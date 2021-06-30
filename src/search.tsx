import { useMachine } from '@xstate/react';
import * as React from 'react';
import { assign, createMachine, send, sendParent, StateValue } from 'xstate';

type Item = string;

export const Search = () => {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const items: Item[] = [
    'apple',
    'banana',
    'coconut',
    'orange',
    'watermelon',
    'pear',
    'strawberry',
    'peach',
    'mango',
    'blueberry',
    'kiwi',
    'lime',
    'grape',
    'raspberry',
  ];
  const search = (items: Item[], query: string) => {
    return items.filter((item) =>
      item.toLowerCase().includes(query.toLowerCase())
    );
  };
  const {
    debug,
    getInputProps,
    getItemProps,
    getFooterProps,
    isOpen,
    selection,
    list,
    query,
  } = useCombobox({
    inputRef,
    items,
    search,
  });

  return (
    <>
      <input type="text" {...getInputProps()} value={selection ?? query} />
      <pre>Selection: {selection}</pre>
      <pre>{JSON.stringify(debug.state)}</pre>
      <pre>{JSON.stringify(debug.context.items)}</pre>
      <pre>{JSON.stringify(debug.context.query)}</pre>
      <pre>{JSON.stringify(debug.context.results)}</pre>
      {isOpen ? (
        <div className="combobox-list">
          <ul>
            {list.map((item, index) => (
              <li {...getItemProps(index)} key={index}>
                {item}
              </li>
            ))}
          </ul>
          <p {...getFooterProps()}>Can't find your journal?</p>
        </div>
      ) : undefined}
    </>
  );
};

