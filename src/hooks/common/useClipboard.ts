import { useCallback } from 'react';
import toast from 'react-hot-toast';

export const useClipboard = () => {
  const copy = useCallback(async (text: string) => {
    if (!navigator?.clipboard) {
      const message = 'Clipboard not supported';

      toast.error(message);
      throw new Error(message);
    }

    // Try to save to clipboard then save it in the state if worked
    try {
      await navigator.clipboard.writeText(text);

      return true;
    } catch (error) {
      toast.error(`Copy failed: ${error}`);

      throw new Error('Copy failed');
    }
  }, []);

  const paste = useCallback(async (): Promise<string> => {
    if (!navigator?.clipboard) {
      const message = 'Clipboard not supported';

      toast.error(message);
      throw new Error(message);
    }

    try {
      return await navigator.clipboard.readText();
    } catch (error) {
      const message = `Paste failed: ${error}`;

      toast.error(message);
      throw new Error(message);
    }
  }, []);

  return {
    copy,
    paste,
  };
};
