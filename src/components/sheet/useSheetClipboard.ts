import { useClipboardEvents } from '@/hooks';
import { Coords } from '@/types/sheet/cell/cell.types';
import { useEffect, useRef, useState } from 'react';

export const useSheetClipboard = () => {
  const { onCopy, onCut, onPaste } = useClipboardEvents();

  const sheetRef = useRef<HTMLDivElement>(null);

  const [menuPosition, setMenuPosition] = useState<Coords | null>(null);

  const openContextualMenu = (event: React.MouseEvent) => {
    event.preventDefault(); // Evita que se abra el menú contextual del navegador por defecto

    const { clientX, clientY } = event;
    setMenuPosition({ x: clientX, y: clientY });
  };

  // Cierra el menú al hacer clic fuera
  const handleClickOutside = () => {
    setMenuPosition(null);
  };

  useEffect(() => {
    document.addEventListener('click', handleClickOutside);

    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    const ref = sheetRef.current;
    if (!ref) return;

    const handleContextMenu = (event: MouseEvent) => {
      event.preventDefault();
    };

    ref.addEventListener('contextmenu', handleContextMenu);

    return () => ref.removeEventListener('contextmenu', handleContextMenu);
  }, []);

  return {
    menuPosition,

    onCopy,
    onCut,
    onPaste,
    openContextualMenu,
    sheetRef,
  };
};
