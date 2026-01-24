import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { 
  Menu, 
  X, 
  LayoutDashboard, 
  PawPrint, 
  DollarSign, 
  Milk, 
  Receipt, 
  Baby, 
  Bell, 
  LogOut,
  Globe
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface AppLayoutProps {
  children: React.ReactNode;
}

const navItems = [
  { path: '/dashboard', icon: LayoutDashboard, labelKey: 'nav_dashboard' as const },
  { path: '/animals', icon: PawPrint, labelKey: 'nav_animals' as const },
  { path: '/milk-rates', icon: DollarSign, labelKey: 'nav_milk_rates' as const },
  { path: '/milk-collection', icon: Milk, labelKey: 'nav_milk_collection' as const },
  { path: '/expenses', icon: Receipt, labelKey: 'nav_expenses' as const },
  { path: '/breeding', icon: Baby, labelKey: 'nav_breeding' as const },
  { path: '/notifications', icon: Bell, labelKey: 'nav_notifications' as const },
];

export const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { t, language, setLanguage } = useLanguage();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'kn' : 'en');
  };

  const NavContent = () => (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-primary flex items-center justify-center">
            <Milk className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="font-semibold text-foreground">{t('app_name')}</h1>
            <p className="text-xs text-muted-foreground">{user?.name}</p>
          </div>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setIsOpen(false)}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-foreground hover:bg-accent'
              )}
            >
              <item.icon className="h-5 w-5" />
              {t(item.labelKey)}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-border space-y-2">
        <Button
          variant="ghost"
          className="w-full justify-start gap-3"
          onClick={toggleLanguage}
        >
          <Globe className="h-5 w-5" />
          {language === 'en' ? 'ಕನ್ನಡ' : 'English'}
        </Button>
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 text-destructive hover:text-destructive hover:bg-destructive/10"
          onClick={handleLogout}
        >
          <LogOut className="h-5 w-5" />
          {t('logout')}
        </Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Header */}
      <header className="lg:hidden sticky top-0 z-50 bg-card border-b border-border">
        <div className="flex items-center justify-between px-4 h-14">
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-72">
              <NavContent />
            </SheetContent>
          </Sheet>
          
          <div className="flex items-center gap-2">
            <Milk className="h-5 w-5 text-primary" />
            <span className="font-semibold text-foreground">{t('app_name')}</span>
          </div>
          
          <Button variant="ghost" size="icon" onClick={toggleLanguage}>
            <Globe className="h-5 w-5" />
          </Button>
        </div>
      </header>

      <div className="flex">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:block fixed left-0 top-0 h-screen w-64 bg-card border-r border-border">
          <NavContent />
        </aside>

        {/* Main Content */}
        <main className="flex-1 lg:ml-64">
          <div className="container mx-auto px-4 py-6 max-w-7xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};
