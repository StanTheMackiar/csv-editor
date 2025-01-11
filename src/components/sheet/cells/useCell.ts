import { ContentEditableEvent } from '@/components/core/input/ContentEditable';
import { parseTextToHTML } from '@/helpers/change-cell.helper';
import { useSheetStore } from '@/stores/useSheetStore';
import { FocusEventHandler, useEffect, useMemo, useRef, useState } from 'react';
import { useShallow } from 'zustand/shallow';
import { CellProps } from './Cell';

export const useCell = ({ cell, saveChanges }: CellProps) => {
  const [
    selectedCells,
    remarkedCell,
    setFocusedCellRef,
    setRemarkedCellRef,
    functionMode,
    updateCells,
    setFunctionMode,
    functionModeCell,
  ] = useSheetStore(
    useShallow((state) => {
      const cellInFunction = state.functionModeCells.find(
        (funcCell) => funcCell.id === cell.id
      );

      return [
        state.selectedCells,
        state.remarkedCell,
        state.setFocusedCellInputRef,
        state.setRemarkedCellInputRef,
        state.functionMode,
        state.updateCells,
        state.setFunctionMode,
        cellInFunction,
      ];
    })
  );

  const [value, setValue] = useState(cell.value);
  const [inputFocused, setInputFocused] = useState(false);

  const inputRef = useRef<HTMLDivElement>(null);

  const isFunctionMode = functionMode && inputFocused;

  const isSelected = useMemo(
    () => selectedCells.some((selectedCell) => selectedCell.id === cell.id),
    [selectedCells, cell]
  );

  const { isRemarked, isShadowed } = useMemo(() => {
    const isShadowed = selectedCells.length > 1 && isSelected;
    const isRemarked = remarkedCell?.id === cell.id;

    return {
      isShadowed,
      isRemarked,
    };
  }, [remarkedCell, isSelected, selectedCells, cell]);

  useEffect(() => {
    const enableFuncMode = value.startsWith('=') && inputFocused;

    setFunctionMode(enableFuncMode);

    return () => {
      setFunctionMode(false);
    };
  }, [inputFocused, setFunctionMode, value]);

  useEffect(() => {
    updateCells([{ ...cell, stateValue: value, setState: setValue }]);
  }, [cell, setValue, updateCells, value]);

  useEffect(() => {
    if (isRemarked) setRemarkedCellRef(inputRef);
  }, [isRemarked, inputRef, setRemarkedCellRef]);

  const handleBlur: FocusEventHandler<HTMLInputElement> = () => {
    inputRef.current?.blur();

    setFocusedCellRef(null);
    setInputFocused(false);
    setFunctionMode(false);

    saveChanges(cell, inputRef.current?.textContent ?? '');
  };

  const onDoubleClick = () => {
    inputRef.current?.focus();
  };

  const onFocus = () => {
    setFocusedCellRef(inputRef);
    setInputFocused(true);
  };

  const onChange = (e: ContentEditableEvent) => {
    const text = (e.currentTarget.textContent as string) ?? '';

    setValue(text);
  };

  const html = parseTextToHTML(String(value));

  const onClick = () => {
    // eslint-disable-next-line no-console
    console.log({ cell });
    // eslint-disable-next-line no-console
    console.log({ value });
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
