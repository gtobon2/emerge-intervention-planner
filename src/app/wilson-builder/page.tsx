'use client';

import { useRouter } from 'next/navigation';
import { AppLayout } from '@/components/layout';
import { WilsonWizard } from '@/components/wilson-planner';

export default function WilsonBuilderPage() {
  const router = useRouter();

  return (
    <AppLayout>
      <div className="h-[calc(100vh-4rem)]">
        <WilsonWizard
          onSave={() => {
            router.push('/groups');
          }}
          onClose={() => {
            router.back();
          }}
        />
      </div>
    </AppLayout>
  );
}
