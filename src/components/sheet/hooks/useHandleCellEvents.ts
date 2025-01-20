import { useSheetStore } from '@/stores/useSheetStore';
import { ICell } from '@/types/sheet/cell/cell.types';
import { useCallback } from 'react';
import { useShallow } from 'zustand/shallow';
import { ContentEditableEvent } from '../../core';

export const useHandleCellEvents = () => {
  const [
    functionMode,
    recomputeSheet,
    setFocusedCell,
    setFocusedCellRef,
    setFunctionMode,
    updateCells,
  ] = useSheetStore(
    useShallow((state) => {
      return [
        state.functionMode,
        state.recomputeSheet,
        state.setFocusedCellCoords,
        state.setFocusedCellInputRef,
        state.setFunctionMode,
        state.updateCells,
      ];
    })
  );

  const onFocusCell = useCallback(
    (cell: ICell, ref: HTMLDivElement | null) => {
      setFocusedCell(cell);

      const enableFuncMode = cell.value.startsWith('=');
      setFunctionMode(enableFuncMode);
      setFocusedCellRef(ref);
    },
    [setFocusedCell, setFocusedCellRef, setFunctionMode]
  );

  const onDoubleClickCell = useCallback((ref: HTMLDivElement | null) => {
    ref?.focus();
  }, []);

  const onBlurCell = useCallback(() => {
    setFocusedCellRef(null);
    setFocusedCell(null);
    setFunctionMode(false);

    recomputeSheet();
  }, [recomputeSheet, setFocusedCell, setFocusedCellRef, setFunctionMode]);

  const onChangeCell = useCallback(
    (e: ContentEditableEvent, cell: ICell, focused: boolean) => {
      const isFunctionMode = functionMode && focused;

      const text = (e.currentTarget.textContent as string) ?? '';

      const newIsFunctionMode = text.startsWith('=') ?? false;
      if (isFunctionMode !== newIsFunctionMode) {
        setFunctionMode(newIsFunctionMode);
      }

      updateCells(
        [
          {
            coords: { x: cell.x, y: cell.y },
            newValue: text,
          },
        ],
        false
      );
    },
    [functionMode, setFunctionMode, updateCells]
  );

  return {
    onBlurCell,
    onChangeCell,
    onDoubleClickCell,
    onFocusCell,
  };
};
