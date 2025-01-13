import { GlobalFunctionsEnum } from '@/enum/global-functions.enum';

export type GlobalFunction = (...args: string[]) => string;

export type GlobalFunctions = Record<GlobalFunctionsEnum, GlobalFunction>;
export type CustomWindow = Window & GlobalFunctions;
