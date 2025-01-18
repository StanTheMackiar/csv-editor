export const generateRandomColor = (): string => {
  const randomColor = Math.floor(Math.random() * 16777215).toString(16);
  return `#${randomColor.padStart(6, '0')}`;
};

const colorSequence = [
  '#FF6F6F', // Vibrant red
  '#FF9E5F', // Vibrant orange
  '#70E070', // Vibrant green
  '#5EC8FF', // Vibrant blue
  '#9D7EFF', // Vibrant purple
  '#FF70B8', // Vibrant pink
  '#F9C66A', // Vibrant peach
  '#70FFA3', // Vibrant mint green
  '#6EB3FF', // Vibrant baby blue
  '#E97EFF', // Vibrant lavender
  '#FFA970', // Vibrant coral
  '#F6F76A', // Vibrant soft lemon
  '#8AC7FF', // Vibrant sky blue
  '#FF7F92', // Vibrant rose
  '#B486FF', // Vibrant lilac
  '#FFDD88', // Vibrant cream
  '#88E38A', // Vibrant pistachio
  '#FF92D0', // Vibrant ballet pink
  '#82DDFF', // Vibrant icy blue
  '#FFA6CC', // Vibrant blush pink
  '#D4FF70', // Vibrant pale lime
  '#FFD17A', // Vibrant sand
  '#A3C8FF', // Vibrant grey-blue
];

export const getColorFromSequence = (input: number): string => {
  // Módulo para garantizar que el índice esté dentro del rango del array de 30 colores
  const index = input % colorSequence.length;
  return colorSequence[index];
};
