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
import {
  CellCoords,
  CellRef,
  ICell,
} from '../../../types/sheet/cell/cell.types';

export const useMouseEvents = () => {
  const [
    focusedCell,
    updateCells,
    focusedCellInput,
    addCellsToSelection,
    functionMode,
    isSelecting,
    remarkedCellCoords,
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
      state.focusedCell,
      state.updateCells,
      state.focusedCellInputRef,
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

  const [startSelectionCoords, setStartSelectionCoords] =
    useState<CellCoords | null>(null);
  const [startCellInFunctionMode, setStartCellInFunctionMode] =
    useState<ICell | null>(null);

  const handleMouseDown = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (e: any) => {
      const allowedButtons = [0, 2];

      if (e.button === 2) e.preventDefault();

      if (!allowedButtons.includes(e.button)) {
        return;
      }

      const targetCell = focusedCell
        ? sheet[focusedCell?.y]?.[focusedCell?.x]
        : undefined;

      const clickedCell = getCellFromMouseEvent(sheet, e);

      if (!clickedCell) {
        if (focusedCellInputRef) return;

        setLatestSelectedCell(null);
        setRemarkedCell(null);
        unmarkSelectedCells();
        setIsSelecting(false);
        setStartSelectionCoords(clickedCell);

        return;
      }

      const isUniqueSelected = selectedCells.length === 1;

      const remarkedCell = remarkedCellCoords
        ? sheet[remarkedCellCoords?.y]?.[remarkedCellCoords?.x]
        : undefined;

      const clickedRemarkedCell =
        isUniqueSelected && remarkedCell?.id === clickedCell?.id;

      const allowGetCellRef =
        functionMode &&
        remarkedCellCoords &&
        !clickedRemarkedCell &&
        !isSelectingFunctionMode;

      if (allowGetCellRef) {
        e.preventDefault();

        if (!isSelectingFunctionMode) {
          setIsSelectingFunctionMode(true);
          setStartCellInFunctionMode(clickedCell);
        }

        if (!targetCell || !focusedCellInputRef)
          throw new Error('Cell not found');

        const { refsFound } = parseExpression(targetCell.value, sheet);

        const cursorPosition = getAbsoluteCursorPosition(focusedCellInputRef);
        if (!cursorPosition) return;

        const lastRefFound: CellRef | undefined =
          refsFound?.[refsFound.length - 1];

        const shouldReplaceRef = lastRefFound
          ? isBetween(cursorPosition, lastRefFound.start, lastRefFound.end)
          : undefined;

        const cursorIsAtEnd = cursorPosition === targetCell.value.length;

        const shouldAddRef = !shouldReplaceRef && cursorIsAtEnd;

        if (shouldAddRef) {
          targetCell.value = parseHTMLToText(targetCell.value + clickedCell.id);
        } else if (shouldReplaceRef) {
          const newValue = targetCell.value.replace(
            lastRefFound.ref,
            clickedCell.id
          );
          targetCell.value = parseHTMLToText(newValue);
        } else {
          focusedCellInputRef?.blur();

          return;
        }

        updateCells([
          {
            coords: {
              x: targetCell.x,
              y: targetCell.y,
            },
            newValue: targetCell.value,
          },
        ]);

        return;
      }

      if (clickedRemarkedCell) {
        setIsSelecting(true);

        return;
      }

      const clickedCellCoors = {
        x: clickedCell.x,
        y: clickedCell.y,
      };

      if (!isSelecting) {
        setIsSelecting(true);
        setRemarkedCell(clickedCellCoors);
        setSelectedCells([clickedCellCoors]);
        setLatestSelectedCell(null);
        setStartSelectionCoords({
          x: clickedCell.x,
          y: clickedCell.y,
        });

        return;
      }

      addCellsToSelection(clickedCellCoors);
    },
    [
      addCellsToSelection,
      focusedCell,
      focusedCellInputRef,
      functionMode,
      isSelecting,
      isSelectingFunctionMode,
      remarkedCellCoords,
      selectedCells.length,
      setIsSelecting,
      setIsSelectingFunctionMode,
      setLatestSelectedCell,
      setRemarkedCell,
      setSelectedCells,
      sheet,
      unmarkSelectedCells,
      updateCells,
    ]
  );

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      const currentCell = getCellFromMouseEvent(sheet, e);
      if (!currentCell) return;

      if (
        isSelectingFunctionMode &&
        startCellInFunctionMode &&
        remarkedCellCoords
      ) {
        const selectedCells = extractCells(
          startCellInFunctionMode.id,
          currentCell.id,
          sheet
        );

        const firstCellCoords = selectedCells?.[0];
        const latestCellCoords = selectedCells?.[selectedCells.length - 1];

        const firstCell = sheet[firstCellCoords.y]?.[firstCellCoords.x];
        const latestCell = sheet[latestCellCoords.y]?.[latestCellCoords.x];

        const isRange = firstCell !== latestCell;

        const cellNewRef = isRange
          ? `${firstCell?.id}:${latestCell?.id}`
          : startCellInFunctionMode.id;

        const targetCell = focusedCell
          ? sheet[focusedCell?.y]?.[focusedCell?.x]
          : undefined;

        if (!targetCell) throw new Error('Cell not found');

        const { refsFound } = parseExpression(targetCell.value, sheet);
        const cursorPosition = getAbsoluteCursorPosition(focusedCellInputRef);

        if (!cursorPosition) throw new Error('Cursor position not found');

        const lastRefFound = refsFound[refsFound.length - 1];

        const lastRefIsHover = isBetween(
          cursorPosition,
          lastRefFound.start,
          lastRefFound.end
        );

        const cursorIsAtEnd = cursorPosition === targetCell.value.length;

        if (!lastRefIsHover && cursorIsAtEnd) {
          targetCell.value = parseHTMLToText(targetCell.value + cellNewRef);
        } else if (lastRefIsHover) {
          const newValue = targetCell.value.replace(
            lastRefFound.ref,
            cellNewRef
          );
          targetCell.value = parseHTMLToText(newValue);
        } else {
          focusedCellInputRef?.blur();
        }

        updateCells([
          {
            coords: {
              x: targetCell.x,
              y: targetCell.y,
            },
            newValue: targetCell.value,
          },
        ]);
      }

      if (isSelecting && startSelectionCoords) {
        selectCells(startSelectionCoords, {
          x: currentCell.x,
          y: currentCell.y,
        });
      }
    },
    [
      focusedCell,
      focusedCellInputRef,
      isSelecting,
      isSelectingFunctionMode,
      remarkedCellCoords,
      selectCells,
      sheet,
      startCellInFunctionMode,
      startSelectionCoords,
      updateCells,
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
