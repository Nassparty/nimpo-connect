import { ReactNode } from 'react';
import { BottomNav } from './BottomNav';

interface AppShellProps {
  children: ReactNode;
  header?: ReactNode;
  hideNav?: boolean;
}

export function AppShell({ children, header, hideNav }: AppShellProps) {
  return (
    <div className="flex flex-col min-h-dvh bg-nimpo-surface-2">
      {header && (
        <header className="sticky top-0 z-40 bg-nimpo-surface/90 backdrop-blur-md border-b border-nimpo-separator">
          {header}
        </header>
      )}
      <main className="flex-1 overflow-y-auto pb-20">
        {children}
      </main>
      {!hideNav && <BottomNav />}
    </div>
  );
}
