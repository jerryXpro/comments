import type { ReactNode } from 'react';

export function Layout({ children, sidebar }: { children: ReactNode; sidebar: ReactNode }) {
    return (
        <div className="flex h-screen bg-background-light dark:bg-background-dark text-slate-800 dark:text-slate-100 overflow-hidden font-sans">
            {/* Sidebar - Desktop fixed, Mobile hidden (handled by Sidebar component) */}
            <aside className="flex-shrink-0 border-r border-slate-200 dark:border-slate-700 bg-surface-light dark:bg-surface-dark hidden md:flex flex-col h-full z-10 transition-none">
                {sidebar}
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col h-full overflow-hidden relative">
                {children}
            </main>
        </div>
    );
}
