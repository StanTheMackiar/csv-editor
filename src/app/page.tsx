'use client';
import { Sheet } from '@/components/sheet/Sheet';
import { SheetEventsProvider } from '@/providers';

export default function Home() {
  return (
    <SheetEventsProvider>
      <main className="bg-gray-600">
        <Sheet />
      </main>
    </SheetEventsProvider>
  );
}
