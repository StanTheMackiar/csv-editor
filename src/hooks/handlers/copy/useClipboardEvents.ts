import { useClipboard } from '@/hooks/common';
import { UpdateCellData, useSheetStore } from '@/stores/useSheetStore';
import { useCallback, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useShallow } from 'zustand/shallow';

export const useCopyEvents = () => {
  const { copy, paste } = useClipboard();

  const [
    updateCells,
    focusedCellInputRef,
    selectedCells,
    setSelectedCells,
    getCell,
  ] = useSheetStore(
    useShallow((state) => [
      state.updateCells,
      state.focusedCellInputRef,
      state.selectedCells,
      state.setSelectedCells,
      state.getCell,
    ])
  );

  const focusedElement = focusedCellInputRef?.current;

  const onCopy = useCallback(async () => {
    // Organiza las celdas por posición
    if (focusedElement && selectedCells.length === 1) return;

    const cellsByRow = new Map<number, Map<number, string>>();

    selectedCells.forEach((coords) => {
      const cell = getCell(coords);
      if (!cell) return;

      if (!cellsByRow.has(coords.y)) {
        cellsByRow.set(coords.y, new Map());
      }
      cellsByRow.get(coords.y)?.set(coords.x, cell.computedValue);
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
  }, [copy, focusedElement, getCell, selectedCells]);

  const onPaste = useCallback(async () => {
    const clipboardText = await paste();

    if (!clipboardText || !selectedCells.length) return;

    const rows = clipboardText.split('\n');
    const newCells: UpdateCellData[] = [];
    const firstSelectedCoords = selectedCells[0];

    rows.forEach((row, rowIndex) => {
      const cols = row.split('\t');

      cols.forEach((col, colIndex) => {
        const positionX = firstSelectedCoords.x + colIndex;
        const positionY = firstSelectedCoords.y + rowIndex;

        newCells.push({
          coords: { x: positionX, y: positionY },
          newValue: col,
        });
      });
    });

    setSelectedCells(
      newCells.map(({ coords }) => ({ x: coords.x, y: coords.y }))
    );

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
