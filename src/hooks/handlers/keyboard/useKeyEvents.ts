import { getFocusedCellElement, getRemarkedCellElement } from '@/helpers';
import { Direction } from '@/types/sheet/cell/cell.types';
import { useCallback, useEffect } from 'react';
import { useShallow } from 'zustand/react/shallow';
import KeyEnum from '../../../enum/key.enum';
import {
  isArrowKey,
  isInputKey,
  isSpecialKey,
} from '../../../helpers/keys/keys.helpers';
import { useSheetStore } from '../../../stores/useSheetStore';

export const usePressedKeys = () => {
  const [
    moveLatestSelectedCell,
    moveRemarkedCell,
    remarkedCellCoords,
    selectedCells,
    updateCells,
    recomputeSheet,
    pressedKeys,
    addPressedKey,
    removePressedKey,
    cleanPressedKeys,
  ] = useSheetStore(
    useShallow((state) => [
      state.moveLatestSelectedCell,
      state.moveRemarkedCell,
      state.remarkedCellCoords,
      state.selectedCellsCoords,
      state.updateCells,
      state.recomputeSheet,
      state.pressedKeys,
      state.addPressedKey,
      state.removePressedKey,
      state.cleanPressedKeys,
    ])
  );

  const onPressEnter = useCallback(() => {
    const focusedCellElement = getFocusedCellElement();
    const remarkedCellElement = getRemarkedCellElement();

    if (focusedCellElement) {
      focusedCellElement.blur();
      moveRemarkedCell('down');

      return;
    } else if (remarkedCellElement) {
      remarkedCellElement.focus();
    }
  }, [moveRemarkedCell]);

  const onPressTab = useCallback(() => {
    const remarkedCellElement = getRemarkedCellElement();

    remarkedCellElement?.blur();

    moveRemarkedCell('right');
  }, [moveRemarkedCell]);

  const onPressShiftPlusTab = useCallback(() => {
    const remarkedCellElement = getRemarkedCellElement();

    remarkedCellElement?.blur();

    moveRemarkedCell('left');
  }, [moveRemarkedCell]);

  const onPressShiftPlusArrow = useCallback(
    (direction: Direction) => {
      const focusedCellElement = getFocusedCellElement();

      if (!focusedCellElement) {
        moveLatestSelectedCell(direction);
      }
    },
    [moveLatestSelectedCell]
  );

  const onPressBackspace = useCallback(() => {
    const focusedCellElement = getFocusedCellElement();

    if (focusedCellElement) return;

    updateCells(
      selectedCells.map((coords) => ({
        coords,
        newValue: '',
      }))
    );

    recomputeSheet();
  }, [recomputeSheet, selectedCells, updateCells]);

  const onPressArrow = useCallback(
    (direction: Direction) => {
      const focusedCellElement = getFocusedCellElement();
      if (focusedCellElement) return;

      moveRemarkedCell(direction);
    },
    [moveRemarkedCell]
  );

  const getActionByKeysPressed = useCallback(
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
    const focusedCellElement = getFocusedCellElement();
    const remarkedCellElement = getRemarkedCellElement();

    if (!pressedKeys.length) return;

    const keyAction = getActionByKeysPressed(pressedKeys);
    if (keyAction) return keyAction();

    const isSingleKeyPressed = pressedKeys.length === 1;

    const keyPressed = pressedKeys[pressedKeys.length - 1];
    const inputKeyPressed = isSingleKeyPressed && isInputKey(keyPressed);

    const updateRemarkedCell =
      inputKeyPressed &&
      !focusedCellElement &&
      typeof remarkedCellElement?.innerText !== 'undefined';

    if (updateRemarkedCell && remarkedCellCoords) {
      updateCells([
        {
          coords: remarkedCellCoords,
          newValue: '',
        },
      ]);

      remarkedCellElement.focus();
    }
  }, [getActionByKeysPressed, pressedKeys, remarkedCellCoords, updateCells]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      const focusedCellElement = getFocusedCellElement();

      const keyCode = e.key;

      const keyIsArrow = isArrowKey(keyCode);
      const keyIsSpecial = isSpecialKey(keyCode);

      const allowDefaultEvent =
        !keyIsSpecial || (focusedCellElement && keyIsArrow);

      if (!allowDefaultEvent) e.preventDefault();

      addPressedKey(keyCode as KeyEnum);
    },
    [addPressedKey]
  );

  const handleKeyUp = useCallback(
    (e: KeyboardEvent) => {
      const keyCode = e.key as KeyEnum;

      removePressedKey(keyCode);
    },
    [removePressedKey]
  );

  useEffect(() => {
    handlePressedKeys();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pressedKeys]);

  useEffect(() => {
    window.addEventListener('blur', cleanPressedKeys);
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);

    return () => {
      window.addEventListener('blur', cleanPressedKeys);
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keyup', handleKeyUp);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [handleKeyUp, handleKeyDown, pressedKeys]);

  return {};
};
