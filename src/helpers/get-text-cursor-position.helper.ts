export const getAbsoluteCursorPosition = (
  focusedCellInputRef: HTMLDivElement | null | undefined
) => {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0 || !focusedCellInputRef)
    return null;

  const range = selection.getRangeAt(0);
  const { startContainer, startOffset } = range;

  let position = startOffset;
  let currentNode = startContainer;

  // Recorremos los nodos hermanos anteriores para calcular la posición absoluta
  while (currentNode && currentNode !== focusedCellInputRef) {
    while (currentNode.previousSibling) {
      currentNode = currentNode.previousSibling;
      position += currentNode.textContent?.length || 0;
    }
    currentNode = currentNode.parentNode as Node;
  }

  return position;
};
