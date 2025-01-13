import {
  GlobalFunctionsEnumEN,
  GlobalFunctionsEnumES,
} from '@/enum/global-functions.enum';

export const isValidFuncExpression = (
  expression: string
): { valid: boolean; errorMsg: string } => {
  if (!expression)
    return {
      valid: false,
      errorMsg: '#EMPTY_EXPRESSION',
    }; // Si la expresión está vacía, es inválida.

  if (!expression.startsWith('='))
    return {
      valid: false,
      errorMsg: '#MUST_START_WITH_EQUAL',
    }; // Si no empieza con '=', es inválida.

  if (!expression.substring(1)) {
    return {
      valid: false,
      errorMsg: '#EMPTY_EXPRESSION',
    };
  }

  // Lista de funciones permitidas
  const validFunctions = [
    ...Object.values(GlobalFunctionsEnumEN),
    ...Object.values(GlobalFunctionsEnumES),
  ];

  // Expresión regular para validar funciones, referencias y operaciones
  const regex =
    /^=([\w]+)?\(?([A-Z]+[0-9]+(:[A-Z]+[0-9]+)?|\d+|"[^"]*")(;|,)?([A-Z]+[0-9]+(:[A-Z]+[0-9]+)?|\d+|"[^"]*")*\)?([+\-*/]\(?([A-Z]+[0-9]+|\d+|"[^"]*"|[\w]+\([^\)]+\))\)?)*$/i;

  // Validar la expresión completa contra la regex
  const match = expression.match(regex);
  if (!match)
    return {
      valid: false,
      errorMsg: '#INCORRECT_FORMAT',
    };

  // Extraer los posibles nombres de funciones para validar que sean válidas
  const functionNames = Array.from(expression.matchAll(/\b([A-Z]+)\(/gi)).map(
    (m) => m[1].toUpperCase()
  );

  const hasFunctionNames = functionNames.length > 0;

  // Verificar que todas las funciones en la expresión estén en la lista permitida
  return {
    valid: hasFunctionNames
      ? functionNames.every((fn) =>
          validFunctions.includes(fn as GlobalFunctionsEnumEN)
        )
      : true,
    errorMsg: '#INVALID_FUNCTION',
  };
};
