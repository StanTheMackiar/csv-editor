import {
  INITIAL_COLS_QTY,
  INITIAL_ROWS_QTY,
} from '@/helpers/constants/sheet-config.helper';
import { RefObject } from 'react';
import { create } from 'zustand';
import { computeCell } from '../helpers/sheet/cell/cell.helper';
import {
  createSheet,
  getCell,
  getCellId,
  getCoordsByDirection,
  getCoordsById,
  getCoordsInRank,
} from '../helpers/sheet/sheet.helper';
import {
  Coords,
  FunctionModeCell,
  ICell,
} from '../types/sheet/cell/cell.types';

type ClipboardAction = 'copy' | 'cut';
export type UpdateCellData = { coords: Coords; newValue: string };
export type Direction = 'left' | 'up' | 'down' | 'right';
interface State {
  colsQty: number;
  isSelecting: boolean;
  isSelectingFunctionMode: boolean;
  rowsQty: number;
  remarkedCellCoords: Coords | null;
  remarkedCellInputRef: RefObject<HTMLDivElement> | null;
  focusedCellCoords: Coords | null;
  focusedCellInputRef: RefObject<HTMLDivElement> | null;
  functionMode: boolean;
  selectedCellsCoords: Coords[];
  latestSelectedCellCoords: Coords | null;
  functionModeCellsCoords: FunctionModeCell[];
  clipboardCellsCoords: Coords[];
  clipboardAction: ClipboardAction;
  sheet: ICell[][];
}

interface Actions {
  addCellsToSelection: (coords: Coords) => void;
  moveRemarkedCell: (direction: Direction) => void;
  setFocusedCellCoords: (coords: Coords | null) => void;
  setFocusedCellInputRef: (value: RefObject<HTMLDivElement> | null) => void;
  setRemarkedCellInputRef: (value: RefObject<HTMLDivElement> | null) => void;
  setIsSelecting: (value: boolean) => void;
  setRemarkedCellCoords: (coords: Coords | null) => void;
  setSelectedCellsCoords: (coords: Coords[]) => void;
  setFunctionModeCellsCoords: (coords: FunctionModeCell[]) => void;
  setIsSelectingFunctionMode: (value: boolean) => void;
  moveLatestSelectedCell: (direction: Direction) => void;
  recomputeSheet: () => void;
  setFunctionMode: (value: boolean) => void;
  setLatestSelectedCellCoords: (coords: Coords | null) => void;
  selectCells: (startCellCoords: Coords, endCellCoords: Coords) => void;
  unmarkSelectedCells: VoidFunction;
  updateCells: (data: UpdateCellData[], recompute?: boolean) => void;
  cleanSelectedCellsContent: VoidFunction;
  setClipboardAction: (action: ClipboardAction) => void;
  setClipboardCellsCoords: (coords: Coords[]) => void;
}

export const defaultState: State = {
  colsQty: INITIAL_COLS_QTY,
  rowsQty: INITIAL_ROWS_QTY,
  focusedCellInputRef: null,
  functionMode: false,
  functionModeCellsCoords: [],
  isSelecting: false,
  isSelectingFunctionMode: false,
  latestSelectedCellCoords: null,
  focusedCellCoords: null,
  remarkedCellCoords: null,
  remarkedCellInputRef: null,
  selectedCellsCoords: [],
  sheet: createSheet(INITIAL_ROWS_QTY, INITIAL_COLS_QTY),
  clipboardCellsCoords: [],
  clipboardAction: 'copy',
};

