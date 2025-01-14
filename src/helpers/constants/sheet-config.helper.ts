import { IS_PROD } from './env.contstants';

export const INITIAL_ROWS_QTY = IS_PROD ? 48 : 30;
export const INITIAL_COLS_QTY = IS_PROD ? 30 : 12;

export const ROW_DEFAULT_HEIGHT = 28;
export const ROW_MIN_HEIGHT = 20;

export const COLUMN_DEFAULT_WIDTH = 160;
export const COLUMN_MIN_WIDTH = 50;
