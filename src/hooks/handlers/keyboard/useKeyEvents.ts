import { useCallback, useEffect, useState } from 'react';
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
      state.focusedCellInputRef,
      state.moveLatestSelectedCell,
      state.moveRemarkedCell,
      state.remarkedCellCoords,
      state.remarkedCellInputRef,
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

  const focusedElement = focusedCellInputRef?.current;
  const remarkedElement = remarkedCellInputRef?.current;

  const onPressEnter = useCallback(() => {
    if (focusedElement) {
      focusedElement.blur();
      moveRemarkedCell('down');

      return;
    } else if (remarkedElement) {
      remarkedElement.focus();
    }
  }, [focusedElement, moveRemarkedCell, remarkedElement]);

  const onPressTab = useCallback(() => {
    remarkedElement?.blur();

    moveRemarkedCell('right');
  }, [moveRemarkedCell, remarkedElement]);

  const onPressShiftPlusTab = useCallback(() => {
    remarkedElement?.blur();

    moveRemarkedCell('left');
  }, [moveRemarkedCell, remarkedElement]);

  const onPressShiftPlusArrow = useCallback(
    (direction: Direction) => {
      if (!focusedElement) {
        moveLatestSelectedCell(direction);
      }
    },
    [focusedElement, moveLatestSelectedCell]
  );

  const onPressBackspace = useCallback(() => {
    if (focusedElement) return;

    updateCells(
      selectedCells.map((coords) => ({
        coords,
        newValue: '',
      }))
    );

    recomputeSheet();
  }, [focusedElement, recomputeSheet, selectedCells, updateCells]);

  const onPressArrow = useCallback(
    (direction: Direction) => {
      if (focusedElement) return;
      moveRemarkedCell(direction);
    },
    [focusedElement, moveRemarkedCell]
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
      !focusedElement &&
      typeof remarkedElement?.innerText !== 'undefined';

    if (updateRemarkedCell && remarkedCellCoords) {
      updateCells([
        {
          coords: remarkedCellCoords,
          newValue: '',
        },
      ]);

      remarkedElement.focus();
    }
  }, [
    focusedElement,
    getActionByKeysPressed,
    pressedKeys,
    remarkedCellCoords,
    remarkedElement,
    updateCells,
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
