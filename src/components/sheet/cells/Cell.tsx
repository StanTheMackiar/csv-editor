'use client';

import ContentEditable from '@/components/core/input/ContentEditable';
import { getCellId, parseTextToHTML } from '@/helpers';
import clsx from 'clsx';
import { FC } from 'react';
import { ICell } from '../../../types/sheet/cell/cell.types';
import s from '../Sheet.module.css';
import { useCell } from './useCell';

export interface CellProps {
  cell: ICell;
}

export const Cell: FC<CellProps> = ({ cell }) => {
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

    handleBlur,
    onChange,
    onDoubleClick,
    onFocus,
  } = useCell({ cell });

  const showFunctionQuestionMark = isFunctionMode && !functionBarIsFocused;

  const onClick = () => {
    // eslint-disable-next-line no-console
    console.log({
      ...cell,
      id: getCellId(cell),
      valueHtml: parseTextToHTML(cell.value),
    });
  };

  return (
    <td
      onClick={onClick}
      onDoubleClick={onDoubleClick}
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
        onBlur={handleBlur}
        onFocus={onFocus}
        innerRef={inputRef}
        id={`${cellId}-cellinput`}
        disabled={functionBarIsFocused}
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
