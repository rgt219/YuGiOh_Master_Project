import About from '@/components/About';

// ⚡ SEO Metadata for Ryan Thomas / ErreGeTe
export const metadata = {
  title: 'About Ryan Thomas (ErreGeTe) | System Architect & Full-Stack Engineer',
  description: 'Results-driven Software Engineer with 6+ years of experience in .NET Core, C#, React, and cloud microservices. Architect of ErreGeTeYGO.',
  openGraph: {
    title: 'Ryan Thomas | Software Engineer & System Architect',
    description: 'Learn about the tech stack, platform specs, and deployment history behind ErreGeTeYGO.',
    images: [{ url: '/images/YCS_Orlando.JPG' }],
  },
};

export default function AboutPage() {
  return <About />;
}