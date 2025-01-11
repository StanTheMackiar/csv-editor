import { FC } from 'react';

import clsx from 'clsx';
import { Cell } from './cells/Cell';

import {
  COLUMN_DEFAULT_WIDTH,
  COLUMN_MIN_WIDTH,
  ROW_DEFAULT_HEIGHT,
} from '@/helpers/constants/sheet-config.helper';
import s from './Sheet.module.css';
import { useSheet } from './useSheet';
import { useSheetRedimension } from './useSheetRedimension';

export const Sheet: FC = () => {
  const {
    focusedCellInputRef,
    sheet,
    sheetLetters,
    sheetNumbers,

    getColIsSelected,
    getRowIsSelected,
    onClickAll,
    onClickColumn,
    onClickRow,
    saveSheetFromCell,
  } = useSheet();

  const { columnWidths, rowHeights, resizeColumnWidth, resizeRowHeight } =
    useSheetRedimension();

  return (
    <div className={s['table-container']}>
      <table
        className={clsx(s.sheet, {
          'select-auto': !!focusedCellInputRef?.current,
        })}
      >
        <thead className={s['sheet-head']}>
          <tr className={s['sheet-row']}>
            <th
              className={clsx(s['sheet-header-cell'])}
              onClick={onClickAll}
            ></th>

            {sheetLetters.map((col) => (
              <th
                onClick={() => onClickColumn(col)}
                className={clsx({
                  [s['sheet-header-cell']]: true,
                  [s.selected]: getColIsSelected(col),
                })}
                style={{
                  width: `${columnWidths[col.name] || COLUMN_DEFAULT_WIDTH}px`,
                  minWidth: `${COLUMN_MIN_WIDTH}px`,
                  height: `${ROW_DEFAULT_HEIGHT}px`,
                }}
                key={col.name}
              >
                {col.name}

                <div
                  className={s['column-resizer']}
                  onMouseDown={(e) => resizeColumnWidth(col.name, e)}
                />
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {sheet.map((row, i) => {
            const rowNumber = sheetNumbers[i];

            return (
              <tr className={s['sheet-row']} key={rowNumber.value}>
                <td
                  onClick={() => onClickRow(rowNumber)}
                  className={clsx({
                    [s['sheet-header-cell']]: true,
                    [s.selected]: getRowIsSelected(rowNumber),
                  })}
                  style={{
                    height: `${rowHeights[rowNumber.name] || ROW_DEFAULT_HEIGHT}px`,
                  }}
                >
                  {rowNumber.name}

                  <div
                    className={s['row-resizer']}
                    onMouseDown={(e) => resizeRowHeight(rowNumber.name, e)}
                  />
                </td>

                {row.map((cell) => {
                  return (
                    <Cell
                      key={cell.id}
                      cell={cell}
                      saveChanges={saveSheetFromCell}
                    />
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
