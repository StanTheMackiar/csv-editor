import { INITIAL_COLS_QTY, INITIAL_ROWS_QTY } from '@/helpers';
import { useSheetStore } from '@/stores/useSheetStore';
import { Field, Input, Label } from '@headlessui/react';
import { FC, FormEventHandler, useState } from 'react';
import { CustomButton } from '../core';
import { CustomDialog } from '../core/dialog/CustomDialog';

interface Props {
  isNewSheet?: boolean;
  onClose: VoidFunction;
  open: boolean;

  onSuccess: (name: string, rows?: number, cols?: number) => void;
}

export const NewSheetDialog: FC<Props> = ({
  isNewSheet = false,
  onClose,
  open,
  onSuccess,
}) => {
  const sheetName = useSheetStore((state) => state.name);

  const [name, setName] = useState(isNewSheet ? 'New Sheet' : sheetName);
  const [rows, setRows] = useState(INITIAL_ROWS_QTY);
  const [cols, setCols] = useState(INITIAL_COLS_QTY);

  const onSubmit: FormEventHandler<HTMLFormElement> = (e) => {
    e.preventDefault();

    onSuccess(name, rows, cols);
  };

  const disabledSubmit = !name || (isNewSheet && (!rows || !cols));

  return (
    <CustomDialog
      open={open}
      onClose={onClose}
      title={{
        children: isNewSheet ? 'New Sheet' : 'Rename Sheet',
      }}
    >
      <form
        onSubmit={onSubmit}
        className="flex flex-col justify-between items-center gap-4 w-full"
      >
        <Field className="w-full">
          <Label className="text-sm/6 text-gray-800">
            {isNewSheet
              ? 'Please input the name for the new sheet'
              : 'Please input the new name for the sheet.'}
          </Label>
          <Input
            autoFocus
            onChange={(e) => setName(e.target.value)}
            value={name}
            className="mt-3 block w-full rounded-lg border bg-white py-1.5 px-3 text-sm/6 text-gray-800 focus:outline-none data-[focus]:outline-2 data-[focus]:-outline-offset-2 data-[focus]:outline-white/25"
          />
        </Field>

        {isNewSheet && (
          <div className="flex gap-4 items-center">
            <Field className="w-full">
              <Label className="text-sm/6 text-gray-800">Rows Quantity</Label>
              <Input
                type="number"
                onChange={(e) => setRows(Number(e.target.value))}
                value={rows}
                className="mt-3 block w-full rounded-lg border bg-white py-1.5 px-3 text-sm/6 text-gray-800 focus:outline-none data-[focus]:outline-2 data-[focus]:-outline-offset-2 data-[focus]:outline-white/25"
              />
            </Field>

            <Field className="w-full">
              <Label className="text-sm/6 text-gray-800">
                Columns Quantity
              </Label>
              <Input
                type="number"
                onChange={(e) => setCols(Number(e.target.value))}
                value={cols}
                className="mt-3 block w-full rounded-lg border bg-white py-1.5 px-3 text-sm/6 text-gray-800 focus:outline-none data-[focus]:outline-2 data-[focus]:-outline-offset-2 data-[focus]:outline-white/25"
              />
            </Field>
          </div>
        )}

        <div className="flex items-center justify-end gap-4">
          <CustomButton
            disabled={disabledSubmit}
            className="bg-emerald-600"
            type="submit"
          >
            {isNewSheet ? 'Create' : 'Rename'}
          </CustomButton>

          <CustomButton
            className="bg-red-800 data-[hover]:bg-red-900"
            onClick={onClose}
          >
            Cancel
          </CustomButton>
        </div>
      </form>
    </CustomDialog>
  );
};
