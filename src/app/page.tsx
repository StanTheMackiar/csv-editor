'use client';
import '@/helpers/global-functions/global-functions.helper';

import { Sheet } from '@/components/sheet/Sheet';
import { SheetEventsProvider } from '@/providers';

export default function Home() {
  return (
    <SheetEventsProvider>
      <main>
        <Sheet />
      </main>
    </SheetEventsProvider>
  );
}
