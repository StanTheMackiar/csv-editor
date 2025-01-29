'use client';
import { CustomWindow } from '@/types/window.type';
import { NUMBER_REGEX } from '../constants/regex.constans';

declare const window: CustomWindow;

const validateNumberStrArgs = (args: string[]) => {
  if (!args?.length) {
    throw new Error('', {
      cause: '#ARGUMENTS_MUST_BE_PROVIDED',
    });
  }

  args.forEach((arg) => {
    if (!NUMBER_REGEX.test(String(Number(arg)))) {
      throw new Error('', {
        cause: '#ARGUMENTS_MUST_BE_NUMBERS',
      });
    }
  });
};

if (typeof window !== 'undefined') {
  window.SUM = (...args) => {
    validateNumberStrArgs(args);
    return String(args.reduce((acc, curr) => acc + Number(curr), 0));
  };

  window.AVERAGE = (...args) => {
    try {
      validateNumberStrArgs(args);
      return String(Number(window.SUM(...args)) / args.length);
    } catch (err) {
      if (err instanceof Error) {
        return err.message;
      }
      return '#ERROR';
    }
  };

  window.COUNT = (...args) => {
    try {
      if (!args?.length) {
        throw new Error('', {
          cause: '#ARGUMENTS_MUST_BE_PROVIDED',
        });
      }
      return args.length.toString();
    } catch (err) {
      if (err instanceof Error) {
        return err.message;
      }
      return '#ERROR';
    }
  };

  window.MAX = (...args) => {
    try {
      validateNumberStrArgs(args);
      return String(Math.max(...args.map(Number)));
    } catch (err) {
      if (err instanceof Error) {
        return err.message;
      }
      return '#ERROR';
    }
  };

  window.MIN = (...args) => {
    try {
      validateNumberStrArgs(args);
      return String(Math.min(...args.map(Number)));
    } catch (err) {
      if (err instanceof Error) {
        return err.message;
      }
      return '#ERROR';
    }
  };

  window.SUBTRACT = (...args) => {
    try {
      validateNumberStrArgs(args);
      return String(args.reduce((acc, curr) => acc - Number(curr), 0));
    } catch (err) {
      if (err instanceof Error) {
        return err.message;
      }
      return '#ERROR';
    }
  };

  window.MULTIPLY = (...args) => {
    try {
      validateNumberStrArgs(args);
      return String(args.reduce((acc, curr) => acc * Number(curr), 1));
    } catch (err) {
      if (err instanceof Error) {
        return err.message;
      }
      return '#ERROR';
    }
  };

  window.AVG = window.AVERAGE;
  window.SUMA = window.SUM;
  window.PROMEDIO = window.AVERAGE;
  window.CONTAR = window.COUNT;
  window.RESTAR = window.SUBTRACT;
  window.MULTIPLICAR = window.MULTIPLY;
}
