/**
 * Advanced Query Batching System for Nostr
 * Batches multiple queries into single requests for efficiency
 */

import { TIMEOUTS } from '@/shared/config';

export interface BatchedQuery {
  filter: any;
  resolve: (events: any[]) => void;
  reject: (error: any) => void;
}

export class NostrQueryBatcher {
  private batches = new Map<string, BatchedQuery[]>();
  private timers = new Map<string, NodeJS.Timeout>();
  private maxBatchSize = 20;
  private batchDelay = 50; // ms

  constructor(
    private queryFn: (filters: any[]) => Promise<any[]>,
    maxSize = 20,
    delay = 50
  ) {
    this.maxBatchSize = maxSize;
    this.batchDelay = delay;
  }

  /**
   * Add a query to the batch
   */
  async query(filter: any): Promise<any[]> {
    return new Promise((resolve, reject) => {
      const key = this.createBatchKey(filter);
      
      if (!this.batches.has(key)) {
        this.batches.set(key, []);
      }
      
      this.batches.get(key)!.push({ filter, resolve, reject });
      
      // Execute immediately if batch is full
      if (this.batches.get(key)!.length >= this.maxBatchSize) {
        this.executeBatch(key);
      } else if (!this.timers.has(key)) {
        // Schedule execution after delay
        this.timers.set(key, setTimeout(() => this.executeBatch(key), this.batchDelay));
      }
    });
  }

  /**
   * Batch multiple queries at once
   */
  async batchQuery(filters: any[]): Promise<any[]> {
    if (filters.length === 0) return [];
    if (filters.length === 1) return this.query(filters[0]);

    const events = await this.queryFn(filters);
    return events;
  }

  /**
   * Create a batch key for grouping similar queries
   */
  private createBatchKey(filter: any): string {
    const parts = [];
    
    if (filter.kinds) parts.push(`k:${filter.kinds.join(',')}`);
    if (filter.authors) parts.push(`a:${filter.authors.join(',')}`);
    if (filter.ids) parts.push(`i:${filter.ids.join(',')}`);
    if (filter.limit) parts.push(`l:${filter.limit}`);
    
    // Include tag filters
    Object.keys(filter).forEach(key => {
      if (key.startsWith('#')) {
        parts.push(`${key}:${filter[key].join(',')}`);
      }
    });
    
    return parts.join('|') || 'default';
  }

  /**
   * Execute a batch of queries
   */
  private async executeBatch(key: string) {
    if (this.timers.has(key)) {
      clearTimeout(this.timers.get(key)!);
      this.timers.delete(key);
    }

    const batch = this.batches.get(key);
    if (!batch || batch.length === 0) return;

    this.batches.delete(key);

    try {
      const filters = batch.map(item => item.filter);
      const allEvents = await this.queryFn(filters);
      
      // Distribute results to individual promises
      batch.forEach(({ filter, resolve }) => {
        const matchingEvents = allEvents.filter(event => this.matchesFilter(event, filter));
        resolve(matchingEvents);
      });
    } catch (error) {
      batch.forEach(({ reject }) => reject(error));
    }
  }

  /**
   * Check if an event matches a filter
   */
  private matchesFilter(event: any, filter: any): boolean {
    if (filter.kinds && !filter.kinds.includes(event.kind)) return false;
    if (filter.authors && !filter.authors.includes(event.pubkey)) return false;
    if (filter.ids && !filter.ids.includes(event.id)) return false;
    
    // Check tag filters
    for (const [key, value] of Object.entries(filter)) {
      if (key.startsWith('#')) {
        const tagName = key.substring(1);
        const tagValues = Array.isArray(value) ? value : [value];
        const eventTags = event.tags?.filter((tag: string[]) => tag[0] === tagName).map((tag: string[]) => tag[1]) || [];
        
        if (!tagValues.some(v => eventTags.includes(v))) return false;
      }
    }
    
    return true;
  }

  /**
   * Clear all pending batches
   */
  clear() {
    this.timers.forEach(timer => clearTimeout(timer));
    this.timers.clear();
    this.batches.clear();
  }

  /**
   * Get current batch statistics
   */
  getStats() {
    return {
      activeBatches: this.batches.size,
      pendingQueries: Array.from(this.batches.values()).reduce((sum, batch) => sum + batch.length, 0),
    };
  }
}

/**
 * Global query batcher instance
 */
let globalQueryBatcher: NostrQueryBatcher | null = null;

export function getQueryBatcher(nostr: any): NostrQueryBatcher {
  if (!globalQueryBatcher) {
    globalQueryBatcher = new NostrQueryBatcher(
      (filters) => nostr.query(filters, { signal: AbortSignal.timeout(TIMEOUTS.QUERY) }),
      20, // max batch size
      50  // batch delay in ms
    );
  }
  return globalQueryBatcher;
}

/**
 * Batch multiple related queries efficiently
 */
export function batchRelatedQueries(
  queries: Array<{ kinds?: number[], authors?: string[], limit?: number, [key: string]: any }>
): any[] {
  // Group by similar properties to optimize batching
  const grouped = new Map<string, any[]>();
  
  queries.forEach(query => {
    const key = `${query.kinds?.join(',')}-${query.limit || ''}`;
    if (!grouped.has(key)) {
      grouped.set(key, []);
    }
    grouped.get(key)!.push(query);
  });
  
  return Array.from(grouped.values()).flat();
}

/**
 * Create optimized batched filters
 */
export function createOptimizedFilters(
  baseFilters: any[],
  maxFiltersPerQuery = 10
): any[][] {
  const batches: any[][] = [];
  
  for (let i = 0; i < baseFilters.length; i += maxFiltersPerQuery) {
    batches.push(baseFilters.slice(i, i + maxFiltersPerQuery));
  }
  
  return batches;
}