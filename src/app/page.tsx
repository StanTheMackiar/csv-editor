'use client';
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
