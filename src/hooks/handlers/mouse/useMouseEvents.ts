import {
  getAbsoluteCursorPosition,
  isBetween,
  parseExpression,
  parseHTMLToText,
} from '@/helpers';
import { useCallback, useEffect, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import {
  getCell,
  getCellFromMouseEvent,
  getCellId,
  getCoordsInRank,
} from '../../../helpers/sheet/sheet.helper';
import { useSheetStore } from '../../../stores/useSheetStore';
import { CellCoords, CellRef } from '../../../types/sheet/cell/cell.types';

export const useMouseEvents = () => {
  const [
    updateCells,
    focusedCellInput,
    addCellsToSelection,
    functionMode,
    isSelecting,
    remarkedCellCoords,
    selectCells,
    selectedCellsCoords,
    setIsSelecting,
    setRemarkedCellCoords,
    setSelectedCellsCoords,
    sheet,
    isSelectingFunctionMode,
    setIsSelectingFunctionMode,
  ] = useSheetStore(
    useShallow((state) => [
      state.updateCells,
      state.focusedCellInputRef,
      state.addCellsToSelection,
      state.functionMode,
      state.isSelecting,
      state.remarkedCellCoords,
      state.selectCells,
      state.selectedCellsCoords,
      state.setIsSelecting,
      state.setRemarkedCellCoords,
      state.setSelectedCellsCoords,
      state.sheet,
      state.isSelectingFunctionMode,
      state.setIsSelectingFunctionMode,
    ])
  );

  const focusedCellInputRef = focusedCellInput?.current;

  const [selectionStartCoords, setSelectionStartCoords] =
    useState<CellCoords | null>(null);
  const [functionModeStartCoords, setFunctionModeStartCoords] =
    useState<CellCoords | null>(null);

  const handleGetCellRef = useCallback(
    (e: MouseEvent) => {
      e.preventDefault();

      const clickedCell = getCellFromMouseEvent(sheet, e);
      if (!clickedCell) return;

      const clickedCellId = clickedCell && getCellId(clickedCell);
      const remarkedCell =
        remarkedCellCoords && getCell(remarkedCellCoords, sheet);

      if (!isSelectingFunctionMode) {
        setIsSelectingFunctionMode(true);
        setFunctionModeStartCoords(clickedCell);
      }

      if (!remarkedCell || !focusedCellInputRef)
        throw new Error('Cell not found');

      const { refs: refsFound } = parseExpression(remarkedCell.value, sheet);

      const cursorPosition = getAbsoluteCursorPosition(focusedCellInputRef);
      if (!cursorPosition) return;

      const lastRefFound: CellRef | undefined =
        refsFound?.[refsFound.length - 1];

      const shouldReplaceRef = lastRefFound
        ? isBetween(cursorPosition, lastRefFound.start, lastRefFound.end)
        : undefined;

      const cursorIsAtEnd = cursorPosition === remarkedCell.value.length;

      const shouldAddRef = !shouldReplaceRef && cursorIsAtEnd;

      if (shouldAddRef) {
        remarkedCell.value = parseHTMLToText(
          remarkedCell.value + clickedCellId
        );
      } else if (shouldReplaceRef) {
        const newValue = remarkedCell.value.replace(
          lastRefFound.ref,
          clickedCellId
        );
        remarkedCell.value = parseHTMLToText(newValue);
      } else {
        focusedCellInputRef?.blur();

        return;
      }

      updateCells([
        {
          coords: {
            x: remarkedCell.x,
            y: remarkedCell.y,
          },
          newValue: remarkedCell.value,
        },
      ]);
    },
    [
      focusedCellInputRef,
      isSelectingFunctionMode,
      remarkedCellCoords,
      setIsSelectingFunctionMode,
      sheet,
      updateCells,
    ]
  );

  const handleMouseDown = useCallback(
    (e: MouseEvent) => {
      const leftClicked = e.button === 0;
      const rightClicked = e.button === 2;

      if (!rightClicked && !leftClicked) return;

      const remarkedCell =
        remarkedCellCoords && getCell(remarkedCellCoords, sheet);

      const clickedCell = getCellFromMouseEvent(sheet, e);

      if (!clickedCell) return;

      const clickeCellInSelectedCells = selectedCellsCoords.some(
        ({ x, y }) => x === clickedCell.x && y === clickedCell.y
      );

      if (clickeCellInSelectedCells && rightClicked) return;

      const clickedCellId = getCellId(clickedCell);
      const remarkedCellId = remarkedCell && getCellId(remarkedCell);

      const isUniqueSelected = selectedCellsCoords.length === 1;

      const clickedRemarkedCell =
        isUniqueSelected && remarkedCellId === clickedCellId;

      const allowGetCellRef =
        functionMode &&
        remarkedCellCoords &&
        !clickedRemarkedCell &&
        !isSelectingFunctionMode;

      if (allowGetCellRef) {
        return handleGetCellRef(e);
      }

      if (clickedRemarkedCell) {
        setIsSelecting(true);

        return;
      }

      const clickedCellCoords = {
        x: clickedCell.x,
        y: clickedCell.y,
      };

      if (!isSelecting) {
        setIsSelecting(true);
        setRemarkedCellCoords(clickedCellCoords);
        setSelectedCellsCoords([clickedCellCoords]);
        setSelectionStartCoords(clickedCellCoords);

        return;
      }

      addCellsToSelection(clickedCellCoords);
    },
    [
      addCellsToSelection,
      functionMode,
      handleGetCellRef,
      isSelecting,
      isSelectingFunctionMode,
      remarkedCellCoords,
      selectedCellsCoords,
      setIsSelecting,
      setRemarkedCellCoords,
      setSelectedCellsCoords,
      sheet,
    ]
  );

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      const currentCell = getCellFromMouseEvent(sheet, e);
      if (!currentCell) return;

      if (
        isSelectingFunctionMode &&
        functionModeStartCoords &&
        remarkedCellCoords
      ) {
        const selectedCells = getCoordsInRank(
          functionModeStartCoords,
          currentCell
        );

        const firstCellCoords = selectedCells?.[0];
        const latestCellCoords = selectedCells?.[selectedCells.length - 1];

        const firstCellId = getCellId(firstCellCoords);
        const latestCellId = getCellId(latestCellCoords);
        const functionModeStartId = getCellId(functionModeStartCoords);

        const isRange = firstCellId !== latestCellId;

        const cellNewRef = isRange
          ? `${firstCellId}:${latestCellId}`
          : functionModeStartId;

        const remarkedCell = getCell(remarkedCellCoords, sheet);

        const { refs } = parseExpression(remarkedCell.value, sheet);
        const cursorPosition = getAbsoluteCursorPosition(focusedCellInputRef);

        if (!cursorPosition) throw new Error('Cursor position not found');

        const lastRefFound = refs[refs.length - 1];

        const lastRefIsHover = isBetween(
          cursorPosition,
          lastRefFound.start,
          lastRefFound.end
        );

        const cursorIsAtEnd = cursorPosition === remarkedCell.value.length;

        if (!lastRefIsHover && cursorIsAtEnd) {
          remarkedCell.value = parseHTMLToText(remarkedCell.value + cellNewRef);
        } else if (lastRefIsHover) {
          const newValue = remarkedCell.value.replace(
            lastRefFound.ref,
            cellNewRef
          );
          remarkedCell.value = parseHTMLToText(newValue);
        } else {
          focusedCellInputRef?.blur();
        }

        updateCells([
          {
            coords: {
              x: remarkedCell.x,
              y: remarkedCell.y,
            },
            newValue: remarkedCell.value,
          },
        ]);
      }

      if (isSelecting && selectionStartCoords) {
        selectCells(selectionStartCoords, {
          x: currentCell.x,
          y: currentCell.y,
        });
      }
    },
    [
      focusedCellInputRef,
      functionModeStartCoords,
      isSelecting,
      isSelectingFunctionMode,
      remarkedCellCoords,
      selectCells,
      selectionStartCoords,
      sheet,
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
