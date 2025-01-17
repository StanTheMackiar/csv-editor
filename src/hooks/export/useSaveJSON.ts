import { useSheetStore } from '@/stores/useSheetStore';
import { useShallow } from 'zustand/shallow';

export const useSaveJSON = () => {
  const [exportSheet, importSheet] = useSheetStore(
    useShallow((state) => [state.exportSheet, state.importSheet])
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

  const importJSON = (file: File) => {
    const reader = new FileReader();

    reader.onload = async (e) => {
      const json = e.target?.result as string;
      importSheet(json);
    };

    reader.readAsText(file);
  };

  return {
    exportJSON,
    importJSON,
  };
};
