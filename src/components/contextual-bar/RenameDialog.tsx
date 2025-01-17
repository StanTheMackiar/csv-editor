import KeyEnum from '@/enum/key.enum';
import { useSheetStore } from '@/stores/useSheetStore';
import { Field, Input, Label } from '@headlessui/react';
import clsx from 'clsx';
import { FC, useState } from 'react';
import { CustomButton } from '../core';
import { CustomDialog } from '../core/dialog/CustomDialog';

interface Props {
  isNewSheet?: boolean;
  onClose: VoidFunction;
  open: boolean;

  onSuccess: (name: string) => void;
}

export const NameSheetDialog: FC<Props> = ({
  isNewSheet = false,
  onClose,
  open,
  onSuccess,
}) => {
  const sheetName = useSheetStore((state) => state.name);

  const [name, setName] = useState(isNewSheet ? '' : sheetName);

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === KeyEnum.Enter) {
      onSuccess(name);
    }
  };

  return (
    <CustomDialog
      open={open}
      onClose={onClose}
      title={{
        children: isNewSheet ? 'New Sheet' : 'Rename Sheet',
      }}
    >
      <div className="flex flex-col justify-between items-center gap-4">
        <Field>
          <Label className="text-sm/6 text-gray-800">
            {isNewSheet
              ? 'Please input the name for the new sheet'
              : 'Please input the new name for the sheet.'}
          </Label>
          <Input
            autoFocus
            onKeyDown={onKeyDown}
            onChange={(e) => setName(e.target.value)}
            defaultValue={name}
            className={clsx(
              'mt-3 block w-full rounded-lg border bg-white py-1.5 px-3 text-sm/6 text-gray-800',
              'focus:outline-none data-[focus]:outline-2 data-[focus]:-outline-offset-2 data-[focus]:outline-white/25'
            )}
          />
        </Field>

        <div className="flex items-center justify-end gap-4">
          <CustomButton
            disabled={!name}
            className="bg-emerald-600"
            onClick={() => onSuccess(name)}
          >
            {isNewSheet ? 'Create' : 'Rename'}
          </CustomButton>

          <CustomButton
            className="bg-red-800 data-[hover]:bg-red-"
            onClick={onClose}
          >
            Cancel
          </CustomButton>
        </div>
      </div>
    </CustomDialog>
  );
};
