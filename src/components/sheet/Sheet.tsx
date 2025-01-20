'use client';
import { getCellKey } from '@/helpers';
import {
  COLUMN_DEFAULT_WIDTH,
  COLUMN_MIN_WIDTH,
  ROW_DEFAULT_HEIGHT,
  ROW_MIN_HEIGHT,
} from '@/helpers/constants/sheet-config.helper';
import { useMouseEvents, usePressedKeys } from '@/hooks';
import { ContextMenuItem } from '@/types/sheet/menu/context-menu.type';
import clsx from 'clsx';
import { FC } from 'react';
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
  const {
    focusedCellInputRef,
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

  const { onBlurCell, onChangeCell, onDoubleClickCell, onFocusCell } =
    useHandleCellEvents();

  const {
    debugInfo,
    visibleRange,
    viewState,
    visibleRows,

    handleScroll,
  } = useSheetVirtualized({
    sheetLetters,
    sheetNumbers,
    sheetRef,
  });

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
        className="w-full bg-slate-100 overflow-auto relative max-h-[100vh]"
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
          style={{
            transform: `
              translateY(${visibleRange.startRow * ROW_DEFAULT_HEIGHT}px) 
              translateX(${visibleRange.startCol * COLUMN_DEFAULT_WIDTH}px)`,
          }}
        >
          <table
            className={clsx(s['sheet-table'], {
              'select-auto': !!focusedCellInputRef,
            })}
          >
            <thead className={s['sheet-head']}>
              <tr className={s['sheet-row']}>
                <th className={s['sheet-header-cell']} onClick={onClickAll} />

                {sheetLetters
                  .slice(visibleRange.startCol, visibleRange.endCol)
                  .map((col) => {
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
              {visibleRows.map(({ row, index }) => {
                const rowNumber = sheetNumbers[index];

                const rowHeight =
                  rowsStyles[rowNumber.name]?.height || ROW_DEFAULT_HEIGHT;

                return (
                  <tr
                    key={rowNumber.coord}
                    style={{
                      height: `${rowHeight}px`,
                      lineHeight: `${rowHeight}px`,
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
                        height: `${rowHeight}px`,
                      }}
                    >
                      {rowNumber.name}
                      <div
                        className={s['row-resizer']}
                        onMouseDown={(e) => resizeRowHeight(rowNumber.name, e)}
                      />
                    </td>

                    {row.map((cell) => (
                      <Cell
                        onBlur={onBlurCell}
                        onChange={onChangeCell}
                        onDoubleClick={onDoubleClickCell}
                        onFocus={onFocusCell}
                        key={getCellKey(cell)}
                        cell={cell}
                      />
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
