import StatusBoard from '@/app/status/StatusBoard';

export const metadata = {
  title: 'System Status | ErreGeTeYGO',
  description: 'Live health of every ErreGeTeYGO backend service and the databases and queues they depend on.',
};

export default function StatusPage() {
  return <StatusBoard />;
}
