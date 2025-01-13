import { CustomWindow } from '@/types/window.type';

declare const window: CustomWindow;

window.SUM = (...args) => {
  return String(args.reduce((acc, curr) => acc + Number(curr), 0));
};

window.AVERAGE = (...args) => {
  return String(Number(window.SUM(...args)) / args.length);
};

window.COUNT = (...args) => {
  return args.length.toString();
};

window.MAX = (...args) => {
  return String(Math.max(...args.map(Number)));
};

window.MIN = (...args) => {
  return String(Math.min(...args.map(Number)));
};

window.SUBTRACT = (...args) => {
  return String(args.reduce((acc, curr) => acc - Number(curr), 0));
};

window.MULTIPLY = (...args) => {
  return String(args.reduce((acc, curr) => acc * Number(curr), 1));
};

window.SUMA = window.SUM;
window.PROMEDIO = window.AVERAGE;
window.CONTAR = window.COUNT;
window.RESTAR = window.SUBTRACT;
window.MULTIPLICAR = window.MULTIPLY;
