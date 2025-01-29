import { getCellFromEvent, getFocusedCellElement } from '@/helpers';
import { useSheetStore } from '@/stores/useSheetStore';
import { ICell } from '@/types/sheet/cell/cell.types';
import { useCallback, useEffect } from 'react';
import { useShallow } from 'zustand/shallow';
import { ContentEditableEvent } from '../../core';

export const useHandleCellEvents = () => {
  const [
    functionMode,
    setFunctionMode,
    updateCells,
    setFocusedCellCoords,
    recomputeSheet,
    sheet,
  ] = useSheetStore(
    useShallow((state) => {
      return [
        state.functionMode,
        state.setFunctionMode,
        state.updateCells,
        state.setFocusedCellCoords,
        state.recomputeSheet,
        state.sheet,
      ];
    })
  );

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

  const handleDoubleClick = useCallback((e: Event) => {
    const focusedElement = getFocusedCellElement();
    if (focusedElement) return;

    const target = e.target as HTMLElement | undefined;
    const contentEditable = target?.childNodes?.[1] as
      | HTMLDivElement
      | undefined;

    contentEditable?.focus?.();
  }, []);

  const handleFocus = useCallback(
    (e: FocusEvent) => {
      const cell = getCellFromEvent(sheet, e);
      if (!cell) return;

      setFocusedCellCoords(cell);

      const enableFuncMode = cell.value.startsWith('=');
      setFunctionMode(enableFuncMode);
    },
    [setFocusedCellCoords, setFunctionMode, sheet]
  );

  const handleBlur = useCallback(
    (e: FocusEvent) => {
      const cell = getCellFromEvent(sheet, e);
      if (!cell) return;

      setFocusedCellCoords(null);
      setFunctionMode(false);

      recomputeSheet();
    },
    [recomputeSheet, setFocusedCellCoords, setFunctionMode, sheet]
  );

  useEffect(() => {
    document.addEventListener('dblclick', handleDoubleClick);
    document.addEventListener('focusin', handleFocus);
    document.addEventListener('focusout', handleBlur);

    return () => {
      document.removeEventListener('dblclick', handleDoubleClick);
      document.removeEventListener('focusin', handleFocus);
      document.removeEventListener('focusout', handleBlur);
    };
  }, [handleDoubleClick, handleFocus, handleBlur]);

  return {
    onChangeCell,
  };
};
