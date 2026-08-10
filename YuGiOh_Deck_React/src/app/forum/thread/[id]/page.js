import ThreadDetail from '@/components/ThreadDetail';

const FALLBACK_STATIC_IDS = [{ id: '1' }, { id: '2' }, { id: 'comp-1' }];

export async function generateStaticParams() {
  const baseUrl = "https://api.happybush-e43d89b2.eastus.azurecontainerapps.io/api";

  try {
    const res = await fetch(`${baseUrl}/forums/threads?category=all`, { next: { revalidate: 60 } });
    if (!res.ok) return FALLBACK_STATIC_IDS;

    const threads = await res.json();
    
    if (!Array.isArray(threads) || threads.length === 0) {
      return FALLBACK_STATIC_IDS;
    }

    const params = threads
      .map((thread) => {
        const rawId = thread?.id || thread?._id || thread?.threadId;
        return rawId ? { id: String(rawId) } : null;
      })
      .filter(Boolean);

    return params.length > 0 ? params : FALLBACK_STATIC_IDS;
  } catch (error) {
    console.warn("Static generation fallback triggered:", error);
    return FALLBACK_STATIC_IDS;
  }
}

export async function generateMetadata({ params }) {
  const resolvedParams = await params;
  const id = resolvedParams?.id;
  const baseUrl = "https://api.happybush-e43d89b2.eastus.azurecontainerapps.io/api";

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