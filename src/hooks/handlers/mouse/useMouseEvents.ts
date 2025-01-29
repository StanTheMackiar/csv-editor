import {
  DivCaretController,
  getFocusedCellElement,
  isBetween,
  parseHTMLToText,
} from '@/helpers';
import { parseExpression } from '@/helpers/sheet/cell/parse-expression.helper';
import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useShallow } from 'zustand/react/shallow';
import {
  getCell,
  getCellFromEvent,
  getCellId,
} from '../../../helpers/sheet/sheet.helper';
import { useSheetStore } from '../../../stores/useSheetStore';
import { Coords, ICell } from '../../../types/sheet/cell/cell.types';

export const useMouseEvents = () => {
  const [
    updateCells,
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

  const [selectionStartCoords, setSelectionStartCoords] = useState<Coords>(
    selectedCellsCoords[0]
  );
  const [functionModeStartCoords, setFunctionModeStartCoords] =
    useState<Coords | null>(null);

  const handleGetCellsRef = useCallback(
    (currentCell: ICell) => {
      const focusedElement = getFocusedCellElement();
      const remarkedCell = getCell(remarkedCellCoords, sheet);

      if (!focusedElement || !remarkedCell) return;

      const currentCellId = getCellId(currentCell);
      const functionModeStartId =
        functionModeStartCoords && getCellId(functionModeStartCoords);

      const isRange =
        functionModeStartId && functionModeStartId !== currentCellId;

      const cellNewRef = isRange
        ? `${functionModeStartId}:${currentCellId}`
        : currentCellId;

      const { refs } = parseExpression(remarkedCell.value, sheet);

      const caret = new DivCaretController(focusedElement);
      const caretPosition = caret.get();

      if (caretPosition === null) {
        console.error('Caret position not found');
        return;
      }

      const cursorBetweenRef = refs.find((ref) => {
        return isBetween(caretPosition, ref.start, ref.end);
      });

      const valueUntilCursor = remarkedCell.value.substring(0, caretPosition);
      const shouldReplaceRef = !!cursorBetweenRef;

      let newValue = remarkedCell.value;

      const shouldAddRef = !cursorBetweenRef;

      if (shouldAddRef) {
        newValue =
          valueUntilCursor + cellNewRef + newValue.slice(caretPosition);

        const newCarretPosition = caretPosition + cellNewRef.length;
        const cursorIsAtEnd = newCarretPosition >= newValue.length;

        if (!cursorIsAtEnd) {
          toast.error('Cannot add reference in the middle of a cell', {
            position: 'top-left',
          });

          focusedElement.blur();

          return;
        } else {
          caret.set(caretPosition + cellNewRef.length, 5);
        }
      } else if (shouldReplaceRef) {
        newValue = newValue.slice().replace(cursorBetweenRef.ref, cellNewRef);

        const { refs } = parseExpression(newValue, sheet);
        const refUpdated = refs.find(({ ref }) => ref === cellNewRef);
        const newCaretPosition = refUpdated?.end ?? newValue.length;

        const cursorIsAtEnd = newCaretPosition >= newValue.length;

        if (isRange && !cursorIsAtEnd) {
          toast.error('Cannot replace reference for a range', {
            position: 'top-left',
          });

          focusedElement.blur();

          return;
        } else {
          caret.set(newCaretPosition, 5);
        }
      }

      updateCells(
        [
          {
            coords: remarkedCellCoords,
            newValue: parseHTMLToText(newValue),
          },
        ],
        false
      );
    },
    [functionModeStartCoords, remarkedCellCoords, sheet, updateCells]
  );

  const handleMouseDown = useCallback(
    (e: MouseEvent) => {
      const leftClicked = e.button === 0;
      const rightClicked = e.button === 2;

      if (!rightClicked && !leftClicked) return;

      const clickedCell = getCellFromEvent(sheet, e);
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

        e.preventDefault();
        handleGetCellsRef(clickedCell);
        return;
      }

      const allowSelectionMode =
        !functionMode &&
        !isSelectingFunctionMode &&
        !isSelecting &&
        !clickedRemarkedCell;

      if (allowSelectionMode) {
        setIsSelecting(true);
        setRemarkedCellCoords(clickedCell);
        setSelectedCellsCoords([clickedCell]);
        setSelectionStartCoords(clickedCell);

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
      const currentCell = getCellFromEvent(sheet, e);
      if (!currentCell) return;

      if (isSelectingFunctionMode) {
        e.preventDefault();
        handleGetCellsRef(currentCell);

        return;
      }

      if (isSelecting) {
        selectCells(selectionStartCoords, currentCell);
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

  useEffect(() => {
    const handleMouseUp = () => {
      setIsSelectingFunctionMode(false);
      setFunctionModeStartCoords(null);
      setIsSelecting(false);
    };

    if (isSelecting || isSelectingFunctionMode) {
      document.addEventListener('mousemove', handleMouseMove);
    }

    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('mousedown', handleMouseDown);
    };
  }, [
    handleMouseDown,
    handleMouseMove,
    isSelecting,
    isSelectingFunctionMode,
    setIsSelecting,
    setIsSelectingFunctionMode,
  ]);

  return {};
};
