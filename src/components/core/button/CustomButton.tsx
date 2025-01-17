import { Button, ButtonProps } from '@headlessui/react';
import clsx from 'clsx';
import { FC } from 'react';

export const CustomButton: FC<ButtonProps> = (props) => {
  return (
    <Button
      {...props}
      className={clsx(
        props.className,
        'inline-flex items-center gap-2 rounded-md bg-emerald-600 py-1.5 px-3 text-sm/6 font-semibold text-white shadow-inner shadow-white/10 focus:outline-none data-[hover]:bg-emerald-700 data-[open]:bg-gray-700 data-[disabled]:bg-gray-500 data-[focus]:outline-1 data-[focus]:outline-white'
      )}
    />
  );
};
