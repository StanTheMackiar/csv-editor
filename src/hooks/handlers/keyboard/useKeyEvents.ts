import { useCallback, useEffect } from 'react';
import { useShallow } from 'zustand/react/shallow';
import KeyEnum from '../../../enum/key.enum';
import {
  isArrowKey,
  isInputKey,
  isSpecialKey,
} from '../../../helpers/keys/keys.helpers';
import { Direction, useSheetStore } from '../../../stores/useSheetStore';

export const usePressedKeys = () => {
  const [
    addPressedKey,
    focusedCellInputRef,
    moveLatestSelectedCell,
    moveRemarkedCell,
    pressedKeys,
    remarkedCellCoords,
    remarkedCellInputRef,
    removePressedKey,
    setPressedKeys,
    selectedCells,
    updateCells,
  ] = useSheetStore(
    useShallow((state) => [
      state.addPressedKey,
      state.focusedCellInputRef,
      state.moveLatestSelectedCell,
      state.moveRemarkedCell,
      state.pressedKeys,
      state.remarkedCell,
      state.remarkedCellInputRef,
      state.removePressedKey,
      state.setPressedKeys,
      state.selectedCells,
      state.updateCells,
    ])
  );

  const focusedElement = focusedCellInputRef?.current;
  const remarkedElement = remarkedCellInputRef?.current;

  const onPressEnter = useCallback(() => {
    if (focusedElement) {
      moveRemarkedCell('down');

      return;
    } else if (remarkedElement) {
      remarkedElement.focus();
    }
  }, [focusedElement, moveRemarkedCell, remarkedElement]);

  const onPressTab = useCallback(() => {
    moveRemarkedCell('right');
  }, [moveRemarkedCell]);

  const onPressShiftPlusTab = useCallback(() => {
    moveRemarkedCell('left');
  }, [moveRemarkedCell]);

  const onPressShiftPlusArrow = useCallback(
    (direction: Direction) => {
      if (!focusedElement) {
        moveLatestSelectedCell(direction);
      }
    },
    [focusedElement, moveLatestSelectedCell]
  );

  const onPressBackspace = useCallback(() => {
    if (!focusedElement) {
      updateCells(
        selectedCells.map((coords) => ({
          coords,
          newValue: '',
        }))
      );
    }
  }, [focusedElement, selectedCells, updateCells]);

  const onPressArrow = useCallback(
    (direction: Direction) => {
      if (!focusedElement) {
        moveRemarkedCell(direction);
      }
    },
    [focusedElement, moveRemarkedCell]
  );

  const getActionByKeyPressed = useCallback(
    (pressedKeys: KeyEnum[]): VoidFunction | undefined => {
      const pressedKeysValue = pressedKeys
        .map((key) => key.toUpperCase())
        .join('plus');

      const keyMap: Record<string, VoidFunction | undefined> = {
        ENTER: onPressEnter,
        BACKSPACE: onPressBackspace,
        DELETE: onPressBackspace,
        TAB: onPressTab,

        ARROWRIGHT: () => onPressArrow('right'),
        ARROWLEFT: () => onPressArrow('left'),
        ARROWDOWN: () => onPressArrow('down'),
        ARROWUP: () => onPressArrow('up'),

        SHIFTplusTAB: onPressShiftPlusTab,
        SHIFTplusARROWUP: () => onPressShiftPlusArrow('up'),
        SHIFTplusARROWDOWN: () => onPressShiftPlusArrow('down'),
        SHIFTplusARROWLEFT: () => onPressShiftPlusArrow('left'),
        SHIFTplusARROWRIGHT: () => onPressShiftPlusArrow('right'),
      };

      return keyMap[pressedKeysValue];
    },
    [
      onPressArrow,
      onPressBackspace,
      onPressEnter,
      onPressShiftPlusArrow,
      onPressShiftPlusTab,
      onPressTab,
    ]
  );

  const handlePressedKeys = useCallback(() => {
    if (!pressedKeys.length) return;

    const keyAction = getActionByKeyPressed(pressedKeys);

    if (keyAction) return keyAction();

    const isSingleKeyPressed = pressedKeys.length === 1;

    const keyPressed = pressedKeys[0];
    const inputKeyPressed = isSingleKeyPressed && isInputKey(keyPressed);

    const updateRemarkedCell =
      inputKeyPressed &&
      !focusedElement &&
      typeof remarkedElement?.innerText !== 'undefined';

    if (updateRemarkedCell && remarkedCellCoords) {
      remarkedElement.focus();
    }
  }, [
    focusedElement,
    getActionByKeyPressed,
    pressedKeys,
    remarkedCellCoords,
    remarkedElement,
  ]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      const keyCode = e.key;

      const keyIsArrow = isArrowKey(keyCode);
      const keyIsSpecial = isSpecialKey(keyCode);

      const allowDefaultEvent = !keyIsSpecial || (focusedElement && keyIsArrow);

      if (!allowDefaultEvent) e.preventDefault();

      addPressedKey(keyCode as KeyEnum);
    },
    [addPressedKey, focusedElement]
  );

  const handleKeyUp = useCallback(
    (e: KeyboardEvent) => {
      const keyCode = e.key as KeyEnum;

      const hasSpecialKey = pressedKeys.some((key) => isSpecialKey(key));

      if (hasSpecialKey) {
        setPressedKeys([]);

        return;
      }

      removePressedKey(keyCode);
    },
    [pressedKeys, removePressedKey, setPressedKeys]
  );

  useEffect(() => {
    handlePressedKeys();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pressedKeys]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keyup', handleKeyUp);
    };
  }, [handleKeyUp, handleKeyDown]);

  return {};
};
