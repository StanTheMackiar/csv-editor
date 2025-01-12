export interface ICell {
  computedValue: string;
  id: string;
  value: string;
  x: number;
  y: number;
}

export type ICellSpecial = {
  value: number;
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
  isMathExp: boolean;
  cellsFound: CellFound[];
  refsFound: CellRef[];
  parsedExp: string;
  isFunction: boolean;
};

export type CellState = {
  value: string;
  x: number;
  y: number;
  id: string;
  setValue: (value: string) => void;
};

export type CellCoords = {
  x: number;
  y: number;
};

export type FunctionModeCell = {
  coords: CellCoords;
  color: string;
};
