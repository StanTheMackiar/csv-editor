import {
  CellRef,
  Coords,
  ICell,
  ISheet,
  ParseExpressionReturn,
} from '../../../types/sheet/cell/cell.types';
import {
  CELL_REGEX,
  MATH_REGEX,
  NUMBER_REGEX,
} from '../../constants/regex.constans';
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

            const isNumber = NUMBER_REGEX.test(computedValue);

            values.push(
              isNumber ? String(computedValue) : `"${computedValue}"`
            );
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

        const isNumber = NUMBER_REGEX.test(computedValue);

        return isNumber ? String(computedValue) : `"${computedValue}"`;
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
    const { errorMsg, valid } = isValidFuncExpression(computedValue);

    if (!valid) {
      throw new Error('', {
        cause: errorMsg,
      });
    }

    const { parsedExp } = parseExpression(computedValue, sheet);

    if (!parsedExp) {
      throw new Error('', {
        cause: '#EMPTY_EXPRESSION',
      });
    }

    const evalResult = eval(parsedExp);
    const allowedTypes = ['number', 'string'];

    if (!allowedTypes.includes(typeof evalResult)) {
      throw new Error('', {
        cause: '#INVALID_RESULT_TYPE',
      });
    }

    const finalExp = String(evalResult);

    computedValue = finalExp;
  } catch (error) {
    computedValue = '#ERROR';

    if (error instanceof Error && error.cause) {
      computedValue = error.cause as string;
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
