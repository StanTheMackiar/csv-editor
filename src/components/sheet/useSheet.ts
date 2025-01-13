import { getColorFromSequence } from '@/helpers/color.helper';
import { parseExpression } from '@/helpers/sheet/cell/cell.helper';
import {
  getCoordsById,
  getCoordsInRank,
  getSheetLetters,
  getSheetNumbers,
} from '@/helpers/sheet/sheet.helper';
import { useSheetStore } from '@/stores/useSheetStore';
import {
  Coords,
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
    cleanSelectedCellsContent,
  ] = useSheetStore(
    useShallow((state) => [
      state.focusedCellCoords,
      state.colsQty,
      state.focusedCellInputRef,
      state.functionMode,
      state.rowsQty,
      state.selectedCellsCoords,
      state.setSelectedCellsCoords,
      state.setFunctionModeCellsCoords,
      state.sheet,
      state.cleanSelectedCellsContent,
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

    const { refs } = parseExpression(focusedValue, sheet);

    const functionModeCells: FunctionModeCell[] = [];

    refs.forEach((cell, i) => {
      const color = getColorFromSequence(i);
      const [startCellId, endCellId] = cell.ref.split(':');
      const isRange = !!endCellId;

      if (isRange) {
        const cellCoords = getCoordsInRank(startCellId, endCellId);

        cellCoords.forEach((coords) => {
          functionModeCells.push({
            coords,
            color,
          });
        });
      } else {
        const coords = getCoordsById(startCellId);

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
    const columnsFound: Coords[] = sheet
      .flat()
      .filter((cell) => cell.x === col.coord)
      .map((cell) => ({ x: cell.x, y: cell.y }));

    setSelectedCells(columnsFound);
  };

  const onClickRow = (row: ICellSpecial) => {
    const rowsFound: Coords[] = sheet
      .flat()
      .filter((cell) => cell.y === row.coord)
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
        (selectedCell) => selectedCell.x === col.coord
      );

      return someColSelected;
    },
    [selectedCells]
  );

  const getRowIsSelected = useCallback(
    (row: ICellSpecial): boolean => {
      const selectedCellsArray = Array.from(selectedCells);

      const someRowSelected = selectedCellsArray.some(
        (selectedCell) => selectedCell.y === row.coord
      );

      return someRowSelected;
    },
    [selectedCells]
  );

  const onCleanCells = () => {
    cleanSelectedCellsContent();
  };

  return {
    focusedCellInputRef,
    sheet,
    sheetLetters,
    sheetNumbers,

    getColIsSelected,
    getRowIsSelected,
    onCleanCells,
    onClickAll,
    onClickColumn,
    onClickRow,
  };
};
