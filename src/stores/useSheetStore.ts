import { LocalStorageEnum } from '@/enum/local-storage.enum';
import { computeCell } from '@/helpers';
import {
  INITIAL_COLS_QTY,
  INITIAL_REMARKED_CELL_COORDS,
  INITIAL_ROWS_QTY,
} from '@/helpers/constants/sheet-config.helper';
import { RefObject } from 'react';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
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
  ISheet,
} from '../types/sheet/cell/cell.types';

type ClipboardAction = 'copy' | 'cut';
export type UpdateCellData = { coords: Coords; newValue: string };
export type Direction = 'left' | 'up' | 'down' | 'right';
export type CellStyle = {
  width?: number;
  height?: number;
};

interface State {
  name: string;
  colsQty: number;
  isSelecting: boolean;
  isSelectingFunctionMode: boolean;
  rowsQty: number;
  remarkedCellCoords: Coords;
  remarkedCellInputRef: RefObject<HTMLDivElement> | null;
  focusedCellCoords: Coords | null;
  focusedCellInputRef: RefObject<HTMLDivElement> | null;
  functionMode: boolean;
  selectedCellsCoords: Coords[];
  latestSelectedCellCoords: Coords | null;
  functionModeCellsCoords: FunctionModeCell[];
  clipboardCellsCoords: Coords[];
  clipboardAction: ClipboardAction;
  sheet: ISheet;
  functionBarIsFocused: boolean;
  cellsStyles: Record<string, CellStyle | undefined>;
  columnsStyles: Record<string, CellStyle | undefined>;
  rowsStyles: Record<string, CellStyle | undefined>;
}

interface Actions {
  addCellsToSelection: (coords: Coords) => void;
  cleanSelectedCellsContent: VoidFunction;
  exportSheet: () => string;
  importSheet: (json: string) => void;
  moveLatestSelectedCell: (direction: Direction) => void;
  moveRemarkedCell: (direction: Direction) => void;
  newSheet: (name: string, rowsQty?: number, colsQty?: number) => void;
  recomputeSheet: () => void;
  selectCells: (startCellCoords: Coords, endCellCoords: Coords) => void;
  setClipboardAction: (action: ClipboardAction) => void;
  setClipboardCellsCoords: (coords: Coords[]) => void;
  setFocusedCellCoords: (coords: Coords | null) => void;
  setFocusedCellInputRef: (value: RefObject<HTMLDivElement> | null) => void;
  setFunctionBarIsFocused: (value: boolean) => void;
  setFunctionMode: (value: boolean) => void;
  setFunctionModeCellsCoords: (coords: FunctionModeCell[]) => void;
  setIsSelecting: (value: boolean) => void;
  setIsSelectingFunctionMode: (value: boolean) => void;
  setLatestSelectedCellCoords: (coords: Coords | null) => void;
  setName: (name: string) => void;
  setRemarkedCellCoords: (coords: Coords) => void;
  setRemarkedCellInputRef: (value: RefObject<HTMLDivElement> | null) => void;
  setSelectedCellsCoords: (coords: Coords[]) => void;
  unmarkSelectedCells: VoidFunction;
  updateCells: (data: UpdateCellData[], recompute?: boolean) => void;
  setColumnsStyles: (columnName: string, style: CellStyle) => void;
  setRowsStyles: (rowName: string, style: CellStyle) => void;
}

export const defaultState: State = {
  clipboardAction: 'copy',
  clipboardCellsCoords: [],
  colsQty: INITIAL_COLS_QTY,
  focusedCellCoords: null,
  focusedCellInputRef: null,
  functionBarIsFocused: false,
  functionMode: false,
  functionModeCellsCoords: [],
  isSelecting: false,
  isSelectingFunctionMode: false,
  latestSelectedCellCoords: null,
  name: 'My Sheet',
  remarkedCellCoords: INITIAL_REMARKED_CELL_COORDS,
  remarkedCellInputRef: null,
  rowsQty: INITIAL_ROWS_QTY,
  selectedCellsCoords: [INITIAL_REMARKED_CELL_COORDS],
  sheet: createSheet(INITIAL_ROWS_QTY, INITIAL_COLS_QTY),
  cellsStyles: {},
  columnsStyles: {},
  rowsStyles: {},
};

export const useSheetStore = create(
  persist<State & Actions>(
    (set, get) => ({
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

            if (!targetCell) return;

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
            if (!remarkedCellCoords) {
              const coords: Coords = { x: 0, y: 0 };

              return {
                remarkedCellCoords: coords,
                selectedCellsCoords: [coords],
                latestSelectedCellCoords: coords,
              };
            }

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

          if (!targetCellCoords) return {};

          const newLatestSelectedCellCoords = getCoordsByDirection(
            direction,
            targetCellCoords
          );

          const newLatestSelectedCellId = getCellId(
            newLatestSelectedCellCoords
          );

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

      setClipboardCellsCoords: (coords) =>
        set({ clipboardCellsCoords: coords }),

      setClipboardAction: (action) => set({ clipboardAction: action }),

      exportSheet: () => {
        const { colsQty, rowsQty, name, sheet, columnsStyles, rowsStyles } =
          get();

        return JSON.stringify({
          colsQty,
          name,
          rowsQty,
          sheet,
          rowsStyles,
          columnsStyles,
        });
      },

      importSheet: (json: string) => {
        const parsedState = JSON.parse(json);
        set(parsedState); // Reemplaza el estado actual con el importado
      },

      setName: (name) => set({ name }),

      newSheet: (
        name,
        rowsQty = INITIAL_ROWS_QTY,
        colsQty = INITIAL_COLS_QTY
      ) =>
        set({
          ...defaultState,
          name,
          rowsQty,
          colsQty,
          sheet: createSheet(rowsQty, colsQty),
        }),

      setFunctionBarIsFocused: (value) => set({ functionBarIsFocused: value }),

      setColumnsStyles: (name, styles) =>
        set((state) => {
          return {
            columnsStyles: {
              ...state.columnsStyles,
              [name]: {
                ...state.columnsStyles[name],
                ...styles,
              },
            },
          };
        }),

      setRowsStyles: (name, styles) =>
        set((state) => {
          return {
            rowsStyles: {
              ...state.rowsStyles,
              [name]: {
                ...state.rowsStyles[name],
                ...styles,
              },
            },
          };
        }),
    }),
    {
      name: LocalStorageEnum.SHEET,
      partialize: (state) =>
        ({
          ...defaultState,
          name: state.name,
          colsQty: state.colsQty,
          rowsQty: state.rowsQty,
          sheet: state.sheet,
          columnsStyles: state.columnsStyles,
          rowsStyles: state.rowsStyles,
        }) as State & Actions, // Guardar solo una parte del estado
    }
  )
);
