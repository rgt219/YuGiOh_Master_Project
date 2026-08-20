import GeneralDiscussion from '@/app/generaldiscussion/GeneralDiscussion';

// ⚡ SEO Metadata
export const metadata = {
  title: 'General Discussion Forum | ErreGeTeYGO',
  description: 'Discuss Yu-Gi-Oh! deck concepts, metagame news, rulings, and community media on the official ErreGeTeYGO forums.',
  openGraph: {
    title: 'General Discussion Forum | ErreGeTeYGO',
    description: 'Community forum for Yu-Gi-Oh! deck builders, news, and strategy.',
  },
};

export default function GeneralDiscussionPage() {
  return <GeneralDiscussion />;
}