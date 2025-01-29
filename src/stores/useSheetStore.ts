import KeyEnum from '@/enum/key.enum';
import { LocalStorageEnum } from '@/enum/local-storage.enum';
import { computeCell, getFocusedCellElement } from '@/helpers';
import {
  INITIAL_COLS_QTY,
  INITIAL_REMARKED_CELL_COORDS,
  INITIAL_ROWS_QTY,
} from '@/helpers/constants/sheet-config.helper';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  coordsInLimit,
  createSheet,
  getCell,
  getCellId,
  getCellKey,
  getCoordsByDirection,
  getCoordsById,
  getCoordsInRank,
} from '../helpers/sheet/sheet.helper';
import {
  CellStyle,
  Coords,
  Direction,
  FunctionModeCell,
  ICell,
  ISheet,
  UpdateCellData,
} from '../types/sheet/cell/cell.types';

type ClipboardAction = 'copy' | 'cut';

interface SheetState {
  cellsStyles: Record<string, CellStyle | undefined>;
  clipboardAction: ClipboardAction;
  clipboardCellsCoords: Coords[];
  columnsStyles: Record<string, CellStyle | undefined>;
  focusedCellCoords: Coords | null;
  functionBarIsFocused: boolean;
  functionMode: boolean;
  functionModeCellsCoords: FunctionModeCell[];
  isSelecting: boolean;
  isSelectingFunctionMode: boolean;
  latestSelectedCellCoords: Coords | null;
  name: string;
  pressedKeys: KeyEnum[];
  remarkedCellCoords: Coords;
  rowsStyles: Record<string, CellStyle | undefined>;
  selectedCellsCoords: Coords[];
  sheet: ISheet;
}

interface SheetActions {
  addPressedKey: (key: KeyEnum) => void;
  cleanPressedKeys: VoidFunction;
  cleanSelectedCellsContent: VoidFunction;
  exportSheet: () => string;
  importSheet: (json: string) => void;
  moveLatestSelectedCell: (direction: Direction) => void;
  moveRemarkedCell: (direction: Direction) => void;
  newSheet: (name: string, rowsQty?: number, colsQty?: number) => void;
  recomputeSheet: VoidFunction;
  removePressedKey: (key: KeyEnum) => void;
  selectCells: (startCellCoords: Coords, endCellCoords: Coords) => void;
  setClipboardAction: (action: ClipboardAction) => void;
  setClipboardCellsCoords: (coords: Coords[]) => void;
  setColumnsStyles: (columnName: string, style: CellStyle) => void;
  setFocusedCellCoords: (coords: Coords | null) => void;
  setFunctionBarIsFocused: (value: boolean) => void;
  setFunctionMode: (value: boolean) => void;
  setFunctionModeCellsCoords: (coords: FunctionModeCell[]) => void;
  setIsSelecting: (value: boolean) => void;
  setIsSelectingFunctionMode: (value: boolean) => void;
  setName: (name: string) => void;
  setRemarkedCellCoords: (coords: Coords) => void;
  setRowsStyles: (rowName: string, style: CellStyle) => void;
  setSelectedCellsCoords: (coords: Coords[]) => void;
  updateCells: (data: UpdateCellData[], recompute?: boolean) => void;
}

export const defaultState: SheetState = {
  cellsStyles: {},
  clipboardAction: 'copy',
  clipboardCellsCoords: [],
  columnsStyles: {},
  focusedCellCoords: null,
  functionBarIsFocused: false,
  functionMode: false,
  functionModeCellsCoords: [],
  isSelecting: false,
  isSelectingFunctionMode: false,
  latestSelectedCellCoords: null,
  name: 'New sheet',
  pressedKeys: [],
  remarkedCellCoords: INITIAL_REMARKED_CELL_COORDS,
  rowsStyles: {},
  selectedCellsCoords: [INITIAL_REMARKED_CELL_COORDS],
  sheet: createSheet(INITIAL_ROWS_QTY, INITIAL_COLS_QTY),
};

export const useSheetStore = create(
  persist<SheetState & SheetActions>(
    (set, get) => ({
      ...defaultState,

      setFunctionMode: (value) => set({ functionMode: value }),

      setIsSelectingFunctionMode: (value) =>
        set({ isSelectingFunctionMode: value }),

      setFunctionModeCellsCoords: (cells) =>
        set({ functionModeCellsCoords: cells }),

      recomputeSheet: () =>
        set(({ sheet }) => {
          const newCells: Record<string, ICell> = {};

          for (const [key, cell] of Object.entries(sheet.cells)) {
            newCells[key] = computeCell(cell, sheet);
          }

          return {
            sheet: {
              ...sheet,
              cells: newCells,
            },
          };
        }),

      updateCells: (updatedCells, recompute = true) =>
        set(({ sheet }) => {
          const newCells = { ...sheet.cells };

          updatedCells.forEach(({ coords, newValue }) => {
            const key = getCellKey(coords);

            if (newValue === '') {
              // Si el valor está vacío, eliminamos la celda
              delete newCells[key];
            } else {
              const currentCell = getCell(coords, sheet);
              if (!currentCell) return;

              newCells[key] = recompute
                ? computeCell(currentCell, sheet, newValue)
                : { ...currentCell, value: newValue };
            }
          });

          return {
            sheet: {
              ...sheet,
              cells: newCells,
            },
          };
        }),

      moveRemarkedCell: (direction) =>
        set(({ remarkedCellCoords, sheet }) => {
          const newRemarkedCell = getCoordsByDirection(
            direction,
            remarkedCellCoords
          );

          // Verificar que la nueva posición está dentro de los límites
          if (coordsInLimit(newRemarkedCell, sheet)) {
            const focusedCellElement = getFocusedCellElement();
            focusedCellElement?.blur();

            return {
              remarkedCellElement: null,
              remarkedCellCoords: newRemarkedCell,
              selectedCellsCoords: [newRemarkedCell],
              latestSelectedCellCoords: newRemarkedCell,
            };
          }

          return {};
        }),

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
        const { sheet, name, columnsStyles, rowsStyles } = get();
        return JSON.stringify({
          name,
          sheet,
          columnsStyles,
          rowsStyles,
        });
      },

      importSheet: (json: string) => {
        const parsedState = JSON.parse(json);
        set(parsedState); // Reemplaza el estado actual con el importado
      },

      setName: (name) => set({ name }),

      newSheet: (name, rows = INITIAL_ROWS_QTY, cols = INITIAL_COLS_QTY) =>
        set({
          ...defaultState,
          name,
          sheet: createSheet(rows, cols),
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

      addPressedKey: (key) =>
        set(({ pressedKeys }) => {
          if (pressedKeys.includes(key)) return {};

          return {
            pressedKeys: [...pressedKeys, key],
          };
        }),

      removePressedKey: (key) =>
        set(({ pressedKeys }) => {
          return {
            pressedKeys: pressedKeys.filter((stateKey) => stateKey !== key),
          };
        }),

      cleanPressedKeys: () => set({ pressedKeys: [] }),
    }),
    {
      name: LocalStorageEnum.SHEET,
      partialize: (state) =>
        ({
          name: state.name,
          sheet: state.sheet,
          columnsStyles: state.columnsStyles,
          rowsStyles: state.rowsStyles,
        }) as SheetState & SheetActions, // Guardar solo una parte del estado
    }
  )
);
