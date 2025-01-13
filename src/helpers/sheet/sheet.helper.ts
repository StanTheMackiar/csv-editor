/* eslint-disable @typescript-eslint/no-explicit-any */
import { RefObject } from 'react';
import { Direction } from '../../stores/useSheetStore';
import {
  Coords,
  ICell,
  ICellSpecial,
  ISheet,
} from '../../types/sheet/cell/cell.types';

export const getCell = (coords: Coords, sheet: ISheet) => {
  if (
    coords.y < 0 ||
    coords.y >= sheet.length ||
    coords.x < 0 ||
    coords.x >= sheet[coords.y]?.length
  ) {
    throw new Error('Cell coordinates out of bounds');
  }

  return sheet[coords.y][coords.x];
};

export const getCoordsById = (
  cellId: string
): {
  x: number;
  y: number;
} => {
  // Validar el formato de la celda
  const match = cellId.match(/^([A-Z]+)(\d+)$/);

  if (!match) {
    throw new Error(
      'Invalid cell ID format. Must be in the format "LetterNumber" (e.g., A1, BA12).'
    );
  }

  const [, letter, number] = match;

  // Convertir letra a coordenada x y número a coordenada y
  const x = getXCoordFromLetter(letter);
  const y = getYCoordFromNumber(number);

  return {
    x, // Coordenada X basada en la letra
    y, // Coordenada Y basada en el número
  };
};

export const getYCoordFromNumber = (numberStr: string): number => {
  const numParsed = Number(numberStr.trim());
  if (isNaN(numParsed)) throw new Error('numberStr must be a number');
  if (numParsed <= 0) throw new Error('numberStr must be greater than 0');
  return numParsed - 1;
};

export const getXCoordFromLetter = (letter: string): number => {
  let x = 0;

  for (let i = 0; i < letter.length; i++) {
    const charCode = letter.charCodeAt(i) - 65; // 'A' es 65
    x = x * 26 + (charCode + 1); // Suma 1 porque 'A' debe ser 1, no 0
  }

  return x - 1; // Resta 1 porque las coordenadas comienzan desde 0
};

export const getNumberFromYCoord = (y: number): number => {
  return y + 1;
};

export const getLetterFromXCoord = (x: number): string => {
  if (x < 0) throw new Error('x must be greater than 0');

  let letter = '';
  let i = x;

  while (i >= 0) {
    letter = String.fromCharCode((i % 26) + 65) + letter;
    i = Math.floor(i / 26) - 1;
  }

  return letter;
};

export const getCellId = ({ x, y }: Coords) => {
  const letter = getLetterFromXCoord(x);
  const number = getNumberFromYCoord(y);

  return `${letter}${number}`;
};

export const createSheet = (rowsQty: number, colsQty: number): ISheet =>
  Array.from({ length: rowsQty }, (_, y) =>
    Array.from({ length: colsQty }, (_, x) => {
      return {
        value: ``,
        x,
        y,
      };
    })
  );

export const getSheetLetters = (colsQty: number): ICellSpecial[] => {
  return Array.from({ length: colsQty }, (_, x) => ({
    name: getLetterFromXCoord(x).toString(),
    coord: x,
  }));
};

export const getSheetNumbers = (rowsQty: number): ICellSpecial[] => {
  return Array.from({ length: rowsQty }, (_, y) => ({
    name: getNumberFromYCoord(y).toString(),
    coord: y,
  }));
};

export const adjustSheetSize = (
  rows: number,
  cols: number,
  currentSheet: ISheet
): ISheet => {
  // Genera una nueva hoja completa
  const newSheet = createSheet(rows, cols);

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

export const getCellFromMouseEvent = (sheet: ISheet, e: any): ICell | null => {
  const target = e.target as HTMLInputElement;
  const [cellId] = target.id.split('-');

  const cell = getCellFromId(sheet, cellId);

  return cell;
};

export const getCellFromId = (sheet: ISheet, cellId?: string): ICell | null => {
  if (!cellId) return null;

  const coords = getCoordsById(cellId);
  const cell = getCell(coords, sheet);

  return cell;
};

export const getCellFromInputRef = (
  inputRef: RefObject<HTMLInputElement> | null,
  sheet: ISheet
): ICell | null => {
  if (!inputRef?.current) return null;

  const [cellId] = inputRef?.current.id.split('-');
  if (!cellId) return null;

  return getCellFromId(sheet, cellId);
};

export const getCoordsInRank = (
  start: string | Coords,
  end: string | Coords
): Coords[] => {
  const startCoords = typeof start === 'string' ? getCoordsById(start) : start;
  const endCoords = typeof end === 'string' ? getCoordsById(end) : end;

  const startX = Math.min(startCoords.x, endCoords.x);
  const startY = Math.min(startCoords.y, endCoords.y);

  const endX = Math.max(startCoords.x, endCoords.x);
  const endY = Math.max(startCoords.y, endCoords.y);

  const cells: Coords[] = [];

  for (let y = startY; y <= endY; y++) {
    for (let x = startX; x <= endX; x++) {
      cells.push({ x, y });
    }
  }

  return cells;
};

export const getCoordsByDirection = (
  dir: Direction,
  coords: Coords
): Coords => {
  const coordsMap: Record<Direction, Coords> = {
    up: {
      x: coords.x,
      y: coords.y - 1,
    },
    down: {
      x: coords.x,
      y: coords.y + 1,
    },
    right: {
      x: coords.x + 1,
      y: coords.y,
    },
    left: {
      x: coords.x - 1,
      y: coords.y,
    },
  };
  const newCoords = coordsMap[dir];
  const positionX = Math.max(newCoords.x, 0);
  const positionY = Math.max(newCoords.y, 0);

  return {
    x: positionX,
    y: positionY,
  };
};
