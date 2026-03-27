import { Link, useLocation } from '@tanstack/react-router';
import { Activity, User, MessageSquare, FlaskConical, RotateCcw, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';

const NAV_ITEMS = [
  { to: '/' as const, label: 'Dashboard', icon: Activity },
  { to: '/profile' as const, label: 'Profile & Habits', icon: User },
  { to: '/chat' as const, label: 'AI Chat', icon: MessageSquare },
  { to: '/health-data' as const, label: 'Blood Work', icon: FlaskConical },
];

interface AppHeaderProps {
  onReset?: () => void;
  extraActions?: React.ReactNode;
}

export default function AppHeader({ onReset, extraActions }: AppHeaderProps) {
  const location = useLocation();

  return (
    <header className="border-b border-border px-4 py-2 sm:px-6 lg:px-8 bg-card sticky top-0 z-20">
      <div className="max-w-[1440px] mx-auto flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/" className="flex items-center gap-2">
            <h1 className="text-base font-bold text-foreground tracking-tight font-display">Future You</h1>
          </Link>
          <nav className="hidden sm:flex items-center gap-0.5 bg-muted/40 rounded-lg p-0.5">
            {NAV_ITEMS.map(item => {
              const isActive = location.pathname === item.to || 
                (item.to !== '/' && location.pathname.startsWith(item.to));
              return (
                <Link key={item.to} to={item.to}>
                  <button className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                    isActive 
                      ? 'bg-card text-foreground shadow-sm' 
                      : 'text-muted-foreground hover:text-foreground'
                  }`}>
                    <item.icon className="w-3.5 h-3.5" />
                    {item.label}
                  </button>
                </Link>
              );
            })}
          </nav>
        </div>
        <div className="flex items-center gap-2">
          {extraActions}
          {onReset && (
            <Button variant="outline" size="sm" onClick={onReset} className="text-xs gap-1.5 h-8 px-3">
              <RotateCcw className="w-3.5 h-3.5" />
              Reset
            </Button>
          )}
        </div>
      </div>
      {/* Mobile nav */}
      <nav className="sm:hidden flex items-center gap-1 mt-2 overflow-x-auto pb-1">
        {NAV_ITEMS.map(item => {
          const isActive = location.pathname === item.to ||
            (item.to !== '/' && location.pathname.startsWith(item.to));
          return (
            <Link key={item.to} to={item.to}>
              <button className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md text-[11px] font-medium whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground'
              }`}>
                <item.icon className="w-3 h-3" />
                {item.label}
              </button>
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
