export interface ICell extends Coords {
  computedValue?: string;
  value: string;
}

export type Coords = {
  x: number;
  y: number;
};

export type FilledCells = Record<string, ICell>;

export type ISheet = {
  cells: FilledCells;
  rows: number;
  cols: number;
};

export type ICellSpecial = {
  coord: number;
  name: string;
};

export type CellFound = {
  id: string;
  y: number;
  x: number;
  value: string;
};

export type CellRef = {
  start: number;
  end: number;
  ref: string;
};

export type ParseExpressionReturn = {
  cells: ICell[];
  refs: CellRef[];
  parsedExp: string;
};

export type FunctionModeCell = {
  coords: Coords;
  color: string;
};

export type UpdateCellData = { coords: Coords; newValue: string };

export type Direction = 'left' | 'up' | 'down' | 'right';

export type CellStyle = {
  width?: number;
  height?: number;
};

export type VisibleCells = {
  startRow: number;
  endRow: number;
  startCol: number;
  endCol: number;
};

export type VisibleRow = {
  row: ICell[];
  index: number;
};
