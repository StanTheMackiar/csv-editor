import { getCellHeart } from '@/helpers/sheet/sheet.helper';
import { useClipboard } from '@/hooks/common';
import { useSheetStore } from '@/stores/useSheetStore';
import { ICell } from '@/types/sheet/cell/cell.types';
import { useCallback, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useShallow } from 'zustand/shallow';

export const useCopyEvents = () => {
  const { copy, paste } = useClipboard();

  const [focusedCellInputRef, selectedCells, setSelectedCells, updateCells] =
    useSheetStore(
      useShallow((state) => [
        state.focusedCellInput,
        state.selectedCells,
        state.setSelectedCells,
        state.updateCells,
      ])
    );

  const focusedElement = focusedCellInputRef?.current;

  const onCopy = useCallback(async () => {
    // Organiza las celdas por posición
    if (focusedElement && selectedCells.length === 1) return;

    const cellsByRow = new Map<number, Map<number, string>>();

    selectedCells.forEach((cell) => {
      if (!cellsByRow.has(cell.positionY)) {
        cellsByRow.set(cell.positionY, new Map());
      }
      cellsByRow.get(cell.positionY)?.set(cell.positionX, cell.computedValue);
    });

    const rows = Array.from(cellsByRow.keys()).sort((a, b) => a - b);

    const clipboardText = rows
      .map((rowIndex) => {
        const row = cellsByRow.get(rowIndex)!;
        const cols = Array.from(row.keys()).sort((a, b) => a - b);
        return cols.map((colIndex) => row.get(colIndex) || '').join('\t');
      })
      .join('\n');

    await copy(clipboardText);
    toast.success('Cells copied to clipboard');
  }, [copy, focusedElement, selectedCells]);

  const onPaste = useCallback(async () => {
    const clipboardText = await paste();

    if (!clipboardText || !selectedCells.length) return;

    const rows = clipboardText.split('\n');
    const newCells: ICell[] = [];
    const firstSelectedCell = selectedCells[0];

    rows.forEach((row, rowIndex) => {
      const cols = row.split('\t');

      cols.forEach((col, colIndex) => {
        const positionX = firstSelectedCell.positionX + colIndex;
        const positionY = firstSelectedCell.positionY + rowIndex;

        newCells.push({
          ...getCellHeart(positionX, positionY),
          value: col,
          computedValue: col,
        });
      });
    });

    setSelectedCells(newCells);
    updateCells(newCells);
  }, [paste, selectedCells, setSelectedCells, updateCells]);

  useEffect(() => {
    document.addEventListener('copy', onCopy);
    document.addEventListener('paste', onPaste);

    return () => {
      document.removeEventListener('copy', onCopy);
      document.removeEventListener('paste', onPaste);
    };
  }, [onCopy, onPaste]);

  return {};
};
