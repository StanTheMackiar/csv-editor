import { isClient } from './constants/os';

export const checkInputIsFocused = (
  inputRef: React.RefObject<HTMLInputElement>
): boolean => {
  if (!isClient || !inputRef.current) return false;

  return document.activeElement === inputRef.current;
};
