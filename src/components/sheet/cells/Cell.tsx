import ContentEditable from '@/components/core/input/ContentEditable';
import clsx from 'clsx';
import { FC } from 'react';
import { ICell } from '../../../types/sheet/cell/cell.types';
import s from '../Sheet.module.css';
import { useCell } from './useCell';

export interface CellProps {
  cell: ICell;
  saveChanges: (cell: ICell, value: string) => void;
}

export const Cell: FC<CellProps> = (props) => {
  const { cell } = props;

  const {
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
      id={`${cell.id}-cell`}
      className={clsx(s['sheet-cell'])}
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
