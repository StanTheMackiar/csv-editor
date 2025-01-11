import { useCopyEvents, useMouseEvents, usePressedKeys } from '@/hooks';
import { FC, PropsWithChildren } from 'react';

export const SheetEventsProvider: FC<PropsWithChildren> = ({ children }) => {
  useCopyEvents();
  useMouseEvents();
  usePressedKeys();

  return children;
};
