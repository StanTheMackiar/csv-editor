import {
  getAbsoluteCursorPosition,
  isBetween,
  parseExpression,
  parseHTMLToText,
} from '@/helpers';
import { useCallback, useEffect, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import {
  extractCells,
  getCellFromMouseEvent,
} from '../../../helpers/sheet/sheet.helper';
import { useSheetStore } from '../../../stores/useSheetStore';
import { CellRef, ICell } from '../../../types/sheet/cell/cell.types';

export const useMouseEvents = () => {
  const [
    focusedCellInput,
    addCellsToSelection,
    functionMode,
    isSelecting,
    remarkedCell,
    selectCells,
    selectedCells,
    setIsSelecting,
    setLatestSelectedCell,
    setRemarkedCell,
    setSelectedCells,
    sheet,
    unmarkSelectedCells,
    isSelectingFunctionMode,
    setIsSelectingFunctionMode,
  ] = useSheetStore(
    useShallow((state) => [
      state.focusedCellInput,
      state.addCellsToSelection,
      state.functionMode,
      state.isSelecting,
      state.remarkedCell,
      state.selectCells,
      state.selectedCells,
      state.setIsSelecting,
      state.setLatestSelectedCell,
      state.setRemarkedCell,
      state.setSelectedCells,
      state.sheet,
      state.unmarkSelectedCells,
      state.isSelectingFunctionMode,
      state.setIsSelectingFunctionMode,
    ])
  );

  const focusedCellInputRef = focusedCellInput?.current;

  const [startSelectionCell, setStartSelectionCell] = useState<ICell | null>(
    null
  );
  const [startCellInFunctionMode, setStartCellInFunctionMode] =
    useState<ICell | null>(null);

  const handleMouseDown = useCallback(
    (e: MouseEvent) => {
      const allowedButtons = [0, 2];

      if (e.button === 2) e.preventDefault();

      if (!allowedButtons.includes(e.button)) {
        return;
      }

      const cellClicked = getCellFromMouseEvent(e, sheet);

      if (!cellClicked) {
        if (focusedCellInputRef) return;

        setLatestSelectedCell(null);
        setRemarkedCell(null);
        unmarkSelectedCells();
        setIsSelecting(false);
        setStartSelectionCell(cellClicked);

        return;
      }

      const isUniqueSelected = selectedCells.length === 1;

      const clickedRemarkedCell =
        isUniqueSelected && remarkedCell?.id === cellClicked?.id;

      const allowGetCellRef =
        functionMode &&
        remarkedCell &&
        !clickedRemarkedCell &&
        !isSelectingFunctionMode;

      if (allowGetCellRef) {
        e.preventDefault();

        if (!isSelectingFunctionMode) {
          setIsSelectingFunctionMode(true);
          setStartCellInFunctionMode(cellClicked);
        }

        selectedCells.forEach((state) => {
          if (state.id !== remarkedCell.id) return;

          const { refsFound } = parseExpression(state.value, sheet);

          const cursorPosition = getAbsoluteCursorPosition(focusedCellInputRef);
          if (!cursorPosition) return;

          const lastRefFound: CellRef | undefined =
            refsFound?.[refsFound.length - 1];

          const lastRefIsHover = lastRefFound
            ? isBetween(cursorPosition, lastRefFound.start, lastRefFound.end)
            : undefined;

          const cursorIsAtEnd = cursorPosition === state.value.length;

          if (!lastRefIsHover && cursorIsAtEnd) {
            state.setState?.(parseHTMLToText(state.value + cellClicked.id));
          } else if (lastRefIsHover) {
            const newValue = state.value.replace(
              lastRefFound.ref,
              cellClicked.id
            );
            state.setState?.(parseHTMLToText(newValue));
          } else {
            focusedCellInputRef?.blur();
          }
        });

        return;
      }

      if (clickedRemarkedCell) {
        setIsSelecting(true);

        return;
      }

      if (!isSelecting) {
        setIsSelecting(true);
        setRemarkedCell(cellClicked);
        setSelectedCells([cellClicked]);
        setLatestSelectedCell(null);
        setStartSelectionCell(cellClicked);

        return;
      }

      addCellsToSelection(cellClicked);
    },
    [
      addCellsToSelection,
      focusedCellInputRef,
      functionMode,
      isSelecting,
      isSelectingFunctionMode,
      remarkedCell,
      selectedCells,
      setIsSelecting,
      setIsSelectingFunctionMode,
      setLatestSelectedCell,
      setRemarkedCell,
      setSelectedCells,
      sheet,
      unmarkSelectedCells,
    ]
  );

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      const currentCell = getCellFromMouseEvent(e, sheet);
      if (!currentCell) return;

      if (isSelectingFunctionMode && startCellInFunctionMode && remarkedCell) {
        const selectedCells = extractCells(
          startCellInFunctionMode.id,
          currentCell.id,
          sheet
        );

        const firstCell = selectedCells?.[0];
        const latestCell = selectedCells?.[selectedCells.length - 1];

        const isRange = firstCell !== latestCell;

        const cellNewRef = isRange
          ? `${firstCell?.id}:${latestCell?.id}`
          : startCellInFunctionMode.id;

        selectedCells.forEach((state) => {
          if (state.id !== remarkedCell.id) return;

          const { refsFound } = parseExpression(state.value, sheet);

          const cursorPosition = getAbsoluteCursorPosition(focusedCellInputRef);

          if (!cursorPosition) return;

          const lastRefFound = refsFound[refsFound.length - 1];

          const lastRefIsHover = isBetween(
            cursorPosition,
            lastRefFound.start,
            lastRefFound.end
          );

          const cursorIsAtEnd = cursorPosition === state.value.length;

          if (!lastRefIsHover && cursorIsAtEnd) {
            state.setState?.(parseHTMLToText(state.value + cellNewRef));
          } else if (lastRefIsHover) {
            const newValue = state.value.replace(lastRefFound.ref, cellNewRef);
            state.setState?.(parseHTMLToText(newValue));
          } else {
            focusedCellInputRef?.blur();
          }
        });
      }

      if (isSelecting && startSelectionCell)
        selectCells(startSelectionCell.id, currentCell.id);
    },
    [
      focusedCellInputRef,
      isSelecting,
      isSelectingFunctionMode,
      remarkedCell,
      selectCells,
      sheet,
      startCellInFunctionMode,
      startSelectionCell,
    ]
  );

  const handleMouseUp = useCallback(() => {
    setIsSelectingFunctionMode(false);
    setIsSelecting(false);
  }, [setIsSelecting, setIsSelectingFunctionMode]);

  useEffect(() => {
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('mousedown', handleMouseDown);
    };
  }, [handleMouseMove, handleMouseUp, handleMouseDown]);

  return {};
};
