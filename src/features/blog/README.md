# Treasures Blog Feature

A Nostr-based blog system for authorized authors to publish long-form content with the #treasures tag.

## Overview

The blog feature allows authorized authors to create, edit, and delete blog posts using Nostr's kind 30023 (long-form content) events. All posts must include the #treasures tag to be displayed in the blog.

## Features

- **Create Posts**: Authorized authors can create new blog posts with Markdown content
- **Edit Posts**: Authors can edit their existing posts (creates new event with same d tag)
- **Delete Posts**: Authors can delete their posts using NIP-09 deletion events
- **Markdown Support**: Full Markdown rendering with GitHub Flavored Markdown (GFM)
- **Tag System**: Posts can have multiple tags, with #treasures automatically included
- **Search & Filter**: Users can search posts and filter by tags
- **Responsive Design**: Works on desktop and mobile devices

## Configuration

### Authorized Authors

Edit `src/features/blog/config/index.ts` to add authorized author pubkeys:

```typescript
export const BLOG_CONFIG: BlogConfig = {
  authorizedAuthors: [
    '86184109eae937d8d6f980b4a0b46da4ef0d983eade403ee1b4c0b6bde238b47', // Your pubkey here
    // Add more hex pubkeys as needed
  ],
  // ... other config
};
```

**Note**: Use hex format pubkeys, not npub format.

### Blog Settings

You can customize the blog title, description, and other settings in the same config file.

## Routes

- `/blog` - Main blog listing page
- `/blog/:pubkey/:dTag` - Individual blog post page

## Components

### BlogList
Main blog listing component with search, filtering, and post management.

### BlogPostCard
Card component for displaying post previews in the blog list.

### BlogPostDetail
Full blog post display component with Markdown rendering.

### BlogPostEditor
Rich editor for creating and editing blog posts with live preview.

## Hooks

### useBlogPosts()
Fetches all blog posts with the #treasures tag.

### useBlogPostsByAuthor(pubkey)
Fetches blog posts by a specific author.

### useBlogPost(pubkey, dTag)
Fetches a single blog post by author and d tag.

### useCreateBlogPost()
Mutation hook for creating new blog posts.

### useUpdateBlogPost()
Mutation hook for updating existing blog posts.

### useDeleteBlogPost()
Mutation hook for deleting blog posts.

### useIsAuthorizedAuthor(pubkey)
Checks if a pubkey is in the authorized authors list.

## Data Flow

1. **Publishing**: Posts are published as Nostr kind 30023 events with required tags
2. **Querying**: Posts are fetched using Nostr filters for kind 30023 + #treasures tag
3. **Caching**: TanStack Query handles caching and background updates
4. **Authorization**: Only authorized authors can create/edit/delete posts

## Nostr Event Structure

Blog posts use the following Nostr event structure:

```json
{
  "kind": 30023,
  "content": "# Post Title\n\nMarkdown content here...",
  "tags": [
    ["d", "post-slug"],
    ["title", "Post Title"],
    ["summary", "Brief summary"],
    ["t", "treasures"],
    ["t", "additional-tag"],
    ["published_at", "1640995200"],
    ["image", "https://example.com/image.jpg"]
  ]
}
```

## URL Structure

Blog post URLs follow the pattern: `/blog/:pubkey/:dTag`

Where:
- `pubkey` is the author's hex pubkey
- `dTag` is the post's d tag identifier (URL slug)

## Testing

Run the blog tests:

```bash
npx vitest run src/features/blog/tests/
```

## Development

### Adding New Authors

1. Get the author's npub
2. Convert to hex format using nostr-tools
3. Add to `BLOG_CONFIG.authorizedAuthors` array

### Customizing Styling

The blog uses Tailwind CSS classes and can be customized by modifying the component styles. Markdown rendering uses `@tailwindcss/typography` for prose styling.

### Adding Features

The blog system is modular and can be extended with:
- Comment systems (using kind 1111 events)
- Like/reaction systems
- RSS feed generation
- SEO optimization
- Social media sharing

## Security

- Only authorized authors can publish posts
- All content is validated before publishing
- Deletion events are properly handled
- XSS protection through proper Markdown rendering