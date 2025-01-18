import { ContentEditableEvent } from '@/components/core/input/ContentEditable';
import { getCellId } from '@/helpers';
import { parseTextToHTML } from '@/helpers/change-cell.helper';
import { useSheetStore } from '@/stores/useSheetStore';
import { FocusEventHandler, useEffect, useMemo, useRef } from 'react';
import { useShallow } from 'zustand/shallow';
import { CellProps } from './Cell';

export const useCell = ({ cell }: CellProps) => {
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

  const cellIsOnClipboard = useMemo(() => {
    return clipboardCellsCoords.some(
      (cuttedCell) => cuttedCell.x === cell.x && cuttedCell.y === cell.y
    );
  }, [cell.x, cell.y, clipboardCellsCoords]);

  const cellId = useMemo(
    () =>
      getCellId({
        x: cell.x,
        y: cell.y,
      }),
    [cell.x, cell.y]
  );

  const functionModeCell = functionModeCells.find(
    (funcCell) => funcCell.coords.x === cell.x && funcCell.coords.y === cell.y
  );
  const inputFocused = focusedCell?.x === cell.x && focusedCell?.y === cell.y;
  const isFunctionMode = functionMode && inputFocused;

  const inputRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    if (isRemarked) setRemarkedCellRef(inputRef);
  }, [isRemarked, inputRef, setRemarkedCellRef]);

  const handleBlur: FocusEventHandler<HTMLInputElement> = () => {
    setFocusedCellRef(null);
    setFocusedCell(null);
    setFunctionMode(false);
    recomputeSheet();
  };

  const onDoubleClick = () => {
    inputRef.current?.focus();
  };

  const onFocus = () => {
    setFocusedCell({
      x: cell.x,
      y: cell.y,
    });

    const enableFuncMode = cell.value.startsWith('=');
    setFunctionMode(enableFuncMode);
    setFocusedCellRef(inputRef);
  };

  const onChange = (e: ContentEditableEvent) => {
    const text = (e.currentTarget.textContent as string) ?? '';

    const newIsFunctionMode = text.startsWith('=') ?? false;
    if (isFunctionMode !== newIsFunctionMode) {
      setFunctionMode(newIsFunctionMode);
    }

    updateCells(
      [
        {
          coords: {
            x: cell.x,
            y: cell.y,
          },
          newValue: text,
        },
      ],
      false
    );
  };

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
    inputRef,
    isFunctionMode,
    isRemarked,
    isSelected,
    isShadowed,

    handleBlur,
    onChange,
    onDoubleClick,
    onFocus,
  };
};
