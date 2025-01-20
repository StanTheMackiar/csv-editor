import { useClipboardEvents } from '@/hooks';
import { Coords } from '@/types/sheet/cell/cell.types';
import { useState } from 'react';

export const useSheetClipboard = () => {
  const { onCopy, onCut, onPaste } = useClipboardEvents();

  const [menuPosition, setMenuPosition] = useState<Coords | null>(null);

  const openContextualMenu = (event: React.MouseEvent) => {
    event.preventDefault();

    const { clientX, clientY } = event;
    const container = event.currentTarget as HTMLElement;

    // Obtener el desplazamiento del contenedor
    const { left, top } = container.getBoundingClientRect();

    // Ajustar coordenadas al contenedor
    setMenuPosition({
      x: clientX - left + container.scrollLeft,
      y: clientY - top + container.scrollTop,
    });
  };

  return {
    menuPosition,

    onCopy,
    onCut,
    onPaste,
    openContextualMenu,
    setMenuPosition,
  };
};
