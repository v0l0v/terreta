import { Geocache, GeocacheLog } from './geocache';
import { NostrEvent } from '@nostrify/nostrify';
import { Event } from 'nostr-tools';

export type ZapTarget = Geocache | NostrEvent | GeocacheLog | Event;
