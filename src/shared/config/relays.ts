/**
 * Relay configuration constants
 * Used by Nostr features for consistent relay behavior
 */

// Multi-relay configuration for better stability
export const DEFAULT_RELAYS = [
  'wss://relay.primal.net',      // Primary relay
];

// Primary relay for backwards compatibility
export const DEFAULT_RELAY = DEFAULT_RELAYS[0];

// Preset relays for the relay selector
export const PRESET_RELAYS = [
  { url: 'wss://relay.primal.net', name: 'Primal' },
  { url: 'wss://ditto.pub/relay', name: 'Ditto' },
  { url: 'wss://relay.nostr.band', name: 'Nostr.Band' },
  { url: 'wss://relay.damus.io', name: 'Damus' },
  { url: 'wss://nos.lol', name: 'nos.lol' },
];