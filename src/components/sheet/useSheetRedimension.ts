import {
  COLUMN_DEFAULT_WIDTH,
  COLUMN_MIN_WIDTH,
  ROW_DEFAULT_HEIGHT,
  ROW_MIN_HEIGHT,
} from '@/helpers/constants/sheet-config.helper';
import { useSheetStore } from '@/stores/useSheetStore';
import { useCallback } from 'react';
import { useShallow } from 'zustand/shallow';
import s from './Sheet.module.css';

export const useSheetRedimension = () => {
  const [columnStyles, setColumnsStyles, rowsStyles, setRowsStyles] =
    useSheetStore(
      useShallow((state) => [
        state.columnsStyles,
        state.setColumnsStyles,
        state.rowsStyles,
        state.setRowsStyles,
      ])
    );

  const resizeColumnWidth = useCallback(
    (columnName: string, e: React.MouseEvent) => {
      e.preventDefault();

      const startX = e.pageX;
      const startWidth =
        columnStyles[columnName]?.width || COLUMN_DEFAULT_WIDTH;

      const handleMouseMove = (e: MouseEvent) => {
        const newWidth = Math.max(
          COLUMN_MIN_WIDTH,
          startWidth + (e.pageX - startX)
        );

        setColumnsStyles(columnName, { width: newWidth });
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
    [columnStyles, setColumnsStyles]
  );

  const resizeRowHeight = useCallback(
    (rowName: string, e: React.MouseEvent) => {
      e.preventDefault();

      const startY = e.pageY;
      const startHeight = rowsStyles[rowName]?.height || ROW_DEFAULT_HEIGHT;

      const handleMouseMove = (e: MouseEvent) => {
        const newHeight = Math.max(
          ROW_MIN_HEIGHT,
          startHeight + (e.pageY - startY)
        );
        setRowsStyles(rowName, { height: newHeight });
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
    [rowsStyles, setRowsStyles]
  );

  return {
    resizeColumnWidth,
    resizeRowHeight,
  };
};
