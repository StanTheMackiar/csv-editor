import {
  INITIAL_COLS_QTY,
  INITIAL_ROWS_QTY,
} from '@/helpers/constants/sheet-config.helper';
import { RefObject } from 'react';
import { create } from 'zustand';
import KeyEnum from '../enum/key.enum';
import { computeCell } from '../helpers/sheet/cell/cell.helper';
import {
  adjustSheetSize,
  createSheet,
  extractCells,
  getCellByDirection,
} from '../helpers/sheet/sheet.helper';
import {
  CellCoords,
  FunctionModeCell,
  ICell,
} from '../types/sheet/cell/cell.types';

export type UpdateCellData = { coords: CellCoords; newValue: string };
export type Direction = 'left' | 'up' | 'down' | 'right';
interface State {
  colsQty: number;
  isSelecting: boolean;
  isSelectingFunctionMode: boolean;
  rowsQty: number;
  remarkedCell: CellCoords | null;
  remarkedCellInputRef: RefObject<HTMLDivElement> | null;
  focusedCell: CellCoords | null;
  focusedCellInputRef: RefObject<HTMLDivElement> | null;
  functionMode: boolean;
  selectedCells: CellCoords[];
  latestSelectedCell: CellCoords | null;
  functionModeCells: FunctionModeCell[];
  sheet: ICell[][];
  pressedKeys: KeyEnum[];
}

interface Actions {
  addCellsToSelection: (cell: CellCoords) => void;
  addPressedKey: (key: KeyEnum) => void;
  moveRemarkedCell: (direction: Direction) => void;
  removePressedKey: (key: KeyEnum) => void;
  setFocusedCell: (cell: CellCoords | null) => void;
  setFocusedCellInputRef: (value: RefObject<HTMLDivElement> | null) => void;
  setRemarkedCellInputRef: (value: RefObject<HTMLDivElement> | null) => void;
  setIsSelecting: (value: boolean) => void;
  setRemarkedCell: (cell: CellCoords | null) => void;
  setPressedKeys: (keys: KeyEnum[]) => void;
  setSelectedCells: (cells: CellCoords[]) => void;
  setFunctionModeCells: (cells: FunctionModeCell[]) => void;
  setIsSelectingFunctionMode: (value: boolean) => void;
  moveLatestSelectedCell: (direction: Direction) => void;
  recomputeSheet: () => void;
  getCell: (cell: CellCoords) => ICell | undefined;
  setFunctionMode: (value: boolean) => void;
  setLatestSelectedCell: (cell: CellCoords | null) => void;
  selectCells: (startCell: CellCoords, endCell: CellCoords) => void;
  unmarkSelectedCells: VoidFunction;
  updateCells: (data: UpdateCellData[], recompute?: boolean) => void;
  setSheet: (
    state: Partial<Pick<State, 'colsQty' | 'rowsQty' | 'sheet'>>
  ) => void;
}

export const defaultState: State = {
  colsQty: INITIAL_COLS_QTY,
  rowsQty: INITIAL_ROWS_QTY,
  focusedCellInputRef: null,
  functionMode: false,
  functionModeCells: [],
  isSelecting: false,
  isSelectingFunctionMode: false,
  latestSelectedCell: null,
  pressedKeys: [],
  focusedCell: null,
  remarkedCell: null,
  remarkedCellInputRef: null,
  selectedCells: [],
  sheet: createSheet(INITIAL_ROWS_QTY, INITIAL_COLS_QTY),
};

