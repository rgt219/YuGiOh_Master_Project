import CompetitiveDiscussion from '@/app/competitivediscussion/CompetitiveDiscussion';

// ⚡ SEO Metadata
export const metadata = {
  title: 'Competitive Discussion & Tournament Reports | ErreGeTeYGO',
  description: 'High-tier metagame breakdowns, YCS & Regional tournament reports, side deck tech, and ruling discussions.',
  openGraph: {
    title: 'Competitive Discussion Forum | ErreGeTeYGO',
    description: 'Analyze tournament reports and meta breakdowns with top duelists on ErreGeTeYGO.',
  },
};

export default function CompetitiveDiscussionPage() {
  return <CompetitiveDiscussion />;
}