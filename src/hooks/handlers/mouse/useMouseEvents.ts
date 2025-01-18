import {
  CaretPosition,
  checkIfEndsWithInvalidChar,
  isBetween,
  parseHTMLToText,
} from '@/helpers';
import { parseExpression } from '@/helpers/sheet/cell/parse-expression.helper';
import { RefObject, useCallback, useEffect, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import {
  getCell,
  getCellFromMouseEvent,
  getCellId,
} from '../../../helpers/sheet/sheet.helper';
import { useSheetStore } from '../../../stores/useSheetStore';
import { Coords, ICell } from '../../../types/sheet/cell/cell.types';

export const useMouseEvents = (sheetRef: RefObject<HTMLDivElement>) => {
  const [
    updateCells,
    focusedCellInput,
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

  const [selectionStartCoords, setSelectionStartCoords] = useState<Coords>(
    selectedCellsCoords[0]
  );
  const [functionModeStartCoords, setFunctionModeStartCoords] =
    useState<Coords | null>(null);

  const handleGetCellsRef = useCallback(
    (e: MouseEvent, currentCell: ICell) => {
      e.preventDefault();

      const currentCellId = getCellId(currentCell);
      const functionModeStartId =
        functionModeStartCoords && getCellId(functionModeStartCoords);

      const isRange =
        functionModeStartId && functionModeStartId !== currentCellId;

      const cellNewRef = isRange
        ? `${functionModeStartId}:${currentCellId}`
        : currentCellId;

      const remarkedCell = getCell(remarkedCellCoords, sheet);

      if (!remarkedCell || !focusedCellInputRef) {
        console.error('Feocused cell not found');
        return;
      }

      const { refs } = parseExpression(remarkedCell.value, sheet);

      const caret = new CaretPosition(focusedCellInputRef);
      const caretPosition = caret.get();

      if (caretPosition === null) {
        console.error('Caret position not found');
        return;
      }

      const cursorBetweenRef = refs.find((ref) => {
        return isBetween(caretPosition, ref.start, ref.end);
      });

      const valueUntilCursor = remarkedCell.value.substring(0, caretPosition);
      const endsWithInvalidChar = checkIfEndsWithInvalidChar(valueUntilCursor);

      const cursorIsAtEnd = caretPosition >= remarkedCell.value.length;
      const shouldReplaceRef = !!cursorBetweenRef && cursorIsAtEnd;
      const shouldAddRef =
        !cursorBetweenRef && endsWithInvalidChar && cursorIsAtEnd;

      let newValue = remarkedCell.value;

      if (shouldAddRef) {
        const value =
          valueUntilCursor +
          cellNewRef +
          remarkedCell.value.slice(caretPosition);

        newValue = parseHTMLToText(value);

        caret.set(caretPosition + cellNewRef.length, 5);
      } else if (shouldReplaceRef) {
        const replacedValue = newValue
          .slice()
          .replace(cursorBetweenRef.ref, cellNewRef);

        newValue = parseHTMLToText(replacedValue);

        const { refs } = parseExpression(newValue, sheet);
        const refUpdated = refs.find(({ ref }) => ref === cellNewRef);

        caret.set(refUpdated?.end ?? newValue.length, 10);
      } else {
        focusedCellInputRef.blur();
      }

      updateCells([
        {
          coords: remarkedCellCoords,
          newValue,
        },
      ]);
    },
    [
      focusedCellInputRef,
      functionModeStartCoords,
      remarkedCellCoords,
      sheet,
      updateCells,
    ]
  );

  const handleMouseDown = useCallback(
    (e: MouseEvent) => {
      const leftClicked = e.button === 0;
      const rightClicked = e.button === 2;

      if (!rightClicked && !leftClicked) return;

      const clickedCell = getCellFromMouseEvent(sheet, e);
      if (!clickedCell) return;

      const clickedCellInSelectedCells = selectedCellsCoords.some(
        ({ x, y }) => x === clickedCell.x && y === clickedCell.y
      );

      if (clickedCellInSelectedCells && rightClicked) return;

      const clickedCellId = getCellId(clickedCell);
      const remarkedCellId = getCellId(remarkedCellCoords);

      const isUniqueSelected = selectedCellsCoords.length === 1;

      const clickedRemarkedCell =
        isUniqueSelected && remarkedCellId === clickedCellId;

      const allowGetCellRef =
        functionMode && !clickedRemarkedCell && !isSelectingFunctionMode;

      if (allowGetCellRef) {
        setFunctionModeStartCoords(clickedCell);
        setIsSelectingFunctionMode(true);

        handleGetCellsRef(e, clickedCell);
        return;
      }

      const clickedCellCoords: Coords = {
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
    },
    [
      functionMode,
      handleGetCellsRef,
      isSelecting,
      isSelectingFunctionMode,
      remarkedCellCoords,
      selectedCellsCoords,
      setIsSelecting,
      setIsSelectingFunctionMode,
      setRemarkedCellCoords,
      setSelectedCellsCoords,
      sheet,
    ]
  );

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      const currentCell = getCellFromMouseEvent(sheet, e);
      if (!currentCell) return;

      if (isSelectingFunctionMode) {
        handleGetCellsRef(e, currentCell);

        return;
      }

      if (isSelecting) {
        selectCells(selectionStartCoords, {
          x: currentCell.x,
          y: currentCell.y,
        });
      }
    },
    [
      handleGetCellsRef,
      isSelecting,
      isSelectingFunctionMode,
      selectCells,
      selectionStartCoords,
      sheet,
    ]
  );

  const handleMouseUp = useCallback(() => {
    setIsSelectingFunctionMode(false);
    setFunctionModeStartCoords(null);
    setIsSelecting(false);
  }, [setIsSelecting, setIsSelectingFunctionMode]);

  useEffect(() => {
    const ref = sheetRef.current;
    if (!ref) return;

    if (isSelecting || isSelectingFunctionMode) {
      ref.addEventListener('mousemove', handleMouseMove);
    }

    ref.addEventListener('mousedown', handleMouseDown);
    ref.addEventListener('mouseup', handleMouseUp);

    return () => {
      ref.removeEventListener('mousemove', handleMouseMove);
      ref.removeEventListener('mouseup', handleMouseUp);
      ref.removeEventListener('mousedown', handleMouseDown);
    };
  }, [
    handleMouseMove,
    handleMouseUp,
    handleMouseDown,
    sheetRef,
    isSelecting,
    isSelectingFunctionMode,
  ]);

  return {};
};
