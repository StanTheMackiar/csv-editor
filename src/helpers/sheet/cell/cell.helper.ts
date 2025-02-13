import { getCellId, isClient } from '@/helpers';
import { ICell, ISheet } from '../../../types/sheet/cell/cell.types';
import { MATH_REGEX } from '../../constants/regex.constans';
import { isValidFuncExpression } from './is-valid-exp-helper';
import { parseExpression } from './parse-expression.helper';

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

    const { parsedExp, cells } = parseExpression(computedValue, sheet);

    const functionCallPattern =
      /^[A-Z]+\(\s*([^",\r\n]+|\d+|""|"(?:[^"\\]|\\.)*")(\s*,\s*([^",\r\n]+|\d+|""|"(?:[^"\\]|\\.)*"))*\s*\)$/i;

    if (!functionCallPattern.test(parsedExp)) {
      throw new Error('', {
        cause: '#INVALID_RANGE',
      });
    }

    const circularDependency = cells.some(
      (c) => getCellId(c) === getCellId(cell)
    );

    if (circularDependency) {
      throw new Error('', {
        cause: '#CIRCULAR_DEPENDENCY',
      });
    }

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

    computedValue = String(evalResult);
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

export const getRemarkedCellElement = () => {
  if (!isClient) return null;

  const cellRemarked = document.querySelector('.cell-remarked');

  if (
    cellRemarked instanceof HTMLDivElement &&
    cellRemarked.contentEditable === 'true'
  ) {
    return cellRemarked;
  }

  return null;
};

export const getFocusedCellElement = () => {
  if (!isClient) return null;

  const focusedElement = document.activeElement;

  if (
    focusedElement instanceof HTMLDivElement &&
    focusedElement.contentEditable === 'true'
  ) {
    return focusedElement;
  }

  return null;
};
