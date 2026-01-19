import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Layout } from './components/layout/Layout';
import { Navbar } from './components/layout/Navbar';
import { Sidebar } from './components/layout/Sidebar';
import { StudentList } from './components/comment/StudentList';
import { HistorySidebar } from './components/comment/HistorySidebar';
import { Menu } from 'lucide-react';
import { clsx } from 'clsx';

function AppContent() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const { settings } = useApp();

  // Apply Interface Settings
  React.useEffect(() => {
    // 1rem = interfaceFontSize (default 14px? No, browser default is 16. Tailwind assumes 1rem=16px)
    // If we want "system default" to be the baseline, let's assume 16px is standard.
    // User setting default is 14? If I set html size to 14, everything shrinks.
    // It's a "Density" setting essentially.
    const fontSize = settings.interfaceFontSize || 16;
    document.documentElement.style.fontSize = `${fontSize}px`;

    // Icon Scale (Relative to text size 1em)
    // Base 16px. If setting is 16, scale is 1.
    const iconBase = 16;
    const iconSetting = settings.interfaceIconSize || 16;
    const scale = iconSetting / iconBase;
    document.documentElement.style.setProperty('--ui-icon-scale', scale.toString());

  }, [settings.interfaceFontSize, settings.interfaceIconSize]);

  return (
    <Layout
      sidebar={<Sidebar />}
    >
      <Navbar onHistoryClick={() => setIsHistoryOpen(true)} />

      {/* Mobile Sidebar Toggle & Drawer */}
      <div className="md:hidden absolute top-4 left-4 z-50">
        {/* This button is redundant if Navbar has a menu, but Navbar is Flex, so we might need a dedicated mobile toggle.
              Actually, let's put the mobile toggle INSIDE Navbar for better UX, or just overlay it.
              For now, let's keep it simple: The Navbar is sticky. We can add a Menu button there.
          */}
      </div>

      {/* Mobile Drawer Overlay */}
      {isSidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-30 md:hidden" onClick={() => setIsSidebarOpen(false)} />
      )}

      {/* History Drawer Overlay */}
      {isHistoryOpen && (
        <div className="fixed inset-0 bg-black/20 z-40" onClick={() => setIsHistoryOpen(false)} />
      )}

      {/* Mobile Sidebar */}
      <div className={clsx(
        "fixed inset-y-0 left-0 bg-white dark:bg-slate-900 shadow-xl transform transition-transform duration-300 z-40 md:hidden",
        isSidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <Sidebar />
      </div>

      {/* History Sidebar (Right Drawer) */}
      <div className={clsx(
        "fixed inset-y-0 right-0 w-96 max-w-full bg-white dark:bg-slate-900 shadow-2xl transform transition-transform duration-300 z-50",
        isHistoryOpen ? "translate-x-0" : "translate-x-full"
      )}>
        <HistorySidebar onClose={() => setIsHistoryOpen(false)} />
      </div>

      {/* Floating Action Button for Mobile Sidebar - Only visible on mobile if closed? Or just part of Navbar */}
      <button
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        className="md:hidden fixed bottom-6 right-6 p-4 bg-primary-DEFAULT text-white rounded-full shadow-lg z-30"
      >
        <Menu />
      </button>

      <StudentList />
    </Layout>
  );
}

function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

export default App;
