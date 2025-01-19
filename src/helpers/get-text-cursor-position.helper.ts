import { wait } from './promise/wait.helper';

export class CaretPosition {
  constructor(private node: HTMLDivElement | HTMLElement | null | undefined) {}

  private findNodeAndOffset = (
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
        const result = this.findNodeAndOffset(
          childNode,
          position - currentPosition
        );
        if (result) return result;
      }

      currentPosition += length;
    }

    return null;
  };

  get() {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return null;

    const range = selection.getRangeAt(0);
    const { startContainer, startOffset } = range;

    let position = startOffset;
    let currentNode = startContainer;

    // Recorremos los nodos hermanos anteriores para calcular la posición absoluta
    while (currentNode && currentNode !== this.node) {
      while (currentNode.previousSibling) {
        currentNode = currentNode.previousSibling;
        position += currentNode.textContent?.length || 0;
      }
      currentNode = currentNode.parentNode as Node;
    }

    return position;
  }

  async set(targetPosition: number, waitTime?: number) {
    const selection = window.getSelection();
    if (!selection || !this.node) return;

    const execute = () => {
      if (!this.node) return;

      const result = this.findNodeAndOffset(this.node, targetPosition);

      if (result) {
        const range = document.createRange();
        range.setStart(result.node, result.offset);
        range.collapse(true);

        selection.removeAllRanges();
        selection.addRange(range);
      }
    };

    if (waitTime) {
      await wait(waitTime).then(execute);
    } else {
      execute();
    }
  }

  /**
   * Devuelve el nodo en el que está el cursor actualmente.
   * @returns El nodo donde está el cursor o null si no se encuentra un rango.
   */
  getCurrentCaretNode() {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return null;

    const range = selection.getRangeAt(0);
    const { startContainer } = range;

    return startContainer;
  }
}
