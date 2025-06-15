import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { FullPageLoading } from '@/components/ui/loading';
import { useCurrentUser } from '@/features/auth/hooks/useCurrentUser';
import { useBlogPosts, useIsAuthorizedAuthor } from '../hooks/useBlogPosts';
import { useDeleteBlogPost } from '../hooks/useBlogPublish';
import { BlogPostCard } from './BlogPostCard';
import { BlogPostEditor } from './BlogPostEditor';
import { BlogPost } from '../types';
import { BLOG_CONFIG } from '../config';
import { Plus, Search, Filter } from 'lucide-react';
import { useToast } from '@/shared/hooks/useToast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export function BlogList() {
  const { toast } = useToast();
  const { user } = useCurrentUser();
  const { data: posts, isLoading, error } = useBlogPosts();
  const deleteMutation = useDeleteBlogPost();
  
  const isAuthorized = useIsAuthorizedAuthor(user?.pubkey);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [showEditor, setShowEditor] = useState(false);
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
  const [deletingPost, setDeletingPost] = useState<BlogPost | null>(null);

  // Filter posts based on search and tag
  const filteredPosts = posts?.filter(post => {
    const matchesSearch = !searchTerm || 
      post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.content.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesTag = !selectedTag || post.tags.includes(selectedTag);
    
    return matchesSearch && matchesTag;
  }) || [];

  // Get all unique tags from posts
  const allTags = Array.from(
    new Set(posts?.flatMap(post => post.tags) || [])
  ).sort();

  const handleEdit = (post: BlogPost) => {
    setEditingPost(post);
    setShowEditor(true);
  };

  const handleDelete = (post: BlogPost) => {
    setDeletingPost(post);
  };

  const confirmDelete = async () => {
    if (!deletingPost) return;

    try {
      await deleteMutation.mutateAsync({
        eventId: deletingPost.id,
        reason: 'Blog post deleted by author',
      });
      
      toast({
        title: 'Success',
        description: 'Blog post deleted successfully',
      });
    } catch (error) {
      const errorObj = error as { message?: string };
      toast({
        title: 'Error',
        description: errorObj.message || 'Failed to delete blog post',
        variant: 'destructive',
      });
    } finally {
      setDeletingPost(null);
    }
  };

  const handleEditorSave = () => {
    setShowEditor(false);
    setEditingPost(null);
  };

  const handleEditorCancel = () => {
    setShowEditor(false);
    setEditingPost(null);
  };

  if (showEditor) {
    return (
      <BlogPostEditor
        post={editingPost || undefined}
        onSave={handleEditorSave}
        onCancel={handleEditorCancel}
      />
    );
  }

  if (isLoading) {
    return (
      <FullPageLoading 
        title="Loading blog posts..."
        description="Fetching the latest stories"
      />
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <h3 className="text-lg font-semibold mb-2">Failed to load blog posts</h3>
          <p className="text-muted-foreground">
            There was an error loading the blog. Please try again later.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">{BLOG_CONFIG.blogTitle}</h1>
          <p className="text-muted-foreground">{BLOG_CONFIG.blogDescription}</p>
        </div>
        
        {isAuthorized && (
          <Button onClick={() => setShowEditor(true)} className="gap-2">
            <Plus className="w-4 h-4" />
            New Post
          </Button>
        )}
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search posts..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <div className="flex flex-wrap gap-2">
            <Badge
              variant={selectedTag === null ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() => setSelectedTag(null)}
            >
              All
            </Badge>
            {allTags.map(tag => (
              <Badge
                key={tag}
                variant={selectedTag === tag ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => setSelectedTag(tag)}
              >
                #{tag}
              </Badge>
            ))}
          </div>
        </div>
      </div>

      {/* Posts Grid */}
      {filteredPosts.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <h3 className="text-lg font-semibold mb-2">No posts found</h3>
            <p className="text-muted-foreground">
              {searchTerm || selectedTag 
                ? 'Try adjusting your search or filter criteria.'
                : 'No blog posts have been published yet.'
              }
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-6">
          {filteredPosts.map((post) => (
            <BlogPostCard
              key={post.id}
              post={post}
              showAuthorActions={isAuthorized && post.pubkey === user?.pubkey}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingPost} onOpenChange={() => setDeletingPost(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Blog Post</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deletingPost?.title}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}