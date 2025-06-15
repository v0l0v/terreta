import { PageLayout } from '@/components/layout/PageLayout';
import { BlogList } from '@/features/blog/components/BlogList';

export default function Blog() {
  return (
    <PageLayout maxWidth="2xl">
      <div className="container mx-auto px-4 py-8">
        <BlogList />
      </div>
    </PageLayout>
  );
}