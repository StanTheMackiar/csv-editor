/* eslint-disable @typescript-eslint/no-explicit-any */
import { RefObject } from 'react';
import { Direction } from '../../stores/useSheetStore';
import { ICell, ICellSpecial, ISheet } from '../../types/sheet/cell/cell.types';
import { alphabet } from '../constants/alphabet';

export const getCellHeart = (positionX: number, positionY: number) => {
  const letter = alphabet[positionX];
  const number = positionY + 1;

  return {
    id: `${letter}${number}`,
    letter,
    number,
    positionY,
    positionX,
  };
};

export const getSheet = (rowsQty: number, colsQty: number): ISheet =>
  Array.from({ length: rowsQty }, (_, positionY) =>
    Array.from({ length: colsQty }, (_, positionX) => {
      return {
        ...getCellHeart(positionX, positionY),
        value: ``,
        computedValue: ``,
        stateValue: ``,
        setState: () => {},
      };
    })
  );

export const getSheetLetters = (colsQty: number): ICellSpecial[] => {
  return Array.from({ length: colsQty }, (_, i) => ({
    name: alphabet[i],
    value: i,
  }));
};

export const getSheetNumbers = (rowsQty: number): ICellSpecial[] => {
  return Array.from({ length: rowsQty }, (_, i) => ({
    name: String(i + 1),
    value: i,
  }));
};

export const adjustSheetSize = (
  rows: number,
  cols: number,
  currentSheet: ISheet
): ISheet => {
  // Genera una nueva hoja completa
  const newSheet = getSheet(rows, cols);

  // Sobrescribe las celdas de la nueva hoja con las celdas existentes en currentSheet, si las hay
  for (let rowIndex = 0; rowIndex < rows; rowIndex++) {
    for (let colIndex = 0; colIndex < cols; colIndex++) {
      if (currentSheet[rowIndex]?.[colIndex]) {
        newSheet[rowIndex][colIndex] = currentSheet[rowIndex][colIndex];
      }
    }
  }

  return newSheet;
};

export const getCellFromMouseEvent = (e: any, sheet: ISheet): ICell | null => {
  const [cellId] = e?.target?.id?.split('-');

  if (!cellId) return null;

  const cell = sheet.flat().find((cell) => cell.id === cellId) ?? null;

  return cell;
};

export const getCellFromInputRef = (
  inputRef: RefObject<HTMLInputElement> | null,
  sheet: ISheet
): ICell | null => {
  if (!inputRef?.current) return null;

  const [cellId] = inputRef?.current.id.split('-');

  if (!cellId) return null;

  const cell = sheet.flat().find((cell) => cell.id === cellId) ?? null;

  return cell;
};

export const extractCells = (start: string, end: string, sheet: ISheet) => {
  const startCol = start.match(/[A-Z]+/g)?.[0] ?? '';
  const startRow = start.match(/\d+/g)?.[0] ?? '';

  const endCol = end.match(/[A-Z]+/g)?.[0] ?? '';
  const endRow = end.match(/\d+/g)?.[0] ?? '';

  const startCellX = startCol.charCodeAt(0) - 'A'.charCodeAt(0);
  const startCellY = parseInt(startRow, 10) - 1;

  const endCellX = endCol.charCodeAt(0) - 'A'.charCodeAt(0);
  const endCellY = parseInt(endRow, 10) - 1;

  const startX = Math.min(startCellX, endCellX);
  const startY = Math.min(startCellY, endCellY);

  const endX = Math.max(startCellX, endCellX);
  const endY = Math.max(startCellY, endCellY);

  const cells: ICell[] = [];

  for (let y = startY; y <= endY; y++) {
    for (let x = startX; x <= endX; x++) {
      const cell = sheet[y]?.[x];
      if (cell) cells.push(cell);
    }
  }

  return cells;
};

export const getCellByDirection = (
  dir: Direction,
  cell: ICell,
  sheet: ISheet
): ICell | undefined => {
  const coordsMap: Record<Direction, { x: number; y: number }> = {
    up: {
      x: cell.positionX,
      y: cell.positionY - 1,
    },
    down: {
      x: cell.positionX,
      y: cell.positionY + 1,
    },
    right: {
      x: cell.positionX + 1,
      y: cell.positionY,
    },
    left: {
      x: cell.positionX - 1,
      y: cell.positionY,
    },
  };
  const coords = coordsMap[dir];
  const positionX = Math.max(coords.x, 0);
  const positionY = Math.max(coords.y, 0);

  const newCell = sheet[positionY][positionX];

  return newCell;
};
