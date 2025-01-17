import {
  Description,
  Dialog,
  DialogBackdrop,
  DialogPanel,
  DialogTitle,
} from '@headlessui/react';
import { FC, PropsWithChildren, ReactNode } from 'react';

type DialogSpecificProps = {
  className?: string;
  children?: ReactNode;
};

interface Props {
  open: boolean;
  onClose: VoidFunction;
  title?: DialogSpecificProps;
  description?: DialogSpecificProps;
}

export const CustomDialog: FC<PropsWithChildren<Props>> = ({
  open,
  onClose,
  children,
  description,
  title,
}) => {
  return (
    <Dialog
      transition
      open={open}
      onClose={() => onClose()}
      className="relative z-50 transition  duration-300 ease-out data-[closed]:opacity-0"
    >
      <DialogBackdrop className="fixed inset-0 bg-black/30" />

      <div className="fixed inset-0 flex w-screen items-center justify-center p-4">
        <DialogPanel className="max-w-lg rounded-2xl space-y-4 border bg-white p-6">
          <DialogTitle className={title?.className ?? 'font-bold'} {...title} />
          <Description {...description} />

          {children}
        </DialogPanel>
      </div>
    </Dialog>
  );
};
