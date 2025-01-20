/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-function-type */
import { CaretPosition } from '@/helpers';
import DOMPurify from 'dompurify';
import deepEqual from 'fast-deep-equal';
import React from 'react';

export type ContentEditableEvent = React.SyntheticEvent<any, Event> & {
  target: { value: string };
};
type Modify<T, R> = Pick<T, Exclude<keyof T, keyof R>> & R;
type DivProps = Modify<
  JSX.IntrinsicElements['div'],
  { onChange: (event: ContentEditableEvent) => void }
>;

export interface Props extends DivProps {
  cursorAtEndOnFocus?: boolean;
  plainValue?: string;
  html: string;
  disabled?: boolean;
  tagName?: string;
  className?: string;
  style?: React.CSSProperties;
  innerRef?: React.RefObject<HTMLElement> | Function;
}

function normalizeHtml(str: string): string {
  return (
    str &&
    str
      .replace(/&nbsp;|\u202F|\u00A0/g, ' ')
      .replace(/<br \/>/g, '<br>')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
  );
}

/**
 * A simple component for an html element with editable contents.
 */
export default class ContentEditable extends React.Component<Props> {
  lastHtml: string = this.props.html;
  lastCaretPosition: number | null = null;
  el: any =
    typeof this.props.innerRef === 'function'
      ? { current: null }
      : React.createRef<HTMLElement>();

  private getEl = () =>
    (this.props.innerRef && typeof this.props.innerRef !== 'function'
      ? this.props.innerRef
      : this.el
    ).current;

  private onFocus: React.FocusEventHandler<HTMLDivElement> = (e) => {
    const el = this.getEl();
    if (!el) return;

    if (this.props.onFocus) {
      this.props.onFocus?.(e);
    } else {
      this.emitChange(e);
    }

    if (this.props.cursorAtEndOnFocus && this.props.plainValue) {
      const caret = new CaretPosition(el);
      caret.set(this.props.plainValue.length, 5);
    }
  };

  emitChange = (originalEvt: React.SyntheticEvent<any>) => {
    const el = this.getEl();
    if (!el) return;

    const caret = new CaretPosition(el);
    this.lastCaretPosition = caret.get();

    const html = el.innerHTML;

    if (this.props.onChange && html !== this.lastHtml) {
      const evt = Object.assign({}, originalEvt, {
        target: {
          value: html,
        },
      });
      this.props.onChange(evt);
    }
    this.lastHtml = html;
  };

  private restoreCaretPosition(el: HTMLElement) {
    if (!el) return;
    // Place the caret at the end of the element
    const target = document.createTextNode('');
    el.appendChild(target);
    // do not move caret if element was not focused
    const isTargetFocused = document.activeElement === el;
    if (target !== null && target.nodeValue !== null && isTargetFocused) {
      const caret = new CaretPosition(el);
      caret.set(this.lastCaretPosition ?? this.props.plainValue?.length ?? 0);
    }
  }

  render() {
    const {
      cursorAtEndOnFocus,
      plainValue,
      tagName,
      html,
      innerRef,
      ...props
    } = this.props;

    return React.createElement(tagName || 'div', {
      ...props,
      ref:
        typeof innerRef === 'function'
          ? (current: HTMLElement) => {
              innerRef(current);
              this.el.current = current;
            }
          : innerRef || this.el,
      onInput: this.emitChange,
      onFocus: this.onFocus,
      onBlur: this.props.onBlur || this.emitChange,
      contentEditable: !this.props.disabled,
      dangerouslySetInnerHTML: { __html: DOMPurify.sanitize(html) },
    });
  }

  shouldComponentUpdate(nextProps: Props): boolean {
    const { props } = this;
    const el = this.getEl();

    if (!el) return true;

    if (normalizeHtml(nextProps.html) !== normalizeHtml(el.innerHTML)) {
      return true;
    }

    return (
      props.disabled !== nextProps.disabled ||
      props.tagName !== nextProps.tagName ||
      props.className !== nextProps.className ||
      !deepEqual(props.style, nextProps.style) || // Comparación profunda
      !deepEqual(props.innerRef, nextProps.innerRef)
    );
  }

  componentDidUpdate() {
    const el = this.getEl();
    if (!el) return;

    if (this.props.html !== el.innerHTML) {
      el.innerHTML = this.props.html;
    }

    this.lastHtml = this.props.html;
    this.restoreCaretPosition(el);
  }
}
