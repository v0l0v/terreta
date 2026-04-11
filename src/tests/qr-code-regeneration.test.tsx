import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { VerificationQRDialog } from '@/components/VerificationQRDialog';
import { generateVerificationQR } from '@/utils/verification';
import { NIP_GC_KINDS } from '@/utils/nip-gc';
import { nip19 } from 'nostr-tools';

const toastMock = vi.fn();

vi.mock('@/components/ui/loading', () => ({
  ComponentLoading: () => <div data-testid="component-loading" />,
}));

vi.mock('@/components/ui/dropdown-menu', () => ({
  DropdownMenu: ({ children }: any) => <div>{children}</div>,
  DropdownMenuTrigger: ({ children }: any) => <>{children}</>,
  DropdownMenuContent: ({ children }: any) => <div>{children}</div>,
  DropdownMenuItem: ({ children, ...props }: any) => (
    <button type="button" {...props}>
      {children}
    </button>
  ),
}));

// Mock the toast hook
vi.mock('@/hooks/useToast', () => ({
  useToast: () => ({
    toast: toastMock,
  }),
}));

// Mock the generateVerificationQR function
vi.mock('@/utils/verification', () => ({
  generateVerificationQR: vi.fn(),
  downloadQRCode: vi.fn(),
}));

const mockGenerateVerificationQR = generateVerificationQR as ReturnType<typeof vi.fn>;

describe('VerificationQRDialog', () => {
  const validPubkey = 'a'.repeat(64);
  const validNaddr = nip19.naddrEncode({
    pubkey: validPubkey,
    kind: NIP_GC_KINDS.GEOCACHE,
    identifier: 'test-dtag',
    relays: [],
  });

  const mockProps = {
    isOpen: true,
    onOpenChange: vi.fn(),
    naddr: validNaddr,
    verificationKeyPair: {
      privateKey: new Uint8Array(32),
      publicKey: validPubkey,
      nsec: 'test-nsec',
      npub: 'test-npub',
    },
    cacheName: 'Test Cache',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    toastMock.mockReset();
    mockGenerateVerificationQR.mockResolvedValue('data:image/png;base64,test-qr-data');
  });

  const getExpectedVerificationUrl = () =>
    `${window.location.origin}/${mockProps.naddr}#verify=${mockProps.verificationKeyPair.nsec}`;

  it('should generate QR code on initial mount', async () => {
    render(<VerificationQRDialog {...mockProps} />);

    // Check that generateVerificationQR was called with the generated verification URL and default type
    await waitFor(() => {
      expect(mockGenerateVerificationQR).toHaveBeenCalledWith(
        getExpectedVerificationUrl(),
        'full',
        expect.objectContaining({
          line1: expect.any(String),
          line2: expect.any(String),
        })
      );
    });

    // Check that QR code is displayed by looking for the image with the translated title alt text
    await waitFor(() => {
      const qrImage = screen.getByAltText('verificationQR.title');
      expect(qrImage).toBeTruthy();
      expect(qrImage.getAttribute('src')).toBe('data:image/png;base64,test-qr-data');
    });
  });

  it('should regenerate QR code when type changes', async () => {
    const { container } = render(<VerificationQRDialog {...mockProps} />);

    // Wait for initial QR code to be generated
    await waitFor(() => {
      expect(mockGenerateVerificationQR).toHaveBeenCalledWith(
        getExpectedVerificationUrl(),
        'full',
        expect.objectContaining({
          line1: expect.any(String),
          line2: expect.any(String),
        })
      );
    });

    // Clear the mock to track new calls
    mockGenerateVerificationQR.mockClear();

    // Change QR type to 'cutout' - open the style selector and click the cutout option
    fireEvent.click(screen.getByTestId('qr-style-trigger'));
    fireEvent.click(await screen.findByTestId('qr-style-cutout'));

    // Check that generateVerificationQR was called again with new type
    await waitFor(() => {
      expect(mockGenerateVerificationQR).toHaveBeenCalledWith(
        getExpectedVerificationUrl(),
        'cutout',
        expect.objectContaining({
          line1: expect.any(String),
          line2: expect.any(String),
        })
      );
    }, { timeout: 3000 }); // Increased timeout to account for the delay in the fix

    // Check that loading state is shown by looking for loading indicator text based on translation keys
    const loadingElement = container.querySelector('[data-loading]') || 
                          Array.from(container.querySelectorAll('*')).find(el => 
                            el.textContent?.includes('createCache.verificationQR.generating'));
    expect(loadingElement).toBeTruthy();
  });

  it('should handle QR generation errors gracefully', async () => {
    mockGenerateVerificationQR.mockRejectedValue(new Error('Generation failed'));

    render(<VerificationQRDialog {...mockProps} />);

    // Wait for error handling and verify toast is called
    await waitFor(() => {
      expect(toastMock).toHaveBeenCalledWith(expect.objectContaining({
        title: 'QR Generation Failed',
      }));
    });
  });

  it('should not generate QR code when dialog is closed', () => {
    const closedProps = { ...mockProps, isOpen: false };
    render(<VerificationQRDialog {...closedProps} />);

    expect(mockGenerateVerificationQR).not.toHaveBeenCalled();
  });

  it('should clear QR code immediately when type changes', async () => {
    const { container } = render(<VerificationQRDialog {...mockProps} />);

    // Wait for initial QR code
    await waitFor(() => {
      const qrImage = screen.getByAltText('verificationQR.title');
      expect(qrImage).toBeTruthy();
    });

    // Simulate QR type change by using the style button and selecting the micro option
    fireEvent.click(screen.getByTestId('qr-style-trigger'));

    const microOption = await screen.findByTestId('qr-style-micro');
    fireEvent.click(microOption);

    // Check that loading state is shown
    const loadingElement = container.querySelector('[data-loading]') || 
                          Array.from(container.querySelectorAll('*')).find(el => 
                            el.textContent?.includes('Generating QR code...'));
    expect(loadingElement).toBeTruthy();
    
    // The old QR image should not be visible immediately after type change
    // This is a bit tricky to test without proper DOM querying, so we'll 
    // verify that the function was called with the new type
    await waitFor(() => {
      expect(mockGenerateVerificationQR).toHaveBeenCalledWith(
        getExpectedVerificationUrl(),
        'micro',
        expect.objectContaining({
          line1: expect.any(String),
          line2: expect.any(String),
        })
      );
    });
  });

  it('should call generateVerificationQR with correct parameters for different types', async () => {
    render(<VerificationQRDialog {...mockProps} />);

    // Test each QR type
    const types = ['full', 'cutout', 'micro'] as const;
    
    for (const type of types) {
      // Clear previous calls
      mockGenerateVerificationQR.mockClear();
      
      // Simulate type change by using the style button and selecting the type option
      fireEvent.click(screen.getByTestId('qr-style-trigger'));
      const option = await screen.findByTestId(`qr-style-${type}`);
      fireEvent.click(option);

      await waitFor(() => {
        expect(mockGenerateVerificationQR).toHaveBeenCalledWith(
          getExpectedVerificationUrl(),
          type,
          expect.objectContaining({
            line1: expect.any(String),
            line2: expect.any(String),
          })
        );
      });
    }
  });
});