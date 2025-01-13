export interface ICell {
  computedValue?: string;
  value: string;
  x: number;
  y: number;
}

export type ICellSpecial = {
  coord: number;
  name: string;
};

export type ISheet = ICell[][];

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
  coords: CellCoords[];
  refs: CellRef[];
  isFunction: boolean;
  parsedExp: string;
};

export type CellCoords = {
  x: number;
  y: number;
};

export type FunctionModeCell = {
  coords: CellCoords;
  color: string;
};
