import { nip19 } from 'nostr-tools';
import { useAuthor } from '@/features/auth/hooks/useAuthor';

interface NostrPubkeyProps {
  npub: string;
  onProfileClick?: (pubkey: string) => void;
}

export function NostrPubkey({ npub, onProfileClick }: NostrPubkeyProps) {
  // Decode the npub to get the hex pubkey
  let pubkey: string;
  try {
    const decoded = nip19.decode(npub);
    if (decoded.type !== 'npub') {
      return <span className="text-blue-600">@{npub.slice(0, 12)}...</span>;
    }
    pubkey = decoded.data;
  } catch (error) {
    // If decoding fails, just show the npub
    return <span className="text-blue-600">@{npub.slice(0, 12)}...</span>;
  }

  const author = useAuthor(pubkey);
  
  // Determine display name
  const displayName = author.data?.metadata?.name || 
                     author.data?.metadata?.display_name ||
                     npub.slice(0, 12) + '...';

  const handleClick = () => {
    if (onProfileClick) {
      onProfileClick(pubkey);
    }
  };

  if (onProfileClick) {
    return (
      <button
        onClick={handleClick}
        className="text-blue-600 hover:text-blue-800 hover:underline cursor-pointer inline"
      >
        @{displayName}
      </button>
    );
  }

  return <span className="text-blue-600 inline">@{displayName}</span>;
}