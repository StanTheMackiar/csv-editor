import {
  GlobalFunctionsEnumEN,
  GlobalFunctionsEnumES,
} from '@/enum/global-functions.enum';

export const isValidFuncExpression = (
  expression: string
): { valid: boolean; errorMsg: string } => {
  if (!expression) {
    return { valid: false, errorMsg: '#EMPTY_EXPRESSION' };
  }

  if (!expression.startsWith('=')) {
    return { valid: false, errorMsg: '#MUST_START_WITH_EQUAL' };
  }

  const content = expression.substring(1).trim(); // Remover `=` y espacios
  if (!content) {
    return { valid: false, errorMsg: '#EMPTY_EXPRESSION_AFTER_EQUAL' };
  }

  // Lista de funciones permitidas
  const validFunctions = [
    ...Object.values(GlobalFunctionsEnumEN),
    ...Object.values(GlobalFunctionsEnumES),
  ];

  // Validar estructura general
  const generalRegex =
    /^([\w]+)?\(?([A-Z]+[0-9]+(:[A-Z]+[0-9]+)?|\d+|"[^"]*")?(;|,)?([A-Z]+[0-9]+(:[A-Z]+[0-9]+)?|\d+|"[^"]*")*\)?([+\-*/]\(?([A-Z]+[0-9]+|\d+|"[^"]*"|[\w]+\([^\)]*\))\)?)*$/i;

  if (!generalRegex.test(content)) {
    return { valid: false, errorMsg: '#INVALID_GENERAL_FORMAT' };
  }

  // Validar nombres de funciones
  const functionMatches = Array.from(content.matchAll(/\b([A-Z]+)\(/gi));
  const functionNames = functionMatches.map((m) => m[1].toUpperCase());

  for (const fn of functionNames) {
    if (
      !validFunctions.includes(fn as GlobalFunctionsEnumEN) &&
      !validFunctions.includes(fn as GlobalFunctionsEnumES)
    ) {
      return { valid: false, errorMsg: `#INVALID_FUNCTION_NAME (${fn})` };
    }
  }

  // Validar argumentos de funciones
  const argsRegex = /([A-Z]+)\((.*?)\)/gi; // Extraer contenido dentro de paréntesis
  const argsMatches = Array.from(content.matchAll(argsRegex));

  for (const match of argsMatches) {
    const args = match[2]; // Contenido dentro de los paréntesis
    if (
      args &&
      !/^([A-Z]+[0-9]+(:[A-Z]+[0-9]+)?|\d+|"[^"]*")(;|,)?(.*?)$/.test(args)
    ) {
      return {
        valid: false,
        errorMsg: `#INVALID_ARGUMENTS_IN_FUNCTION (${match[1]})`,
      };
    }
  }

  // Validar operaciones matemáticas
  const mathRegex = /[+\-*/]/;
  if (mathRegex.test(content)) {
    const invalidOperations = content.match(/[+\-*/]\s*$/); // Verificar operaciones mal formadas
    if (invalidOperations) {
      return {
        valid: false,
        errorMsg: '#INVALID_OPERATION_FORMAT',
      };
    }
  }

  // Si todas las validaciones pasan
  return { valid: true, errorMsg: '' };
};
