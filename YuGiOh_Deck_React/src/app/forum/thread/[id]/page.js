import ThreadDetail from '@/components/ThreadDetail';

// ⚡ Dynamic SEO & Open Graph Meta Tags (Runs on Server)
export async function generateMetadata({ params }) {
  const { id } = await params;
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