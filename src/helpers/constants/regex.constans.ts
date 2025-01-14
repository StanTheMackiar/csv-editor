export const VALID_INPUT_KEY_REGEX = /^[ -~]$|^Backspace$|^Enter$|^Tab$/;

export const CELL_REGEX = /([A-Z]+)(\d+)(:([A-Z]+)(\d+))?/g;

export const MATH_REGEX =
  /^([A-Z]+\d+|\d+)([\s]*[+\-*/][\s]*([A-Z]+\d+|\d+))+$/i;

export const NUMBER_REGEX = /^-?\d+(\.\d+)?$/;
