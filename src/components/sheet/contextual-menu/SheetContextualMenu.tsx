import { ContextMenuItem } from '@/types/sheet/menu/context-menu.type';
import { Icon } from '@iconify/react/dist/iconify.js';
import { FC } from 'react';

interface Props {
  menuPosition: { x: number; y: number };
  items: ContextMenuItem[];
}

export const SheetContextualMenu: FC<Props> = ({ menuPosition, items }) => {
  const onClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
  };

  return (
    <div
      onClick={onClick}
      className="absolute z-20 bg-white border rounded shadow-lg"
      style={{ left: `${menuPosition.x}px`, top: `${menuPosition.y}px` }}
    >
      <ul className="p-2 min-w-60">
        {items.map((item) => (
          <li
            key={item.text}
            onClick={item.onClick}
            className="p-2 hover:bg-gray-200 cursor-pointer flex justify-between"
          >
            <div className="flex gap-3 items-center">
              <Icon icon={item.icon} className="text-lg" />
              <span className="font-normal text-gray-800">{item.text}</span>
            </div>

            <span className="font-medium italic text-gray-600">
              {item.shortcut}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
};
