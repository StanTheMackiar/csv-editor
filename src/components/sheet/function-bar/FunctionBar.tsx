'use client';

import ContentEditable, {
  ContentEditableEvent,
} from '@/components/core/input/ContentEditable';
import { getCell, getCellId, parseTextToHTML } from '@/helpers';
import { useSheetStore } from '@/stores/useSheetStore';
import { Icon } from '@iconify/react/dist/iconify.js';
import clsx from 'clsx';
import { FC, useCallback, useMemo } from 'react';
import { useShallow } from 'zustand/shallow';

export const FunctionBar: FC = () => {
  const [
    remarkedCellCoords,
    sheet,
    updateCells,
    functionBarIsFocused,
    setFunctionMode,
    isFunctionMode,
    selectedCellsCoords,
  ] = useSheetStore(
    useShallow((state) => [
      state.remarkedCellCoords,
      state.sheet,
      state.updateCells,
      state.functionBarIsFocused,
      state.setFunctionMode,
      state.functionMode,
      state.selectedCellsCoords,
    ])
  );

  const cell = useMemo(
    () => getCell(remarkedCellCoords, sheet),
    [remarkedCellCoords, sheet]
  );

  const onChange = useCallback(
    (e: ContentEditableEvent) => {
      if (!cell) throw new Error('Cell not found');

      const text = (e.currentTarget.textContent as string) ?? '';

      const newIsFunctionMode = text.startsWith('=');
      if (isFunctionMode !== newIsFunctionMode) {
        setFunctionMode(newIsFunctionMode);
      }

      updateCells(
        [
          {
            coords: cell,
            newValue: text,
          },
        ],
        false
      );
    },
    [cell, isFunctionMode, setFunctionMode, updateCells]
  );

  const html = useMemo<string>(() => {
    if (!cell?.value) return '';

    const cellHasFunction = cell?.value.startsWith('=');

    const parsedValue = parseTextToHTML(String(cell?.value));

    return cellHasFunction ? parsedValue : cell?.value;
  }, [cell?.value]);

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

  const cellId = getCellId(remarkedCellCoords);

  return (
    <section id={`${cellId}-cell`} className="bg-white flex py-0.5">
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

        <ContentEditable
          id={`${cellId}-functionbar`}
          className="flex-1 border-none outline-none text-gray-800 text-sm"
          html={html}
          onChange={onChange}
        />
      </div>
    </section>
  );
};
