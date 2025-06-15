import { describe, it, expect } from 'vitest';
import { 
  generateDTag, 
  extractExcerpt, 
  validateBlogPostData, 
  isAuthorizedAuthor,
  eventToBlogPost,
  createBlogPostEvent
} from '../utils/blogUtils';
import { CreateBlogPostData } from '../types';
import { NostrEvent } from '@nostrify/nostrify';

describe('blogUtils', () => {
  describe('generateDTag', () => {
    it('should generate a valid d tag from title', () => {
      expect(generateDTag('Hello World')).toBe('hello-world');
      expect(generateDTag('My First Blog Post!')).toBe('my-first-blog-post');
      expect(generateDTag('Special Characters @#$%')).toBe('special-characters');
      expect(generateDTag('Multiple   Spaces')).toBe('multiple-spaces');
    });

    it('should handle empty or invalid titles', () => {
      const result = generateDTag('');
      expect(result).toMatch(/^post-\d+$/);
      
      const result2 = generateDTag('!@#$%^&*()');
      expect(result2).toMatch(/^post-\d+$/);
    });

    it('should limit length to 50 characters', () => {
      const longTitle = 'This is a very long title that should be truncated to fit within the limit';
      const result = generateDTag(longTitle);
      expect(result.length).toBeLessThanOrEqual(50);
    });
  });

  describe('extractExcerpt', () => {
    it('should extract plain text from markdown', () => {
      const markdown = '# Title\n\nThis is **bold** and *italic* text with [a link](http://example.com).';
      const excerpt = extractExcerpt(markdown, 50);
      expect(excerpt).toBe('Title This is bold and italic text with a link.');
    });

    it('should truncate at word boundaries', () => {
      const text = 'This is a long sentence that should be truncated at a word boundary.';
      const excerpt = extractExcerpt(text, 30);
      expect(excerpt).toBe('This is a long sentence that...');
    });

    it('should return full text if under limit', () => {
      const text = 'Short text.';
      const excerpt = extractExcerpt(text, 50);
      expect(excerpt).toBe('Short text.');
    });
  });

  describe('validateBlogPostData', () => {
    const validData: CreateBlogPostData = {
      title: 'Test Post',
      content: 'This is test content.',
    };

    it('should pass validation for valid data', () => {
      const errors = validateBlogPostData(validData);
      expect(errors).toHaveLength(0);
    });

    it('should require title', () => {
      const errors = validateBlogPostData({ ...validData, title: '' });
      expect(errors).toContain('Title is required');
    });

    it('should require content', () => {
      const errors = validateBlogPostData({ ...validData, content: '' });
      expect(errors).toContain('Content is required');
    });

    it('should validate title length', () => {
      const longTitle = 'a'.repeat(201);
      const errors = validateBlogPostData({ ...validData, title: longTitle });
      expect(errors).toContain('Title must be less than 200 characters');
    });

    it('should validate summary length', () => {
      const longSummary = 'a'.repeat(501);
      const errors = validateBlogPostData({ ...validData, summary: longSummary });
      expect(errors).toContain('Summary must be less than 500 characters');
    });
  });

  describe('isAuthorizedAuthor', () => {
    const authorizedAuthors = ['pubkey1', 'pubkey2', 'pubkey3'];

    it('should return true for authorized authors', () => {
      expect(isAuthorizedAuthor('pubkey1', authorizedAuthors)).toBe(true);
      expect(isAuthorizedAuthor('pubkey2', authorizedAuthors)).toBe(true);
    });

    it('should return false for unauthorized authors', () => {
      expect(isAuthorizedAuthor('pubkey4', authorizedAuthors)).toBe(false);
      expect(isAuthorizedAuthor('', authorizedAuthors)).toBe(false);
    });
  });

  describe('createBlogPostEvent', () => {
    const blogData: CreateBlogPostData = {
      title: 'Test Post',
      content: 'This is test content.',
      summary: 'Test summary',
      tags: ['test', 'blog'],
    };

    it('should create a valid blog post event', () => {
      const event = createBlogPostEvent(blogData);
      
      expect(event.kind).toBe(30023);
      expect(event.content).toBe(blogData.content);
      expect(event.tags).toContainEqual(['title', 'Test Post']);
      expect(event.tags).toContainEqual(['summary', 'Test summary']);
      expect(event.tags).toContainEqual(['t', 'treasures']);
      expect(event.tags).toContainEqual(['t', 'test']);
      expect(event.tags).toContainEqual(['t', 'blog']);
    });

    it('should generate d tag if not provided', () => {
      const event = createBlogPostEvent(blogData);
      const dTag = event.tags?.find(tag => tag[0] === 'd')?.[1];
      expect(dTag).toBe('test-post');
    });

    it('should use provided d tag', () => {
      const dataWithDTag = { ...blogData, dTag: 'custom-slug' };
      const event = createBlogPostEvent(dataWithDTag);
      const dTag = event.tags?.find(tag => tag[0] === 'd')?.[1];
      expect(dTag).toBe('custom-slug');
    });
  });

  describe('eventToBlogPost', () => {
    const mockEvent: NostrEvent = {
      id: 'event123',
      pubkey: 'pubkey123',
      created_at: 1640995200,
      kind: 30023,
      tags: [
        ['d', 'test-post'],
        ['title', 'Test Post'],
        ['summary', 'Test summary'],
        ['t', 'treasures'],
        ['t', 'test'],
        ['published_at', '1640995200'],
      ],
      content: 'This is test content.',
      sig: 'signature123',
    };

    it('should convert valid event to blog post', () => {
      const blogPost = eventToBlogPost(mockEvent);
      
      expect(blogPost).toBeTruthy();
      expect(blogPost!.id).toBe('event123');
      expect(blogPost!.title).toBe('Test Post');
      expect(blogPost!.content).toBe('This is test content.');
      expect(blogPost!.summary).toBe('Test summary');
      expect(blogPost!.tags).toContain('treasures');
      expect(blogPost!.tags).toContain('test');
      expect(blogPost!.dTag).toBe('test-post');
    });

    it('should return null for wrong kind', () => {
      const wrongKindEvent = { ...mockEvent, kind: 1 };
      const blogPost = eventToBlogPost(wrongKindEvent);
      expect(blogPost).toBeNull();
    });

    it('should return null for missing d tag', () => {
      const noDTagEvent = { 
        ...mockEvent, 
        tags: mockEvent.tags.filter(tag => tag[0] !== 'd') 
      };
      const blogPost = eventToBlogPost(noDTagEvent);
      expect(blogPost).toBeNull();
    });

    it('should return null for missing treasures tag', () => {
      const noTreasuresTagEvent = { 
        ...mockEvent, 
        tags: mockEvent.tags.filter(tag => !(tag[0] === 't' && tag[1] === 'treasures'))
      };
      const blogPost = eventToBlogPost(noTreasuresTagEvent);
      expect(blogPost).toBeNull();
    });

    it('should handle missing optional fields', () => {
      const minimalEvent = {
        ...mockEvent,
        tags: [
          ['d', 'minimal-post'],
          ['t', 'treasures'],
        ],
      };
      
      const blogPost = eventToBlogPost(minimalEvent);
      expect(blogPost).toBeTruthy();
      expect(blogPost!.title).toBe('Untitled');
      expect(blogPost!.summary).toBeUndefined();
      expect(blogPost!.publishedAt).toBe(mockEvent.created_at);
    });
  });
});