type ComboboxReturnType = {
  debug: {
    state: StateValue;
    context: SearchContext;
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
  list: Item[];
  query: string;
  selection?: Item;
};

function useCombobox({
  inputRef,
  items,
  search,
}: {
  inputRef: React.RefObject<HTMLInputElement>;
  items: Item[];
  search: (items: Item[], query: string) => Item[];
}): ComboboxReturnType {
  const [current, send] = useMachine(() =>
    createComboboxMachine({ items, search })
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

  console.log(current);

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
    isOpen: true,
    list: current.tags.has('showAll')
      ? current.context.items
      : current.tags.has('showResults')
      ? current.context.results
      : [],
    query: current.context.query,
    selection: current.context.selection,
  };
}

type SearchContext = {
  items: Item[];
  query: string;
  results: Item[];
  selection?: Item;
  pointer:
    | { placement: 'none' }
    | { placement: 'list'; index: number }
    | { placement: 'footer' };
};

function createComboboxMachine({
  items,
  search,
}: {
  items: Item[];
  search: (items: Item[], query: string) => Item[];
}) {
  type SearchEvent =
    | { type: 'FOCUS' }
    | { type: 'BLUR' }
    | { type: 'UP' }
    | { type: 'DOWN' }
    | { type: 'ENTER' }
    | { type: 'QUERY_CHANGED'; query: string }
    | { type: 'ITEM_SELECTED'; item: Item }
    | {
        type: 'POINTER_MOVED';
        pointer:
          | { placement: 'none' }
          | { placement: 'list'; index: number }
          | { placement: 'footer' };
      }
    | { type: 'FOOTER_SELECTED' };

  type ListContext = {
    items: Item[];
    pointer?: number;
  };
  type ListEvent =
    | { type: 'UPDATE_ITEMS'; items: Item[] }
    | { type: 'UP' }
    | { type: 'DOWN' }
    | { type: 'OPEN' }
    | { type: 'CLOSE' }
    | { type: 'SELECT' };

  const listMachine = createMachine<ListContext, ListEvent>(
    {
      id: 'list',
      context: {
        pointer: undefined,
        items: [],
      },
      initial: 'closed',
      states: {
        closed: {
          entry: [
            (context) => {
              console.log('closed', context);
            },
          ],
          on: {
            OPEN: { target: 'opened' },
          },
        },
        opened: {
          entry: [
            (context) => {
              console.log('opened', context);
            },
          ],
          on: {
            CLOSE: { target: 'closed' },
          },
          initial: 'idle',
          states: {
            idle: {
              always: [{ cond: 'hasPointer', target: 'browsingList' }],
              entry: [
                (context) => {
                  console.log('idle', context);
                },
              ],
              on: {
                DOWN: [
                  {
                    cond: 'hasItems',
                    actions: ['pointAtFirstItem'],
                    target: 'browsingList',
                  },
                  { target: 'focusingFooter' },
                ],
              },
            },
            browsingList: {
              entry: [
                'sendListPointer',
                () => {
                  console.log('browsingList');
                },
              ],
              on: {
                UP: [
                  { cond: 'firstItem', target: 'browsingList', internal: true },
                  { actions: ['moveUp'], target: 'browsingList' },
                ],
                DOWN: [
                  { cond: 'lastItem', target: 'focusingFooter' },
                  { actions: ['moveDown'], target: 'browsingList' },
                ],
                SELECT: {
                  actions: 'sendItemSelected',
                },
              },
            },
            focusingFooter: {
              entry: [
                'sendFooterPointer',
                () => {
                  console.log('focusingFooter');
                },
              ],
              on: {
                UP: {
                  cond: 'hasItems',
                  actions: ['pointAtLastItem'],
                  target: 'browsingList',
                },
                SELECT: {
                  actions: 'sendFooterSelected',
                },
              },
            },
          },
        },
      },
    },
    {
      actions: {
        moveUp: assign({
          pointer: (context) =>
            context.pointer !== undefined
              ? context.pointer - 1
              : context.pointer,
        }),
        moveDown: assign({
          pointer: (context) =>
            context.pointer !== undefined
              ? context.pointer + 1
              : context.pointer,
        }),
        sendListPointer: sendParent((context) => ({
          type: 'POINTER_MOVED',
          pointer: { placement: 'list', index: context.pointer },
        })),
        sendFooterPointer: sendParent((context) => ({
          type: 'POINTER_MOVED',
          pointer: { placement: 'footer' },
        })),
        sendItemSelected: sendParent((context) => ({
          type: 'ITEM_SELECTED',
          item: context.items[context.pointer!],
        })),
        sendFooterSelected: sendParent({ type: 'FOOTER_SELECTED' }),
        pointAtFirstItem: assign({
          pointer: (context) => 0,
        }),
        pointAtLastItem: assign({
          pointer: (context) => context.items.length - 1,
        }),
      },
      guards: {
        hasPointer: (context) => context.pointer !== undefined,
        hasItems: (context) => context.items.length > 0,
        firstItem: (context) => {
          console.log('first item?', context);
          return context.pointer === 0;
        },
        lastItem: (context) => {
          console.log('last item?', context);
          return context.items.length - 1 === context.pointer;
        },
      },
    }
  );

  return createMachine<SearchContext, SearchEvent>(
    {
      id: 'search',
      initial: 'blurred',
      context: {
        items,
        query: '',
        results: [],
        selection: undefined,
        pointer: { placement: 'none' },
      },
      states: {
        blurred: {
          on: {
            FOCUS: { target: 'focused' },
          },
        },
        focused: {
          on: {
            BLUR: { target: 'blurred' },
            QUERY_CHANGED: {
              target: '.searching',
              actions: ['performSearch'],
            },
            ITEM_SELECTED: {
              actions: ['setSelection'],
              target: '.idle',
            },
            POINTER_MOVED: {
              actions: ['setPointer'],
            },
            FOOTER_SELECTED: {
              actions: () => {
                console.log('footer selected');
              },
            },
          },
          initial: 'select',
          states: {
            idle: {
              entry: [
                () => {
                  console.log('idle search');
                },
              ],
              on: {
                UP: {
                  target: 'select',
                },
                DOWN: {
                  target: 'select',
                },
              },
            },
            select: {
              tags: ['showAll'],
              invoke: {
                id: 'list',
                src: listMachine,
                data: {
                  items: (context: SearchContext) => context.items,
                  pointer: (context: SearchContext) =>
                    context.selection
                      ? findIndex(
                          context.items,
                          context.selection,
                          (a, b) => a === b
                        )
                      : undefined,
                },
              },
              entry: [
                () => {
                  console.log('select mode');
                },
                send({ type: 'OPEN' }, { to: 'list' }),
              ],
              on: {
                UP: {
                  actions: [send({ type: 'UP' }, { to: 'list' })],
                },
                DOWN: {
                  actions: [send({ type: 'DOWN' }, { to: 'list' })],
                },
                ENTER: {
                  actions: [send({ type: 'SELECT' }, { to: 'list' })],
                },
              },
            },
            searching: {
              entry: ['clearSelection', 'clearPointer'],
              always: [
                {
                  cond: 'noResults',
                  target: 'noResults',
                },
                {
                  cond: 'hasResults',
                  target: 'hasResults',
                },
                {
                  target: 'idle',
                },
              ],
            },
            noResults: {},
            hasResults: {
              tags: ['showResults'],
              invoke: {
                id: 'list',
                src: listMachine,
                data: {
                  items: (context: SearchContext) => context.results,
                  pointer: undefined,
                },
              },
              entry: [send({ type: 'OPEN' }, { to: 'list' })],
              on: {
                UP: {
                  actions: [send({ type: 'UP' }, { to: 'list' })],
                },
                DOWN: {
                  actions: [send({ type: 'DOWN' }, { to: 'list' })],
                },
                ENTER: {
                  actions: [send({ type: 'SELECT' }, { to: 'list' })],
                },
              },
            },
          },
        },
      },
    },
    {
      actions: {
        performSearch: assign((context, event) =>
          event.type === 'QUERY_CHANGED'
            ? {
                query: event.query,
                results: search(context.items, event.query),
              }
            : context
        ),
        clearPointer: assign({
          pointer: (context) => ({ placement: 'none' }),
        }),
        setPointer: assign((context, event) =>
          event.type === 'POINTER_MOVED' ? { pointer: event.pointer } : context
        ),
        clearSelection: assign({
          selection: (context) => undefined,
        }),
        setSelection: assign((context, event) =>
          event.type === 'ITEM_SELECTED'
            ? {
                selection: event.item,
              }
            : context
        ),
      },
      guards: {
        hasResults: (context) =>
          context.query.length > 0 && context.results.length > 0,
        noResults: (context) =>
          context.query.length > 0 && context.results.length === 0,
      },
    }
  );
}

function findIndex<A>(xs: A[], x: A, comparator: (x: A, y: A) => boolean) {
  const index = xs.findIndex((y) => comparator(x, y));
  return index >= 0 ? index : undefined;
}
