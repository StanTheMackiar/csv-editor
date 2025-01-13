import { FC } from 'react';

interface Props {
  menuPosition: { x: number; y: number };
  onCopy: VoidFunction;
  onCut: VoidFunction;
  onPaste: VoidFunction;
  onClean: VoidFunction;
}

export const SheetContextualMenu: FC<Props> = ({
  menuPosition,
  onCopy,
  onCut,
  onPaste,
  onClean,
}) => {
  const onClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
  };

  const contextMenuItems: ContextMenuItem[] = [
    {
      text: 'Cortar',
      shortcut: 'Ctrl + X',
      onClick: onCut,
    },
    {
      text: 'Copiar',
      shortcut: 'Ctrl + C',
      onClick: onCopy,
    },
    {
      text: 'Pegar',
      shortcut: 'Ctrl + V',
      onClick: onPaste,
    },
    {
      text: 'Limpiar selección',
      shortcut: 'Del',
      onClick: onClean,
    },
  ];

  return (
    <div
      onClick={onClick}
      className="absolute z-20 bg-white border rounded shadow-lg"
      style={{ left: `${menuPosition.x}px`, top: `${menuPosition.y}px` }}
    >
      <ul className="p-2 min-w-80">
        {contextMenuItems.map((element) => (
          <li
            key={element.text}
            onClick={element.onClick}
            className="p-2 hover:bg-gray-200 cursor-pointer flex justify-between"
          >
            <span className="font-thin text-gray-800">{element.text}</span>
            <span className="font-bold text-gray-600">{element.shortcut}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

interface ContextMenuItem {
  text: string;
  shortcut: string;
  onClick: VoidFunction;
}
