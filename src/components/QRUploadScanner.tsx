import { useRef, useState } from 'react';
import { Upload, Camera, X, CheckCircle, AlertCircle } from 'lucide-react';
import { CompassSpinner } from '@/components/ui/loading';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useQRScanner, type QRScanResult } from '@/hooks/useQRScanner';

interface QRUploadScannerProps {
  onScanResult: (result: QRScanResult) => void;
  onError?: (error: string) => void;
  className?: string;
  acceptedFormats?: string[];
  maxFileSize?: number; // in MB
}

export function QRUploadScanner({
  onScanResult,
  onError,
  className = '',
  acceptedFormats = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'],
  maxFileSize = 10
}: QRUploadScannerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [scanResult, setScanResult] = useState<QRScanResult | null>(null);
  
  const { scanFile, isScanning, error, clearError } = useQRScanner();

  const validateFile = (file: File): string | null => {
    if (!acceptedFormats.includes(file.type)) {
      return `File type not supported. Please use: ${acceptedFormats.map(f => f.split('/')[1]).join(', ')}`;
    }
    
    if (file.size > maxFileSize * 1024 * 1024) {
      return `File too large. Maximum size is ${maxFileSize}MB`;
    }
    
    return null;
  };

  const handleFileSelect = async (file: File) => {
    clearError();
    setScanResult(null);
    
    const validationError = validateFile(file);
    if (validationError) {
      onError?.(validationError);
      return;
    }

    setSelectedFile(file);
    
    try {
      const result = await scanFile(file);
      if (result) {
        setScanResult(result);
        onScanResult(result);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to scan QR code';
      onError?.(errorMessage);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
  };

  const handleClear = () => {
    setSelectedFile(null);
    setScanResult(null);
    clearError();
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* File Upload Area */}
      <Card className={`border-2 border-dashed transition-colors ${
        dragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'
      }`}>
        <CardContent className="p-6">
          <div
            className="text-center space-y-4"
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <div className="mx-auto w-12 h-12 text-muted-foreground">
              {isScanning ? (
                <CompassSpinner size={48} variant="component" />
              ) : (
                <Upload className="w-12 h-12" />
              )}
            </div>
            
            <div className="space-y-2">
              <h3 className="text-lg font-medium">
                {isScanning ? 'Scanning QR Code...' : 'Upload QR Code Image'}
              </h3>
              <p className="text-sm text-muted-foreground">
                Drag and drop an image file here, or click to select
              </p>
              <p className="text-xs text-muted-foreground">
                Supports: {acceptedFormats.map(f => f.split('/')[1].toUpperCase()).join(', ')} 
                (max {maxFileSize}MB)
              </p>
            </div>

            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={isScanning}
              className="gap-2"
            >
              <Camera className="w-4 h-4" />
              Choose File
            </Button>

            <input
              ref={fileInputRef}
              type="file"
              accept={acceptedFormats.join(',')}
              onChange={handleInputChange}
              className="hidden"
              disabled={isScanning}
            />
          </div>
        </CardContent>
      </Card>

      {/* Selected File Info */}
      {selectedFile && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-muted rounded flex items-center justify-center">
                  <Camera className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-medium text-sm">{selectedFile.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClear}
                className="h-8 w-8 p-0"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Scan Result */}
      {scanResult && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-2">
              <p className="font-medium">QR Code detected successfully!</p>
              <div className="bg-muted p-2 rounded text-sm font-mono break-all">
                {scanResult.text}
              </div>
              <p className="text-xs text-muted-foreground">
                Format: {scanResult.format}
              </p>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Error Display */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-1">
              <p className="font-medium">Scan failed</p>
              <p className="text-sm">{error.message}</p>
              {error.type === 'not_found' && (
                <p className="text-xs">
                  Tip: Ensure the QR code is clearly visible and well-lit in the image.
                </p>
              )}
            </div>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}