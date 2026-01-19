import OpenAI from 'openai';
import type { GenerationError } from '../types';

export class OpenAIService {
    private openai: OpenAI;
    private model: string;

    constructor(apiKey: string, model: string = 'gpt-4o') {
        this.openai = new OpenAI({
            apiKey: apiKey,
            dangerouslyAllowBrowser: true // Required for client-side use
        });
        this.model = model;
    }

    async testConnection(): Promise<boolean> {
        try {
            await this.openai.models.list();
            return true;
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


        try {
            const completion = await this.openai.chat.completions.create({
                messages: [{ role: "user", content: prompt }],
                model: this.model,
            });
            return completion.choices[0].message.content || '';
        } catch (error: any) {
            throw this.mapError(error);
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

        try {
            const completion = await this.openai.chat.completions.create({
                messages: [{ role: "user", content: prompt }],
                model: this.model,
            });
            return completion.choices[0].message.content || '';
        } catch (error: any) {
            throw this.mapError(error);
        }
    }

    private mapError(error: any): GenerationError {
        console.error("OpenAI API Error:", error);
        const message = error.message || '';

        if (error.status === 401) {
            return { code: 'INVALID_KEY', message: 'OpenAI API 金鑰無效，請檢查設定。' };
        }
        if (error.status === 429) {
            return { code: 'RATE_LIMIT', message: '已達到 OpenAI 使用速率限制或額度不足。' };
        }
        return { code: 'UNKNOWN', message: 'OpenAI 發生錯誤：' + message };
    }
}
