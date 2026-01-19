import React from 'react';
import { useApp } from '../../context/AppContext';
import { generateCSV, generateTXT, downloadFile } from '../../lib/export';
import { Trash2, FileText, FileSpreadsheet, X, Clock } from 'lucide-react';
import { clsx } from 'clsx';
import type { GenerationRecord } from '../../types';

interface HistorySidebarProps {
    onClose: () => void;
}

export function HistorySidebar({ onClose }: HistorySidebarProps) {
    const { history, deleteHistoryItem, clearHistory } = useApp();

    const handleExportCSV = () => {
        const csv = generateCSV(history);
        downloadFile(csv, `評語記錄_${new Date().toISOString().slice(0, 10)}.csv`, 'text/csv;charset=utf-8;');
    };

    const handleExportTXT = () => {
        const txt = generateTXT(history);
        downloadFile(txt, `評語記錄_${new Date().toISOString().slice(0, 10)}.txt`, 'text/plain;charset=utf-8;');
    };

    return (
        <div className="flex flex-col h-full bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl w-96 max-w-full">
            {/* Header */}
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-900">
                <h2 className="text-base font-bold flex items-center gap-2 text-slate-700 dark:text-slate-200">
                    <Clock size={18} /> 歷史記錄 ({history.length})
                </h2>
                <button onClick={onClose} className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300">
                    <X size={20} />
                </button>
            </div>

            {/* Toolbar */}
            {history.length > 0 && (
                <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex gap-2 overflow-x-auto">
                    <button
                        onClick={handleExportCSV}
                        className="flex items-center gap-1 px-3 py-1.5 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 text-xs rounded-full hover:bg-green-100 dark:hover:bg-green-900/40 transition-colors whitespace-nowrap"
                    >
                        <FileSpreadsheet size={14} /> 匯出 CSV
                    </button>
                    <button
                        onClick={handleExportTXT}
                        className="flex items-center gap-1 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 text-xs rounded-full hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors whitespace-nowrap"
                    >
                        <FileText size={14} /> 匯出 TXT
                    </button>
                    <div className="flex-1" />
                    <button
                        onClick={() => confirm('確定要清除所有歷史記錄？') && clearHistory()}
                        className="flex items-center gap-1 px-2 py-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded text-xs transition-colors"
                        title="全部清除"
                    >
                        <Trash2 size={14} />
                    </button>
                </div>
            )}

            {/* List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50 dark:bg-slate-900">
                {history.length === 0 ? (
                    <div className="text-center py-10 text-slate-400 text-sm">
                        <p>尚無生成記錄</p>
                    </div>
                ) : (
                    history.map((record) => (
                        <HistoryItem key={record.id} record={record} onDelete={() => deleteHistoryItem(record.id)} />
                    ))
                )}
            </div>
        </div>
    );
}

function HistoryItem({ record, onDelete }: { record: GenerationRecord; onDelete: () => void }) {
    const [expanded, setExpanded] = React.useState(false);

    return (
        <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden group">
            <div className="p-3 flex justify-between items-start gap-2">
                <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center mb-1">
                        <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100 truncate">{record.studentName}</h3>
                        <span className="text-[10px] text-slate-400 flex-shrink-0">
                            {new Date(record.generatedAt).toLocaleString('zh-TW', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </span>
                    </div>

                    <div className="flex flex-wrap gap-1 mb-2">
                        {record.traits.map(t => (
                            <span key={t} className="text-[10px] px-1.5 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 rounded">
                                {t}
                            </span>
                        ))}
                        <span className="text-[10px] px-1.5 py-0.5 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded">
                            {record.style === 'formal' ? '正式' : '親切'}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-500 rounded">
                            ~{record.wordCount}字
                        </span>
                    </div>

                    <p
                        className={clsx(
                            "text-xs text-slate-600 dark:text-slate-300 leading-relaxed cursor-pointer hover:text-slate-900 dark:hover:text-slate-100 transition-colors",
                            !expanded && "line-clamp-2"
                        )}
                        onClick={() => setExpanded(!expanded)}
                    >
                        {record.comment}
                    </p>
                </div>

                <button
                    onClick={onDelete}
                    className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors opacity-0 group-hover:opacity-100"
                >
                    <Trash2 size={14} />
                </button>
            </div>
        </div>
    );
}
