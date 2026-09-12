// The PostDetail component (renders all the fields of a single report)
import PostDetail from '@/components/PostDetail';
// React library
import React from 'react';

// Dynamic route: /post/[id] shows the full details of one report.
// In Next.js 15, `params` is a Promise that must be awaited.
async function Page({ params }: { params: Promise<{ id: string }> }) {
  // Extract the post id from the route params
  const { id } = await params;

  return (
    // Full-height container so the detail view fills the viewport
    <div className="h-full">
      <PostDetail id={id} />
    </div>
  );
}

export default Page;
