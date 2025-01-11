/* eslint-disable @typescript-eslint/no-explicit-any */
import { LocalStorageEnum } from '@/enum/local-storage.enum';
import { SessionStorageEnum } from '@/enum/session-storage.enum';
import { isClient } from '../constants/os';

export const setToLocalStorage = <T = unknown>(
  key: LocalStorageEnum,
  value: T
) => {
  if (!isClient) {
    console.error(`can't set to local storage because isn't at client side`);

    return;
  }

  localStorage.setItem(key, JSON.stringify(value));
};

export const getFromLocalStorage = <T = unknown>(
  key: LocalStorageEnum
): T | undefined => {
  if (!isClient) {
    console.error(`can't get from local storage because isn't at client side`);

    return;
  }

  const result = localStorage.getItem(key);

  if (result) return JSON.parse(result) as T;
};

export const setToSessionStorage = <T = unknown>(
  key: SessionStorageEnum,
  value: T
) => {
  if (!isClient) {
    console.error(`can't set to local storage because isn't at client side`);

    return;
  }

  sessionStorage.setItem(key, JSON.stringify(value));
};

export const getFromSessionStorage = <T = unknown>(
  key: SessionStorageEnum
): T | undefined => {
  if (!isClient) {
    console.error(`can't get from local storage because isn't at client side`);

    return;
  }

  const result = sessionStorage.getItem(key);

  if (result) return JSON.parse(result) as T;
};
