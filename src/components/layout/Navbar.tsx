
import { Moon, Sun, Trash2, History } from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface NavbarProps {
    onHistoryClick: () => void;
}

export function Navbar({ onHistoryClick }: NavbarProps) {
    const { settings, updateSettings, clearAllStudents, students } = useApp();

    const toggleTheme = () => {
        updateSettings({ isDarkMode: !settings.isDarkMode });
    };

    return (
        <header className="h-16 border-b border-slate-200 dark:border-slate-700 bg-surface-light/80 dark:bg-surface-dark/80 backdrop-blur-md flex items-center justify-between px-6 shrink-0 z-20 transition-colors">
            <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold bg-gradient-to-r from-primary-DEFAULT to-purple-600 bg-clip-text text-transparent">
                    Comments
                </h1>
                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400">
                    Beta
                </span>
            </div>

            <div className="flex items-center gap-3">
                {students.length > 0 && (
                    <>
                        <button
                            onClick={() => { if (confirm('確定要清空所有學生資料嗎？')) clearAllStudents(); }}
                            className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg text-red-500 transition-colors"
                            title="清空所有資料"
                        >
                            <Trash2 size={20} />
                        </button>
                    </>
                )}

                <div className="w-px h-6 bg-slate-200 dark:bg-slate-700 mx-1" />

                <button
                    onClick={onHistoryClick}
                    className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-slate-600 dark:text-slate-300 transition-colors"
                    title="歷史記錄"
                >
                    <History size={20} />
                </button>

                <button
                    onClick={toggleTheme}
                    className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-slate-600 dark:text-slate-300 transition-colors"
                >
                    {settings.isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
                </button>
            </div>
        </header>
    );
}
