import { GeminiService } from './gemini';
import { OpenAIService } from './openai';
import type { AppSettings } from '../types';

export type AIService = GeminiService | OpenAIService;

export function createAIService(settings: AppSettings): AIService {
    if (settings.provider === 'openai') {
        return new OpenAIService(settings.openaiKey, settings.openaiModel);
    }
    // Default to Gemini
    return new GeminiService(settings.apiKey, settings.geminiModel);
}
