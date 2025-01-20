import { getColorFromSequence } from '@/helpers/color.helper';
import { parseExpression } from '@/helpers/sheet/cell/parse-expression.helper';
import {
  getCell,
  getCoordsById,
  getCoordsInRank,
  getSheetLetters,
  getSheetNumbers,
} from '@/helpers/sheet/sheet.helper';
import { useSheetStore } from '@/stores/useSheetStore';
import { FunctionModeCell, ICellSpecial } from '@/types/sheet/cell/cell.types';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useShallow } from 'zustand/shallow';

export const useSheet = () => {
  const [
    cleanSelectedCellsContent,
    focusedCell,
    focusedCellInputRef,
    functionMode,
    selectedCells,
    setFunctionModeCells,
    setSelectedCells,
    sheet,
  ] = useSheetStore(
    useShallow((state) => [
      state.cleanSelectedCellsContent,
      state.focusedCellCoords,
      state.focusedCellInputRef,
      state.functionMode,
      state.selectedCellsCoords,
      state.setFunctionModeCellsCoords,
      state.setSelectedCellsCoords,
      state.sheet,
    ])
  );

  const sheetRef = useRef<HTMLDivElement>(null);

  const remarkFunctionCells = useCallback(() => {
    const focusedValue = focusedCell && getCell(focusedCell, sheet)?.value;

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

        if (!coords) return;

        functionModeCells.push({
          coords,
          color,
        });
      }
    });

    setFunctionModeCells(functionModeCells);
  }, [focusedCell, functionMode, setFunctionModeCells, sheet]);

  useEffect(() => {
    remarkFunctionCells();
  }, [remarkFunctionCells]);

  const sheetLetters = useMemo(() => getSheetLetters(sheet.cols), [sheet.cols]);
  const sheetNumbers = useMemo(() => getSheetNumbers(sheet.rows), [sheet.rows]);

  const onClickColumn = (col: ICellSpecial) => {
    const columnCoords = getCoordsInRank(
      { x: col.coord, y: 0 },
      { x: col.coord, y: sheet.rows - 1 }
    );

    setSelectedCells(columnCoords);
  };

  const onClickRow = (row: ICellSpecial) => {
    const rowCoords = getCoordsInRank(
      { x: 0, y: row.coord },
      { x: sheet.cols - 1, y: row.coord }
    );

    setSelectedCells(rowCoords);
  };

  const onClickAll = () => {
    const allRows = getCoordsInRank(
      { x: 0, y: 0 },
      { x: sheet.cols - 1, y: sheet.rows - 1 }
    );

    setSelectedCells(allRows);
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

  return {
    focusedCellInputRef,
    sheet,
    sheetRef,
    sheetLetters,
    sheetNumbers,

    getColIsSelected,
    getRowIsSelected,
    onCleanCells: cleanSelectedCellsContent,
    onClickAll,
    onClickColumn,
    onClickRow,
  };
};
