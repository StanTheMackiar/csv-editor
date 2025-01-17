/**
 * Convierte un color HEX a formato ARGB.
 * @param hex - El color en formato HEX (ej. "#FF0000").
 * @returns El color en formato ARGB (ej. "FFFF0000").
 */
export const hexToArgb = (hex: string): string => {
  // Validar si el color HEX es válido
  const hexRegex = /^#([A-Fa-f0-9]{6})$/i;
  const match = hex.match(hexRegex);
  if (!match) {
    throw new Error("El color HEX debe ser válido (ej. #FF0000).");
  }

  // Extraer los componentes de color (R, G, B)
  const r = match[1].slice(0, 2);
  const g = match[1].slice(2, 4);
  const b = match[1].slice(4, 6);

  // Asumir que el alpha es completamente opaco (FF) si no se proporciona
  const a = "FF"; // Valor máximo para alpha (completamente opaco)

  // Retornar el color en formato ARGB
  return `${a}${r}${g}${b}`;
};
