import { getColorFromSequence } from '@/helpers/color.helper';
import { computeCell, parseExpression } from '@/helpers/sheet/cell/cell.helper';
import {
  extractCells,
  getSheetLetters,
  getSheetNumbers,
} from '@/helpers/sheet/sheet.helper';
import { useSheetStore } from '@/stores/useSheetStore';
import {
  FunctionModeCell,
  ICell,
  ICellSpecial,
} from '@/types/sheet/cell/cell.types';
import { useCallback, useEffect, useMemo } from 'react';
import { useShallow } from 'zustand/shallow';

export const useSheet = () => {
  const [
    colsQty,
    focusedCellInputRef,
    functionMode,
    rowsQty,
    selectedCells,
    setSelectedCells,
    setFunctionModeCells,
    setSheet,
    sheet,
    recomputeSheet,
    selectedCellsState,
  ] = useSheetStore(
    useShallow((state) => [
      state.colsQty,
      state.focusedCellInput,
      state.functionMode,
      state.rowsQty,
      state.selectedCells,
      state.setSelectedCells,
      state.setFunctionModeCells,
      state.setSheet,
      state.sheet,
      state.recomputeSheet,
      state.selectedCellsState,
    ])
  );

  useEffect(() => {
    const remarkedValue = selectedCellsState[0]?.value;

    if (!remarkedValue || !functionMode) {
      setFunctionModeCells([]);

      return;
    }

    const { refsFound } = parseExpression(remarkedValue, sheet);

    const functionModeCells: FunctionModeCell[] = [];

    refsFound.forEach((ref, i) => {
      const color = getColorFromSequence(i);
      const [startCell, endCell] = ref.split(':');
      const isRange = !!endCell;

      if (isRange) {
        const cells = extractCells(startCell, endCell, sheet);

        cells.forEach((cell) => {
          functionModeCells.push({
            id: cell.id,
            color,
          });
        });
      } else {
        functionModeCells.push({
          id: startCell,
          color,
        });
      }
    });

    setFunctionModeCells(functionModeCells);
  }, [functionMode, selectedCellsState, setFunctionModeCells, sheet]);

  const saveSheetFromCell = (cell: ICell, newValue: string) => {
    const currentSheet = sheet.slice();

    currentSheet[cell.positionY][cell.positionX] = computeCell(
      cell,
      sheet,
      newValue
    );

    setSheet({ sheet: currentSheet });

    setTimeout(recomputeSheet, 50);
  };

  const sheetLetters = useMemo(() => getSheetLetters(colsQty), [colsQty]);
  const sheetNumbers = useMemo(() => getSheetNumbers(rowsQty), [rowsQty]);

  const onClickColumn = (col: ICellSpecial) => {
    const columnsFound: ICell[] = sheet
      .flat()
      .filter((cell) => cell.positionX === col.value)
      .map((cell) => cell);

    setSelectedCells(columnsFound);
  };

  const onClickRow = (row: ICellSpecial) => {
    const rowsFound: ICell[] = sheet
      .flat()
      .filter((cell) => cell.positionY === row.value)
      .map((cell) => cell);

    setSelectedCells(rowsFound);
  };

  const onClickAll = () => {
    setSelectedCells(sheet.flat());
  };

  const getColIsSelected = useCallback(
    (col: ICellSpecial): boolean => {
      const selectedCellsArray = Array.from(selectedCells);

      const someColSelected = selectedCellsArray.some(
        (selectedCell) => selectedCell.positionX === col.value
      );

      return someColSelected;
    },
    [selectedCells]
  );

  const getRowIsSelected = useCallback(
    (row: ICellSpecial): boolean => {
      const selectedCellsArray = Array.from(selectedCells);

      const someRowSelected = selectedCellsArray.some(
        (selectedCell) => selectedCell.positionY === row.value
      );

      return someRowSelected;
    },
    [selectedCells]
  );

  return {
    focusedCellInputRef,
    sheet,
    sheetLetters,
    sheetNumbers,

    getColIsSelected,
    getRowIsSelected,
    onClickAll,
    onClickColumn,
    onClickRow,
    saveSheetFromCell,
  };
};
