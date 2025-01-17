import { useState } from 'react';

type ModalStateReturn<T> = [
  boolean,
  VoidFunction,
  VoidFunction,
  T | null,
  (value: T | null) => void,
];

export const useModalState = <T = boolean>(): ModalStateReturn<T> => {
  const [open, setOpen] = useState(false);
  const [data, setData] = useState<T | null>(null);

  const openModal = () => {
    setOpen(true);
  };

  const closeModal = () => setOpen(false);

  return [open, openModal, closeModal, data, setData];
};
