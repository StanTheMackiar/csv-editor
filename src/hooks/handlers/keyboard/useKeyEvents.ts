import { Direction } from '@/types/sheet/cell/cell.types';
import { useCallback, useEffect, useState } from 'react';
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
    focusedCellInputRef,
    moveLatestSelectedCell,
    moveRemarkedCell,
    remarkedCellCoords,
    remarkedCellInputRef,
    selectedCells,
    updateCells,
    recomputeSheet,
  ] = useSheetStore(
    useShallow((state) => [
      state.focusedCellElement,
      state.moveLatestSelectedCell,
      state.moveRemarkedCell,
      state.remarkedCellCoords,
      state.remarkedCellElement,
      state.selectedCellsCoords,
      state.updateCells,
      state.recomputeSheet,
    ])
  );

  const [pressedKeys, setPressedKeys] = useState<KeyEnum[]>([]);

  const addPressedKey = useCallback((key: KeyEnum) => {
    setPressedKeys((pressedKeys) => [...new Set([...pressedKeys, key])]);
  }, []);

  const removePressedKey = useCallback((key: KeyEnum) => {
    setPressedKeys((pressedKeys) =>
      pressedKeys.filter((stateKey) => stateKey !== key)
    );
  }, []);

  const onPressEnter = useCallback(() => {
    if (focusedCellInputRef) {
      focusedCellInputRef.blur();
      moveRemarkedCell('down');

      return;
    } else if (remarkedCellInputRef) {
      remarkedCellInputRef.focus();
    }
  }, [focusedCellInputRef, moveRemarkedCell, remarkedCellInputRef]);

  const onPressTab = useCallback(() => {
    remarkedCellInputRef?.blur();

    moveRemarkedCell('right');
  }, [moveRemarkedCell, remarkedCellInputRef]);

  const onPressShiftPlusTab = useCallback(() => {
    remarkedCellInputRef?.blur();

    moveRemarkedCell('left');
  }, [moveRemarkedCell, remarkedCellInputRef]);

  const onPressShiftPlusArrow = useCallback(
    (direction: Direction) => {
      if (!focusedCellInputRef) {
        moveLatestSelectedCell(direction);
      }
    },
    [focusedCellInputRef, moveLatestSelectedCell]
  );

  const onPressBackspace = useCallback(() => {
    if (focusedCellInputRef) return;

    updateCells(
      selectedCells.map((coords) => ({
        coords,
        newValue: '',
      }))
    );

    recomputeSheet();
  }, [focusedCellInputRef, recomputeSheet, selectedCells, updateCells]);

  const onPressArrow = useCallback(
    (direction: Direction) => {
      if (focusedCellInputRef) return;
      moveRemarkedCell(direction);
    },
    [focusedCellInputRef, moveRemarkedCell]
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
    if (!pressedKeys.length) return;

    const keyAction = getActionByKeysPressed(pressedKeys);
    if (keyAction) return keyAction();

    const isSingleKeyPressed = pressedKeys.length === 1;

    const keyPressed = pressedKeys[pressedKeys.length - 1];
    const inputKeyPressed = isSingleKeyPressed && isInputKey(keyPressed);

    const updateRemarkedCell =
      inputKeyPressed &&
      !focusedCellInputRef &&
      typeof remarkedCellInputRef?.innerText !== 'undefined';

    if (updateRemarkedCell && remarkedCellCoords) {
      updateCells([
        {
          coords: remarkedCellCoords,
          newValue: '',
        },
      ]);

      remarkedCellInputRef.focus();
    }
  }, [
    focusedCellInputRef,
    getActionByKeysPressed,
    pressedKeys,
    remarkedCellCoords,
    remarkedCellInputRef,
    updateCells,
  ]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      const keyCode = e.key;

      const keyIsArrow = isArrowKey(keyCode);
      const keyIsSpecial = isSpecialKey(keyCode);

      const allowDefaultEvent =
        !keyIsSpecial || (focusedCellInputRef && keyIsArrow);

      if (!allowDefaultEvent) e.preventDefault();

      addPressedKey(keyCode as KeyEnum);
    },
    [addPressedKey, focusedCellInputRef]
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
    const cleanPressedKeys = () => {
      setPressedKeys([]);
    };

    window.addEventListener('blur', cleanPressedKeys);
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);

    return () => {
      window.addEventListener('blur', cleanPressedKeys);
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keyup', handleKeyUp);
    };
  }, [handleKeyUp, handleKeyDown, setPressedKeys]);

  return {};
};
