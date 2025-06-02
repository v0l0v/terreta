import { useState } from 'react';
import { QrCode, Upload, Camera } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { QRUploadScanner } from '@/components/QRUploadScanner';
import { QRCameraScanner } from '@/components/QRCameraScanner';
import { useToast } from '@/hooks/useToast';
import { type QRScanResult } from '@/hooks/useQRScanner';

interface QRScannerDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onScanResult: (result: QRScanResult) => void;
  title?: string;
  description?: string;
}

export function QRScannerDialog({
  isOpen,
  onOpenChange,
  onScanResult,
  title = 'Scan QR Code',
  description = 'Upload an image or use your camera to scan a QR code'
}: QRScannerDialogProps) {
  const [activeTab, setActiveTab] = useState('upload');
  const { toast } = useToast();

  const handleScanResult = (result: QRScanResult) => {
    onScanResult(result);
    onOpenChange(false);
    toast({
      title: 'QR Code Scanned',
      description: 'Successfully detected QR code content.',
    });
  };

  const handleError = (error: string) => {
    toast({
      title: 'Scan Error',
      description: error,
      variant: 'destructive',
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5" />
            {title}
          </DialogTitle>
          <DialogDescription>
            {description}
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="upload" className="gap-2">
              <Upload className="h-4 w-4" />
              Upload Image
            </TabsTrigger>
            <TabsTrigger value="camera" className="gap-2">
              <Camera className="h-4 w-4" />
              Use Camera
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="mt-4">
            <QRUploadScanner
              onScanResult={handleScanResult}
              onError={handleError}
            />
          </TabsContent>

          <TabsContent value="camera" className="mt-4">
            <QRCameraScanner
              onScanResult={handleScanResult}
              onError={handleError}
            />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}