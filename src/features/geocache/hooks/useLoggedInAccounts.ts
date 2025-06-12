import { useNostrLogin } from '@nostrify/react/login';
import { NostrMetadata } from '@nostrify/nostrify';
import { useAuthor } from '@/features/auth/hooks/useAuthor';

export interface Account {
  id: string;
  pubkey: string;
  metadata: NostrMetadata;
  isLoadingMetadata?: boolean;
}

export function useLoggedInAccounts() {
  const { logins, setLogin, removeLogin } = useNostrLogin();

  // Get author data for the current user (first login)
  const currentLogin = logins[0];
  const currentUserAuthor = useAuthor(currentLogin?.pubkey);

  // Get author data for other users
  const otherLogins = logins.slice(1);
  const otherUsersAuthors = otherLogins.map(login => ({
    login,
    author: useAuthor(login.pubkey)
  }));

  // Build current user account with loading state
  const currentUser: Account | undefined = currentLogin ? {
    id: currentLogin.id,
    pubkey: currentLogin.pubkey,
    metadata: currentUserAuthor.data?.metadata || {},
    isLoadingMetadata: currentUserAuthor.isLoading,
  } : undefined;

  // Build other users accounts with loading states
  const otherUsers: Account[] = otherUsersAuthors.map(({ login, author }) => ({
    id: login.id,
    pubkey: login.pubkey,
    metadata: author.data?.metadata || {},
    isLoadingMetadata: author.isLoading,
  }));

  // Build all authors array for backward compatibility
  const authors: Account[] = [
    ...(currentUser ? [currentUser] : []),
    ...otherUsers
  ];

  return {
    authors,
    currentUser,
    otherUsers,
    setLogin,
    removeLogin,
    // Expose loading states for better UX
    isLoadingCurrentUser: currentUserAuthor.isLoading,
    isLoadingAnyUser: currentUserAuthor.isLoading || otherUsersAuthors.some(({ author }) => author.isLoading),
  };
}