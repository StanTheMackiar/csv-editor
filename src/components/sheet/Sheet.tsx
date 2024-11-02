import { FC } from 'react';

import clsx from 'clsx';
import { Cell } from './cells/Cell';

import { useMouseEvents, usePressedKeys } from '@/hooks';
import s from './Sheet.module.css';
import { useSheet } from './useSheet';

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

  useMouseEvents();
  usePressedKeys();

  return (
    <table
      className={clsx(s.sheet, {
        'select-auto': !!focusedCellInputRef?.current,
      })}
    >
      <thead className={s['sheet-head']}>
        <tr className={s['sheet-row']}>
          <th className={s['sheet-header-cell']} onClick={onClickAll}></th>

          {sheetLetters.map((col) => (
            <th
              onClick={() => onClickColumn(col)}
              className={clsx({
                [s['sheet-header-cell']]: true,
                [s.selected]: getColIsSelected(col),
              })}
              key={col.name}
            >
              {col.name}
            </th>
          ))}
        </tr>
      </thead>

      <tbody>
        {sheet.map((row, i) => {
          const specialRow = sheetNumbers[i];

          return (
            <tr className={s['sheet-row']} key={specialRow.value}>
              <td
                onClick={() => onClickRow(specialRow)}
                className={clsx({
                  [s['sheet-header-cell']]: true,
                  [s.selected]: getRowIsSelected(specialRow),
                })}
              >
                {specialRow.name}
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
  );
};
