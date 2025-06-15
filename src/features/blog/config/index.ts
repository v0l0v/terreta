import { BlogConfig } from '../types';

// Configuration for the Treasures blog
export const BLOG_CONFIG: BlogConfig = {
  // Add authorized author pubkeys here (hex format)
  authorizedAuthors: [
    '86184109eae937d8d6f980b4a0b46da4ef0d983eade403ee1b4c0b6bde238b47', // npub1scvyzz02ayma34hesz62pdrd5nhsmxp74hjq8msmfs9khh3r3drsnw68d8
  ],
  blogTitle: 'Treasures Blog',
  blogDescription: 'Stories, updates, and adventures from the Treasures community',
  blogImage: '/icon-512x512.png', // Default blog image
};

// Nostr event kind for long-form content
export const BLOG_POST_KIND = 30023;

// Required tag for blog posts
export const BLOG_TAG = 'treasures';

// Query limits for blog posts
export const BLOG_QUERY_LIMITS = {
  POSTS_PER_PAGE: 10,
  RECENT_POSTS: 20,
  AUTHOR_POSTS: 50,
} as const;

// Cache times for blog data (in milliseconds)
export const BLOG_CACHE_TIMES = {
  POSTS: 5 * 60 * 1000, // 5 minutes
  AUTHORS: 10 * 60 * 1000, // 10 minutes
  SINGLE_POST: 2 * 60 * 1000, // 2 minutes
} as const;