'use client';

import ContentEditable from '@/components/core/input/ContentEditable';
import clsx from 'clsx';
import { FC } from 'react';
import { ICell } from '../../../types/sheet/cell/cell.types';
import s from '../Sheet.module.css';
import { useCell } from './useCell';

export interface CellProps {
  cell: ICell;
}

export const Cell: FC<CellProps> = (props) => {
  const {
    cellId,
    cellIsOnClipboard,
    functionModeCell,
    html,
    inputFocused,
    inputRef,
    isFunctionMode,
    isRemarked,
    isShadowed,

    handleBlur,
    onChange,
    onDoubleClick,
    onFocus,
  } = useCell(props);

  return (
    <td
      onDoubleClick={onDoubleClick}
      id={`${cellId}-cell`}
      className={clsx(s['sheet-cell'])}
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
        id={`${cellId}-cellinput`}
        onChange={onChange}
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
};
