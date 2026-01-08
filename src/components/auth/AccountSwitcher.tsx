// NOTE: This file is stable and usually should not be modified.
// It is important that all functionality in this file is preserved, and should only be modified if explicitly requested.

import { LogOut, UserIcon, UserPlus, Settings, Bookmark, Wallet, Sun, Moon, Sword, Monitor, Radio } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useLoggedInAccounts } from '@/features/geocache/hooks/useLoggedInAccounts';
import { useNavigate } from 'react-router-dom';
import { WalletModal } from '@/components/WalletModal';
import { useTheme } from '@/shared/hooks/useTheme';
import { useAppContext } from '@/shared/hooks/useAppContext';

interface AccountSwitcherProps {
  onAddAccountClick: () => void;
}

export function AccountSwitcher({ onAddAccountClick }: AccountSwitcherProps) {
  const { t } = useTranslation();
  const { currentUser, otherUsers, setLogin, removeLogin, isLoadingCurrentUser } = useLoggedInAccounts();
  const navigate = useNavigate();
  const { setTheme, theme } = useTheme();
  const { config, updateConfig, presetRelays = [] } = useAppContext();

  if (!currentUser) return null;

  // Get theme icon
  const getThemeIcon = () => {
    switch (theme) {
      case 'light': return <Sun className="h-4 w-4" />;
      case 'dark': return <Moon className="h-4 w-4" />;
      case 'adventure': return <Sword className="h-4 w-4" />;
      case 'system': return <Monitor className="h-4 w-4" />;
      default: return <Monitor className="h-4 w-4" />;
    }
  };

  // Get theme display name
  const getThemeDisplayName = () => {
    switch (theme) {
      case 'light': return t('theme.light');
      case 'dark': return t('theme.dark');
      case 'adventure': return t('theme.adventure');
      case 'system': return t('theme.system');
      default: return t('theme.system');
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className='flex items-center gap-3 p-2 rounded-full hover:bg-accent adventure:hover:bg-stone-200 transition-all text-foreground'>
          <Avatar className='w-8 h-8'>
            {/* Show loading state for avatar to prevent layout shift */}
            {isLoadingCurrentUser ? (
              <AvatarFallback>
                <div className="animate-pulse bg-muted rounded-full w-full h-full flex items-center justify-center">
                  <UserIcon className="w-4 h-4 text-muted-foreground" />
                </div>
              </AvatarFallback>
            ) : (
              <>
                <AvatarImage src={currentUser.metadata.picture} alt={currentUser.metadata.name} />
                <AvatarFallback>{currentUser.metadata.name?.charAt(0) || <UserIcon />}</AvatarFallback>
              </>
            )}
          </Avatar>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className='w-56 p-2 animate-scale-in'
        side="bottom"
        sideOffset={8}
        avoidCollisions={true}
        collisionPadding={{ bottom: 80 }}
      >
        {otherUsers.length > 0 && (
          <>
            <div className='font-medium text-sm px-2 py-1.5'>{t('navigation.switchAccount')}</div>
            {otherUsers.map((user) => (
              <DropdownMenuItem
                key={user.id}
                onClick={() => setLogin(user.id)}
                className='flex items-center gap-2 cursor-pointer p-2 rounded-md'
              >
                <Avatar className='w-8 h-8'>
                  {user.isLoadingMetadata ? (
                    <AvatarFallback>
                      <div className="animate-pulse bg-muted rounded-full w-full h-full flex items-center justify-center">
                        <UserIcon className="w-4 h-4 text-muted-foreground" />
                      </div>
                    </AvatarFallback>
                  ) : (
                    <>
                      <AvatarImage src={user.metadata.picture} alt={user.metadata.name} />
                      <AvatarFallback>{user.metadata.name?.charAt(0) || <UserIcon />}</AvatarFallback>
                    </>
                  )}
                </Avatar>
                <div className='flex-1 truncate'>
                  <p className='text-sm font-medium'>
                    {user.isLoadingMetadata ? (
                      <span className="animate-pulse bg-muted rounded w-20 h-4 inline-block"></span>
                    ) : (
                      user.metadata.name || user.pubkey
                    )}
                  </p>
                </div>
                {user.id === currentUser.id && <div className='w-2 h-2 rounded-full bg-primary'></div>}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
          </>
        )}
        <DropdownMenuItem
          onClick={() => navigate(`/profile/${currentUser.pubkey}`)}
          className='flex items-center gap-2 cursor-pointer p-2 rounded-md'
        >
          <UserIcon className='w-4 h-4' />
          <span>{t('navigation.myProfile')}</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => navigate('/saved')}
          className='flex items-center gap-2 cursor-pointer p-2 rounded-md'
        >
          <Bookmark className='w-4 h-4' />
          <span>{t('navigation.savedCaches')}</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => navigate('/settings')}
          className='flex items-center gap-2 cursor-pointer p-2 rounded-md'
        >
          <Settings className='w-4 h-4' />
          <span>{t('navigation.appSettings')}</span>
        </DropdownMenuItem>
        <WalletModal>
          <DropdownMenuItem
            className='flex items-center gap-2 cursor-pointer p-2 rounded-md'
            onSelect={(e) => e.preventDefault()}
          >
            <Wallet className='w-4 h-4' />
            <span>{t('navigation.walletSettings')}</span>
          </DropdownMenuItem>
        </WalletModal>
        <DropdownMenuSeparator />

        {/* Theme Submenu */}
        <DropdownMenuSub>
          <DropdownMenuSubTrigger className='flex items-center gap-2 cursor-pointer p-2 rounded-md'>
            {getThemeIcon()}
            <span>{getThemeDisplayName()}</span>
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            <DropdownMenuItem onClick={() => setTheme("light")}>
              <Sun className="mr-2 h-4 w-4" />
              {t('theme.light')}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTheme("dark")}>
              <Moon className="mr-2 h-4 w-4" />
              {t('theme.dark')}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTheme("adventure")}>
              <Sword className="mr-2 h-4 w-4" />
              {t('theme.adventure')}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTheme("system")}>
              <Monitor className="mr-2 h-4 w-4" />
              {t('theme.system')}
            </DropdownMenuItem>
          </DropdownMenuSubContent>
        </DropdownMenuSub>

        {/* Relay Submenu - Desktop only */}
        <DropdownMenuSub>
          <DropdownMenuSubTrigger className='hidden md:flex items-center gap-2 cursor-pointer p-2 rounded-md'>
            <Radio className='w-4 h-4' />
            <span className="truncate max-w-[140px]">
              {presetRelays.find(r => r.url === config.relayUrl)?.name || config.relayUrl.replace(/^wss?:\/\//, '')}
            </span>
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            {presetRelays.map((relay) => (
              <DropdownMenuItem
                key={relay.url}
                onClick={() => updateConfig((current) => ({ ...current, relayUrl: relay.url }))}
              >
                <div className="flex flex-col">
                  <span className="font-medium">{relay.name}</span>
                  <span className="text-xs text-muted-foreground truncate max-w-[200px]">{relay.url}</span>
                </div>
              </DropdownMenuItem>
            ))}
          </DropdownMenuSubContent>
        </DropdownMenuSub>

        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={onAddAccountClick}
          className='flex items-center gap-2 cursor-pointer p-2 rounded-md'
        >
          <UserPlus className='w-4 h-4' />
          <span>{t('navigation.addAnotherAccount')}</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => removeLogin(currentUser.id)}
          className='flex items-center gap-2 cursor-pointer p-2 rounded-md text-red-500'
        >
          <LogOut className='w-4 h-4' />
          <span>{t('navigation.logOut')}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}