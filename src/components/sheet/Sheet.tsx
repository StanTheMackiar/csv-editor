'use client';
import { IS_DEV } from '@/helpers';
import {
  COLUMN_DEFAULT_WIDTH,
  COLUMN_MIN_WIDTH,
  ROW_DEFAULT_HEIGHT,
  ROW_MIN_HEIGHT,
} from '@/helpers/constants/sheet-config.helper';
import { useMouseEvents, usePressedKeys } from '@/hooks';
import { useSheetStore } from '@/stores/useSheetStore';
import { ContextMenuItem } from '@/types/sheet/menu/context-menu.type';
import clsx from 'clsx';
import { FC, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useShallow } from 'zustand/shallow';
import { SheetContextualMenu } from '../menu/contextual-menu/SheetContextualMenu';
import { Cell } from './cells/Cell';
import { DebugInfoProps, DebugPanel } from './debug/DebugPanel';
import s from './Sheet.module.css';
import { useSheet } from './useSheet';
import { useSheetClipboard } from './useSheetClipboard';
import { useSheetRedimension } from './useSheetRedimension';

// Aumentamos el buffer para mayor suavidad
const DEFAULT_BUFFER_SIZE = {
  rows: 10, // Más filas de buffer
  columns: 10, // Buffer para columnas
};

const MAX_BUFFER_SIZE = {
  rows: 50,
  columns: 40,
};

