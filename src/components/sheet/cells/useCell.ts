import { ContentEditableEvent } from '@/components/core/input/ContentEditable';
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
  ] = useSheetStore(
    useShallow((state) => {
      return [
        state.updateCells,
        state.selectedCells,
        state.remarkedCell,
        state.setFocusedCell,
        state.setFocusedCellInputRef,
        state.setRemarkedCellInputRef,
        state.functionMode,
        state.setFunctionMode,
        state.functionModeCells,
        state.focusedCell,
        state.recomputeSheet,
      ];
    })
  );

  const functionModeCell = functionModeCells.find(
    (funcCell) =>
      funcCell.coords.x === cell.positionX &&
      funcCell.coords.y === cell.positionY
  );

  const inputFocused =
    focusedCell?.x === cell.positionX && focusedCell?.y === cell.positionY;

  const inputRef = useRef<HTMLDivElement>(null);

  const isFunctionMode = functionMode && inputFocused;

  const isSelected = useMemo(
    () =>
      selectedCells.some(
        (selectedCell) =>
          selectedCell.x === cell.positionX && selectedCell.y === cell.positionY
      ),
    [selectedCells, cell]
  );

  const { isRemarked, isShadowed } = useMemo(() => {
    const isShadowed = selectedCells.length > 1 && isSelected;
    const isRemarked =
      remarkedCell?.x === cell.positionX && remarkedCell?.y === cell.positionY;

    return {
      isShadowed,
      isRemarked,
    };
  }, [remarkedCell, isSelected, selectedCells, cell]);

  useEffect(() => {
    if (!inputFocused) return;
    const enableFuncMode = cell.value.startsWith('=');

    setFunctionMode(enableFuncMode);
  }, [cell.value, inputFocused, setFunctionMode]);

  useEffect(() => {
    if (isRemarked) setRemarkedCellRef(inputRef);
  }, [isRemarked, inputRef, setRemarkedCellRef]);

  const handleBlur: FocusEventHandler<HTMLInputElement> = () => {
    inputRef.current?.blur();

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
      x: cell.positionX,
      y: cell.positionY,
    });

    setFocusedCellRef(inputRef);
  };

  const onChange = (e: ContentEditableEvent) => {
    const text = (e.currentTarget.textContent as string) ?? '';
    const enableFuncMode = text.startsWith('=');

    setFunctionMode(enableFuncMode);

    updateCells([
      {
        coords: {
          x: cell.positionX,
          y: cell.positionY,
        },
        newValue: text,
      },
    ]);
  };

  const html = parseTextToHTML(String(cell.value));

  const onClick = () => {
    // eslint-disable-next-line no-console
    // console.log(cell);
  };

  return {
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
    onClick,
    onDoubleClick,
    onFocus,
  };
};
