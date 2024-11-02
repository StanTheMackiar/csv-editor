export const generateRandomColor = (): string => {
  const randomColor = Math.floor(Math.random() * 16777215).toString(16);
  return `#${randomColor.padStart(6, '0')}`;
};

const colorSequence = [
  '#FF0000',
  '#00FF00',
  '#0000FF',
  '#FF00FF',
  '#00FFFF',
  '#800000',
  '#008000',
  '#000080',
  '#808000',
  '#800080',
  '#008080',
  '#C0C0C0',
  '#808080',
  '#FFA500',
  '#A52A2A',
  '#8A2BE2',
  '#DEB887',
  '#5F9EA0',
  '#7FFF00',
  '#D2691E',
  '#FF7F50',
  '#6495ED',
  '#DC143C',
  '#00FA9A',
  '#ADFF2F',
  '#4B0082',
  '#FF4500',
  '#DA70D6',
  '#B0E0E6',
];

export const getColorFromSequence = (input: number): string => {
  // Módulo para garantizar que el índice esté dentro del rango del array de 30 colores
  const index = input % colorSequence.length;
  return colorSequence[index];
};
