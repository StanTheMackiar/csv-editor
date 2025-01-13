import {
  CellRef,
  Coords,
  ICell,
  ISheet,
  ParseExpressionReturn,
} from '../../../types/sheet/cell/cell.types';
import { CELL_REGEX, MATH_REGEX } from '../../constants/regex.constans';
import { getCell, getCoordsById } from '../sheet.helper';
import { isValidFuncExpression } from './is-valid-exp-helper';

export const parseExpression = (
  value: string,
  sheet: ISheet
): ParseExpressionReturn => {
  const coords: Coords[] = [];
  const refs: CellRef[] = [];

  const isFunction = value.startsWith('=');

  if (!isFunction) {
    return {
      coords,
      parsedExp: value,
      isFunction: false,
      refs,
    };
  }

  const finalValue = value
    .substring(1)
    .trim()
    //? Reemplazar los paréntesis que contienen rangos
    .replace(/\(([^)]+)\)/g, (match) => match.replace(/;/g, ','));

  const parsedExp = finalValue.replace(
    CELL_REGEX,
    (original, startCol, startRow, range, endCol, endRow, offset) => {
      if (!startCol || !startRow) {
        return original; // Devuelve el texto original si no es válido
      }

      if (range) {
        // Es un rango, por ejemplo: A1:A17
        const startId = `${startCol}${startRow}`;
        const endId = `${endCol}${endRow}`;

        const startCoords = getCoordsById(startId);
        const endCoords = getCoordsById(endId);

        const rangeRef = `${startId}:${endId}`;
        refs.push({
          start: offset + 1,
          end: offset + rangeRef.length + 1,
          ref: rangeRef,
        });

        const values: string[] = [];

        for (let y = startCoords.y; y <= endCoords.y; y++) {
          for (let x = startCoords.x; x <= endCoords.x; x++) {
            const cell = getCell({ x, y }, sheet);
            const computedValue = cell.computedValue || cell.value;

            coords.push({ y, x });

            const numberValue = Number(computedValue);
            const isString = isNaN(numberValue);

            values.push(isString ? `'${computedValue}'` : String(numberValue));
          }
        }

        return values.join(',');
      } else {
        const cellId = `${startCol}${startRow}`;
        const { x, y } = getCoordsById(cellId);

        refs.push({
          start: offset + 1,
          end: offset + cellId.length + 1,
          ref: cellId,
        });

        const cell = getCell({ x, y }, sheet);
        const computedValue = cell.computedValue || cell.value;

        coords.push({ y, x });

        const numberValue = Number(computedValue);
        const isString = isNaN(numberValue);

        return String(isString ? `'${computedValue}'` : numberValue);
      }
    }
  );

  return {
    coords,
    parsedExp,
    isFunction,
    refs,
  };
};

export const parseRange = (range: `${string}:${string}`) => {
  const [start, end] = range.split(':');
  return { start, end };
};

export const computeCell = (
  cell: ICell,
  sheet: ISheet,
  newValue?: string
): ICell => {
  const value = newValue ?? cell.value;
  const cellHasFunction = value.startsWith('=');

  if (!cellHasFunction) {
    return {
      x: cell.x,
      y: cell.y,
      value,
    };
  }

  let computedValue = value;

  try {
    const isValid = isValidFuncExpression(computedValue);

    if (!isValid) {
      const errorMsg = '#INVALID_EXPRESSION';

      throw new Error(errorMsg, {
        cause: errorMsg,
      });
    }

    const { parsedExp } = parseExpression(computedValue, sheet);
    const finalExp = String(eval(parsedExp));
    computedValue = finalExp;
  } catch (error) {
    console.error(error);
    computedValue = '#ERROR';

    if (error instanceof Error && error.cause) {
      computedValue = error.message;
    }
  }

  return {
    ...cell,
    value,
    computedValue,
  };
};

export const isMathExpression = (expression: string): boolean => {
  // Verificar si la expresión coincide con la expresión regular
  return MATH_REGEX.test(expression);
};
