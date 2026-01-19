import { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Sparkles, Copy, RefreshCw, X, AlertTriangle, Plus, Wand2, StickyNote } from 'lucide-react';
import { clsx } from 'clsx';
import type { GenerationStatus, GenerationError } from '../../types';


interface StudentCardProps {
    id: string;
}

export function StudentCard({ id }: StudentCardProps) {
    const { students, updateStudentTrait, updateStudentNote, updateStudentComment, removeStudent, settings, generate, rewrite } = useApp();


    const student = students.find(s => s.id === id);

    // Flatten all traits from categories for easy access
    const availableTraits = settings.traitCategories?.flatMap(c => c.traits) || [];

    const [status, setStatus] = useState<GenerationStatus>('idle');
    const [error, setError] = useState<GenerationError | null>(null);
    const [localComment, setLocalComment] = useState('');
    const [customTrait, setCustomTrait] = useState('');
    const [isRewriting, setIsRewriting] = useState(false);
    const [rewriteInstruction, setRewriteInstruction] = useState('');

    if (!student) return null;

    useEffect(() => {
        setLocalComment(student.generatedComment || '');
    }, [student.generatedComment]);

    const handleGenerate = async () => {
        const currentKey = settings.provider === 'gemini' ? settings.apiKey : settings.openaiKey;
        if (!currentKey) {
            // Focus on settings or show a more integrated message
            // Since we don't have a global toast system yet, let's use a cleaner approach:
            // Highlight the error state on the card itself or console, but for now, let's just avoid window.alert.
            // Dispatching an event to open sidebar settings would be good.
            const sidebar = document.querySelector('aside');
            if (sidebar) {
                // Blink the sidebar or scroll to top
                sidebar.scrollTo({ top: 0, behavior: 'smooth' });
                sidebar.classList.add('ring-2', 'ring-red-500');
                setTimeout(() => sidebar.classList.remove('ring-2', 'ring-red-500'), 1000);
            }
            setError({ code: 'INVALID_KEY', message: '請先在左側設定 API Key 才能開始生成' });
            setStatus('error');
            return;
            setError({ code: 'INVALID_KEY', message: '請先在左側設定 API Key 才能開始生成' });
            setStatus('error');
            return;
        }

        if (isRewriting && localComment && rewriteInstruction.trim()) {
            setStatus('generating');
            setError(null);
            try {
                const result = await rewrite(localComment, rewriteInstruction.trim());
                updateStudentComment(id, result, {
                    traits: student.traits,
                    style: 'Rewrite: ' + rewriteInstruction,
                    wordCount: result.length
                });
                setStatus('success');
                setIsRewriting(false);
                setRewriteInstruction('');
            } catch (err: any) {
                setError(err as GenerationError);
                setStatus('error');
            }
            return; // Exit after rewrite
        }

        const styleToUse = settings.selectedStyles?.length > 0 ? settings.selectedStyles.join(' + ') : '溫馨';
        const traitsToUse = student.traits;

        setStatus('generating');
        setError(null);
        try {
            const result = await generate(student.name, traitsToUse, styleToUse, settings.targetWordCount, student.note);
            updateStudentComment(id, result, {
                traits: traitsToUse,
                style: styleToUse,
                wordCount: settings.targetWordCount,
                note: student.note
            });
            setStatus('success');
        } catch (err: any) {
            setError(err as GenerationError);
            setStatus('error');
        }
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(localComment);
    };

    const handleAddCustomTrait = () => {
        if (customTrait.trim()) {
            updateStudentTrait(id, customTrait.trim());
            setCustomTrait('');
        }
    };

    return (
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col transition-all hover:shadow-md min-h-[600px]">
            {/* Header */}
            <div className="px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center shrink-0 rounded-t-xl">
                <div className="flex items-center gap-2">
                    <span className="font-mono text-lg font-bold text-slate-400 dark:text-slate-500">{student.seatNumber}</span>
                    <span className="font-bold text-slate-800 dark:text-slate-100 truncate max-w-[120px]" title={student.name}>{student.name}</span>
                </div>
                <button onClick={() => removeStudent(id)} className="text-slate-400 hover:text-red-500 p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                    <X size={16} />
                </button>
            </div>

            {/* Traits Section */}
            <div className="p-4 space-y-3 flex-shrink-0">
                <div className="flex flex-wrap gap-1.5 max-h-[180px] overflow-y-auto custom-scrollbar">
                    {availableTraits.map(t => (
                        <button
                            key={t}
                            onClick={() => updateStudentTrait(id, t)}
                            style={{
                                fontFamily: settings.fontFamily || 'sans-serif',
                                fontSize: `${Math.max(12, (settings.fontSize || 16) - 2)}px`
                            }}
                            className={clsx(
                                "px-2.5 py-1 rounded-full border transition-all",
                                student.traits.includes(t)
                                    ? "bg-primary-50 dark:bg-primary-900/40 border-primary-200 dark:border-primary-800 text-primary-700 dark:text-primary-300 font-medium shadow-sm"
                                    : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-primary-300 hover:bg-slate-50 dark:hover:bg-slate-700"
                            )}
                        >
                            {t}
                        </button>
                    ))}
                </div>

                <div className="flex gap-2">
                    <input
                        type="text"
                        value={customTrait}
                        onChange={e => setCustomTrait(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleAddCustomTrait()}
                        placeholder="自訂特質..."
                        style={{
                            fontFamily: settings.fontFamily || 'sans-serif',
                            fontSize: `${Math.max(12, (settings.fontSize || 16) - 2)}px`
                        }}
                        className="flex-1 px-3 py-1.5 border rounded bg-transparent dark:border-slate-700 dark:text-slate-200 outline-none focus:border-primary-400 focus:ring-1 focus:ring-primary-200 placeholder:text-slate-400"
                    />
                    <button
                        onClick={handleAddCustomTrait}
                        className="px-3 py-1 bg-slate-100 dark:bg-slate-700 rounded hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors text-slate-600 dark:text-slate-300"
                    >
                        <Plus size={18} />
                    </button>
                </div>

                <div className="flex flex-wrap gap-1 min-h-[1.5rem] max-h-[3rem] overflow-y-auto custom-scrollbar content-start">
                    {student.traits.map(t => (
                        <span key={t} className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-xs border border-amber-100 dark:border-amber-900/50">
                            {t}
                            <button onClick={() => updateStudentTrait(id, t)} className="hover:text-amber-900 rounded-full"><X size={10} /></button>
                        </span>
                    ))}
                </div>
            </div>

            {/* Output Section */}
            <div className="flex-1 p-4 pt-0 flex flex-col gap-2 min-h-0">
                <div className="relative group flex-1 flex flex-col">
                    <textarea
                        value={localComment}
                        onChange={(e) => {
                            setLocalComment(e.target.value);
                        }}
                        placeholder={status === 'generating' ? "正在撰寫評語..." : "等待生成..."}
                        className={clsx(
                            "w-full flex-1 p-3 text-sm rounded-lg border bg-slate-50 dark:bg-slate-900 resize-y outline-none focus:ring-2 focus:ring-primary-DEFAULT/50 transition-all min-h-[150px]",
                            status === 'error' ? "border-red-300 ring-1 ring-red-200" : "border-slate-200 dark:border-slate-700",
                            status === 'generating' && "animate-pulse"
                        )}
                        style={{
                            fontSize: `${settings.fontSize || 16}px`,
                            fontFamily: settings.fontFamily || 'sans-serif',
                            color: settings.textColor || 'inherit',
                            lineHeight: '1.6'
                        }}
                    />
                    {localComment && (
                        <button
                            onClick={handleCopy}
                            className="absolute right-2 bottom-2 p-1.5 bg-white dark:bg-slate-800 rounded-md shadow-sm border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-primary-DEFAULT opacity-0 group-hover:opacity-100 transition-opacity"
                            title="複製內容"
                        >
                            <Copy size={14} />
                        </button>
                    )}
                </div>

                {/* Specific Notes Input */}
                <div className="mb-4">
                    <label className="text-xs text-slate-500 dark:text-slate-400 mb-1 flex items-center gap-1">
                        <StickyNote size={12} />
                        補充記事 (具體事件)
                    </label>
                    <textarea
                        value={student.note || ''}
                        onChange={(e) => updateStudentNote(id, e.target.value)}
                        placeholder="例如：數學成績進步很大，但常忘記帶作業..."
                        className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary-DEFAULT/50 outline-none bg-slate-50 dark:bg-slate-900/50 text-slate-700 dark:text-slate-300 resize-none min-h-[60px]"
                    />
                </div>

                {/* Error Info */}
                {error && (
                    <div className="text-xs text-red-600 bg-red-50 dark:bg-red-900/20 p-2 rounded flex items-center gap-2">
                        <AlertTriangle size={14} />
                        <span>{error.message}</span>
                    </div>
                )}

                {/* Rewrite Input */}
                {isRewriting && (
                    <div className="flex gap-2 mb-2 animate-in fade-in slide-in-from-top-2 duration-200">
                        <input
                            type="text"
                            value={rewriteInstruction}
                            onChange={(e) => setRewriteInstruction(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleGenerate()}
                            placeholder="輸入優化指令 (例如：語氣更委婉、減少贅字)..."
                            className="flex-1 px-3 py-2 text-xs border border-primary-200 rounded-lg focus:ring-2 focus:ring-primary-DEFAULT/50 outline-none bg-primary-50/50 dark:bg-primary-900/20"
                            autoFocus
                        />
                        <button
                            onClick={() => setIsRewriting(false)}
                            className="px-3 text-xs text-slate-500 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg dark:bg-slate-800 dark:text-slate-400 dark:hover:text-slate-300"
                        >
                            取消
                        </button>
                    </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-2 shrink-0">
                    {localComment && !isRewriting && (
                        <button
                            onClick={() => setIsRewriting(true)}
                            disabled={status === 'generating'}
                            className="px-3 py-2 bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-900/50 rounded-lg hover:bg-amber-100 dark:hover:bg-amber-900/50 transition-colors flex items-center justify-center gap-2 text-sm font-medium"
                            title="優化這則評語"
                        >
                            <Wand2 size={16} />
                            <span className="hidden sm:inline">優化</span>
                        </button>
                    )}

                    <button
                        onClick={handleGenerate}
                        disabled={status === 'generating' || (isRewriting && !rewriteInstruction.trim()) || (!isRewriting && student.traits.length === 0)}
                        className={clsx(
                            "flex-1 py-2 rounded-lg flex items-center justify-center gap-2 text-sm font-medium transition-colors",
                            status === 'generating'
                                ? "bg-slate-100 dark:bg-slate-800 text-slate-400"
                                : (isRewriting || student.traits.length > 0)
                                    ? "bg-primary-DEFAULT hover:bg-primary-hover text-white shadow-sm hover:shadow"
                                    : "bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed"
                        )}
                    >
                        {status === 'generating' ? (
                            <RefreshCw size={16} className="animate-spin" />
                        ) : isRewriting ? (
                            <Wand2 size={16} />
                        ) : (
                            <Sparkles size={16} />
                        )}
                        {status === 'generating' ? '處理中...' : isRewriting ? '確認優化' : localComment ? '重新生成' : '生成評語'}
                    </button>
                </div>
            </div>
        </div>
    );
}
