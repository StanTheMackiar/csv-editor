import { parseTextToHTML } from '@/helpers/change-cell.helper';
import clsx from 'clsx';
import {
  FC,
  FocusEventHandler,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import ContentEditable, { ContentEditableEvent } from 'react-contenteditable';
import { useShallow } from 'zustand/react/shallow';
import { useSheetStore } from '../../../stores/useSheetStore';
import { ICell } from '../../../types/sheet/cell/cell.types';
import s from '../Sheet.module.css';

interface Props {
  cell: ICell;
  saveChanges: (cell: ICell, value: string) => void;
}

export const Cell: FC<Props> = ({ cell, saveChanges }) => {
  const [
    selectedCells,
    addSelectedCellState,
    remarkedCell,
    setFocusedCellRef,
    removeSelectedCellState,
    setRemarkedCellRef,
    functionMode,
    setFunctionMode,
    functionModeCell,
  ] = useSheetStore(
    useShallow((state) => {
      const cellInFunction = state.functionModeCells.find(
        (funcCell) => funcCell.id === cell.id
      );

      return [
        state.selectedCells,
        state.addSelectedCellState,
        state.remarkedCell,
        state.setFocusedCellInputRef,
        state.removeSelectedCellState,
        state.setRemarkedCellInputRef,
        state.functionMode,
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
    if (isSelected) {
      addSelectedCellState({
        cellId: cell.id,
        setValue: (text: string) => setValue(text),
        value,
      });
    } else {
      removeSelectedCellState(cell.id);
    }
  }, [
    addSelectedCellState,
    cell.id,
    isSelected,
    removeSelectedCellState,
    value,
  ]);

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

  return (
    <td
      onDoubleClick={onDoubleClick}
      id={`${cell.id}-cell`}
      className={s['sheet-cell']}
      key={cell.id}
    >
      <div
        className={clsx(
          s['function-mode-span'],
          isFunctionMode ? 'flex' : 'hidden'
        )}
      >
        <span>?</span>
      </div>

      <ContentEditable
        onBlur={handleBlur}
        onFocus={onFocus}
        innerRef={inputRef}
        id={`${cell.id}-cellinput`}
        onChange={onChange}
        className={clsx(s['sheet-input'], {
          [s['cell-shadow']]: isShadowed,
          [s['cell-marked']]: isRemarked,
          [s['cell-function-mode']]: isFunctionMode,
          [s['cell-focused']]: inputFocused,
          'pointer-events-none': !inputFocused,
        })}
        style={{
          ...(functionModeCell
            ? {
                border: functionModeCell
                  ? `1px ${functionModeCell.color} dashed`
                  : undefined,
                backgroundColor: `${functionModeCell.color}05`,
              }
            : {}),
        }}
        html={inputFocused ? html : cell.computedValue}
      />
    </td>
  );
};
