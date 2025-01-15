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
    clipboardCellsCoords,
    setClipboardCellsCoords,
    setClipboardAction,
    clipboardAction,
  ] = useSheetStore(
    useShallow((state) => [
      state.updateCells,
      state.focusedCellInputRef,
      state.selectedCellsCoords,
      state.setSelectedCellsCoords,
      state.sheet,
      state.recomputeSheet,
      state.clipboardCellsCoords,
      state.setClipboardCellsCoords,
      state.setClipboardAction,
      state.clipboardAction,
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
      cellsByRow.get(coords.y)?.set(coords.x, cell.value);
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

      setClipboardCellsCoords(selectedCells);
      setClipboardAction('copy');
    },
    [
      copy,
      focusedElement,
      getClipboardText,
      selectedCells,
      setClipboardAction,
      setClipboardCellsCoords,
    ]
  );

  const onCut = useCallback(
    async (e?: ClipboardEvent) => {
      if (focusedElement) return;

      e?.preventDefault();

      const clipboardText = getClipboardText();
      await copy(clipboardText);

      setClipboardCellsCoords(selectedCells);
      setClipboardAction('cut');
      recomputeSheet();
    },
    [
      copy,
      focusedElement,
      getClipboardText,
      recomputeSheet,
      selectedCells,
      setClipboardAction,
      setClipboardCellsCoords,
    ]
  );

  const onPaste = useCallback(
    async (e?: ClipboardEvent) => {
      if (focusedElement) return;

      e?.preventDefault();

      const clipboardText = await paste();

      if (!selectedCells.length) return;

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

      let cellsToClean: UpdateCellData[] = [];

      if (clipboardAction === 'cut') {
        cellsToClean = clipboardCellsCoords.map((coords) => ({
          coords,
          newValue: '',
        }));
      }

      setClipboardCellsCoords([]);
      setClipboardAction('copy');
      updateCells([...cellsToClean, ...newCells]);

      recomputeSheet();
    },
    [
      clipboardAction,
      clipboardCellsCoords,
      focusedElement,
      paste,
      recomputeSheet,
      selectedCells,
      setClipboardAction,
      setClipboardCellsCoords,
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
