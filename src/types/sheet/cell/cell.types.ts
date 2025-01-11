export interface ICell {
  positionY: number;
  id: string;
  letter: string;
  number: number;
  positionX: number;
  value: string;
  computedValue: string;
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
  cellId: string;
  setValue: (value: string) => void;
};

export type CellCoords = {
  x: number;
  y: number;
};

export type FunctionModeCell = {
  id: string;
  color: string;
};
