import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';
import type { GenerationError } from '../types';

export class GeminiService {
    private genAI: GoogleGenerativeAI;
    private model: GenerativeModel;

    constructor(apiKey: string, modelId: string = "gemini-1.5-flash") {
        this.genAI = new GoogleGenerativeAI(apiKey);
        this.model = this.genAI.getGenerativeModel({ model: modelId });
    }

    async testConnection(): Promise<boolean> {
        try {
            // Send a minimal prompt to test the key
            const result = await this.model.generateContent("Hello");
            const response = await result.response;
            return !!response.text();
        } catch (error: any) {
            throw this.mapError(error);
        }
    }

    async generateComment(
        studentName: string,
        traits: string[],
        style: string,
        wordCount: number,
        note?: string,
        pronounMode: 'name' | 'you' | 'he_she' | 'student' = 'student',
        structureMode: 'free' | 'sandwich' | 'points' = 'free'
    ): Promise<string> {
        let pronounInstruction = '';
        switch (pronounMode) {
            case 'name': pronounInstruction = `請在評語中多使用學生姓名（${studentName}）稱呼，減少代名詞。`; break;
            case 'you': pronounInstruction = '請使用第二人稱「你」來稱呼學生，語氣像是直接對學生說話。'; break;
            case 'he_she': pronounInstruction = '請使用第三人稱「他/她」稱呼學生。'; break;
            case 'student': pronounInstruction = '請使用「該生」或學生姓名稱呼。'; break;
        }

        let structureInstruction = '';
        switch (structureMode) {
            case 'sandwich': structureInstruction = '請務必依照「優點肯定 -> 待改進之處 -> 未來期許與勉勵」的「三明治」結構撰寫。'; break;
            case 'points': structureInstruction = '請以列點式結構呈現，分為「優點」、「表現」與「建議」等部分。'; break;
            case 'free': structureInstruction = '結構不拘，請自然流暢地撰寫。'; break;
        }

        const prompt = `
            你是一位具有教育學與兒童發展心理學背景的顧問專家，也是資深的國小導師，擅長以溫暖、具體且鼓勵性的語言撰寫學生成績單評語。

            請為一位名叫 ${studentName} 的學生撰寫期末評語。
            特質：${traits.join(', ')}。
            ${note ? `補充與具體事件紀錄：${note} (請將此具體事件自然融入評語中)。` : ''}
            風格：${style}。
            字數：約 ${wordCount} 字。
            
            寫作要求：
            1. ${pronounInstruction}
            2. ${structureInstruction}
            3. 請直接輸出評語內容，不要有 markdown 標題或額外說明。
            4. 使用繁體中文（台灣）。
            `;


        let retries = 0;
        const maxRetries = 3;

        while (true) {
            try {
                const result = await this.model.generateContent(prompt);
                const response = await result.response;
                return response.text();
            } catch (error: any) {
                const mappedError = this.mapError(error);

                // Retry on rate limit
                if (mappedError.code === 'RATE_LIMIT' && retries < maxRetries) {
                    retries++;
                    const delay = Math.pow(2, retries) * 1000 + 1000; // 3s, 5s, 9s... increases backoff
                    console.warn(`Gemini Rate Limit hit. Retrying in ${delay}ms... (Attempt ${retries}/${maxRetries})`);
                    await new Promise(resolve => setTimeout(resolve, delay));
                    continue;
                }

                throw mappedError;
            }
        }
    }

    async rewriteComment(originalComment: string, instruction: string): Promise<string> {
        const prompt = `
            以下是一則學生的期末評語：
            「${originalComment}」

            請根據以下指示重新撰寫或優化這則評語：
            ${instruction}

            請直接輸出優化後的評語內容，不要有 markdown 標題或額外說明，保持繁體中文（台灣）。
        `;

        let retries = 0;
        const maxRetries = 3;

        while (true) {
            try {
                const result = await this.model.generateContent(prompt);
                const response = await result.response;
                return response.text();
            } catch (error: any) {
                const mappedError = this.mapError(error);

                if (mappedError.code === 'RATE_LIMIT' && retries < maxRetries) {
                    retries++;
                    const delay = Math.pow(2, retries) * 1000 + 1000;
                    console.warn(`Gemini Rate Limit hit during rewrite. Retrying in ${delay}ms... (Attempt ${retries}/${maxRetries})`);
                    await new Promise(resolve => setTimeout(resolve, delay));
                    continue;
                }
                throw mappedError;
            }
        }
    }

    private mapError(error: any): GenerationError {
        console.error("Gemini API Error:", error);

        const message = error.message || '';
        const status = error.status || 0;

        if (message.includes('API key not valid') || message.includes('API_KEY_INVALID')) {
            return { code: 'INVALID_KEY', message: 'API 金鑰無效，請檢查您的 Key 是否正確。' };
        }

        // Google Generative AI often returns 404 for invalid models or 400 with "models/..." not found
        if (message.includes('not found') || message.includes('404')) {
            if (message.includes('model')) {
                return { code: 'INVALID_MODEL', message: '找不到此模型 ID，請確認模型名稱是否正確 (例如 gemini-1.5-flash)。' };
            }
        }

        if (status === 400 || message.includes('400')) {
            if (message.includes('model') || message.includes('tunedModels')) {
                return { code: 'INVALID_MODEL', message: '模型 ID 格式錯誤或是自訂模型不存在。' };
            }
            if (message.includes('InvalidArgument')) {
                return { code: 'INVALID_REQUEST', message: '請求參數無效 (Invalid Argument)。' };
            }
            // Fallback for other 400s
            return { code: 'INVALID_REQUEST', message: '請求格式錯誤 (400) - 請檢查設定。' };
        }

        if (message.includes('429') || message.includes('quota') || message.includes('RESOURCE_EXHAUSTED')) {
            return { code: 'RATE_LIMIT', message: '已達到 API 使用速率限制，請稍後再試。' };
        }

        if (message.includes('fetch failed') || message.includes('network')) {
            return { code: 'NETWORK', message: '網路連線失敗，請檢查您的網路狀態。' };
        }

        return { code: 'UNKNOWN', message: '發生未預期的錯誤：' + message };
    }
}
