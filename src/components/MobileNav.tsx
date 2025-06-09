import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Map, Plus, Menu, Settings, Bookmark, LogOut, User, QrCode } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { LoginArea } from '@/components/auth/LoginArea';
import { OfflineIndicator } from '@/components/OfflineIndicator';
import { ThemeToggle } from '@/components/ThemeToggle';
import { RelaySelector } from '@/components/RelaySelector';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useLoggedInAccounts } from '@/hooks/useLoggedInAccounts';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';

const navigation = [
  { name: 'Home', href: '/', icon: Home },
  { name: 'Map', href: '/map', icon: Map },
  { name: 'Claim', href: '/claim', icon: QrCode },
  { name: 'New', href: '/create', icon: Plus },
];

// Helper function for consistent theme-aware styling
function getThemeClasses(isAdventureTheme: boolean) {
  return {
    header: isAdventureTheme 
      ? 'bg-adventure-nav border-adventure-nav' 
      : 'bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60',
    text: isAdventureTheme ? 'text-stone-200' : 'text-foreground',
    textMuted: isAdventureTheme ? 'text-stone-400' : 'text-muted-foreground',
    textActive: isAdventureTheme ? 'text-stone-200' : 'text-green-600',
    button: isAdventureTheme ? 'text-stone-200 hover:bg-stone-700/50 hover:text-stone-100' : '',
    icon: isAdventureTheme ? 'sepia' : '',
  };
}

// Navigation link component for reusability
function NavLink({ 
  to, 
  icon: Icon, 
  children, 
  isActive, 
  onClick 
}: { 
  to: string; 
  icon: React.ComponentType<{ className?: string }>; 
  children: React.ReactNode; 
  isActive: boolean; 
  onClick: () => void; 
}) {
  return (
    <Link
      to={to}
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground",
        isActive 
          ? "bg-accent text-accent-foreground" 
          : "text-muted-foreground"
      )}
    >
      <Icon className="h-4 w-4" />
      {children}
    </Link>
  );
}

