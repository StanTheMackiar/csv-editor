/* eslint-disable @typescript-eslint/no-explicit-any */
import { RefObject } from 'react';
import {
  Coords,
  Direction,
  ICell,
  ICellSpecial,
  ISheet,
} from '../../types/sheet/cell/cell.types';

export const getCellKey = (coords: Coords): string => `${coords.x},${coords.y}`;

export const getCell = (coords: Coords, sheet: ISheet): ICell => {
  const emptyCell: ICell = {
    value: '',
    x: coords.x,
    y: coords.y,
  };

  if (!coordsInLimit(coords, sheet)) {
    return emptyCell;
  }

  const key = getCellKey(coords);
  // Si la celda no existe, retornamos una celda vacía con las coordenadas
  return sheet.cells[key] || emptyCell;
};

export const getCoordsById = (cellId: string): Coords | undefined => {
  // Validar el formato de la celda
  const match = cellId.match(/^([A-Z]+)(\d+)$/);

  if (!match) {
    console.error(
      'Invalid cell ID format. Must be in the format "LetterNumber" (e.g., A1, BA12).'
    );

    return;
  }

  const [, letter, number] = match;

  // Convertir letra a coordenada x y número a coordenada y
  const x = getXCoordFromLetter(letter);
  const y = getYCoordFromNumber(number);

  if (typeof y === 'undefined') {
    console.error(`Invalid coordinate for number ${number}`);
    return;
  }

  return {
    x, // Coordenada X basada en la letra
    y, // Coordenada Y basada en el número
  };
};

export const getYCoordFromNumber = (numberStr: string): number | undefined => {
  const numParsed = Number(numberStr.trim());

  if (isNaN(numParsed)) {
    console.error('Invalid number format. Must be a number.');
    return;
  }
  if (numParsed <= 0) {
    console.error('numberStr must be greater than 0');
    return;
  }

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

export const getLetterFromXCoord = (x: number): string | undefined => {
  if (x < 0) {
    console.error('x must be greater than 0');
    return;
  }

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

export const createSheet = (rows: number, cols: number): ISheet => ({
  cells: {},
  rows,
  cols,
});

export const getSpecialColumn = (
  startCol: number,
  endCol: number
): ICellSpecial[] => {
  const colsQty = endCol - startCol;

  return Array.from({ length: colsQty }, (_, i) => {
    const x = i + startCol;

    return {
      name: getLetterFromXCoord(x)!.toString(),
      coord: x,
    };
  });
};

export const getSpecialRow = (
  startRow: number,
  endRow: number
): ICellSpecial[] => {
  const rowsQty = endRow - startRow;

  return Array.from({ length: rowsQty }, (_, i) => {
    const y = i + startRow;

    return {
      name: getNumberFromYCoord(y).toString(),
      coord: y,
    };
  });
};

export const adjustSheetSize = (
  rows: number,
  cols: number,
  currentSheet: ISheet
): ISheet => {
  const newSheet: ISheet = {
    cells: { ...currentSheet.cells },
    rows,
    cols,
  };

  // Eliminar celdas que estén fuera de los nuevos límites
  Object.entries(newSheet.cells).forEach(([key, cell]) => {
    if (cell.x >= cols || cell.y >= rows) {
      delete newSheet.cells[key];
    }
  });

  return newSheet;
};

export const getCellFromEvent = (
  sheet: ISheet,
  e: Event
): ICell | undefined => {
  const target = e.target as HTMLDivElement;
  const [cellId] = target.id.split('-');

  const cell = getCellFromId(sheet, cellId);

  return cell;
};

export const getCellFromId = (
  sheet: ISheet,
  cellId?: string
): ICell | undefined => {
  if (!cellId) return;

  const coords = getCoordsById(cellId);

  if (!coords) {
    return;
  }

  const cell = getCell(coords, sheet);

  return cell;
};

export const getCellFromInputRef = (
  inputRef: RefObject<HTMLInputElement> | null,
  sheet: ISheet
): ICell | undefined => {
  if (!inputRef?.current) return;

  const [cellId] = inputRef?.current.id.split('-');
  if (!cellId) return;

  return getCellFromId(sheet, cellId);
};

export const getCoordsInRank = (
  start: string | Coords,
  end: string | Coords
): Coords[] => {
  const startCoords = typeof start === 'string' ? getCoordsById(start) : start;
  const endCoords = typeof end === 'string' ? getCoordsById(end) : end;

  if (!startCoords || !endCoords) return [];

  const startX = Math.min(startCoords.x, endCoords.x);
  const startY = Math.min(startCoords.y, endCoords.y);

  const endX = Math.max(startCoords.x, endCoords.x);
  const endY = Math.max(startCoords.y, endCoords.y);

  const coords: Coords[] = [];

  for (let y = startY; y <= endY; y++) {
    for (let x = startX; x <= endX; x++) {
      coords.push({ x, y });
    }
  }

  return coords;
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

export const getAllRows = (sheet: ISheet): ICell[][] => {
  const rows: ICell[][] = [];

  for (let y = 0; y < sheet.rows; y++) {
    const row: ICell[] = [];

    for (let x = 0; x < sheet.cols; x++) {
      const cell = getCell({ x, y }, sheet);
      row.push(cell!);
    }

    rows.push(row);
  }

  return rows;
};

export const coordsInLimit = ({ x, y }: Coords, sheet: ISheet): boolean => {
  return x >= 0 && x < sheet.cols && y >= 0 && y < sheet.rows;
};
