import { getColorFromSequence } from '@/helpers/color.helper';
import { parseExpression } from '@/helpers/sheet/cell/cell.helper';
import {
  extractCells,
  extractCoordsFromId,
  getSheetLetters,
  getSheetNumbers,
} from '@/helpers/sheet/sheet.helper';
import { useSheetStore } from '@/stores/useSheetStore';
import {
  CellCoords,
  FunctionModeCell,
  ICellSpecial,
} from '@/types/sheet/cell/cell.types';
import { useCallback, useEffect, useMemo } from 'react';
import { useShallow } from 'zustand/shallow';

export const useSheet = () => {
  const [
    focusedCell,
    colsQty,
    focusedCellInputRef,
    functionMode,
    rowsQty,
    selectedCells,
    setSelectedCells,
    setFunctionModeCells,
    sheet,
  ] = useSheetStore(
    useShallow((state) => [
      state.focusedCell,
      state.colsQty,
      state.focusedCellInputRef,
      state.functionMode,
      state.rowsQty,
      state.selectedCells,
      state.setSelectedCells,
      state.setFunctionModeCells,
      state.sheet,
    ])
  );

  useEffect(() => {
    const focusedValue = focusedCell
      ? sheet[focusedCell?.y][focusedCell?.x].value
      : undefined;

    if (!focusedValue || !functionMode) {
      setFunctionModeCells([]);

      return;
    }

    const { refsFound } = parseExpression(focusedValue, sheet);

    const functionModeCells: FunctionModeCell[] = [];

    refsFound.forEach((cell, i) => {
      const color = getColorFromSequence(i);
      const [startCell, endCell] = cell.ref.split(':');
      const isRange = !!endCell;

      if (isRange) {
        const cellCoords = extractCells(startCell, endCell, sheet);

        cellCoords.forEach((coords) => {
          functionModeCells.push({
            coords,
            color,
          });
        });
      } else {
        const coords = extractCoordsFromId(startCell);

        functionModeCells.push({
          coords,
          color,
        });
      }
    });

    setFunctionModeCells(functionModeCells);
  }, [focusedCell, functionMode, setFunctionModeCells, sheet]);

  const sheetLetters = useMemo(() => getSheetLetters(colsQty), [colsQty]);
  const sheetNumbers = useMemo(() => getSheetNumbers(rowsQty), [rowsQty]);

  const onClickColumn = (col: ICellSpecial) => {
    const columnsFound: CellCoords[] = sheet
      .flat()
      .filter((cell) => cell.x === col.value)
      .map((cell) => ({ x: cell.x, y: cell.y }));

    setSelectedCells(columnsFound);
  };

  const onClickRow = (row: ICellSpecial) => {
    const rowsFound: CellCoords[] = sheet
      .flat()
      .filter((cell) => cell.y === row.value)
      .map((cell) => ({ x: cell.x, y: cell.y }));

    setSelectedCells(rowsFound);
  };

  const onClickAll = () => {
    setSelectedCells(
      sheet.flatMap((row) => row.map((cell) => ({ x: cell.x, y: cell.y })))
    );
  };

  const getColIsSelected = useCallback(
    (col: ICellSpecial): boolean => {
      const selectedCellsArray = Array.from(selectedCells);

      const someColSelected = selectedCellsArray.some(
        (selectedCell) => selectedCell.x === col.value
      );

      return someColSelected;
    },
    [selectedCells]
  );

  const getRowIsSelected = useCallback(
    (row: ICellSpecial): boolean => {
      const selectedCellsArray = Array.from(selectedCells);

      const someRowSelected = selectedCellsArray.some(
        (selectedCell) => selectedCell.y === row.value
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
  };
};
