'use client';
import { Sheet } from '@/components/sheet/Sheet';
import { useMouseEvents, usePressedKeys } from '@/hooks';

export default function Home() {
  useMouseEvents();
  usePressedKeys();

  return (
    <main className="bg-gray-600">
      <Sheet />
    </main>
  );
}
