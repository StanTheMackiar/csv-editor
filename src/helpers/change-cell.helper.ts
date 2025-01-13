import { getColorFromSequence } from './color.helper';

const parseCellReferences = (text: string) => {
  const cellRegex = /\b([A-Z]+[0-9]+(:[A-Z]+[0-9]+)?)\b/g; // Regex para celdas y rangos
  let colorIndex = 0;

  // Usar replace con función de reemplazo para procesar el texto
  const parsed = text.replace(cellRegex, (match) => {
    const color = getColorFromSequence(colorIndex);
    colorIndex++;
    return `<span style="color: ${color}">${match}</span>`; // Envuelve el match en un span con color
  });

  return parsed;
};

export const parseTextToHTML = (text: string) => {
  const enableFuncMode = text.startsWith('=');

  const newValue = enableFuncMode ? parseCellReferences(text) : text;

  return newValue;
};
