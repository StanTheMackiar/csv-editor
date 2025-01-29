import { getCellId } from '@/helpers';
import { parseTextToHTML } from '@/helpers/change-cell.helper';
import { useSheetStore } from '@/stores/useSheetStore';
import { ICell } from '@/types/sheet/cell/cell.types';
import { useMemo } from 'react';
import { useShallow } from 'zustand/shallow';

export const useCell = (cell: ICell) => {
  const [
    selectedCells,
    remarkedCell,
    functionMode,
    functionModeCells,
    focusedCell,
    clipboardCellsCoords,
    functionBarIsFocused,
  ] = useSheetStore(
    useShallow((state) => {
      return [
        state.selectedCellsCoords,
        state.remarkedCellCoords,
        state.functionMode,
        state.functionModeCellsCoords,
        state.focusedCellCoords,
        state.clipboardCellsCoords,
        state.functionBarIsFocused,
      ];
    })
  );

  const cellIsOnClipboard = useMemo(() => {
    return clipboardCellsCoords.some(
      (cuttedCell) => cuttedCell.x === cell.x && cuttedCell.y === cell.y
    );
  }, [cell.x, cell.y, clipboardCellsCoords]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const cellId = useMemo(() => getCellId(cell), [cell.x, cell.y]);

  const functionModeCell = useMemo(
    () =>
      functionModeCells.find(
        (funcCell) =>
          funcCell.coords.x === cell.x && funcCell.coords.y === cell.y
      ),
    [functionModeCells, cell.x, cell.y]
  );

  const inputFocused = focusedCell?.x === cell.x && focusedCell?.y === cell.y;
  const isFunctionMode = functionMode && inputFocused;

  const isSelected = useMemo(
    () =>
      selectedCells.some(
        (selectedCell) => selectedCell.x === cell.x && selectedCell.y === cell.y
      ),
    [selectedCells, cell]
  );

  const { isRemarked, isShadowed } = useMemo(() => {
    const isShadowed = selectedCells.length > 1 && isSelected;
    const isRemarked = remarkedCell?.x === cell.x && remarkedCell?.y === cell.y;

    return {
      isShadowed,
      isRemarked,
    };
  }, [remarkedCell, isSelected, selectedCells, cell]);

  const html = useMemo<string>(() => {
    const cellHasFunction = cell.value.startsWith('=');

    const { value, computedValue } = cell;

    let text = '';

    if (inputFocused) text = String(cell.value);
    else if (cellHasFunction) text = computedValue ?? value;
    else text = value;

    return parseTextToHTML(text);
  }, [cell, inputFocused]);

  return {
    cellId,
    cellIsOnClipboard,
    functionBarIsFocused,
    functionModeCell,
    html,
    inputFocused,
    isFunctionMode,
    isRemarked,
    isSelected,
    isShadowed,
  };
};
