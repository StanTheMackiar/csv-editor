'use client';
import {
  COLUMN_DEFAULT_WIDTH,
  COLUMN_MIN_WIDTH,
  ROW_DEFAULT_HEIGHT,
  ROW_MIN_HEIGHT,
} from '@/helpers/constants/sheet-config.helper';
import { useMouseEvents, usePressedKeys } from '@/hooks';
import { ContextMenuItem } from '@/types/sheet/menu/context-menu.type';
import clsx from 'clsx';
import { FC, useRef } from 'react';
import { SheetContextualMenu } from '../menu/contextual-menu/SheetContextualMenu';
import { Cell } from './cells/Cell';
import { DebugPanel } from './debug/DebugPanel';
import { useSheetVirtualized } from './hooks';
import { useHandleCellEvents } from './hooks/useHandleCellEvents';
import { useSheet } from './hooks/useSheet';
import { useSheetClipboard } from './hooks/useSheetClipboard';
import { useSheetRedimension } from './hooks/useSheetRedimension';
import s from './Sheet.module.css';

export const Sheet: FC = () => {
  const sheetRef = useRef<HTMLDivElement>(null);

  const {
    focusedCell,
    getColIsSelected,
    getRowIsSelected,
    onCleanCells,
    onClickAll,
    onClickColumn,
    onClickRow,
  } = useSheet();

  useMouseEvents();
  usePressedKeys();
  const { onChangeCell } = useHandleCellEvents();

  const { columnsStyles, rowsStyles, resizeColumnWidth, resizeRowHeight } =
    useSheetRedimension();

  const {
    menuPosition,
    onCopy,
    onCut,
    onPaste,
    openContextualMenu,
    setMenuPosition,
  } = useSheetClipboard();

  const {
    debugInfo,
    specialColumn,
    specialRow,
    viewState,
    visibleRows,

    handleScroll,
  } = useSheetVirtualized(sheetRef);

  const contextMenuItems: ContextMenuItem[] = [
    { icon: 'tdesign:cut', text: 'Cut', shortcut: 'Ctrl + X', onClick: onCut },
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
    <>
      {debugInfo && <DebugPanel {...debugInfo} />}

      <section
        onContextMenu={openContextualMenu}
        onClick={() => setMenuPosition(null)}
        ref={sheetRef}
        onScroll={handleScroll}
        className={clsx(
          'w-full  h-full bg-slate-100 overflow-auto relative max-h-[100vh]',
          s['sheet-container']
        )}
      >
        <div
          style={{
            width: viewState.totalWidth,
            height: viewState.totalHeight,
            position: 'absolute',
            top: 0,
            left: 0,
            pointerEvents: 'none', // Evita interferir con interacciones
          }}
        />

        <div
          className={clsx(
            'sticky top-0 left-0 w-full h-full',
            s['table-wrapper']
          )}
        >
          <table
            className={clsx(s['sheet-table'], {
              'select-auto': Boolean(focusedCell),
            })}
          >
            <thead className={s['sheet-head']}>
              <tr className={s['sheet-row']}>
                <th className={s['sheet-header-cell']} onClick={onClickAll} />

                {specialColumn.map((col) => {
                  const colWidth =
                    columnsStyles[col.name]?.width || COLUMN_DEFAULT_WIDTH;

                  return (
                    <th
                      onClick={() => onClickColumn(col)}
                      className={clsx({
                        [s['sheet-header-cell']]: true,
                        [s.selected]: getColIsSelected(col),
                      })}
                      style={{
                        width: `${colWidth}px`,
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
                  );
                })}
              </tr>
            </thead>

            <tbody>
              {visibleRows.map((row, i) => {
                const rowNumber = specialRow[i];

                const rowHeight =
                  rowsStyles?.[rowNumber?.name]?.height || ROW_DEFAULT_HEIGHT;

                return (
                  <tr
                    key={i}
                    style={{
                      height: `${rowHeight}px`,
                      lineHeight: `${rowHeight}px`,
                    }}
                  >
                    <td
                      onClick={() => onClickRow(rowNumber)}
                      className={clsx({
                        [s['sheet-header-cell']]: true,
                        [s.selected]: rowNumber && getRowIsSelected(rowNumber),
                      })}
                      style={{
                        minHeight: `${ROW_MIN_HEIGHT}px`,
                        height: `${rowHeight}px`,
                      }}
                    >
                      {rowNumber.name}
                      <div
                        className={s['row-resizer']}
                        onMouseDown={(e) => resizeRowHeight(rowNumber.name, e)}
                      />
                    </td>

                    {row.map((cell, i) => (
                      <Cell onChange={onChangeCell} key={i} cell={cell} />
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {menuPosition && (
          <SheetContextualMenu
            items={contextMenuItems}
            menuPosition={menuPosition}
          />
        )}
      </section>
    </>
  );
};
