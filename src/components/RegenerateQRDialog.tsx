import { useState } from 'react';
import { RotateCcw, AlertTriangle, QrCode, ChevronDown } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { VerificationQRDialog } from '@/components/VerificationQRDialog';
import { useRegenerateVerificationKey } from '@/hooks/useRegenerateVerificationKey';
import type { VerificationKeyPair } from '@/utils/verification';

interface RegenerateQRDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  naddr: string;
  pubkey: string;
  dTag: string;
  relays?: string[];
  name: string;
}

export function RegenerateQRDialog({
  isOpen,
  onOpenChange,
  naddr,
  pubkey,
  dTag,
  relays,
  name,
}: RegenerateQRDialogProps) {
  const { t } = useTranslation();
  const [showNewQR, setShowNewQR] = useState(false);
  const [newVerificationKeyPair, setNewVerificationKeyPair] = useState<VerificationKeyPair | null>(null);
  const [useCompact, setUseCompact] = useState(false);
  
  const { mutate: regenerateKey, isPending, reset } = useRegenerateVerificationKey({ pubkey, dTag, relays });

  const handleRegenerate = (compact: boolean = false) => {
    setUseCompact(compact);
    console.log('[RegenerateQR] Starting regeneration', { compact, dTag });
    
    regenerateKey(undefined, {
      onSuccess: (result) => {
        console.log('[RegenerateQR] Success', { eventId: result.event.id });
        const verificationKeyPair = result.verificationKeyPair;
        setNewVerificationKeyPair(verificationKeyPair);
        setShowNewQR(true);
        onOpenChange(false);
      },
      onError: (error) => {
        console.error('[RegenerateQR] Error', error);
      },
    });
  };

  const handleCancel = () => {
    if (isPending) {
      reset();
    }
    onOpenChange(false);
  };

  const handleQRDialogClose = () => {
    setShowNewQR(false);
    setNewVerificationKeyPair(null);
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <RotateCcw className="h-5 w-5" />
              {t('regenerateQR.title')}
            </DialogTitle>
            <DialogDescription>
              {t('regenerateQR.description')}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>{t('regenerateQR.warning.title')}:</strong> {t('regenerateQR.warning.message')}
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                {t('regenerateQR.after.title')}
              </p>
              <ul className="text-sm text-muted-foreground space-y-1 ml-4">
                <li>• {t('regenerateQR.after.item1')}</li>
                <li>• {t('regenerateQR.after.item2')}</li>
                <li>• {t('regenerateQR.after.item3')}</li>
                <li>• {t('regenerateQR.after.item4')}</li>
                <li>• {t('regenerateQR.after.item5')}</li>
              </ul>
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                variant="outline"
                onClick={handleCancel}
                disabled={isPending}
                className="flex-1"
              >
                {t('common.cancel')}
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button disabled={isPending} className="flex-1">
                    {isPending ? (
                      <>
                        <RotateCcw className="h-4 w-4 mr-2 animate-spin" />
                        {t('regenerateQR.action.publishing')}
                      </>
                    ) : (
                      <>
                        <QrCode className="h-4 w-4 mr-2" />
                        {t('regenerateQR.action.regenerate')}
                        <ChevronDown className="h-4 w-4 ml-2" />
                      </>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => handleRegenerate(false)}>
                    {t('regenerateQR.action.standard')}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleRegenerate(true)}>
                    <span className="text-green-600 font-medium">{t('regenerateQR.action.compact')}</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Show new QR code dialog after successful regeneration */}
      {newVerificationKeyPair && (
        <VerificationQRDialog
          isOpen={showNewQR}
          onOpenChange={handleQRDialogClose}
          naddr={naddr}
          verificationKeyPair={newVerificationKeyPair}
          cacheName={name}
          useCompact={useCompact}
        />
      )}
    </>
  );
}