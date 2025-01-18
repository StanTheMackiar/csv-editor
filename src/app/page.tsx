'use client';
import '@/helpers/global-functions/global-functions.helper';

import { ContextualBar } from '@/components/contextual-bar/ContextualBar';
import { FunctionBar } from '@/components/sheet/function-bar/FunctionBar';
import { Sheet } from '@/components/sheet/Sheet';
import { useSheetStore } from '@/stores/useSheetStore';
import { useEffect, useState } from 'react';

export default function Home() {
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const isHydrated = useSheetStore.persist.hasHydrated();

    setHydrated(isHydrated);
  }, []);

  if (!hydrated) return null;

  return (
    <main className="relative overflow-hidden flex flex-col w-full h-full">
      <ContextualBar />
      <FunctionBar />
      <Sheet />
    </main>
  );
}
