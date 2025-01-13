import { getCell } from '@/helpers';
import { useClipboard } from '@/hooks/common';
import { UpdateCellData, useSheetStore } from '@/stores/useSheetStore';
import { useCallback, useEffect } from 'react';
import { useShallow } from 'zustand/shallow';

export const useClipboardEvents = () => {
  const { copy, paste } = useClipboard();

  const [
    updateCells,
    focusedCellInputRef,
    selectedCells,
    setSelectedCells,
    sheet,
    recomputeSheet,
    cuttedCellsCoords,
    setCuttedCellsCoords,
  ] = useSheetStore(
    useShallow((state) => [
      state.updateCells,
      state.focusedCellInputRef,
      state.selectedCellsCoords,
      state.setSelectedCellsCoords,
      state.sheet,
      state.recomputeSheet,
      state.cuttedCellsCoords,
      state.setCuttedCellsCoords,
    ])
  );

  const focusedElement = focusedCellInputRef?.current;

  const getClipboardText = useCallback(() => {
    const cellsByRow = new Map<number, Map<number, string>>();

    selectedCells.forEach((coords) => {
      const cell = getCell(coords, sheet);
      if (!cell) return;

      if (!cellsByRow.has(coords.y)) {
        cellsByRow.set(coords.y, new Map());
      }
      cellsByRow.get(coords.y)?.set(coords.x, cell.computedValue || cell.value);
    });

    const rows = Array.from(cellsByRow.keys()).sort((a, b) => a - b);

    const clipboardText = rows
      .map((rowIndex) => {
        const row = cellsByRow.get(rowIndex)!;
        const cols = Array.from(row.keys()).sort((a, b) => a - b);
        return cols.map((colIndex) => row.get(colIndex) || '').join('\t');
      })
      .join('\n');

    return clipboardText;
  }, [selectedCells, sheet]);

  const onCopy = useCallback(
    async (e?: ClipboardEvent) => {
      if (focusedElement) return;

      e?.preventDefault();

      const clipboardText = getClipboardText();
      await copy(clipboardText);
    },
    [copy, focusedElement, getClipboardText]
  );

  const onCut = useCallback(
    async (e?: ClipboardEvent) => {
      if (focusedElement) return;

      e?.preventDefault();

      const clipboardText = getClipboardText();
      await copy(clipboardText);

      setCuttedCellsCoords(selectedCells);
      recomputeSheet();
    },
    [
      copy,
      focusedElement,
      getClipboardText,
      recomputeSheet,
      selectedCells,
      setCuttedCellsCoords,
    ]
  );

  const onPaste = useCallback(
    async (e?: ClipboardEvent) => {
      if (focusedElement) return;

      e?.preventDefault();

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

      const cellsToClean = cuttedCellsCoords.map((coords) => ({
        coords,
        newValue: '',
      }));

      setCuttedCellsCoords([]);
      updateCells([...cellsToClean, ...newCells]);

      recomputeSheet();
    },
    [
      cuttedCellsCoords,
      focusedElement,
      paste,
      recomputeSheet,
      selectedCells,
      setCuttedCellsCoords,
      setSelectedCells,
      updateCells,
    ]
  );

  useEffect(() => {
    document.addEventListener('copy', onCopy);
    document.addEventListener('cut', onCut);
    document.addEventListener('paste', onPaste);

    return () => {
      document.removeEventListener('copy', onCopy);
      document.removeEventListener('cut', onCut);
      document.removeEventListener('paste', onPaste);
    };
  }, [onCopy, onCut, onPaste]);

  return {
    onCopy,
    onCut,
    onPaste,
  };
};
