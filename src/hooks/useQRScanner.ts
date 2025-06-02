import { useState, useCallback } from 'react';
import { BrowserMultiFormatReader, NotFoundException, ChecksumException, FormatException } from '@zxing/library';

export interface QRScanResult {
  text: string;
  format: string;
}

export interface QRScanError {
  type: 'not_found' | 'checksum' | 'format' | 'file_error' | 'unknown';
  message: string;
}

export function useQRScanner() {
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<QRScanError | null>(null);

  const scanFile = useCallback(async (file: File): Promise<QRScanResult | null> => {
    setIsScanning(true);
    setError(null);

    try {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        throw new Error('Please select an image file');
      }

      // Create a BrowserMultiFormatReader instance
      const codeReader = new BrowserMultiFormatReader();

      // Convert file to image element
      const imageUrl = URL.createObjectURL(file);
      
      try {
        const img = new Image();
        
        // Wait for image to load
        await new Promise<void>((resolve, reject) => {
          img.onload = () => resolve();
          img.onerror = () => reject(new Error('Failed to load image'));
          img.src = imageUrl;
        });

        // Scan the image for QR codes
        const result = await codeReader.decodeFromImageElement(img);
        
        return {
          text: result.getText(),
          format: result.getBarcodeFormat().toString()
        };

      } finally {
        // Clean up the object URL
        URL.revokeObjectURL(imageUrl);
        codeReader.reset();
      }

    } catch (error: unknown) {
      let qrError: QRScanError;

      if (error instanceof NotFoundException) {
        qrError = {
          type: 'not_found',
          message: 'No QR code found in the image. Please ensure the QR code is clearly visible and try again.'
        };
      } else if (error instanceof ChecksumException) {
        qrError = {
          type: 'checksum',
          message: 'QR code found but appears to be damaged or corrupted. Please try a clearer image.'
        };
      } else if (error instanceof FormatException) {
        qrError = {
          type: 'format',
          message: 'QR code format not supported. Please try a different image.'
        };
      } else if (error instanceof Error) {
        if (error.message.includes('image')) {
          qrError = {
            type: 'file_error',
            message: error.message
          };
        } else {
          qrError = {
            type: 'unknown',
            message: error.message || 'An unexpected error occurred while scanning the QR code.'
          };
        }
      } else {
        qrError = {
          type: 'unknown',
          message: 'An unexpected error occurred while scanning the QR code.'
        };
      }

      setError(qrError);
      return null;

    } finally {
      setIsScanning(false);
    }
  }, []);

  const scanFromCamera = useCallback(async (videoElement: HTMLVideoElement): Promise<QRScanResult | null> => {
    setIsScanning(true);
    setError(null);

    try {
      const codeReader = new BrowserMultiFormatReader();
      
      try {
        const result = await codeReader.decodeFromVideoElement(videoElement);
        
        return {
          text: result.getText(),
          format: result.getBarcodeFormat().toString()
        };

      } finally {
        codeReader.reset();
      }

    } catch (error: unknown) {
      let qrError: QRScanError;

      if (error instanceof NotFoundException) {
        qrError = {
          type: 'not_found',
          message: 'No QR code detected. Please position the QR code within the camera view.'
        };
      } else if (error instanceof ChecksumException) {
        qrError = {
          type: 'checksum',
          message: 'QR code detected but appears damaged. Please ensure good lighting and steady positioning.'
        };
      } else if (error instanceof FormatException) {
        qrError = {
          type: 'format',
          message: 'QR code format not supported.'
        };
      } else {
        qrError = {
          type: 'unknown',
          message: 'Failed to scan QR code from camera.'
        };
      }

      setError(qrError);
      return null;

    } finally {
      setIsScanning(false);
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    scanFile,
    scanFromCamera,
    isScanning,
    error,
    clearError
  };
}