import { useSheetStore } from '@/stores/useSheetStore';
import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react';
import { Icon } from '@iconify/react/dist/iconify.js';
import { FC } from 'react';
import { useShallow } from 'zustand/shallow';

export const ContextualBar: FC = () => {
  const [exportSheet, importSheet, newSheet, name] = useSheetStore(
    useShallow((state) => [
      state.exportSheet,
      state.importSheet,
      state.newSheet,
      state.name,
    ])
  );

  const exportJSON = () => {
    const json = exportSheet();

    // Descargar como archivo JSON
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'MySheet.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const importJSON = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      const reader = new FileReader();

      reader.onload = async (e) => {
        const json = e.target?.result as string;
        importSheet(json);
      };

      reader.readAsText(file);
    };

    input.click();
  };

  const onNewSheet = () => {
    newSheet('New Sheet');
  };

  const contextualBar = [
    {
      name: 'File',
      options: [
        {
          name: 'New',
          icon: 'mdi:file',
          shortcut: 'Ctrl + N',
          action: onNewSheet,
        },
        {
          name: 'Open',
          icon: 'material-symbols:file-open',
          shortcut: 'Ctrl + O',
          action: importJSON,
        },
        {
          name: 'Export JSON',
          icon: 'si:json-duotone',
          shortcut: 'Ctrl + S',
          action: exportJSON,
        },
        // {
        //   name: 'Export CSV',
        //   icon: 'ph:file-csv-fill',
        //   shortcut: 'Ctrl + G',
        //   action: () => {},
        // },
      ],
    },
  ];

  return (
    <section className="sticky top-0 w-full">
      <div className="sticky top-0 flex justify-center items-center  px-2 bg-gray-300 border-b border-gray-300">
        <h1 className="text-sm py-1 font-semibold text-gray-800">{name}</h1>
      </div>
      <div className="sticky top-0 flex px-2 bg-gray-50 border-b border-gray-300">
        {contextualBar.map((item) => (
          <Menu as="nav" key={item.name}>
            <MenuButton className="inline-flex items-center gap-2 py-1 px-5 text-sm font-semibold text-gray-800 shadow-inner focus:outline-none data-[focus]:outline-1 data-[focus]:outline-white">
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
  );
};
