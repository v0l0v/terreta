import { useState } from 'react';
import { Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCurrentUser } from '@/features/auth/hooks/useCurrentUser';
import { requestProvider } from 'webln';
import type { WebLNProvider } from 'webln';
import type { ZapTarget } from '@/types/zaps';
import { ZapModal } from './ZapModal';
import { useTheme } from 'next-themes';

interface ZapButtonProps {
  target: ZapTarget;
}

export function ZapButton({ target }: ZapButtonProps) {
  const [webln, setWebln] = useState<WebLNProvider | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { user } = useCurrentUser();
  const { theme } = useTheme();

  const handleOpenModal = async () => {
    if (!webln) {
      try {
        const provider = await requestProvider();
        setWebln(provider);
      } catch (err) {
        // Silently fail
      }
    }
    setIsModalOpen(true);
  };

  const buttonClasses = theme === 'adventure'
    ? "bg-primary text-primary-foreground hover:bg-primary/90"
    : theme === 'dark'
    ? "bg-white text-black hover:bg-gray-200"
    : "bg-black text-white hover:bg-gray-800";

  return (
    <>
      <Button size="sm" onClick={handleOpenModal} disabled={!user} className={buttonClasses}>
        <Zap className="h-4 w-4" />
      </Button>
      {isModalOpen && <ZapModal open={isModalOpen} onOpenChange={setIsModalOpen} target={target} webln={webln} />}
    </>
  );
}
