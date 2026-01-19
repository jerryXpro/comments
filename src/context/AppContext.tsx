import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { Student, AppSettings, GenerationRecord } from '../types';
import { generateId } from '../lib/utils';

interface AppContextType {
    students: Student[];
    settings: AppSettings;
    history: GenerationRecord[];
    addStudent: (rawText: string) => void;
    removeStudent: (id: string) => void;
    updateStudentTrait: (id: string, trait: string) => void;
    updateStudentNote: (id: string, note: string) => void;
    updateStudentComment: (id: string, comment: string, meta: { traits: string[], style: string, wordCount: number, note?: string }) => void;
    clearAllStudents: () => void;
    updateSettings: (newSettings: Partial<AppSettings>) => void;
    deleteHistoryItem: (id: string) => void;
    clearHistory: () => void;
    generate: (studentName: string, traits: string[], style: string, wordCount: number, note?: string) => Promise<string>;
    rewrite: (originalComment: string, instruction: string) => Promise<string>;
    validateKey: (key: string, provider: 'gemini' | 'openai', modelId?: string) => Promise<boolean>;
    restoreData: (data: any) => void;
}

const defaultSettings: AppSettings = {
    provider: 'gemini',
    apiKey: '',
    openaiKey: '',
    geminiModel: 'gemini-2.5-flash',
    openaiModel: 'gpt-4o',

    traitCategories: [
        {
            id: 'attitude',
            name: '資質與態度 (Attitude)',
            traits: ['聰穎靈活', '理解力強', '領悟快速', '認真專注', '勤勉好學', '主動求知', '善於思考', '舉一反三', '觀察力佳', '表達清晰', '善於溝通', '勇於發表', '不夠認真', '欠缺專注', '怠忽學業', '理解較慢', '需多練習', '有待加強', '遲交作業']
        },
        {
            id: 'personality',
            name: '個性與品德 (Personality)',
            traits: ['性格溫和', '溫順文靜', '誠實', '守規矩', '有禮貌', '開朗活潑', '樂觀', '負責盡職', '做事認真', '守分負責', '性格內向', '不善交際', '羞怯膽小', '不夠自律', '做事粗心']
        },
        {
            id: 'social',
            name: '團體與人際 (Social)',
            traits: ['待人和善', '人緣良好', '善解人意', '樂於助人', '熱心服務', '具領導力', '友愛同學', '願意分享', '樂於合作', '不太合群', '較少互動', '不善合作', '較少參與']
        },
        {
            id: 'talent',
            name: '專長與才藝 (Talent)',
            traits: ['語文能力強', '寫作表達佳', '數理能力佳', '邏輯思維強', '計算能力好', '表演才能優', '美術天分佳', '音樂感佳', '運動能力強', '體能活動好', '動作協調佳', '創意思維佳', '想像力豐富', '創意點子多']
        }
    ],

    styles: [
        '口語人性化', '鼓勵型', '幽默', '溫馨', '分析型',
        '詩意', '個性化', '目標導向', '故事型', '十六箴言'
    ],

    selectedStyles: ['溫馨'], // Default selection

    // New Feature Settings
    pronounMode: 'student', // default to '該生' (conservative choice)
    structureMode: 'free',

    targetWordCount: 100,
    isDarkMode: false,

    // Appearance Defaults
    // Appearance Defaults
    fontSize: 16,
    fontFamily: 'sans-serif',
    textColor: '#334155', // Slate-700
    interfaceFontSize: 14,
    interfaceIconSize: 16,
    traitTagFontSize: 12,
    traitTagColor: '' // Empty means default theme color
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
    const [students, setStudents] = useState<Student[]>(() => {
        const saved = localStorage.getItem('fcg_students');
        return saved ? JSON.parse(saved) : [];
    });

    const [settings, setSettings] = useState<AppSettings>(() => {
        const saved = localStorage.getItem('fcg_settings');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                // Merge with defaults to ensure new fields (like styles) exist
                return { ...defaultSettings, ...parsed };
            } catch (e) {
                console.error("Failed to parse settings", e);
                return defaultSettings;
            }
        }
        return defaultSettings;
    });

    const [history, setHistory] = useState<GenerationRecord[]>(() => {
        const saved = localStorage.getItem('fcg_history');
        return saved ? JSON.parse(saved) : [];
    });

    // Persistence
    useEffect(() => {
        localStorage.setItem('fcg_students', JSON.stringify(students));
    }, [students]);

    useEffect(() => {
        localStorage.setItem('fcg_settings', JSON.stringify(settings));
        if (settings.isDarkMode) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [settings]);

    // Force update styles if they don't match the new defaults (One-time migration logic for existing users)
    useEffect(() => {
        const requiredStyles = [
            '口語人性化', '鼓勵型', '幽默', '溫馨', '分析型',
            '詩意', '個性化', '目標導向', '故事型', '十六箴言'
        ];
        // If the current styles don't include '十六箴言' (a unique new one) or length is different from expected defaults + user additions
        // For simplicity, since the user asked to SET these as options, let's ensure they are available.
        // We'll reset the styles to this list if '十六箴言' is missing.
        if (!settings.styles?.includes('十六箴言')) {
            setSettings(prev => ({ ...prev, styles: requiredStyles }));
        }
    }, []);

    useEffect(() => {
        localStorage.setItem('fcg_history', JSON.stringify(history));
    }, [history]);

    const addStudent = (rawText: string) => {
        const lines = rawText.split('\n').filter(l => l.trim());
        const newStudents: Student[] = lines.map(line => {
            // "01. Name" or just "Name"
            const match = line.match(/^(\d+)[.\s]+(.*)$/);
            if (match) {
                return { id: generateId(), seatNumber: match[1], name: match[2].trim(), traits: [] };
            }
            return { id: generateId(), seatNumber: '?', name: line.trim(), traits: [] };
        });
        setStudents(prev => [...prev, ...newStudents]);
    };

    const removeStudent = (id: string) => {
        setStudents(prev => prev.filter(s => s.id !== id));
    };

    const updateStudentTrait = (id: string, trait: string) => {
        setStudents(prev => prev.map(s => {
            if (s.id !== id) return s;
            const traits = s.traits.includes(trait)
                ? s.traits.filter(t => t !== trait)
                : [...s.traits, trait];
            return { ...s, traits };
        }));
    };

    const updateStudentNote = (id: string, note: string) => {
        setStudents(prev => prev.map(s =>
            s.id === id ? { ...s, note } : s
        ));
    };

    const updateStudentComment = (id: string, comment: string, meta: { traits: string[], style: string, wordCount: number, note?: string }) => {
        setStudents(prev => prev.map(s =>
            s.id === id ? { ...s, generatedComment: comment, lastGeneratedAt: Date.now() } : s
        ));

        // Add to history
        const student = students.find(s => s.id === id);
        if (student) {
            const newRecord: GenerationRecord = {
                id: generateId(),
                studentId: student.id,
                studentName: student.name,
                generatedAt: Date.now(),
                comment,
                traits: [...meta.traits],
                note: meta.note,
                style: meta.style,
                wordCount: meta.wordCount
            };
            setHistory(prev => [newRecord, ...prev]);
        }
    };

    const clearAllStudents = () => {
        setStudents([]);
    };

    const updateSettings = (newSettings: Partial<AppSettings>) => {
        setSettings(prev => ({ ...prev, ...newSettings }));
    };

    const deleteHistoryItem = (id: string) => {
        setHistory(prev => prev.filter(h => h.id !== id));
    };

    const clearHistory = () => {
        setHistory([]);
    };

    const generate = async (studentName: string, traits: string[], style: string, wordCount: number, note?: string): Promise<string> => {
        const { createAIService } = await import('../services/aiFactory');
        const service = createAIService(settings);
        // Cast to any to pass new args until interfaces are fully unified
        // We need to pass pronounMode and structureMode too, but they are in settings, so service can read them from settings?
        // Wait, createAIService takes settings, so the service INSTANCE potentially has access to settings?
        // Currently Service instances depend on keys mostly.
        // We should probably pass these as extra options to generateComment, or update the service logic.
        // For now, let's update call signature.
        return await (service as any).generateComment(studentName, traits, style, wordCount, note, settings.pronounMode, settings.structureMode);
    };

    const rewrite = async (originalComment: string, instruction: string): Promise<string> => {
        const { createAIService } = await import('../services/aiFactory');
        const service = createAIService(settings);
        // Cast to any because TS might not see the new method on the union type immediately if interface isn't updated, 
        // but both classes have it now.
        return await (service as any).rewriteComment(originalComment, instruction);
    };

    const validateKey = async (key: string, provider: 'gemini' | 'openai', modelId?: string): Promise<boolean> => {
        const { createAIService } = await import('../services/aiFactory');
        // Create a temporary settings object to test the new key
        const testSettings = {
            ...settings,
            provider,
            apiKey: provider === 'gemini' ? key : settings.apiKey,
            openaiKey: provider === 'openai' ? key : settings.openaiKey,
            geminiModel: provider === 'gemini' && modelId ? modelId : settings.geminiModel,
            openaiModel: provider === 'openai' && modelId ? modelId : settings.openaiModel
        };
        const service = createAIService(testSettings);
        return await service.testConnection();
    };

    const restoreData = (data: any) => {
        if (data.students) setStudents(data.students);
        if (data.settings) setSettings({ ...defaultSettings, ...data.settings });
        if (data.history) setHistory(data.history);
    };

    return (
        <AppContext.Provider value={{
            students,
            settings,
            history,
            addStudent,
            removeStudent,
            updateStudentTrait,
            updateStudentNote,
            updateStudentComment,
            clearAllStudents,
            updateSettings,
            deleteHistoryItem,
            clearHistory,
            generate,
            validateKey,
            rewrite,
            restoreData
        }}>
            {children}
        </AppContext.Provider>
    );
}

export function useApp() {
    const context = useContext(AppContext);
    if (!context) throw new Error('useApp must be used within AppProvider');
    return context;
}
