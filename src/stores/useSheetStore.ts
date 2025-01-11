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
  extractCells,
  getCellByDirection,
  getSheet,
} from '../helpers/sheet/sheet.helper';
import { FunctionModeCell, ICell } from '../types/sheet/cell/cell.types';

export type Direction = 'left' | 'up' | 'down' | 'right';
interface State {
  colsQty: number;
  isSelecting: boolean;
  isSelectingFunctionMode: boolean;
  rowsQty: number;
  remarkedCell: ICell | null;
  remarkedCellInputRef: RefObject<HTMLDivElement> | null;
  focusedCellInput: RefObject<HTMLDivElement> | null;
  functionMode: boolean;
  selectedCells: ICell[];
  latestSelectedCell: ICell | null;
  functionModeCells: FunctionModeCell[];
  sheet: ICell[][];
  pressedKeys: KeyEnum[];
}

interface Actions {
  addCellsToSelection: (cell: ICell) => void;
  addPressedKey: (key: KeyEnum) => void;
  moveRemarkedCell: (direction: Direction) => void;
  removePressedKey: (key: KeyEnum) => void;
  setFocusedCellInputRef: (value: RefObject<HTMLDivElement> | null) => void;
  setRemarkedCellInputRef: (value: RefObject<HTMLDivElement> | null) => void;
  setIsSelecting: (value: boolean) => void;
  setRemarkedCell: (cell: ICell | null) => void;
  setPressedKeys: (keys: KeyEnum[]) => void;
  setSelectedCells: (cells: ICell[]) => void;
  setFunctionModeCells: (cells: FunctionModeCell[]) => void;
  setIsSelectingFunctionMode: (value: boolean) => void;
  moveLatestSelectedCell: (direction: Direction) => void;
  recomputeSheet: () => void;
  setFunctionMode: (value: boolean) => void;
  setLatestSelectedCell: (cell: ICell | null) => void;
  selectCells: (startCell: string, endCell: string) => void;
  unmarkSelectedCells: VoidFunction;
  updateCells: (
    cells: (Partial<ICell> & {
      positionX: number;
      positionY: number;
    })[]
  ) => void;
  setSheet: (
    state: Partial<Pick<State, 'colsQty' | 'rowsQty' | 'sheet'>>
  ) => void;
}

export const defaultState: State = {
  colsQty: INITIAL_COLS_QTY,
  rowsQty: INITIAL_ROWS_QTY,
  focusedCellInput: null,
  functionMode: false,
  functionModeCells: [],
  isSelecting: false,
  isSelectingFunctionMode: false,
  latestSelectedCell: null,
  pressedKeys: [],
  remarkedCell: null,
  remarkedCellInputRef: null,
  selectedCells: [],
  sheet: getSheet(INITIAL_ROWS_QTY, INITIAL_COLS_QTY),
};

export const useSheetStore = create<State & Actions>((set) => ({
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

  setFocusedCellInputRef: (value) => set({ focusedCellInput: value }),

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

  updateCells: (updatedCells) =>
    set(({ sheet }) => {
      updatedCells.forEach((cell) => {
        const targetCell = sheet?.[cell.positionY]?.[cell.positionX];

        if (!targetCell) return {};

        sheet[cell.positionY][cell.positionX] = {
          ...targetCell,
          ...cell,
        };
      });

      return {
        sheet,
      };
    }),

  moveRemarkedCell: (direction) =>
    set(
      ({
        remarkedCell,
        sheet,
        remarkedCellInputRef,
        focusedCellInput: focusedCellInputRef,
      }) => {
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

  selectCells: (startCell, currentCell) =>
    set(({ sheet }) => {
      const newSelectedCells = extractCells(startCell, currentCell, sheet);

      return {
        selectedCells: newSelectedCells,
      };
    }),

  moveLatestSelectedCell: (direction) =>
    set(({ latestSelectedCell, remarkedCell, sheet }) => {
      if (!remarkedCell) return {};

      const startCell = remarkedCell;
      const targetCell = latestSelectedCell ?? startCell;

      if (!targetCell || !startCell) return {};

      const newLatestSelectedCell = getCellByDirection(
        direction,
        targetCell,
        sheet
      );

      if (!newLatestSelectedCell) return {};

      const newSelectedCells = extractCells(
        startCell.id,
        newLatestSelectedCell.id,
        sheet
      );

      return {
        latestSelectedCell: newLatestSelectedCell,
        selectedCells: newSelectedCells,
      };
    }),

  unmarkSelectedCells: () => set({ selectedCells: [] }),

  setIsSelecting: (value) => set({ isSelecting: value }),

  setRemarkedCell: (cell) => set({ remarkedCell: cell }),

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
}));