export const useSheetStore = create<State & Actions>((set, get) => ({
  ...defaultState,

  addPressedKey: (key) =>
    set(({ pressedKeys }) => ({
      pressedKeys: [...new Set([...pressedKeys, key])],
    })),

  removePressedKey: (key) =>
    set(({ pressedKeys }) => ({
      pressedKeys: pressedKeys.filter((stateKey) => stateKey !== key),
    })),

  setFunctionMode: (value) => set({ functionMode: value }),

  setLatestSelectedCell: (cell) => set({ latestSelectedCell: cell }),

  setFocusedCellInputRef: (value) => set({ focusedCellInputRef: value }),

  setRemarkedCellInputRef: (value) => set({ remarkedCellInputRef: value }),

  setIsSelectingFunctionMode: (value) =>
    set({ isSelectingFunctionMode: value }),

  setPressedKeys: (pressedKeys) => set({ pressedKeys }),

  setFunctionModeCells: (cells) => set({ functionModeCells: cells }),

  recomputeSheet: () =>
    set(({ sheet }) => {
      const newSheet = sheet.map((row) =>
        row.map((cell) => {
          const newCell = computeCell(cell, sheet);

          return newCell;
        })
      );

      return { sheet: newSheet };
    }),

  updateCells: (updatedCells, recompute = true) =>
    set(({ sheet, getCell }) => {
      const newSheet = sheet.slice();

      updatedCells.forEach(({ coords, newValue }) => {
        const targetCell = getCell(coords);
        if (!targetCell) return {};

        newSheet[coords.y][coords.x] = recompute
          ? computeCell(targetCell, sheet, newValue)
          : { ...targetCell, value: newValue, computedValue: newValue };
      });

      return {
        sheet: newSheet,
      };
    }),

  moveRemarkedCell: (direction) =>
    set(
      ({ remarkedCell, sheet, remarkedCellInputRef, focusedCellInputRef }) => {
        if (!remarkedCell) return { remarkedCell };

        const newRemarkedCell = getCellByDirection(
          direction,
          remarkedCell,
          sheet
        );

        if (!newRemarkedCell) return { remarkedCell };

        focusedCellInputRef?.current?.blur();
        remarkedCellInputRef?.current?.blur();

        return {
          remarkedCell: newRemarkedCell,
          selectedCells: [newRemarkedCell],
        };
      }
    ),

  selectCells: (startCellCoords, currentCellCoords) =>
    set(({ sheet }) => {
      const startCell = sheet[startCellCoords.y][startCellCoords.x];
      const currentCell = sheet[currentCellCoords.y][currentCellCoords.x];

      const newSelectedCells = extractCells(
        startCell.id,
        currentCell.id,
        sheet
      );

      return {
        selectedCells: newSelectedCells,
      };
    }),

  moveLatestSelectedCell: (direction) =>
    set(
      ({
        latestSelectedCell: latestSelectedCellCoords,
        remarkedCell: remarkedCellCoords,
        sheet,
      }) => {
        if (!remarkedCellCoords) return {};

        const startCell = sheet?.[remarkedCellCoords.y]?.[remarkedCellCoords.x];

        const targetCell = latestSelectedCellCoords
          ? sheet?.[latestSelectedCellCoords.y]?.[latestSelectedCellCoords.x]
          : startCell;

        if (!targetCell || !startCell) return {};

        const newLatestSelectedCellCoords = getCellByDirection(
          direction,
          {
            x: targetCell.x,
            y: targetCell.y,
          },
          sheet
        );

        const newLatestSelectedCell = newLatestSelectedCellCoords
          ? sheet?.[newLatestSelectedCellCoords.y]?.[
              newLatestSelectedCellCoords.x
            ]
          : undefined;

        if (!newLatestSelectedCell) return {};

        const newSelectedCells = extractCells(
          startCell.id,
          newLatestSelectedCell.id,
          sheet
        );

        return {
          latestSelectedCell: newLatestSelectedCellCoords,
          selectedCells: newSelectedCells,
        };
      }
    ),

  unmarkSelectedCells: () => set({ selectedCells: [] }),

  setIsSelecting: (value) => set({ isSelecting: value }),

  setRemarkedCell: (cell) => set({ remarkedCell: cell }),

  setFocusedCell: (cell) => set({ focusedCell: cell }),

  setSelectedCells: (cells) => set({ selectedCells: [...new Set(cells)] }),

  addCellsToSelection: (newCell) =>
    set((state) => {
      const newSelectedCells = [...state.selectedCells, newCell];

      return { selectedCells: [...new Set(newSelectedCells)] };
    }),

  setSheet: (newState) =>
    set((currentState) => {
      // Verificar si hay cambios en las propiedades
      const shouldUpdateRowsQty = newState.rowsQty !== undefined;
      const shouldUpdateColsQty = newState.colsQty !== undefined;
      const shouldUpdateSheet = newState.sheet !== undefined;

      if (!shouldUpdateRowsQty && !shouldUpdateColsQty && !shouldUpdateSheet) {
        return currentState; // No hacer nada si no hay cambios
      }

      const updatedRowsQty = shouldUpdateRowsQty
        ? newState.rowsQty!
        : currentState.rowsQty;

      const updatedColsQty = shouldUpdateColsQty
        ? newState.colsQty!
        : currentState.colsQty;

      const updatedSheet = shouldUpdateSheet
        ? adjustSheetSize(updatedRowsQty, updatedColsQty, newState.sheet!)
        : shouldUpdateRowsQty || shouldUpdateColsQty
          ? adjustSheetSize(updatedRowsQty, updatedColsQty, currentState.sheet)
          : currentState.sheet;

      return {
        ...(shouldUpdateColsQty && { colsQty: updatedColsQty }),
        ...(shouldUpdateRowsQty && { rowsQty: updatedRowsQty }),
        ...(updatedSheet && { sheet: updatedSheet }),
      };
    }),

  getCell: (cell) => {
    const { sheet } = get();
    if (
      cell.y < 0 ||
      cell.y >= sheet.length ||
      cell.x < 0 ||
      cell.x >= sheet[cell.y]?.length
    ) {
      return undefined; // Índices fuera de los límites
    }
    return sheet[cell.y][cell.x];
  },
}));
