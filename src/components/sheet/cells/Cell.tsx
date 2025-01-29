'use client';
import ContentEditable, {
  ContentEditableEvent,
} from '@/components/core/input/ContentEditable';
import clsx from 'clsx';
import { FC, useCallback } from 'react';
import { ICell } from '../../../types/sheet/cell/cell.types';
import s from '../Sheet.module.css';
import { useCell } from './useCell';

export interface CellProps {
  cell: ICell;

  onChange: (e: ContentEditableEvent, cell: ICell, focused: boolean) => void;
}

export const Cell: FC<CellProps> = ({ cell, onChange }) => {
  const {
    cellId,
    cellIsOnClipboard,
    functionModeCell,
    functionBarIsFocused,
    html,
    inputFocused,
    isFunctionMode,
    isRemarked,
    isShadowed,
  } = useCell(cell);

  const showFunctionQuestionMark = isFunctionMode && !functionBarIsFocused;

  const onChangeProxy = useCallback<(event: ContentEditableEvent) => void>(
    (e) => {
      onChange(e, cell, inputFocused);
    },
    [cell, inputFocused, onChange]
  );

  return (
    <td
      // onClick={onClick}
      id={`${cellId}-cell`}
      className={clsx(s['sheet-cell'])}
    >
      <div
        className={clsx(
          'flex items-center z-10 justify-center absolute p-1 bg-blue-500 left-[-20px] translate-y-[-50%]',
          showFunctionQuestionMark ? 'flex' : 'hidden'
        )}
      >
        <span className="text-white text-sm">?</span>
      </div>

      <ContentEditable
        cursorAtEndOnFocus
        plainValue={cell.value}
        id={`${cellId}-cellremarked`}
        disabled={functionBarIsFocused}
        onChange={onChangeProxy}
        className={clsx({
          [s['sheet-input']]: true,
          [s['cell-shadow']]: isShadowed,
          [s['cell-marked']]: isRemarked,
          'pointer-events-none': !inputFocused,
          'cell-remarked': isRemarked,
          'cell-focused': inputFocused,
          cell: true,
        })}
        style={{
          ...(functionModeCell && {
            outline: functionModeCell
              ? `2px ${functionModeCell.color} dashed`
              : undefined,
            backgroundColor: `${functionModeCell.color}05`,
          }),
          ...(cellIsOnClipboard && {
            outline: '2px #3d45b4 dashed',
          }),
        }}
        html={html}
      />
    </td>
  );
};
