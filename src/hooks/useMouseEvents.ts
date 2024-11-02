import { parseHTMLToText } from '@/helpers/html-parser.helper';
import { useCallback, useEffect, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { parseExpression } from '../helpers/sheet/cell/cell.helper';
import { isValidExcelExpression } from '../helpers/sheet/cell/is-valid-exp-helper';
import {
  extractCells,
  getCellFromMouseEvent,
} from '../helpers/sheet/sheet.helper';
import { useSheetStore } from '../stores/useSheetStore';
import { ICell } from '../types/sheet/cell/cell.types';

export const useMouseEvents = () => {
  const [
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
    selectedCellsState,
    isSelectingFunctionMode,
    setIsSelectingFunctionMode,
  ] = useSheetStore(
    useShallow((state) => [
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
      state.selectedCellsState,
      state.isSelectingFunctionMode,
      state.setIsSelectingFunctionMode,
    ])
  );

  const [startSelectionCell, setStartSelectionCell] = useState<ICell | null>(
    null
  );
  const [startCellInFunctionMode, setStartCellInFunctionMode] =
    useState<ICell | null>(null);

  const handleMouseDown = useCallback(
    (e: MouseEvent) => {
      if (e.button !== 0) return;

      const cellClicked = getCellFromMouseEvent(e, sheet);

      if (!cellClicked) {
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

        selectedCellsState.forEach((state) => {
          if (state.cellId !== remarkedCell.id) return;

          let newValue = state.value + cellClicked.id;

          const isValidExp = isValidExcelExpression(state.value);

          if (!isValidExp) {
            state.setValue(parseHTMLToText(newValue));
          } else {
            const { refsFound } = parseExpression(state.value, sheet);

            const latestRefFound = refsFound[refsFound.length - 1];
            if (latestRefFound) {
              newValue = state.value.replace(latestRefFound, cellClicked.id);
              state.setValue(parseHTMLToText(newValue));
            }
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
      functionMode,
      isSelecting,
      isSelectingFunctionMode,
      remarkedCell,
      selectedCells.length,
      selectedCellsState,
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

        selectedCellsState.forEach((state) => {
          if (state.cellId === remarkedCell.id) {
            let newValue = state.value + cellNewRef;

            const isValidExp = isValidExcelExpression(state.value);

            if (!isValidExp) {
              state.setValue(parseHTMLToText(newValue));
            } else {
              const { refsFound } = parseExpression(state.value, sheet);

              const latestRefFound = refsFound[refsFound.length - 1];

              if (latestRefFound) {
                newValue = state.value.replace(latestRefFound, cellNewRef);

                state.setValue(parseHTMLToText(newValue));
              }
            }
          }
        });
      }

      if (isSelecting && startSelectionCell)
        selectCells(startSelectionCell.id, currentCell.id);
    },
    [
      isSelecting,
      isSelectingFunctionMode,
      remarkedCell,
      selectCells,
      selectedCellsState,
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