export function MobileHeader() {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const { user } = useCurrentUser();
  const { currentUser, removeLogin } = useLoggedInAccounts();
  const { theme } = useTheme();
  const isAdventureTheme = theme === 'adventure';
  const themeClasses = getThemeClasses(isAdventureTheme);

  const closeSheet = () => setIsOpen(false);

  return (
    <header className={cn(
      "sticky top-0 z-40 w-full border-b md:hidden pt-safe-top",
      themeClasses.header
    )}>
      <div className="container flex h-16 items-center justify-between">
        {/* Menu Button */}
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Button 
              variant="ghost" 
              size="sm" 
              className={cn("-ml-2", themeClasses.button)}
            >
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle menu</span>
            </Button>
          </SheetTrigger>
          
          {/* Side Sheet Content */}
          <SheetContent side="left" className="flex flex-col">
            {/* Header */}
            <div className="flex items-center gap-2 px-2 py-4">
              <img 
                src="/icon.png" 
                alt="Treasures" 
                className={cn("h-10 w-10 transition-all duration-200", themeClasses.icon)} 
              />
              <span className="font-bold text-lg">Treasures</span>
            </div>
            
            {/* Navigation Links */}
            <nav className="flex flex-col gap-2 px-2 flex-1">
              {navigation.map((item) => (
                <NavLink
                  key={item.name}
                  to={item.href}
                  icon={item.icon}
                  isActive={location.pathname === item.href}
                  onClick={closeSheet}
                >
                  {item.name}
                </NavLink>
              ))}
              
              <NavLink
                to="/saved"
                icon={Bookmark}
                isActive={location.pathname === '/saved'}
                onClick={closeSheet}
              >
                Saved Caches
              </NavLink>
              
              {user && (
                <>
                  <NavLink
                    to="/profile"
                    icon={User}
                    isActive={location.pathname === '/profile'}
                    onClick={closeSheet}
                  >
                    My Profile
                  </NavLink>
                  <NavLink
                    to="/settings"
                    icon={Settings}
                    isActive={location.pathname === '/settings'}
                    onClick={closeSheet}
                  >
                    App Settings
                  </NavLink>
                </>
              )}
            </nav>
            
            {/* Footer */}
            <div className="mt-auto p-2">
              <div className="space-y-3">
                {/* Settings - Always visible */}
                <div className="px-3 py-2 space-y-3">
                  <OfflineIndicator showDetails={false} />
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-muted-foreground shrink-0">Theme</span>
                    <ThemeToggle variant="mobile-sheet" />
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-muted-foreground shrink-0">Relay</span>
                    <RelaySelector className="flex-1" />
                  </div>
                </div>

                {/* User-specific content */}
                {currentUser ? (
                  <div className="space-y-3">
                    {/* User Info */}
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-accent/50">
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={currentUser.metadata.picture} alt={currentUser.metadata.name} />
                        <AvatarFallback>
                          {currentUser.metadata.name?.charAt(0) || <User className="w-4 h-4" />}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">
                          {currentUser.metadata.name || `${currentUser.pubkey.slice(0, 8)}...`}
                        </p>
                        <p className="text-xs text-muted-foreground">Logged in</p>
                      </div>
                    </div>
                    
                    {/* Logout Button */}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        removeLogin(currentUser.id);
                        closeSheet();
                      }}
                      className="w-full flex items-center gap-2"
                    >
                      <LogOut className="w-4 h-4" />
                      Log out
                    </Button>
                  </div>
                ) : (
                  <LoginArea />
                )}
              </div>
            </div>
          </SheetContent>
        </Sheet>
        
        {/* Center Logo */}
        <Link to="/" className="absolute left-1/2 transform -translate-x-1/2 flex flex-col items-center gap-1">
          <img 
            src="/icon.png" 
            alt="Treasures" 
            className={cn("h-8 w-8 transition-all duration-200", themeClasses.icon)} 
          />
          <h1 className={cn("text-xs font-bold m-0 leading-none", themeClasses.text)}>
            Treasures
          </h1>
        </Link>
        
        {/* Right Side Login */}
        <div className="-mr-2">
          <LoginArea compact />
        </div>
      </div>
    </header>
  );
}

// Bottom navigation item component
function BottomNavItem({ 
  to, 
  icon: Icon, 
  children, 
  isActive, 
  themeClasses 
}: { 
  to: string; 
  icon: React.ComponentType<{ className?: string }>; 
  children: React.ReactNode; 
  isActive: boolean; 
  themeClasses: ReturnType<typeof getThemeClasses>; 
}) {
  return (
    <Link
      to={to}
      className={cn(
        "flex flex-col items-center justify-center gap-1 px-2 py-1 text-xs transition-colors",
        isActive 
          ? themeClasses.textActive 
          : cn(themeClasses.textMuted, "hover:text-foreground")
      )}
    >
      <div className="flex items-center justify-center w-6 h-6">
        <Icon className={cn("h-5 w-5", isActive && themeClasses.textActive)} />
      </div>
      <span className={cn(
        "text-center leading-tight",
        isActive && cn(themeClasses.textActive, "font-medium")
      )}>
        {children}
      </span>
    </Link>
  );
}

export function MobileBottomNav() {
  const location = useLocation();
  const { theme } = useTheme();
  const isAdventureTheme = theme === 'adventure';
  const themeClasses = getThemeClasses(isAdventureTheme);

  return (
    <nav className={cn(
      "fixed bottom-0 left-0 right-0 z-40 border-t md:hidden pb-safe-bottom",
      themeClasses.header
    )}>
      <div className="grid grid-cols-4 h-16 items-center">
        {navigation.map((item) => (
          <BottomNavItem
            key={item.name}
            to={item.href}
            icon={item.icon}
            isActive={location.pathname === item.href}
            themeClasses={themeClasses}
          >
            {item.name}
          </BottomNavItem>
        ))}
      </div>
    </nav>
  );
}

// Keep the original export for backward compatibility
export function MobileNav() {
  return (
    <>
      <MobileHeader />
      <MobileBottomNav />
    </>
  );
}