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

export const setAbsoluteCursorPosition = (
  element: HTMLDivElement | null | undefined,
  targetPosition: number
) => {
  if (!element) return;

  const selection = window.getSelection();
  if (!selection) return;

  // Función recursiva para encontrar el nodo y offset correctos
  const findNodeAndOffset = (
    node: Node,
    position: number
  ): { node: Node; offset: number } | null => {
    if (node.nodeType === Node.TEXT_NODE) {
      const length = node.textContent?.length || 0;
      if (position <= length) {
        return { node, offset: position };
      }
      return null;
    }

    let currentPosition = 0;
    for (const childNode of Array.from(node.childNodes)) {
      const length = childNode.textContent?.length || 0;

      if (currentPosition + length >= position) {
        // La posición objetivo está en este nodo o sus hijos
        const result = findNodeAndOffset(childNode, position - currentPosition);
        if (result) return result;
      }

      currentPosition += length;
    }

    return null;
  };

  const result = findNodeAndOffset(element, targetPosition);

  if (result) {
    const range = document.createRange();
    range.setStart(result.node, result.offset);
    range.collapse(true);

    selection.removeAllRanges();
    selection.addRange(range);
  }
};
