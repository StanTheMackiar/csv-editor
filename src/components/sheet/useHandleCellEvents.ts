import { useSheetStore } from '@/stores/useSheetStore';
import { ICell } from '@/types/sheet/cell/cell.types';
import { useRef } from 'react';
import { useShallow } from 'zustand/shallow';

export const useHandleCellEvents = () => {
  const [
    updateCells,
    selectedCells,
    remarkedCell,
    setFocusedCell,
    setFocusedCellRef,
    setRemarkedCellRef,
    functionMode,
    setFunctionMode,
    functionModeCells,
    focusedCell,
    recomputeSheet,
    clipboardCellsCoords,
    functionBarIsFocused,
  ] = useSheetStore(
    useShallow((state) => {
      return [
        state.updateCells,
        state.selectedCellsCoords,
        state.remarkedCellCoords,
        state.setFocusedCellCoords,
        state.setFocusedCellInputRef,
        state.setRemarkedCellInputRef,
        state.functionMode,
        state.setFunctionMode,
        state.functionModeCellsCoords,
        state.focusedCellCoords,
        state.recomputeSheet,
        state.clipboardCellsCoords,
        state.functionBarIsFocused,
      ];
    })
  );

  const focusedCellRef = useRef<HTMLInputElement>(null);

  const onFocus = (cell: ICell) => {
    setFocusedCell(cell);

    const enableFuncMode = cell.value.startsWith('=');
    setFunctionMode(enableFuncMode);
    setFocusedCellRef(focusedCellRef);
  };

  return {};
};
