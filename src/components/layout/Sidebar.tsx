import { useState, useEffect, useRef } from 'react';
import { Settings, Key, UserPlus, CheckCircle, AlertCircle, Eye, EyeOff, Loader2, Trash2, FileSpreadsheet, X, Plus, Type, Download, Upload, ChevronRight, ChevronDown } from 'lucide-react';
import { read, utils } from 'xlsx';
import { useApp } from '../../context/AppContext';
import { clsx } from 'clsx';

// Reusable Section Component
function SidebarSection({
    title,
    icon: Icon,
    children,
    className,
    defaultExpanded = false,
    headerAction
}: {
    title: string;
    icon: any;
    children: React.ReactNode;
    className?: string;
    defaultExpanded?: boolean;
    headerAction?: React.ReactNode;
}) {
    const [isExpanded, setIsExpanded] = useState(defaultExpanded);

    return (
        <div className={clsx("border-b border-slate-200 dark:border-slate-800", className)}>
            <div
                className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <h2 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-2 select-none">
                    <Icon size={14} /> {title}
                </h2>
                <div className="flex items-center gap-2">
                    {headerAction}
                    <button className="text-slate-400">
                        {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                    </button>
                </div>
            </div>
            {isExpanded && (
                <div className="px-4 pb-4 animate-in slide-in-from-top-2 duration-200">
                    {children}
                </div>
            )}
        </div>
    );
}

export function Sidebar() {
    const { addStudent, students, history, settings, updateSettings, validateKey, restoreData } = useApp();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [importText, setImportText] = useState('');
    const [localSettings, setLocalSettings] = useState(settings);
    const [isValidating, setIsValidating] = useState(false);
    const [keyStatus, setKeyStatus] = useState<'none' | 'success' | 'invalid'>('none');
    const [errorMessage, setErrorMessage] = useState('');
    const [showKey, setShowKey] = useState(false);

    // Style Management State
    const [isManagingStyles, setIsManagingStyles] = useState(false);
    const [newStyle, setNewStyle] = useState('');

    // Trait Management State
    const [isManagingTraits, setIsManagingTraits] = useState(false);

    const fontOptions = [
        { label: '系統預設 (Sans)', value: 'sans-serif' },
        { label: '標楷體 (Kaiti)', value: '"BiauKai", "DFKai-SB", serif' },
        { label: '微軟正黑體 (JhengHei)', value: '"Microsoft JhengHei", sans-serif' },
        { label: '新細明體 (MingLiU)', value: '"PMingLiU", serif' },
        { label: '襯線體 (Serif)', value: 'serif' },
        { label: '等寬字體 (Mono)', value: 'monospace' },
    ];

    // Sync local settings when global settings change
    useEffect(() => {
        setLocalSettings(settings);
    }, [settings]);

    const handleImport = () => {
        if (!importText.trim()) return;
        addStudent(importText);
        setImportText('');
    };

    const handleExcelUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            const data = await file.arrayBuffer();
            const workbook = read(data);
            const sheetName = workbook.SheetNames[0];
            const sheet = workbook.Sheets[sheetName];
            const jsonData = utils.sheet_to_json(sheet, { header: 1 }) as any[][];

            let names: string[] = [];

            for (const row of jsonData) {
                if (row[0] && typeof row[0] === 'string') {
                    names.push(row[0].trim());
                } else if (row[0] && typeof row[0] === 'number') {
                    if (row[1] && typeof row[1] === 'string') {
                        names.push(row[1].trim());
                    }
                }
            }

            const headers = ['姓名', 'Name', 'Student', '學生姓名'];
            names = names.filter(n => !headers.includes(n) && n.length > 0);

            if (names.length > 0) {
                names.forEach(name => addStudent(name));
                alert(`成功匯入 ${names.length} 位學生`);
            } else {
                alert('未偵測到有效學生名單，請確認 Excel 第一欄為姓名。');
            }
        } catch (err) {
            console.error(err);
            alert('讀取 Excel 失敗，請確認檔案格式正確。');
        } finally {
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleSaveSettings = async () => {
        setIsValidating(true);
        const provider = localSettings.provider;
        const keyToValidate = provider === 'gemini' ? localSettings.apiKey : localSettings.openaiKey;

        if (!keyToValidate) {
            updateSettings(localSettings);
            setIsValidating(false);
            return;
        }

        try {
            setErrorMessage('');
            const modelToValidate = provider === 'gemini' ? localSettings.geminiModel : localSettings.openaiModel;
            const isValid = await validateKey(keyToValidate, provider as any, modelToValidate);

            if (isValid) {
                setKeyStatus('success');
                updateSettings(localSettings);
                setTimeout(() => setKeyStatus('none'), 2000);
            } else {
                setKeyStatus('invalid');
                setErrorMessage('連線測試失敗 (API Key 可能無效)');
            }
        } catch (error: any) {
            console.error("Validation failed:", error);
            setKeyStatus('invalid');
            setErrorMessage(error.message || '連線發生錯誤');
        } finally {
            setIsValidating(false);
        }
    };

    const clearKey = () => {
        if (localSettings.provider === 'gemini') {
            setLocalSettings(prev => ({ ...prev, apiKey: '' }));
        } else {
            setLocalSettings(prev => ({ ...prev, openaiKey: '' }));
        }
    };

    const modelOptions = [
        { label: 'Gemini 3 Pro Preview', value: 'gemini-3.0-pro-preview' },
        { label: 'Gemini 3 Flash Preview', value: 'gemini-3.0-flash-preview' },
        { label: 'Gemini 2.5 Pro', value: 'gemini-2.5-pro' },
        { label: 'Gemini 2.5 Flash', value: 'gemini-2.5-flash' },
        { label: '自訂 (Custom)', value: 'custom' }
    ];

    // Resizable Sidebar State
    const [sidebarWidth, setSidebarWidth] = useState(() => {
        const saved = localStorage.getItem('fcg_sidebar_width');
        return saved ? parseInt(saved, 10) : 320;
    });
    const sidebarRef = useRef<HTMLDivElement>(null);
    const isResizing = useRef(false);

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!isResizing.current) return;
            let newWidth = e.clientX;
            if (newWidth < 250) newWidth = 250;
            if (newWidth > 600) newWidth = 600;
            setSidebarWidth(newWidth);
        };

        const handleMouseUp = () => {
            isResizing.current = false;
            document.body.style.cursor = 'default';
            localStorage.setItem('fcg_sidebar_width', sidebarWidth.toString());
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [sidebarWidth]);

    return (
        <div
            ref={sidebarRef}
            style={{ width: `${sidebarWidth}px` }}
            className="flex flex-col h-full bg-slate-50 dark:bg-slate-900 overflow-y-auto custom-scrollbar shrink-0 border-r border-slate-200 dark:border-slate-800 relative group/sidebar"
        >
            {/* Drag Handle */}
            <div
                className="absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-primary-300 active:bg-primary-500 z-50 transition-colors opacity-0 group-hover/sidebar:opacity-100"
                onMouseDown={(e) => {
                    isResizing.current = true;
                    document.body.style.cursor = 'col-resize';
                    e.preventDefault();
                }}
            />

            {/* 1. Student Import (Always Visible) */}
            <div className="p-4 border-b border-slate-200 dark:border-slate-800">
                <h2 className="text-sm font-semibold text-slate-500 dark:text-slate-400 mb-3 uppercase tracking-wider flex items-center gap-2">
                    <UserPlus size={14} /> 匯入學生
                </h2>
                <textarea
                    value={importText}
                    onChange={(e) => setImportText(e.target.value)}
                    placeholder="格式範例：&#10;01. 王小明&#10;02. 李大華"
                    className="w-full h-20 p-2 text-xs rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-primary-DEFAULT outline-none resize-none mb-2"
                />
                <div className="flex gap-2">
                    <button
                        onClick={handleImport}
                        disabled={!importText.trim()}
                        className="flex-1 py-1.5 bg-white border border-slate-300 dark:bg-slate-800 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-md text-xs font-medium transition-colors"
                    >
                        新增至列表
                    </button>
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        className="px-3 py-1.5 bg-green-50 border border-green-200 dark:bg-green-900/20 dark:border-green-800 text-green-700 dark:text-green-400 rounded-md text-xs font-medium transition-colors hover:bg-green-100 dark:hover:bg-green-900/40"
                        title="從 Excel 匯入"
                    >
                        <FileSpreadsheet size={16} />
                    </button>
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleExcelUpload}
                        accept=".xlsx, .xls"
                        className="hidden"
                    />
                </div>
            </div>

            {/* 2. Generation Settings (High Frequency) */}
            <SidebarSection
                title="偏好與生成設定"
                icon={Settings}
                defaultExpanded={true}
            >
                <div className="space-y-4">
                    {/* Style/Tone */}
                    <div>
                        <label className="text-xs text-slate-500 dark:text-slate-400 mb-2 block flex justify-between items-center">
                            <span>風格語氣 {isManagingStyles ? '(編輯模式)' : '(最多選 2 項)'}</span>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setIsManagingStyles(!isManagingStyles);
                                }}
                                className={clsx(
                                    "text-[10px] hover:underline transition-colors",
                                    isManagingStyles ? "text-amber-500" : "text-primary-DEFAULT"
                                )}
                            >
                                {isManagingStyles ? '完成' : '編輯'}
                            </button>
                        </label>
                        <div className="flex flex-wrap gap-2 mb-2">
                            {settings.styles?.map(style => (
                                <div key={style} className="relative group">
                                    <button
                                        onClick={() => {
                                            if (isManagingStyles) return;
                                            const current = settings.selectedStyles || [];
                                            const isSelected = current.includes(style);
                                            let newStyles;
                                            if (isSelected) {
                                                newStyles = current.filter(s => s !== style);
                                            } else {
                                                if (current.length >= 2) {
                                                    newStyles = [...current.slice(1), style];
                                                } else {
                                                    newStyles = [...current, style];
                                                }
                                            }
                                            updateSettings({ selectedStyles: newStyles });
                                        }}
                                        disabled={isManagingStyles}
                                        className={clsx(
                                            "px-2.5 py-1.5 text-xs rounded border transition-colors relative",
                                            (settings.selectedStyles || []).includes(style)
                                                ? "bg-primary-50 dark:bg-primary-900/30 border-primary-light text-primary-DEFAULT"
                                                : "border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300",
                                            isManagingStyles && "opacity-60 cursor-default pr-6"
                                        )}
                                    >
                                        {style}
                                    </button>
                                    {isManagingStyles && (
                                        <button
                                            onClick={() => {
                                                const newStyles = settings.styles.filter(s => s !== style);
                                                const newSelected = (settings.selectedStyles || []).filter(s => s !== style);
                                                updateSettings({ styles: newStyles, selectedStyles: newSelected });
                                            }}
                                            className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full p-0.5 shadow-sm hover:bg-red-600 transition-colors z-10"
                                        >
                                            <X size={10} />
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                        {isManagingStyles && (
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={newStyle}
                                    onChange={(e) => setNewStyle(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && newStyle.trim()) {
                                            if (!settings.styles.includes(newStyle.trim())) {
                                                updateSettings({ styles: [...settings.styles, newStyle.trim()] });
                                                setNewStyle('');
                                            }
                                        }
                                    }}
                                    placeholder="新增風格..."
                                    className="flex-1 px-2 py-1 text-xs border rounded bg-white dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200 outline-none focus:border-primary-400"
                                />
                                <button
                                    onClick={() => {
                                        if (newStyle.trim() && !settings.styles.includes(newStyle.trim())) {
                                            updateSettings({ styles: [...settings.styles, newStyle.trim()] });
                                            setNewStyle('');
                                        }
                                    }}
                                    className="px-2 py-1 text-xs bg-primary-DEFAULT text-white rounded hover:bg-primary-hover"
                                >
                                    <Plus size={14} />
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Pronoun Mode */}
                    <div>
                        <label className="text-xs text-slate-500 dark:text-slate-400 mb-2 block">稱謂模式</label>
                        <div className="flex bg-slate-100 dark:bg-slate-800 rounded-lg p-1 gap-1">
                            {[
                                { id: 'student', label: '該生' },
                                { id: 'name', label: '姓名' },
                                { id: 'you', label: '你' },
                                { id: 'he_she', label: '他/她' }
                            ].map(mode => (
                                <button
                                    key={mode.id}
                                    onClick={() => updateSettings({ pronounMode: mode.id as any })}
                                    className={clsx(
                                        "flex-1 text-xs py-1.5 rounded-md transition-all font-medium",
                                        settings.pronounMode === mode.id || (!settings.pronounMode && mode.id === 'student')
                                            ? "bg-white dark:bg-slate-700 text-primary-DEFAULT shadow-sm"
                                            : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                                    )}
                                >
                                    {mode.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Structure Mode */}
                    <div>
                        <label className="text-xs text-slate-500 dark:text-slate-400 mb-2 block">評語結構</label>
                        <div className="flex bg-slate-100 dark:bg-slate-800 rounded-lg p-1 gap-1">
                            {[
                                { id: 'free', label: '自由' },
                                { id: 'sandwich', label: '三明治法' },
                                { id: 'points', label: '條列式' }
                            ].map(mode => (
                                <button
                                    key={mode.id}
                                    onClick={() => updateSettings({ structureMode: mode.id as any })}
                                    className={clsx(
                                        "flex-1 text-xs py-1.5 rounded-md transition-all font-medium",
                                        settings.structureMode === mode.id || (!settings.structureMode && mode.id === 'free')
                                            ? "bg-white dark:bg-slate-700 text-primary-DEFAULT shadow-sm"
                                            : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                                    )}
                                >
                                    {mode.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Word Count */}
                    <div>
                        <label className="text-xs text-slate-500 dark:text-slate-400 mb-1.5 block">
                            字數限制: {settings.targetWordCount} 字
                        </label>
                        <input
                            type="range"
                            min="50"
                            max="500"
                            step="50"
                            value={settings.targetWordCount}
                            onChange={(e) => updateSettings({ targetWordCount: Number(e.target.value) })}
                            className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-primary-DEFAULT"
                        />
                    </div>
                </div>
            </SidebarSection>

            {/* 3. Trait Management (Collapsible, Default Collapsed) */}
            <SidebarSection
                title="特質分類設定"
                icon={CheckCircle}
                defaultExpanded={false}
                headerAction={
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            setIsManagingTraits(!isManagingTraits);
                        }}
                        className={clsx(
                            "text-[10px] hover:underline transition-colors font-normal normal-case z-10 px-2 py-1",
                            isManagingTraits ? "text-amber-500" : "text-primary-DEFAULT"
                        )}
                    >
                        {isManagingTraits ? '完成' : '管理'}
                    </button>
                }
            >
                <div className="space-y-4">
                    {settings.traitCategories?.map(cat => (
                        <div key={cat.id} className="space-y-2">
                            <div className="flex items-center justify-between">
                                <h3 className="text-xs font-semibold text-slate-600 dark:text-slate-300">{cat.name}</h3>
                                {isManagingTraits && (
                                    <button
                                        onClick={() => {
                                            if (confirm(`確定要刪除分類「${cat.name}」及其所有特質嗎？`)) {
                                                const newCats = settings.traitCategories.filter(c => c.id !== cat.id);
                                                updateSettings({ traitCategories: newCats });
                                            }
                                        }}
                                        className="text-[10px] text-red-500 hover:underline"
                                    >
                                        刪除分類
                                    </button>
                                )}
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                                {cat.traits.map(t => (
                                    <span
                                        key={t}
                                        style={{
                                            fontSize: `${settings.traitTagFontSize || 10}px`,
                                            color: settings.traitTagColor || undefined,
                                            borderColor: settings.traitTagColor ? `${settings.traitTagColor}40` : undefined
                                        }}
                                        className={clsx(
                                            "px-2 py-0.5 rounded border bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 relative group transition-all",
                                            !settings.traitTagColor && "text-slate-600 dark:text-slate-400",
                                            isManagingTraits && "pr-4"
                                        )}>
                                        {t}
                                        {isManagingTraits && (
                                            <button
                                                onClick={() => {
                                                    const newCats = settings.traitCategories.map(c => {
                                                        if (c.id !== cat.id) return c;
                                                        return { ...c, traits: c.traits.filter(tr => tr !== t) };
                                                    });
                                                    updateSettings({ traitCategories: newCats });
                                                }}
                                                className="absolute top-0 right-0 bottom-0 px-1 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white rounded-r transition-colors flex items-center"
                                            >
                                                <X size={8} />
                                            </button>
                                        )}
                                    </span>
                                ))}
                                {isManagingTraits && (
                                    <div className="flex items-center gap-1">
                                        <input
                                            type="text"
                                            placeholder="新增..."
                                            className="w-16 px-1 py-0.5 text-[10px] border rounded dark:bg-slate-800 dark:border-slate-700"
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                    const val = (e.target as HTMLInputElement).value.trim();
                                                    if (val) {
                                                        const newCats = settings.traitCategories.map(c => {
                                                            if (c.id !== cat.id) return c;
                                                            if (c.traits.includes(val)) return c;
                                                            return { ...c, traits: [...c.traits, val] };
                                                        });
                                                        updateSettings({ traitCategories: newCats });
                                                        (e.target as HTMLInputElement).value = '';
                                                    }
                                                }
                                            }}
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                    {isManagingTraits && (
                        <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                            <button
                                onClick={() => {
                                    const name = prompt("請輸入新分類名稱：");
                                    if (name) {
                                        const id = `cat_${Date.now()}`;
                                        updateSettings({
                                            traitCategories: [...settings.traitCategories, { id, name, traits: [] }]
                                        });
                                    }
                                }}
                                className="w-full py-1 text-xs border border-dashed border-slate-300 dark:border-slate-700 text-slate-500 rounded hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                            >
                                + 新增分類
                            </button>
                        </div>
                    )}
                </div>
            </SidebarSection>

            {/* 4. Appearance Settings */}
            <SidebarSection title="顯示與文字設定" icon={Type}>
                <div className="space-y-3 pl-1">
                    {/* Font Size */}
                    <div>
                        <label className="text-xs text-slate-600 dark:text-slate-300 mb-1 flex justify-between">
                            <span>字體大小</span>
                            <span className="text-slate-400">{settings.fontSize || 16}px</span>
                        </label>
                        <input
                            type="range"
                            min="12"
                            max="32"
                            step="1"
                            value={settings.fontSize || 16}
                            onChange={(e) => updateSettings({ fontSize: Number(e.target.value) })}
                            className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-primary-DEFAULT"
                        />
                    </div>
                    {/* Font Family */}
                    <div>
                        <label className="text-xs text-slate-600 dark:text-slate-300 mb-1 block">
                            字體樣式
                        </label>
                        <select
                            value={settings.fontFamily || 'sans-serif'}
                            onChange={(e) => updateSettings({ fontFamily: e.target.value })}
                            className="w-full px-2 py-1.5 text-xs border rounded bg-white dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200"
                        >
                            {fontOptions.map(opt => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                        </select>
                    </div>

                    {/* Text Color */}
                    <div>
                        <label className="text-xs text-slate-600 dark:text-slate-300 mb-1 block">
                            文字顏色
                        </label>
                        <div className="flex items-center gap-2">
                            <input
                                type="color"
                                value={settings.textColor || '#334155'}
                                onChange={(e) => updateSettings({ textColor: e.target.value })}
                                className="w-8 h-8 rounded cursor-pointer border-0 p-0"
                            />
                            <span className="text-xs text-slate-500 font-mono">{settings.textColor || '#334155'}</span>
                            <button
                                onClick={() => updateSettings({ textColor: '#334155' })}
                                className="text-[10px] text-slate-400 hover:text-slate-600 underline ml-auto"
                            >
                                重置
                            </button>
                        </div>
                    </div>

                    <div className="space-y-3 pl-1 mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                        <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-2">
                            全局介面設定 (Interface)
                        </label>
                        {/* Interface Font Size */}
                        <div>
                            <label className="text-xs text-slate-600 dark:text-slate-300 mb-1 flex justify-between">
                                <span>介面字體大小</span>
                                <span className="text-slate-400">{settings.interfaceFontSize || 14}px</span>
                            </label>
                            <input
                                type="range"
                                min="12"
                                max="20"
                                step="1"
                                value={settings.interfaceFontSize || 14}
                                onChange={(e) => updateSettings({ interfaceFontSize: Number(e.target.value) })}
                                className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-primary-DEFAULT"
                            />
                        </div>
                        {/* Interface Icon Size */}
                        <div>
                            <label className="text-xs text-slate-600 dark:text-slate-300 mb-1 flex justify-between">
                                <span>介面圖示大小</span>
                                <span className="text-slate-400">{settings.interfaceIconSize || 16}px</span>
                            </label>
                            <input
                                type="range"
                                min="14"
                                max="24"
                                step="1"
                                value={settings.interfaceIconSize || 16}
                                onChange={(e) => updateSettings({ interfaceIconSize: Number(e.target.value) })}
                                className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-primary-DEFAULT"
                            />
                        </div>
                        {/* Trait Tag Appearance */}
                        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 mt-2">
                            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-2">
                                特質標籤設定
                            </label>
                            <div className="space-y-2">
                                <div>
                                    <label className="text-xs text-slate-600 dark:text-slate-300 mb-1 flex justify-between">
                                        <span>標籤字體大小</span>
                                        <span className="text-slate-400">{settings.traitTagFontSize || 12}px</span>
                                    </label>
                                    <input
                                        type="range"
                                        min="10"
                                        max="18"
                                        step="1"
                                        value={settings.traitTagFontSize || 12}
                                        onChange={(e) => updateSettings({ traitTagFontSize: Number(e.target.value) })}
                                        className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-primary-DEFAULT"
                                    />
                                </div>
                                <div className="flex justify-between items-center">
                                    <label className="text-xs text-slate-600 dark:text-slate-300">
                                        標籤文字顏色
                                    </label>
                                    <div className="flex items-center gap-2">
                                        {settings.traitTagColor && (
                                            <button
                                                onClick={() => updateSettings({ traitTagColor: '' })}
                                                className="text-[10px] text-slate-400 hover:text-red-500"
                                            >
                                                重置
                                            </button>
                                        )}
                                        <input
                                            type="color"
                                            value={settings.traitTagColor || '#475569'}
                                            onChange={(e) => updateSettings({ traitTagColor: e.target.value })}
                                            className="w-6 h-6 rounded border-0 p-0 cursor-pointer"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </SidebarSection>

            {/* 5. AI Settings */}
            <SidebarSection title="AI 核心設定" icon={Key}>
                <div className="space-y-4">
                    {/* Provider Toggle */}
                    <div className="flex bg-slate-200 dark:bg-slate-800 rounded-lg p-1">
                        {['gemini', 'openai'].map((p) => (
                            <button
                                key={p}
                                onClick={() => setLocalSettings(prev => ({ ...prev, provider: p as any }))}
                                className={clsx(
                                    "flex-1 py-1.5 text-xs font-medium rounded-md transition-all",
                                    localSettings.provider === p
                                        ? "bg-white dark:bg-slate-700 text-primary-DEFAULT shadow-sm"
                                        : "text-slate-500 dark:text-slate-400 hover:text-slate-700"
                                )}
                            >
                                {p === 'gemini' ? 'Gemini' : 'OpenAI'}
                            </button>
                        ))}
                    </div>
                    {/* Gemini Specific */}
                    {localSettings.provider === 'gemini' && (
                        <div className="space-y-3">
                            <div>
                                <label className="text-xs text-slate-500 dark:text-slate-400 mb-1.5 block">API Key</label>
                                <div className="relative">
                                    <input
                                        type={showKey ? "text" : "password"}
                                        value={localSettings.apiKey}
                                        onChange={(e) => setLocalSettings(prev => ({ ...prev, apiKey: e.target.value }))}
                                        placeholder="Enter Gemini Key"
                                        className="w-full pl-3 pr-14 py-2 text-xs rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-primary-DEFAULT outline-none"
                                    />
                                    <div className="absolute right-2 top-2 flex items-center gap-1">
                                        <button
                                            onClick={() => setShowKey(!showKey)}
                                            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                                            title={showKey ? "Hide API Key" : "Show API Key"}
                                        >
                                            {showKey ? <EyeOff size={14} /> : <Eye size={14} />}
                                        </button>
                                        {localSettings.apiKey && (
                                            <button
                                                onClick={clearKey}
                                                className="text-slate-400 hover:text-red-500 transition-colors"
                                                title="Clear API Key"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div>
                                <label className="text-xs text-slate-500 dark:text-slate-400 mb-1.5 block">模型 (Model)</label>
                                <select
                                    value={modelOptions.some(o => o.value === localSettings.geminiModel) ? localSettings.geminiModel : 'custom'}
                                    onChange={e => {
                                        const val = e.target.value;
                                        if (val !== 'custom') {
                                            setLocalSettings(prev => ({ ...prev, geminiModel: val }));
                                        }
                                    }}
                                    className="w-full px-3 py-2 text-xs border rounded-md dark:bg-slate-800 dark:border-slate-700 dark:text-white mb-2"
                                >
                                    {modelOptions.map(opt => (
                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                    ))}
                                </select>
                                {(!modelOptions.some(o => o.value === localSettings.geminiModel) || localSettings.geminiModel === 'custom') && (
                                    <>
                                        <input
                                            type="text"
                                            value={localSettings.geminiModel === 'custom' ? '' : localSettings.geminiModel}
                                            onChange={e => setLocalSettings(prev => ({ ...prev, geminiModel: e.target.value }))}
                                            placeholder="輸入自訂模型 ID (例如 gemini-1.5-pro)"
                                            className="w-full px-3 py-2 text-xs border rounded-md dark:bg-slate-800 dark:border-slate-700"
                                        />
                                        {localSettings.geminiModel && localSettings.geminiModel !== 'custom' && (localSettings.geminiModel.includes(' ') || /[A-Z]/.test(localSettings.geminiModel)) && (
                                            <p className="text-[10px] text-amber-500 mt-1">
                                                提示: Model ID 通常為小寫且無空白 (例如 gemini-1.5-flash)
                                            </p>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>
                    )}
                    {/* OpenAI Specific */}
                    {localSettings.provider === 'openai' && (
                        <div className="space-y-3">
                            <div>
                                <label className="text-xs text-slate-500 dark:text-slate-400 mb-1.5 block">OpenAI Key</label>
                                <div className="relative">
                                    <input
                                        type={showKey ? "text" : "password"}
                                        value={localSettings.openaiKey}
                                        onChange={(e) => setLocalSettings(prev => ({ ...prev, openaiKey: e.target.value }))}
                                        placeholder="sk-..."
                                        className="w-full pl-3 pr-14 py-2 text-xs rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-primary-DEFAULT outline-none"
                                    />
                                    <div className="absolute right-2 top-2 flex items-center gap-1">
                                        <button
                                            onClick={() => setShowKey(!showKey)}
                                            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                                            title={showKey ? "Hide API Key" : "Show API Key"}
                                        >
                                            {showKey ? <EyeOff size={14} /> : <Eye size={14} />}
                                        </button>
                                        {localSettings.openaiKey && (
                                            <button
                                                onClick={clearKey}
                                                className="text-slate-400 hover:text-red-500 transition-colors"
                                                title="Clear API Key"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div>
                                <label className="text-xs text-slate-500 dark:text-slate-400 mb-1.5 block">模型 (Model)</label>
                                <input
                                    type="text"
                                    value={localSettings.openaiModel}
                                    onChange={(e) => setLocalSettings(prev => ({ ...prev, openaiModel: e.target.value }))}
                                    placeholder="e.g. gpt-4o"
                                    className="w-full px-3 py-2 text-xs border rounded-md dark:bg-slate-800 dark:border-slate-700 bg-white"
                                />
                            </div>
                        </div>
                    )}
                    {/* Status & Save */}
                    <div className="flex flex-col gap-2 pt-2">
                        <div className="flex items-center justify-between">
                            <div className="flex-1">
                                {keyStatus === 'invalid' && <span className="text-xs text-red-500 flex items-center gap-1"><AlertCircle size={12} /> 連線失敗</span>}
                                {keyStatus === 'success' && <span className="text-xs text-green-500 flex items-center gap-1"><CheckCircle size={12} /> 設定已儲存</span>}
                            </div>

                            <button
                                onClick={handleSaveSettings}
                                disabled={isValidating}
                                className="bg-slate-900 dark:bg-slate-700 text-white px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-2 hover:bg-slate-700 transition-colors disabled:opacity-50"
                            >
                                {isValidating && <Loader2 size={12} className="animate-spin" />}
                                儲存並測試
                            </button>
                        </div>
                        {errorMessage && (
                            <p className="text-[10px] text-red-500 bg-red-50 dark:bg-red-900/10 p-1.5 rounded border border-red-100 dark:border-red-900/20">
                                {errorMessage}
                            </p>
                        )}
                    </div>
                </div>
            </SidebarSection>

            {/* Data Management */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 mt-auto">
                <h2 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">
                    資料管理
                </h2>
                <div className="grid grid-cols-2 gap-2">
                    <button
                        onClick={() => {
                            const data = JSON.stringify({
                                students,
                                settings,
                                history
                            }, null, 2);
                            const blob = new Blob([data], { type: 'application/json' });
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = `grade_comments_backup_${new Date().toISOString().split('T')[0]}.json`;
                            document.body.appendChild(a);
                            a.click();
                            document.body.removeChild(a);
                            URL.revokeObjectURL(url);
                        }}
                        className="px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors flex items-center justify-center gap-2"
                    >
                        <Download size={14} /> 匯出備份
                    </button>
                    <label className="px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors flex items-center justify-center gap-2 cursor-pointer">
                        <Upload size={14} /> 匯入還原
                        <input
                            type="file"
                            accept=".json"
                            className="hidden"
                            onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (!file) return;
                                const reader = new FileReader();
                                reader.onload = (ev) => {
                                    try {
                                        const data = JSON.parse(ev.target?.result as string);
                                        if (confirm('確定要還原資料嗎？這將會覆蓋目前的學生名單與設定。')) {
                                            restoreData(data);
                                            alert('還原成功！');
                                        }
                                    } catch (err) {
                                        alert('檔案格式錯誤，無法還原。');
                                    }
                                };
                                reader.readAsText(file);
                            }}
                        />
                    </label>
                </div>
            </div>

            {/* Footer / Version */}
            <div className="p-3 border-t border-slate-200 dark:border-slate-800 text-center">
                <span className="text-[10px] text-slate-400">v1.1.0 • Made with ❤️</span>
            </div>
        </div>
    );
}
