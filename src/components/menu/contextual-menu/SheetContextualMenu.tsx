'use client';

import { ContextMenuItem } from '@/types/sheet/menu/context-menu.type';
import { Icon } from '@iconify/react/dist/iconify.js';
import { FC } from 'react';

interface Props {
  menuPosition: { x: number; y: number };
  items: ContextMenuItem[];
}

export const SheetContextualMenu: FC<Props> = ({ menuPosition, items }) => {
  return (
    <div
      className="absolute z-20 bg-white border rounded-b shadow-lg"
      style={{ left: `${menuPosition.x}px`, top: `${menuPosition.y}px` }}
    >
      <ul className="p-2 min-w-60">
        {items.map((item) => (
          <li
            key={item.text}
            onClick={item.onClick}
            className="px-2 py-1.5 hover:bg-gray-200 rounded-lg cursor-pointer flex justify-between"
          >
            <div className="flex gap-2 items-center">
              <Icon icon={item.icon} className="text-sm" />

              {item.text}
            </div>

            <kbd className="items-center my-auto  text-xs text-gray-500">
              {item.shortcut}
            </kbd>
          </li>
        ))}
      </ul>
    </div>
  );
};
