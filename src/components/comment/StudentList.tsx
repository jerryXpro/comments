import { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { StudentCard } from './StudentCard';
import { Ghost } from 'lucide-react';

export function StudentList() {
    const { students } = useApp();

    if (students.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-slate-400">
                <div className="bg-slate-100 dark:bg-slate-800 p-6 rounded-full mb-4">
                    <Ghost size={48} />
                </div>
                <h3 className="text-lg font-medium text-slate-600 dark:text-slate-300">尚未匯入學生</h3>
                <p className="text-sm mt-1">請在左側側邊欄輸入「座號.姓名」來開始</p>
            </div>
        );
    }

    const [isBatchGenerating, setIsBatchGenerating] = useState(false);
    const [progress, setProgress] = useState({ current: 0, total: 0 });
    const { settings, generate, updateStudentComment } = useApp();

    const handleBatchGenerate = async () => {
        if (!confirm('確定要為所有尚未生成評語的學生自動生成評語嗎？')) return;

        const targets = students.filter(s => !s.generatedComment);
        if (targets.length === 0) return;

        setIsBatchGenerating(true);
        setProgress({ current: 0, total: targets.length });

        const style = settings.selectedStyles?.length > 0 ? settings.selectedStyles.join(' + ') : '溫馨';
        const wordCount = settings.targetWordCount;

        for (let i = 0; i < targets.length; i++) {
            const student = targets[i];

            if (student.traits.length > 0) {
                try {
                    const result = await generate(student.name, student.traits, style, wordCount);
                    updateStudentComment(student.id, result, {
                        traits: student.traits,
                        style,
                        wordCount
                    });
                } catch (e) {
                    console.error(`Failed to generate for ${student.name}`, e);
                }
            }

            setProgress(prev => ({ ...prev, current: i + 1 }));

            // Add a polite delay between requests to avoid rate limits (Gemini Free Tier is ~15 RPM)
            // 4000ms delay + execution time should be safe
            if (i < targets.length - 1) {
                await new Promise(r => setTimeout(r, 4000));
            }
        }
        setIsBatchGenerating(false);
        setProgress({ current: 0, total: 0 });
    };

    return (
        <div className="flex flex-col h-full overflow-hidden">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-white dark:bg-slate-900 shrink-0">
                <h3 className="font-semibold text-slate-700 dark:text-slate-200">
                    學生列表 ({students.length})
                </h3>
                <div className="flex gap-2">
                    <button
                        onClick={handleBatchGenerate}
                        disabled={isBatchGenerating || students.every(s => s.generatedComment)}
                        className="px-4 py-2 bg-primary-DEFAULT hover:bg-primary-hover text-white text-sm rounded-lg shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        {isBatchGenerating ? <Ghost className="animate-spin" size={16} /> : <Ghost size={16} />}
                        {isBatchGenerating ? `生成中... (${progress.current}/${progress.total})` : '一鍵補完評語'}
                    </button>
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 p-6 overflow-y-auto custom-scrollbar pb-20">
                {students.map(student => (
                    <StudentCard key={student.id} id={student.id} />
                ))}
            </div>
        </div>
    );
}
