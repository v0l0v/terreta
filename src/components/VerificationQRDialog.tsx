import { useState, useEffect } from 'react';
import { Download, Copy, Check, QrCode } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/useToast';
import { generateVerificationQR, downloadQRCode, type VerificationKeyPair } from '@/lib/verification';

interface VerificationQRDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  naddr: string;
  verificationKeyPair: VerificationKeyPair;
  cacheName: string;
}

export function VerificationQRDialog({
  isOpen,
  onOpenChange,
  naddr,
  verificationKeyPair,
  cacheName
}: VerificationQRDialogProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen && naddr && verificationKeyPair.nsec) {
      setIsGenerating(true);
      generateVerificationQR(naddr, verificationKeyPair.nsec)
        .then(setQrDataUrl)
        .catch((error) => {
          console.error('Failed to generate QR code:', error);
          toast({
            title: 'QR Generation Failed',
            description: 'Unable to generate QR code. Please try again.',
            variant: 'destructive',
          });
        })
        .finally(() => setIsGenerating(false));
    }
  }, [isOpen, naddr, verificationKeyPair.nsec, toast]);

  const handleDownload = () => {
    if (qrDataUrl) {
      const safeCacheName = cacheName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      const filename = `${safeCacheName}-${naddr}-verification-qr.png`;
      downloadQRCode(qrDataUrl, filename);
      toast({
        title: 'QR Code Downloaded',
        description: 'The verification QR code has been saved to your downloads.',
      });
    }
  };

  const handleCopyKey = async () => {
    try {
      await navigator.clipboard.writeText(verificationKeyPair.nsec);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({
        title: 'Verification Key Copied',
        description: 'The private verification key has been copied to your clipboard.',
      });
    } catch (error) {
      toast({
        title: 'Copy Failed',
        description: 'Unable to copy to clipboard. Please copy manually.',
        variant: 'destructive',
      });
    }
  };

  const verificationUrl = `https://treasures.to/${naddr}#verify=${verificationKeyPair.nsec}`;

  // Verification QR dialog rendering

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5" />
            Verification QR Code
          </DialogTitle>
          <DialogDescription>
            Print this QR code and place it with your geocache. Finders can scan it to access the verified logging form.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* QR Code Display */}
          <div className="flex justify-center p-4 bg-white rounded-lg border">
            {isGenerating ? (
              <div className="w-64 h-64 flex items-center justify-center bg-muted rounded">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                  <p className="text-sm text-muted-foreground">Generating QR code...</p>
                </div>
              </div>
            ) : qrDataUrl ? (
              <img 
                src={qrDataUrl} 
                alt="Verification QR Code" 
                className="w-64 h-64 rounded"
              />
            ) : (
              <div className="w-64 h-64 flex items-center justify-center bg-muted rounded">
                <p className="text-sm text-muted-foreground">Failed to generate QR code</p>
              </div>
            )}
          </div>

          {/* Instructions */}
          <Alert>
            <AlertDescription>
              <strong>Instructions:</strong>
              <ol className="list-decimal list-inside mt-2 space-y-1 text-sm">
                <li>Download and print this QR code</li>
                <li>Place it inside your geocache container</li>
                <li>Finders can scan it to access the verified logging form</li>
                <li>Keep the verification key safe - you'll need it to verify logs</li>
              </ol>
            </AlertDescription>
          </Alert>

          {/* Verification Key */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Verification Key (Keep Private)</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={verificationKeyPair.nsec}
                readOnly
                className="flex-1 px-3 py-2 text-xs font-mono bg-muted border rounded-md"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyKey}
                className="flex-shrink-0"
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Store this key securely. Anyone with this key can create verified logs for your cache.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-2">
            <Button
              onClick={handleDownload}
              disabled={!qrDataUrl}
              className="flex-1"
            >
              <Download className="h-4 w-4 mr-2" />
              Download QR Code
            </Button>
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Done
            </Button>
          </div>

          {/* URL for reference */}
          <details className="text-xs">
            <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
              Show verification URL
            </summary>
            <div className="mt-2 p-2 bg-muted rounded font-mono break-all">
              {verificationUrl}
            </div>
          </details>
        </div>
      </DialogContent>
    </Dialog>
  );
}