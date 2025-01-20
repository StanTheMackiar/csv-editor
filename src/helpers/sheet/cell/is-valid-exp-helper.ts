import {
  GlobalFunctionsEnumEN,
  GlobalFunctionsEnumES,
} from '@/enum/global-functions.enum';

export const checkIfEndsWithInvalidChar = (text: string): boolean => {
  // Expresión regular para caracteres inválidos (no letras ni números)
  const invalidChars = /[^a-zA-Z0-9]$/;
  return invalidChars.test(text.trim());
};

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

  // Validar nombres de funciones y sus argumentos
  const functionRegex = /\b([A-Z]+)\((.*?)\)/gi; // Detectar funciones con sus argumentos

  // Validar nombres de funciones y argumentos
  const functionMatches = Array.from(content.matchAll(functionRegex));

  for (const match of functionMatches) {
    const functionName = match[1].toUpperCase();
    const args = match[2]; // Contenido dentro de los paréntesis

    if (!validFunctions.includes(functionName as GlobalFunctionsEnumEN)) {
      return {
        valid: false,
        errorMsg: `#INVALID_FUNCTION_NAME (${functionName})`,
      };
    }

    // Validar múltiples rangos o argumentos separados por `;` o `,`
    const argsList = args.split(/;|,/).map((arg) => arg.trim());

    for (const arg of argsList) {
      if (
        arg && // Argumento no vacío
        !/^([A-Z]+[0-9]+(:[A-Z]+[0-9]+)?|\d+|"[^"]*")$/.test(arg)
      ) {
        return {
          valid: false,
          errorMsg: `#INVALID_ARGUMENTS_IN_FUNCTION (${functionName})`,
        };
      }
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
