import {
  CellFound,
  CellRef,
  ICell,
  ISheet,
  ParseExpressionReturn,
} from '../../../types/sheet/cell/cell.types';
import { CELL_REGEX, MATH_REGEX } from '../../constants/regex.constans';
import { isValidExcelExpression } from './is-valid-exp-helper';

export const parseExpression = (
  value: string,
  sheet: ISheet
): ParseExpressionReturn => {
  const isMathExp = isMathExpression(value);

  const cellsFound: CellFound[] = [];
  const refsFound: CellRef[] = [];

  const parsed = value.replace(
    CELL_REGEX,
    (original, startCol, startRow, range, endCol, endRow, offset) => {
      if (!startCol || !startRow) {
        return original; // Devuelve el texto original si no es válido
      }

      if (range) {
        // Es un rango, por ejemplo: A1:A17
        const startX = startCol.charCodeAt(0) - 'A'.charCodeAt(0);
        const startY = parseInt(startRow, 10) - 1;
        const endX = endCol.charCodeAt(0) - 'A'.charCodeAt(0);
        const endY = parseInt(endRow, 10) - 1;

        const startId = `${startCol}${startRow}`;
        const endId = `${endCol}${endRow}`;

        const rangeRef = `${startId}:${endId}`;
        refsFound.push({
          start: offset,
          end: offset + rangeRef.length,
          ref: rangeRef,
        });

        const values: string[] = [];

        for (let y = startY; y <= endY; y++) {
          for (let x = startX; x <= endX; x++) {
            const cellId = `${String.fromCharCode(x + 'A'.charCodeAt(0))}${y + 1}`;
            const computedValue = sheet?.[y]?.[x]?.computedValue ?? '';
            cellsFound.push({
              id: cellId,
              value: computedValue,
              y,
              x,
            });

            const numberValue = Number(computedValue);
            const isString = isNaN(numberValue);
            values.push(isString ? `'${computedValue}'` : String(numberValue));
          }
        }

        return values.join(',');
      } else {
        // Es una celda, por ejemplo: A1
        const id = `${startCol}${startRow}`;
        refsFound.push({
          start: offset,
          end: offset + id.length,
          ref: id,
        });

        const x = startCol.charCodeAt(0) - 'A'.charCodeAt(0);
        const y = parseInt(startRow, 10) - 1;

        const computedValue = sheet?.[y]?.[x].computedValue ?? '';

        cellsFound.push({
          id,
          value: computedValue,
          y,
          x,
        });

        const numberValue = Number(computedValue);

        const isString = isNaN(numberValue);

        // Devolver el valor de la celda desde la matriz
        return String(isString ? `'${computedValue}'` : numberValue);
      }
    }
  );

  const isFunction = value.startsWith('=');
  const parsedExp = isFunction ? parsed.substring(1) : parsed;

  return {
    isMathExp,
    parsedExp,
    cellsFound,
    refsFound,
    isFunction,
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
      ...cell,
      value,
      computedValue: value,
    };
  }

  let computedValue = cellHasFunction ? value.substring(1) : value;

  try {
    const isValid = isValidExcelExpression(computedValue);

    if (!isValid) throw new Error();

    const { parsedExp } = parseExpression(computedValue, sheet);

    const finalExp = String(eval(parsedExp));

    computedValue = finalExp;
  } catch (error) {
    console.error(error);

    computedValue = '#ERROR';
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
