import {
  COLUMN_DEFAULT_WIDTH,
  getCell,
  IS_DEV,
  ROW_DEFAULT_HEIGHT,
} from '@/helpers';
import { useSheetStore } from '@/stores/useSheetStore';
import {
  ICell,
  ICellSpecial,
  VisibleCells,
  VisibleRow,
} from '@/types/sheet/cell/cell.types';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useShallow } from 'zustand/shallow';
import { DebugInfoProps } from '../debug/DebugPanel';

interface Params {
  sheetRef: React.RefObject<HTMLDivElement>;
  sheetLetters: ICellSpecial[];
  sheetNumbers: ICellSpecial[];
}

export const useSheetVirtualized = ({
  sheetLetters,
  sheetNumbers,
  sheetRef,
}: Params) => {
  const sheet = useSheetStore((state) => state.sheet);

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

  const visibleRange = useMemo<VisibleCells>(() => {
    const { scrollLeft, viewportWidth, scrollTop, viewportHeight } = viewState;
    const rowHeight = ROW_DEFAULT_HEIGHT;
    const columnWidth = COLUMN_DEFAULT_WIDTH;

    const startRow = Math.max(
      0,
      Math.floor(scrollTop / rowHeight) - bufferSize.rows
    );
    const endRow = Math.min(
      sheet.rows,
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
    sheet.rows,
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

  const visibleRows = useMemo<VisibleRow[]>(() => {
    const rows: VisibleRow[] = [];

    for (let y = visibleRange.startRow; y < visibleRange.endRow; y++) {
      const row: ICell[] = [];

      for (let x = visibleRange.startCol; x < visibleRange.endCol; x++) {
        const cell = getCell({ x, y }, sheet);
        row.push(cell!);
      }
      rows.push({
        row,
        index: y,
      });
    }

    return rows;
  }, [sheet, visibleRange]);

  const debugInfo = useMemo<DebugInfoProps | null>(() => {
    if (!IS_DEV) return null;

    const totalRows = sheet.rows;
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
    sheet.rows,
    sheetLetters.length,
    visibleRange.endRow,
    visibleRange.startRow,
    visibleRange.endCol,
    visibleRange.startCol,
    bufferSize,
  ]);

  return {
    debugInfo,
    viewState,
    visibleRange,
    visibleRows,

    handleScroll,
  };
};

const DEFAULT_BUFFER_SIZE = {
  rows: 5, // Más filas de buffer
  columns: 5, // Buffer para columnas
};

const MAX_BUFFER_SIZE = {
  rows: 20,
  columns: 20,
};

const SCROLL_THROTTLE = 16; // Aproximadamente 60fps
const SPEED_THRESHOLD = 30; // Umbral para considerar scroll rápido
const BUFFER_SCALE = 1; // Factor de escala para el buffer
