'use client';
import { FC } from 'react';

import clsx from 'clsx';
import { Cell } from './cells/Cell';

import {
  COLUMN_DEFAULT_WIDTH,
  COLUMN_MIN_WIDTH,
  ROW_DEFAULT_HEIGHT,
  ROW_MIN_HEIGHT,
} from '@/helpers/constants/sheet-config.helper';
import { useMouseEvents, usePressedKeys } from '@/hooks';
import { ContextMenuItem } from '@/types/sheet/menu/context-menu.type';
import { SheetContextualMenu } from '../menu/contextual-menu/SheetContextualMenu';
import s from './Sheet.module.css';
import { useSheet } from './useSheet';
import { useSheetClipboard } from './useSheetClipboard';
import { useSheetRedimension } from './useSheetRedimension';

export const Sheet: FC = () => {
  const {
    focusedCellInputRef,
    sheet,
    sheetRef,
    sheetLetters,
    sheetNumbers,

    getColIsSelected,
    getRowIsSelected,
    onCleanCells,
    onClickAll,
    onClickColumn,
    onClickRow,
  } = useSheet();

  useMouseEvents(sheetRef);
  usePressedKeys();

  const { columnWidths, rowHeights, resizeColumnWidth, resizeRowHeight } =
    useSheetRedimension();

  const {
    menuPosition,

    onCopy,
    onCut,
    onPaste,
    openContextualMenu,
    setMenuPosition,
  } = useSheetClipboard();

  const contextMenuItems: ContextMenuItem[] = [
    {
      icon: 'tdesign:cut',
      text: 'Cut',
      shortcut: 'Ctrl + X',
      onClick: onCut,
    },
    {
      icon: 'tdesign:copy',
      text: 'Copy',
      shortcut: 'Ctrl + C',
      onClick: onCopy,
    },
    {
      icon: 'tdesign:paste',
      text: 'Paste',
      shortcut: 'Ctrl + V',
      onClick: onPaste,
    },
    {
      icon: 'tdesign:clear-formatting-1',
      text: 'Clean',
      shortcut: 'Del',
      onClick: onCleanCells,
    },
  ];

  return (
    <section
      onContextMenu={openContextualMenu}
      onClick={() => setMenuPosition(null)}
      ref={sheetRef}
      className="w-full bg-slate-100 overflow-auto relative max-h-[100vh]"
    >
      <table
        className={clsx(s.sheet, {
          'select-auto': !!focusedCellInputRef?.current,
        })}
      >
        <thead className={s['sheet-head']}>
          <tr className={s['sheet-row']}>
            <th className={clsx(s['sheet-header-cell'])} onClick={onClickAll} />

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
              <tr
                className={s['sheet-row']}
                key={rowNumber.coord}
                style={{
                  lineHeight: `${rowHeights[rowNumber.name] || ROW_DEFAULT_HEIGHT}px`,
                }}
              >
                <td
                  onClick={() => onClickRow(rowNumber)}
                  className={clsx({
                    [s['sheet-header-cell']]: true,
                    [s.selected]: getRowIsSelected(rowNumber),
                  })}
                  style={{
                    minHeight: `${ROW_MIN_HEIGHT}px`,
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
                  return <Cell key={`${cell.x}${cell.y}`} cell={cell} />;
                })}
              </tr>
            );
          })}
        </tbody>
      </table>

      {menuPosition && (
        <SheetContextualMenu
          items={contextMenuItems}
          menuPosition={menuPosition}
        />
      )}
    </section>
  );
};
