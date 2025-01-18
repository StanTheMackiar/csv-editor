import { useModalState } from '@/hooks';
import { useSaveExcel } from '@/hooks/export/useSaveExcel';
import { useSaveJSON } from '@/hooks/export/useSaveJSON';
import { useSheetStore } from '@/stores/useSheetStore';
import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react';
import { Icon } from '@iconify/react/dist/iconify.js';
import { FC, useCallback } from 'react';
import { useShallow } from 'zustand/shallow';
import { NameSheetDialog } from './RenameDialog';

export const ContextualBar: FC = () => {
  const [newSheet, name, setName] = useSheetStore(
    useShallow((state) => [state.newSheet, state.name, state.setName])
  );

  const [renameDialogOpen, openRenameDialog, closeRenameDialog] =
    useModalState();

  const [
    nameNewSheetDialogOpen,
    openNameNewSheetDialog,
    closeNameNewSheetDialog,
  ] = useModalState();

  const { exportExcel } = useSaveExcel();

  const { exportJSON, importJSON } = useSaveJSON();

  const importFile = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json .xlsx';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      importJSON(file);
    };

    input.click();
  }, [importJSON]);

  const onNewSheet = (name: string) => {
    newSheet(name);

    closeNameNewSheetDialog();
  };

  const contextualBar = [
    {
      name: 'File',
      options: [
        {
          name: 'Rename',
          icon: 'mdi:rename',
          shortcut: 'F2',
          action: openRenameDialog,
        },
        {
          name: 'New',
          icon: 'mdi:file',
          shortcut: 'Ctrl + N',
          action: openNameNewSheetDialog,
        },
        {
          name: 'Open',
          icon: 'material-symbols:file-open',
          shortcut: 'Ctrl + O',
          action: importFile,
        },
        {
          name: 'Export Excel',
          icon: 'icon-park-outline:excel',
          shortcut: 'Ctrl + S',
          action: exportExcel,
        },
        {
          name: 'Export JSON',
          icon: 'si:json-duotone',
          shortcut: 'Ctrl + J',
          action: exportJSON,
        },
      ],
    },
  ];

  const onRenameSheet = useCallback(
    (newName: string) => {
      closeRenameDialog();

      setName(newName);
    },
    [closeRenameDialog, setName]
  );

  return (
    <>
      <section className="sticky top-0 w-full">
        <div className="select-none sticky top-0 flex justify-center items-center  px-2 bg-green-600 border-b border-gray-300">
          <h1
            onClick={openRenameDialog}
            className="cursor-pointer text-base py-1 font-medium text-white"
          >
            {name}
          </h1>
        </div>

        <div className="sticky top-0 flex px-2 bg-gray-200 border-b border-gray-300">
          {contextualBar.map((item) => (
            <Menu as="nav" key={item.name}>
              <MenuButton className="inline-flex items-center gap-2 py-1 px-5 text-sm font-medium text-gray-800 shadow-inner focus:outline-none data-[focus]:outline-1 data-[focus]:outline-white">
                {item.name}
              </MenuButton>

              <MenuItems
                transition
                anchor="bottom end"
                className="w-72 z-50 origin-top-right rounded-b-lg border bg-white p-1 text-sm/6 text-gray-800 transition duration-100 ease-out [--anchor-gap:var(--spacing-1)] focus:outline-none data-[closed]:scale-95 data-[closed]:opacity-0"
              >
                {item.options.map((option) => (
                  <MenuItem key={option.name}>
                    <button
                      onClick={option.action}
                      className="group flex w-full items-center gap-2 rounded-lg py-1.5 px-3  hover:bg-gray-200"
                    >
                      <Icon icon={option.icon} className="size-4" />

                      {option.name}

                      <kbd className="ml-auto text-xs text-gray-500">
                        {option.shortcut}
                      </kbd>
                    </button>
                  </MenuItem>
                ))}
              </MenuItems>
            </Menu>
          ))}
        </div>
      </section>

      <NameSheetDialog
        onSuccess={onRenameSheet}
        onClose={closeRenameDialog}
        open={renameDialogOpen}
      />

      <NameSheetDialog
        isNewSheet
        onSuccess={onNewSheet}
        onClose={closeNameNewSheetDialog}
        open={nameNewSheetDialogOpen}
      />
    </>
  );
};