export const useSheetStore = create<State & Actions>((set, get) => ({
  ...defaultState,

  setFunctionMode: (value) => set({ functionMode: value }),

  setLatestSelectedCellCoords: (cell) =>
    set({ latestSelectedCellCoords: cell }),

  setFocusedCellInputRef: (value) => set({ focusedCellInputRef: value }),

  setRemarkedCellInputRef: (value) => set({ remarkedCellInputRef: value }),

  setIsSelectingFunctionMode: (value) =>
    set({ isSelectingFunctionMode: value }),

  setFunctionModeCellsCoords: (cells) =>
    set({ functionModeCellsCoords: cells }),

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
    set(({ sheet }) => {
      const newSheet = sheet.slice();

      updatedCells.forEach(({ coords, newValue }) => {
        const targetCell = getCell(coords, sheet);

        newSheet[coords.y][coords.x] = recompute
          ? computeCell(targetCell, sheet, newValue)
          : { ...targetCell, value: newValue };
      });

      return {
        sheet: newSheet,
      };
    }),

  moveRemarkedCell: (direction) =>
    set(
      ({
        remarkedCellCoords,
        remarkedCellInputRef,
        focusedCellInputRef,
        sheet,
      }) => {
        if (!remarkedCellCoords) return {};

        const newRemarkedCell = getCoordsByDirection(
          direction,
          remarkedCellCoords
        );

        try {
          getCell(newRemarkedCell, sheet);

          focusedCellInputRef?.current?.blur();
          remarkedCellInputRef?.current?.blur();

          return {
            remarkedCellCoords: newRemarkedCell,
            selectedCellsCoords: [newRemarkedCell],
            latestSelectedCellCoords: newRemarkedCell,
          };
        } catch (err) {
          console.error(err);

          return {};
        }
      }
    ),

  selectCells: (startCellCoords, currentCellCoords) =>
    set(() => {
      const newSelectedCells = getCoordsInRank(
        startCellCoords,
        currentCellCoords
      );

      return {
        selectedCellsCoords: newSelectedCells,
        latestSelectedCellCoords: currentCellCoords,
      };
    }),

  moveLatestSelectedCell: (direction) =>
    set(({ latestSelectedCellCoords, remarkedCellCoords }) => {
      if (!remarkedCellCoords) return {};

      const startCellId = getCellId(remarkedCellCoords);

      const targetCellId = latestSelectedCellCoords
        ? getCellId(latestSelectedCellCoords)
        : startCellId;

      const targetCellCoords = getCoordsById(targetCellId);

      const newLatestSelectedCellCoords = getCoordsByDirection(
        direction,
        targetCellCoords
      );

      const newLatestSelectedCellId = getCellId(newLatestSelectedCellCoords);

      const newSelectedCells = getCoordsInRank(
        startCellId,
        newLatestSelectedCellId
      );

      return {
        selectedCellsCoords: newSelectedCells,
        latestSelectedCellCoords: newLatestSelectedCellCoords,
      };
    }),

  unmarkSelectedCells: () =>
    set({ selectedCellsCoords: [], latestSelectedCellCoords: null }),

  setIsSelecting: (value) => set({ isSelecting: value }),

  setRemarkedCellCoords: (cell) => set({ remarkedCellCoords: cell }),

  setFocusedCellCoords: (cell) => set({ focusedCellCoords: cell }),

  setSelectedCellsCoords: (coords) =>
    set(() => {
      const selectedCellsCoords = [...new Set(coords)];

      return {
        selectedCellsCoords,
        latestSelectedCellCoords:
          selectedCellsCoords[selectedCellsCoords.length - 1],
      };
    }),

  addCellsToSelection: (newCell) =>
    set((state) => {
      const selectedCellsCoords = [
        ...new Set([...state.selectedCellsCoords, newCell]),
      ];

      return { selectedCellsCoords, latestSelectedCellCoords: newCell };
    }),

  cleanSelectedCellsContent: () => {
    const { updateCells, selectedCellsCoords } = get();

    updateCells(
      selectedCellsCoords.map((coords) => ({ coords, newValue: '' }))
    );
  },

  setClipboardCellsCoords: (coords) => set({ clipboardCellsCoords: coords }),

  setClipboardAction: (action) => set({ clipboardAction: action }),
}));
