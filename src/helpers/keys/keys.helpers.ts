const arrowKeys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'];

export function isSpecialKey(key: string): boolean {
  const specialKeys = new Set([
    'Alt',
    'AltGraph',
    'Control',
    'Shift',
    'Meta',
    'CapsLock',
    'Escape',
    'Home',
    'End',
    'PageUp',
    'Tab',
    'End',
    'PageDown',
    'Insert',
    'Delete',
    'F1',
    'F2',
    'F3',
    'F4',
    'F5',
    'F6',
    'F7',
    'F8',
    'F9',
    'F10',
    'F11',
    'ContextMenu',
    'NumLock',
    'ScrollLock',
    'Pause',
    'PrintScreen',
  ]);

  return specialKeys.has(key);
}

export const isArrowKey = (key: string) => {
  return arrowKeys.includes(key);
};

export function isInputKey(key: string): boolean {
  const inputKeyRegex = /^[ -~]$|^[=\/()\%$·"!@#~€¬|]+$|^Backspace$|^Enter$/;

  return inputKeyRegex.test(key);
}
