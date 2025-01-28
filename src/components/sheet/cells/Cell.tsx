'use client';
import ContentEditable, {
  ContentEditableEvent,
} from '@/components/core/input/ContentEditable';
import clsx from 'clsx';
import {
  FC,
  FocusEventHandler,
  memo,
  MouseEventHandler,
  useCallback,
} from 'react';
import { ICell } from '../../../types/sheet/cell/cell.types';
import s from '../Sheet.module.css';
import { useCell } from './useCell';

export interface CellProps {
  cell: ICell;

  onBlur: VoidFunction;
  onChange: (e: ContentEditableEvent, cell: ICell, focused: boolean) => void;
  onDoubleClick: (ref: HTMLDivElement | null) => void;
  onFocus: (cell: ICell, ref: HTMLDivElement | null) => void;
}

export const Cell: FC<CellProps> = memo(
  ({ cell, onBlur, onChange, onDoubleClick, onFocus }) => {
    const {
      cellId,
      cellIsOnClipboard,
      functionModeCell,
      functionBarIsFocused,
      html,
      inputFocused,
      inputRef,
      isFunctionMode,
      isRemarked,
      isShadowed,
    } = useCell(cell);

    const showFunctionQuestionMark = isFunctionMode && !functionBarIsFocused;

    const onDoubleClickProxy = useCallback<MouseEventHandler>(() => {
      onDoubleClick(inputRef.current);
    }, [inputRef, onDoubleClick]);

    const onBlurProxy = useCallback<FocusEventHandler<HTMLDivElement>>(() => {
      onBlur();
    }, [onBlur]);

    const onFocusProxy = useCallback<FocusEventHandler<HTMLDivElement>>(() => {
      onFocus(cell, inputRef.current);
    }, [cell, inputRef, onFocus]);

    const onChangeProxy = useCallback<(event: ContentEditableEvent) => void>(
      (e) => {
        onChange(e, cell, inputFocused);
      },
      [cell, inputFocused, onChange]
    );

    return (
      <td
        // onClick={onClick}
        onDoubleClick={onDoubleClickProxy}
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
          onBlur={onBlurProxy}
          onFocus={onFocusProxy}
          innerRef={inputRef}
          id={`${cellId}-cellinput`}
          disabled={functionBarIsFocused}
          onChange={onChangeProxy}
          className={clsx(s['sheet-input'], {
            [s['cell-shadow']]: isShadowed,
            [s['cell-marked']]: isRemarked,
            [s['cell-function-mode']]: isFunctionMode,
            'pointer-events-none': !inputFocused,
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
  }
);

Cell.displayName = 'Cell';
