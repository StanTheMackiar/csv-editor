import { useMouseEvents, usePressedKeys } from '@/hooks';
import { FC, PropsWithChildren } from 'react';

export const SheetEventsProvider: FC<PropsWithChildren> = ({ children }) => {
  useMouseEvents();
  usePressedKeys();

  return children;
};
