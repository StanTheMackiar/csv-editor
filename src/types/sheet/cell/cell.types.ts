export interface ICell extends Coords {
  computedValue?: string;
  value: string;
}

export type ISheet = ICell[][];

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

export type Coords = {
  x: number;
  y: number;
};

export type FunctionModeCell = {
  coords: Coords;
  color: string;
};
