import { useMachine } from '@xstate/react';
import * as React from 'react';
import { StateValue } from 'xstate';
import {
  ComboboxContext,
  ComboboxItem,
  ComboboxItemComparator,
  ComboboxSearch,
  createComboboxMachine,
} from './combobox-machine';

type ComboboxReturnType<TItem> = {
  debug: {
    state: StateValue;
    context: ComboboxContext<TItem>;
  };
  getInputProps: () => {
    onFocus: React.FocusEventHandler<HTMLInputElement>;
    onBlur: React.FocusEventHandler<HTMLInputElement>;
    onChange: React.ChangeEventHandler<HTMLInputElement>;
    ref: React.RefObject<HTMLInputElement>;
  };
  getItemProps: (index: number) => {
    'data-highlighted': string | undefined;
  };
  getFooterProps: () => {
    'data-highlighted': string | undefined;
  };
  isOpen: boolean;
  list: TItem[];
  query: string;
  selection?: TItem;
};

export function useCombobox<TItem extends ComboboxItem>({
  inputRef,
  items,
  search,
  comparator,
}: {
  inputRef: React.RefObject<HTMLInputElement>;
  items: TItem[];
  search: ComboboxSearch<TItem>;
  comparator: ComboboxItemComparator<TItem>;
}): ComboboxReturnType<TItem> {
  const [current, send] = useMachine(() =>
    createComboboxMachine({ items, search, comparator })
  );

  React.useEffect(() => {
    const inputField = inputRef.current;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault(); // Prevent caret movement in the input field
        send('DOWN');
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault(); // Prevent caret movement in the input fields
        send('UP');
      }
      if (e.key === 'Enter') {
        send('ENTER');
      }
    };

    inputField?.addEventListener('keydown', onKeyDown);

    return () => {
      inputField?.removeEventListener('keydown', onKeyDown);
    };
  }, [send, inputRef]);

  return {
    debug: {
      context: current.context,
      state: current.value,
    },
    getInputProps: () => ({
      onFocus: () => {
        send('FOCUS');
      },
      onBlur: () => {
        send('BLUR');
      },
      onChange: (e) => {
        send({
          type: 'QUERY_CHANGED',
          query: e.currentTarget.value,
        });
      },
      ref: inputRef,
    }),
    getItemProps: (index: number) => ({
      'data-highlighted':
        current.context.pointer.placement === 'list' &&
        current.context.pointer.index === index
          ? ''
          : undefined,
    }),
    getFooterProps: () => ({
      'data-highlighted':
        current.context.pointer.placement === 'footer' ? '' : undefined,
    }),
    isOpen: current.tags.has('open'),
    list: current.tags.has('showAll')
      ? current.context.items
      : current.tags.has('showResults')
      ? current.context.results
      : [],
    query: current.context.query,
    selection: current.context.selection,
  };
}
