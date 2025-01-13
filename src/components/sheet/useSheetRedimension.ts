import {
  COLUMN_DEFAULT_WIDTH,
  COLUMN_MIN_WIDTH,
  ROW_DEFAULT_HEIGHT,
  ROW_MIN_HEIGHT,
} from '@/helpers/constants/sheet-config.helper';
import { useCallback, useState } from 'react';
import s from './Sheet.module.css';

export const useSheetRedimension = () => {
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>({});
  const [rowHeights, setRowHeights] = useState<Record<string, number>>({});

  const resizeColumnWidth = useCallback(
    (columnName: string, e: React.MouseEvent) => {
      e.preventDefault();

      const startX = e.pageX;
      const startWidth = columnWidths[columnName] || COLUMN_DEFAULT_WIDTH;

      const handleMouseMove = (e: MouseEvent) => {
        const newWidth = Math.max(
          COLUMN_MIN_WIDTH,
          startWidth + (e.pageX - startX)
        );
        setColumnWidths((prev) => ({
          ...prev,
          [columnName]: newWidth,
        }));
      };

      const handleMouseUp = () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.body.classList.remove(s['resizing-column']);
      };

      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.classList.add(s['resizing-column']);
    },
    [columnWidths]
  );

  const resizeRowHeight = useCallback(
    (rowName: string, e: React.MouseEvent) => {
      e.preventDefault();

      const startY = e.pageY;
      const startHeight = rowHeights[rowName] || ROW_DEFAULT_HEIGHT;

      const handleMouseMove = (e: MouseEvent) => {
        const newHeight = Math.max(
          ROW_MIN_HEIGHT,
          startHeight + (e.pageY - startY)
        );
        setRowHeights((prev) => ({
          ...prev,
          [rowName]: newHeight,
        }));
      };

      const handleMouseUp = () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.body.classList.remove(s['resizing-row']);
      };

      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.classList.add(s['resizing-row']);
    },
    [rowHeights]
  );

  return {
    columnWidths,
    rowHeights,
    resizeColumnWidth,
    resizeRowHeight,
  };
};
