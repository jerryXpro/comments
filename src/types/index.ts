export interface Student {
    id: string;
    seatNumber: string;
    name: string;
    traits: string[];
    note?: string; // Specific event notes
    generatedComment?: string;
    lastGeneratedAt?: number;
}

export interface GenerationRecord {
    id: string;
    studentId: string;
    studentName: string;
    generatedAt: number;
    traits: string[];
    note?: string;
    style: string; // Changed from GenerationStyle to string to support custom styles
    wordCount: number;
    comment: string;
}

export type GenerationStyle = 'formal' | 'warm';

export interface TraitCategory {
    id: string;
    name: string;
    traits: string[];
}

export interface AppSettings {
    provider: 'gemini' | 'openai';
    apiKey: string;
    openaiKey: string;
    geminiModel: string;
    openaiModel: string;

    // New Customizable Fields
    traitCategories: TraitCategory[];
    styles: string[]; // Available styles

    // Selection Defaults / Preferences
    targetWordCount: number;
    // Plan says "selectedStyles: string[]"
    selectedStyles: string[];

    // New Feature Settings
    pronounMode: 'name' | 'you' | 'he_she' | 'student'; // 姓名 / 你 / 他/她 / 該生
    structureMode: 'free' | 'sandwich' | 'points'; // 自由 / 三明治 / 條列

    isDarkMode: boolean;

    // Appearance Settings
    fontSize: number;
    fontFamily: string;
    textColor: string;

    // Interface Settings
    interfaceFontSize: number;
    interfaceIconSize: number;

    // Trait Tags Settings
    traitTagFontSize: number;
    traitTagColor: string; // Custom color for trait tags
}

export type GenerationStatus = 'idle' | 'generating' | 'success' | 'error';

export interface GenerationError {
    code: 'INVALID_KEY' | 'RATE_LIMIT' | 'NETWORK' | 'UNKNOWN' | 'INVALID_MODEL' | 'INVALID_REQUEST';
    message: string;
}
