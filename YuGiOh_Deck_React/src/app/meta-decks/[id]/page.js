import ThreadDetail from '@/components/ThreadDetail';

// ⚡ Comprehensive fallback parameters matching the full path hierarchy
const FALLBACK_STATIC_PARAMS = [
  { forum: 'general', thread: 'discussion', id: '1' },
  { forum: 'general', thread: 'discussion', id: '2' },
  { forum: 'competitive', thread: 'thread', id: 'comp-1' }
];

export async function generateStaticParams() {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || process.env.REACT_APP_API_URL || 'https://api.happybush-e43d89b2.eastus.azurecontainerapps.io/api';

  try {
    const res = await fetch(`${baseUrl}/forums/threads?category=all`, { next: { revalidate: 60 } });
    if (!res.ok) return FALLBACK_STATIC_PARAMS;

    const threads = await res.json();
    
    if (!Array.isArray(threads) || threads.length === 0) {
      return FALLBACK_STATIC_PARAMS;
    }

    // ⚡ Return objects containing all segment parameters to satisfy the compiler
    const params = threads
      .map((thread) => {
        const rawId = thread?.id || thread?._id || thread?.threadId;
        if (!rawId) return null;
        
        return {
          forum: String(thread?.category || 'general').toLowerCase(),
          thread: 'thread',
          id: String(rawId),
        };
      })
      .filter(Boolean);

    return params.length > 0 ? params : FALLBACK_STATIC_PARAMS;
  } catch (error) {
    console.warn("Static generation fallback triggered for forum thread:", error);
    return FALLBACK_STATIC_PARAMS;
  }
}

// ⚡ Dynamic SEO & Open Graph Meta Tags
export async function generateMetadata({ params }) {
  const resolvedParams = await params;
  const id = resolvedParams?.id;
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || process.env.REACT_APP_API_URL || 'https://api.happybush-e43d89b2.eastus.azurecontainerapps.io/api';

  try {
    const res = await fetch(`${baseUrl}/forums/threads/${id}`, { cache: 'no-store' });
    if (!res.ok) return { title: 'Forum Thread | ErreGeTeYGO' };

    const thread = await res.json();
    const title = thread?.title || 'Forum Discussion';
    const author = thread?.author || 'Anonymous';
    const content = thread?.content?.substring(0, 150) || 'Join the discussion on ErreGeTeYGO.';

    return {
      title: `${title} - Forum | ErreGeTeYGO`,
      description: `${content}... Posted by @${author}`,
      openGraph: {
        title: title,
        description: content,
        type: 'article',
      },
    };
  } catch {
    return { title: 'Forum Thread | ErreGeTeYGO' };
  }
}

export default async function ThreadPage() {
  return <ThreadDetail />;
}