import {
  COLUMN_DEFAULT_WIDTH,
  getCell,
  getSpecialColumn,
  getSpecialRow,
  IS_DEV,
  ROW_DEFAULT_HEIGHT,
} from '@/helpers';
import { useSheetStore } from '@/stores/useSheetStore';
import { ICell, VisibleRange } from '@/types/sheet/cell/cell.types';
import {
  RefObject,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useShallow } from 'zustand/shallow';
import { DebugInfoProps } from '../debug/DebugPanel';

export const useSheetVirtualized = (sheetRef: RefObject<HTMLDivElement>) => {
  const sheet = useSheetStore((state) => state.sheet);

  const lastScrollTime = useRef(0);
  const scrollTimeout = useRef<NodeJS.Timeout>();
  const isScrolling = useRef(false);

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

  const calculateTotalDimensions = useCallback(() => {
    const heightCustom =
      Object.keys(rowsStyles).reduce((acc, key) => {
        const rowCustomHeight = rowsStyles?.[key]?.height ?? 0;

        const heightDiff = rowCustomHeight - ROW_DEFAULT_HEIGHT;

        return acc + heightDiff;
      }, 0) + LAYOUT_EXTRA;

    const widthCustom =
      Object.keys(columnsStyles).reduce((acc, key) => {
        const columnCustomWidth = columnsStyles?.[key]?.width ?? 0;

        const widthDiff = columnCustomWidth - COLUMN_DEFAULT_WIDTH;

        return acc + widthDiff;
      }, 0) + LAYOUT_EXTRA;

    const totalHeight = sheet.rows * ROW_DEFAULT_HEIGHT + heightCustom;
    const totalWidth = sheet.cols * COLUMN_DEFAULT_WIDTH + widthCustom;

    return { totalHeight, totalWidth };
  }, [columnsStyles, rowsStyles, sheet.rows, sheet.cols]);

  const updateViewportDimensions = useCallback(() => {
    if (!sheetRef.current) return;

    const { clientWidth, clientHeight } = sheetRef.current;

    const { totalHeight, totalWidth } = calculateTotalDimensions();

    setViewState((prev) => ({
      ...prev,
      viewportWidth: clientWidth,
      viewportHeight: clientHeight,
      totalHeight: Math.max(totalHeight, clientHeight),
      totalWidth: Math.max(totalWidth, clientWidth),
    }));
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

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const currentTime = Date.now();
    const target = e.currentTarget;

    if (currentTime - lastScrollTime.current >= SCROLL_THROTTLE) {
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
    }
  }, []);

  const visibleRange = useMemo<VisibleRange>(() => {
    const { scrollLeft, viewportWidth, scrollTop, viewportHeight } = viewState;
    const rowHeight = ROW_DEFAULT_HEIGHT;
    const columnWidth = COLUMN_DEFAULT_WIDTH;

    const startRow = Math.max(0, Math.floor(scrollTop / rowHeight));
    const endRow = Math.min(
      sheet.rows,
      Math.ceil((scrollTop + viewportHeight) / rowHeight)
    );

    const startCol = Math.max(0, Math.floor(scrollLeft / columnWidth));
    const endCol = Math.min(
      sheet.cols,
      Math.ceil((scrollLeft + viewportWidth) / columnWidth)
    );

    const specialColumn = getSpecialColumn(startCol, endCol);
    const specialRow = getSpecialRow(startRow, endRow);

    return {
      startRow,
      endRow,
      startCol,
      endCol,
      specialColumn,
      specialRow,
    };
  }, [viewState, sheet.rows, sheet.cols]);

  const visibleRows = useMemo<ICell[][]>(() => {
    const rows: ICell[][] = [];

    for (let y = visibleRange.startRow; y < visibleRange.endRow; y++) {
      const row: ICell[] = [];

      for (let x = visibleRange.startCol; x < visibleRange.endCol; x++) {
        const cell = getCell({ x, y }, sheet);

        row.push(cell);
      }
      rows.push(row);
    }

    return rows;
  }, [
    visibleRange.startRow,
    visibleRange.endRow,
    visibleRange.startCol,
    visibleRange.endCol,
    sheet,
  ]);

  const debugInfo = useMemo<DebugInfoProps | null>(() => {
    if (!IS_DEV) return null;

    const totalRows = sheet.rows;
    const totalColumns = sheet.cols;
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
    };
  }, [
    sheet.rows,
    sheet.cols,
    visibleRange.endRow,
    visibleRange.startRow,
    visibleRange.endCol,
    visibleRange.startCol,
  ]);

  return {
    debugInfo,
    viewState,
    specialRow: visibleRange.specialRow,
    specialColumn: visibleRange.specialColumn,
    visibleRows,

    handleScroll,
  };
};

const SCROLL_THROTTLE = 16; // Aproximadamente 60fps
const LAYOUT_EXTRA = 100;
