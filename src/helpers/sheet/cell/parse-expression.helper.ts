import { CELL_REGEX, NUMBER_REGEX } from '@/helpers/constants/regex.constans';
import {
  CellRef,
  ICell,
  ISheet,
  ParseExpressionReturn,
} from '@/types/sheet/cell/cell.types';
import { getCell, getCoordsById } from '../sheet.helper';

export const parseExpression = (
  value: string,
  sheet: ISheet
): ParseExpressionReturn => {
  const cells: ICell[] = [];
  const refs: CellRef[] = [];
  const isFunction = value.startsWith('=');

  if (!isFunction) {
    return {
      parsedExp: value,
      cells,
      refs,
    };
  }

  //? Paso 1: Normalizar expresion
  const normalizedExp = value
    .substring(1)
    .trim()
    //? Reemplazar los paréntesis que contienen rangos
    .replace(/\(([^)]+)\)/g, (match) => match.replace(/;/g, ','));

  const quotesRegex = /(['"])(.*?)\1/g;

  //Paso 2: Parsear la expresión entre comillas
  const parsedQuoted = normalizedExp.replace(
    quotesRegex, // Detecta texto entre comillas dobles o simples
    (originalString, quoteType, innerContent, offset) => {
      if (!originalString) return originalString;

      // Manejo de contenido entre comillas
      const updatedContent = innerContent.replace(
        /&([A-Z]+[0-9]+)/g, // Detecta "&CELDA"
        (original: string, cellId: string) => {
          const coords = getCoordsById(cellId);
          if (!coords) return original;

          refs.push({
            start: offset + 2 + innerContent.indexOf(original),
            end: offset + 2 + innerContent.indexOf(original) + original.length,
            ref: cellId,
          });

          const cell = getCell(coords, sheet);
          if (cell) cells.push(cell);

          const computedValue =
            typeof cell?.computedValue !== 'undefined'
              ? (cell.computedValue ?? '')
              : (cell?.value ?? '');

          return computedValue; // Sustituye por el valor de la celda
        }
      );

      return `${quoteType}${updatedContent}${quoteType}`; // Mantiene las comillas intactas
    }
  );

  const quotedSegments: string[] = [];
  const protectedExpression = parsedQuoted.replace(
    quotesRegex, // Detecta texto entre comillas dobles
    (original) => {
      quotedSegments.push(original); // Guarda el segmento completo
      return `__QUOTED_${quotedSegments.length - 1}__`; // Reemplaza por un marcador
    }
  );

  // Paso 2: Parsear el resto de la expresión (fuera de comillas)
  const parsedExp = protectedExpression.replace(
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

        if (!startCoords || !endCoords) {
          return original;
        }

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

            if (cell) {
              cells.push(cell);
            }

            const computedValue =
              typeof cell?.computedValue !== 'undefined'
                ? (cell.computedValue ?? '')
                : (cell?.value ?? '');

            const isNumber = NUMBER_REGEX.test(computedValue);

            values.push(
              isNumber ? String(computedValue) : `"${computedValue}"`
            );
          }
        }

        return values.join(',');
      } else {
        const cellId = `${startCol}${startRow}`;
        const coords = getCoordsById(cellId);

        if (!coords) return original;

        refs.push({
          start: offset + 1,
          end: offset + cellId.length + 1,
          ref: cellId,
        });

        const cell = getCell(coords, sheet);

        if (cell) {
          cells.push(cell);
        }

        const computedValue =
          typeof cell?.computedValue !== 'undefined'
            ? (cell.computedValue ?? '')
            : (cell?.value ?? '');

        const isNumber = NUMBER_REGEX.test(computedValue);

        return isNumber ? String(computedValue) : `"${computedValue}"`;
      }
    }
  );

  // Paso 3: Restaurar contenido entre comillas dobles
  const restoredExp = parsedExp.replace(
    /__QUOTED_(\d+)__/g,
    (match, index) => quotedSegments[Number(index)] // Restaura el segmento original
  );

  return {
    cells,
    parsedExp: restoredExp,
    refs,
  };
};
