'use client';

import { ContentEditableEvent } from '@/components/core/input/ContentEditable';
import { CaretPosition, getCell, getCellId, parseTextToHTML } from '@/helpers';
import { useSheetStore } from '@/stores/useSheetStore';
import { Icon } from '@iconify/react/dist/iconify.js';
import clsx from 'clsx';
import { FC, FocusEventHandler, useEffect, useMemo, useRef } from 'react';
import { useShallow } from 'zustand/shallow';

export const FunctionBar: FC = () => {
  const [
    remarkedCellCoords,
    sheet,
    updateCells,
    functionBarIsFocused,
    setFunctionBarIsFocused,
    setFocusedCellCoords,
    setFocusedCellInputRef,
    setFunctionMode,
    recomputeSheet,
    isFunctionMode,
    selectedCellsCoords,
  ] = useSheetStore(
    useShallow((state) => [
      state.remarkedCellCoords,
      state.sheet,
      state.updateCells,
      state.functionBarIsFocused,
      state.setFunctionBarIsFocused,
      state.setFocusedCellCoords,
      state.setFocusedCellInputRef,
      state.setFunctionMode,
      state.recomputeSheet,
      state.functionMode,
      state.selectedCellsCoords,
    ])
  );

  const inputRef = useRef<HTMLDivElement>(null);
  const cursorPosition = useRef<number>();

  const cell = getCell(remarkedCellCoords, sheet);

  const onChange = (e: ContentEditableEvent) => {
    if (!cell) throw new Error('Cell not found');

    const caretPosition = new CaretPosition(inputRef.current).get();
    const text = (e.currentTarget.textContent as string) ?? '';

    cursorPosition.current = caretPosition || text.length;

    const newIsFunctionMode = text.startsWith('=');
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

  //? Se encarga de mantener el cursor a la derecha al escribir
  useEffect(() => {
    if (!functionBarIsFocused) return;

    const caret = new CaretPosition(inputRef.current);
    caret.set(cursorPosition.current || cell?.value.length || 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cell?.value]);

  const html = useMemo<string>(() => {
    if (!cell?.value) return '';

    const cellHasFunction = cell?.value.startsWith('=');

    const parsedValue = parseTextToHTML(String(cell?.value));

    return cellHasFunction ? parsedValue : cell?.value;
  }, [cell?.value]);

  const onBlur: FocusEventHandler<HTMLInputElement> = () => {
    setFocusedCellInputRef(null);
    setFocusedCellCoords(null);
    setFunctionMode(false);
    setFunctionBarIsFocused(false);

    recomputeSheet();
  };

  const onFocus = () => {
    if (!cell) throw new Error('Cell not found');

    setFocusedCellCoords({ x: cell.x, y: cell.y });
    setFunctionBarIsFocused(true);
    setFocusedCellInputRef(inputRef);

    const isFunction = cell.value.startsWith('=');

    if (isFunction) {
      setFunctionMode(isFunction);

      const caret = new CaretPosition(inputRef.current);
      caret.set(cell.value.length, 5);
    }
  };

  const showFunctionQuestionMark = isFunctionMode && functionBarIsFocused;

  const selectedRange = useMemo(() => {
    if (!selectedCellsCoords.length) return '';

    const firstCellCoords = selectedCellsCoords[0];
    const multipleCellsSelected = selectedCellsCoords.length > 1;

    if (!multipleCellsSelected) {
      return getCellId(firstCellCoords);
    }

    const lastCellCoords = selectedCellsCoords[selectedCellsCoords.length - 1];

    return `${getCellId(firstCellCoords)}:${getCellId(lastCellCoords)}`;
  }, [selectedCellsCoords]);

  return (
    <section className="bg-white flex py-0.5">
      <div className="select-none px-6 border-r-2">
        <span className="text-gray-700 text-sm">{selectedRange}</span>
      </div>

      <div className="relative flex flex-1 px-2 items-center gap-2">
        <div
          className={clsx(
            'flex items-center justify-center absolute p-1 left-[-10px] bg-blue-500',
            showFunctionQuestionMark ? 'flex' : 'hidden'
          )}
        >
          <span className="text-white text-sm">?</span>
        </div>

        <Icon icon="material-symbols-light:function" />

        <div
          contentEditable
          onBlur={onBlur}
          ref={inputRef}
          onFocus={onFocus}
          className="flex-1 border-none outline-none text-gray-800 text-sm"
          dangerouslySetInnerHTML={{ __html: html }}
          onInput={onChange}
        />
      </div>
    </section>
  );
};