// Throttle tiempo en ms
const SCROLL_THROTTLE = 16; // Aproximadamente 60fps
const SPEED_THRESHOLD = 30; // Umbral para considerar scroll rápido
const BUFFER_SCALE = 2; // Factor de escala para el buffer

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

  const { resizeColumnWidth, resizeRowHeight } = useSheetRedimension();

  const {
    menuPosition,
    onCopy,
    onCut,
    onPaste,
    openContextualMenu,
    setMenuPosition,
  } = useSheetClipboard();

  const lastScrollTime = useRef(0);
  const scrollTimeout = useRef<NodeJS.Timeout>();
  const isScrolling = useRef(false);
  const scrollSpeedTracker = useRef({
    lastX: 0,
    lastY: 0,
    lastTime: 0,
    speeds: [] as Array<{ x: number; y: number }>,
  });

  const [columnsStyles, rowsStyles] = useSheetStore(
    useShallow((state) => [state.columnsStyles, state.rowsStyles])
  );

  const [viewState, setViewState] = useState({
    scrollTop: 0,
    scrollLeft: 0,
    viewportWidth: 0,
    viewportHeight: 0,
    totalHeight: 0,
    totalWidth: 0,
  });

  // Ajustamos el buffer basado en la velocidad de scroll
  const [bufferSize, setBufferSize] = useState(DEFAULT_BUFFER_SIZE);

  const calculateAverageSpeed = (speeds: Array<{ x: number; y: number }>) => {
    if (speeds.length === 0) return { x: 0, y: 0 };

    const sum = speeds.reduce(
      (acc, speed) => ({
        x: acc.x + Math.abs(speed.x),
        y: acc.y + Math.abs(speed.y),
      }),
      { x: 0, y: 0 }
    );

    return {
      x: sum.x / speeds.length,
      y: sum.y / speeds.length,
    };
  };

  const updateBufferSize = useCallback(
    (currentSpeed: { x: number; y: number }) => {
      // Actualizar histórico de velocidades (últimas 5)
      scrollSpeedTracker.current.speeds.push(currentSpeed);
      if (scrollSpeedTracker.current.speeds.length > 5) {
        scrollSpeedTracker.current.speeds.shift();
      }

      // Calcular velocidad promedio
      const avgSpeed = calculateAverageSpeed(scrollSpeedTracker.current.speeds);

      const calculateBuffer = (
        speed: number,
        defaultSize: number,
        maxSize: number
      ) => {
        if (speed < SPEED_THRESHOLD) {
          return defaultSize;
        }

        const scaledBuffer = Math.min(
          defaultSize + Math.floor(speed / SPEED_THRESHOLD) * BUFFER_SCALE,
          maxSize
        );

        return scaledBuffer;
      };

      setBufferSize({
        rows: calculateBuffer(
          avgSpeed.y,
          DEFAULT_BUFFER_SIZE.rows,
          MAX_BUFFER_SIZE.rows
        ),
        columns: calculateBuffer(
          avgSpeed.x,
          DEFAULT_BUFFER_SIZE.columns,
          MAX_BUFFER_SIZE.columns
        ),
      });
    },
    []
  );

  const calculateTotalDimensions = useCallback(() => {
    const totalHeight = sheetNumbers.reduce(
      (total, row) =>
        total + (rowsStyles[row.name]?.height || ROW_DEFAULT_HEIGHT),
      0
    );

    const totalWidth = sheetLetters.reduce(
      (total, col) =>
        total + (columnsStyles[col.name]?.width || COLUMN_DEFAULT_WIDTH),
      0
    );
    return { totalHeight, totalWidth };
  }, [columnsStyles, rowsStyles, sheetLetters, sheetNumbers]);

  const updateViewportDimensions = useCallback(() => {
    if (sheetRef.current) {
      const { clientWidth, clientHeight } = sheetRef.current;
      const { totalHeight, totalWidth } = calculateTotalDimensions();

      // Aseguramos un tamaño mínimo basado en el viewport
      const minWidth = clientWidth;
      const minHeight = clientHeight;

      setViewState((prev) => ({
        ...prev,
        viewportWidth: clientWidth,
        viewportHeight: clientHeight,
        totalHeight: Math.max(totalHeight, minHeight),
        totalWidth: Math.max(totalWidth, minWidth),
      }));
    }
  }, [calculateTotalDimensions, sheetRef]);

  //? Observer para cambios de tamaño
  useEffect(() => {
    updateViewportDimensions();

    const observer = new ResizeObserver(updateViewportDimensions);
    if (sheetRef.current) {
      observer.observe(sheetRef.current);
    }

    return () => observer.disconnect();
  }, [sheetRef, updateViewportDimensions]);

  const visibleRange = useMemo(() => {
    const { scrollLeft, viewportWidth, scrollTop, viewportHeight } = viewState;
    const rowHeight = ROW_DEFAULT_HEIGHT;
    const columnWidth = COLUMN_DEFAULT_WIDTH;

    const startRow = Math.max(
      0,
      Math.floor(scrollTop / rowHeight) - bufferSize.rows
    );
    const endRow = Math.min(
      sheet.length,
      Math.ceil((scrollTop + viewportHeight) / rowHeight) + bufferSize.rows
    );

    const startCol = Math.max(
      0,
      Math.floor(scrollLeft / columnWidth) - bufferSize.columns
    );

    const endCol = Math.min(
      sheetLetters.length,
      Math.ceil((scrollLeft + viewportWidth) / columnWidth) + bufferSize.columns
    );

    return { startRow, endRow, startCol, endCol };
  }, [
    viewState,
    bufferSize.rows,
    bufferSize.columns,
    sheet.length,
    sheetLetters.length,
  ]);

  const handleScroll = useCallback(
    (e: React.UIEvent<HTMLDivElement>) => {
      const currentTime = Date.now();
      const target = e.currentTarget;

      if (currentTime - lastScrollTime.current >= SCROLL_THROTTLE) {
        const timeElapsed = currentTime - scrollSpeedTracker.current.lastTime;
        if (timeElapsed > 0) {
          // Evitar división por cero
          // Calcular velocidad instantánea
          const instantSpeed = {
            x:
              (Math.abs(target.scrollLeft - scrollSpeedTracker.current.lastX) /
                timeElapsed) *
              1000,
            y:
              (Math.abs(target.scrollTop - scrollSpeedTracker.current.lastY) /
                timeElapsed) *
              1000,
          };

          updateBufferSize(instantSpeed);
        }

        // Actualizar últimas posiciones y tiempo
        scrollSpeedTracker.current = {
          ...scrollSpeedTracker.current,
          lastX: target.scrollLeft,
          lastY: target.scrollTop,
          lastTime: currentTime,
        };

        lastScrollTime.current = currentTime;

        setViewState((prev) => ({
          ...prev,
          scrollTop: target.scrollTop,
          scrollLeft: target.scrollLeft,
        }));

        isScrolling.current = true;

        if (scrollTimeout.current) {
          clearTimeout(scrollTimeout.current);
        }

        scrollTimeout.current = setTimeout(() => {
          isScrolling.current = false;
          scrollSpeedTracker.current.speeds = []; // Limpiar histórico
          setBufferSize(DEFAULT_BUFFER_SIZE); // Resetear a valores por defecto
        }, 150);
      }
    },
    [updateBufferSize]
  );

  // Generar filas visibles
  const visibleRows = useMemo(() => {
    const rows = sheet
      .slice(visibleRange.startRow, visibleRange.endRow)
      .map((row, index) => ({
        row: row.slice(visibleRange.startCol, visibleRange.endCol),
        index: visibleRange.startRow + index,
      }));

    return rows;
  }, [sheet, visibleRange]);

  const debugInfo = useMemo<DebugInfoProps | null>(() => {
    if (!IS_DEV) return null;

    const totalRows = sheet.length;
    const totalColumns = sheetLetters.length;
    const renderedRows = visibleRange.endRow - visibleRange.startRow;
    const renderedColumns = visibleRange.endCol - visibleRange.startCol;

    return {
      totalRows,
      renderedRows,
      startRow: visibleRange.startRow,
      startCol: visibleRange.startCol,
      endCol: visibleRange.endCol,
      endRow: visibleRange.endRow,
      totalColumns,
      renderedColumns,
      totalCells: totalRows * totalColumns,
      renderedCells: renderedRows * renderedColumns,
      bufferSize,
    };
  }, [
    sheet.length,
    sheetLetters.length,
    visibleRange.endRow,
    visibleRange.startRow,
    visibleRange.endCol,
    visibleRange.startCol,
    bufferSize,
  ]);

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
              'select-auto': !!focusedCellInputRef?.current,
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
                      <Cell key={`${cell.x}${cell.y}`} cell={cell} />
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
