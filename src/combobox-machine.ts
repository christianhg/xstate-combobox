import { assign, createMachine, send } from 'xstate';
import { createListMachine } from './list-machine';

export type ComboboxItem = {
  id: string;
  label: string;
};

export type ComboboxSearch<TComboboxItem extends ComboboxItem> = (
  items: TComboboxItem[],
  query: string
) => TComboboxItem[];

export type ComboboxItemComparator<TComboboxItem extends ComboboxItem> = (
  a: TComboboxItem,
  b: TComboboxItem
) => boolean;

export type ComboboxContext<TComboboxItem> = {
  items: TComboboxItem[];
  query: string;
  results: TComboboxItem[];
  selection?: TComboboxItem;
  pointer:
    | { placement: 'none' }
    | { placement: 'list'; index: number }
    | { placement: 'footer' };
};

export type ComboboxEvent<TComboboxItem> =
  | { type: 'FOCUS' }
  | { type: 'BLUR' }
  | { type: 'UP' }
  | { type: 'DOWN' }
  | { type: 'MOUSE_ENTER'; index: number }
  | { type: 'MOUSE_LEAVE'; index: number }
  | { type: 'ENTER' }
  | { type: 'QUERY_CHANGED'; query: string }
  | { type: 'ITEM_SELECTED'; item: TComboboxItem }
  | {
      type: 'POINTER_MOVED';
      pointer:
        | { placement: 'none' }
        | { placement: 'list'; index: number }
        | { placement: 'footer' };
    }
  | { type: 'FOOTER_SELECTED' };

export function createComboboxMachine<TComboboxItem extends ComboboxItem>({
  items,
  search,
  comparator,
  onFooterSelected,
}: {
  items: TComboboxItem[];
  search: ComboboxSearch<TComboboxItem>;
  comparator: ComboboxItemComparator<TComboboxItem>;
  onFooterSelected: () => void;
}) {
  const listMachine = createListMachine<TComboboxItem>();

  return createMachine<
    ComboboxContext<TComboboxItem>,
    ComboboxEvent<TComboboxItem>
  >(
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
          entry: ['clearQuery'],
          on: {
            FOCUS: { target: 'focused' },
          },
        },
        focused: {
          exit: ['clearPointer'],
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
              actions: [onFooterSelected],
            },
          },
          initial: 'select',
          states: {
            idle: {
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
              tags: ['open', 'showAll'],
              invoke: {
                id: 'list',
                src: listMachine,
                data: {
                  items: (context: ComboboxContext<TComboboxItem>) =>
                    context.items,
                  pointer: (context: ComboboxContext<TComboboxItem>) =>
                    context.selection
                      ? findIndex(context.items, context.selection, comparator)
                      : undefined,
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
                MOUSE_ENTER: {
                  actions: [
                    send(
                      (context, event) => ({
                        type: 'MOUSE_ENTER',
                        index: event.index,
                      }),
                      { to: 'list' }
                    ),
                  ],
                },
                MOUSE_LEAVE: {
                  actions: [
                    send(
                      (context, event) => ({
                        type: 'MOUSE_LEAVE',
                        index: event.index,
                      }),
                      { to: 'list' }
                    ),
                  ],
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
            noResults: {
              tags: ['open'],
              invoke: {
                id: 'list',
                src: listMachine,
                data: {
                  items: [],
                  pointer: undefined,
                },
              },
              entry: [send({ type: 'OPEN' }, { to: 'list' })],
              on: {
                DOWN: {
                  actions: [send({ type: 'DOWN' }, { to: 'list' })],
                },
                ENTER: {
                  actions: [send({ type: 'SELECT' }, { to: 'list' })],
                },
              },
            },
            hasResults: {
              tags: ['open', 'showResults'],
              invoke: {
                id: 'list',
                src: listMachine,
                data: {
                  items: (context: ComboboxContext<TComboboxItem>) =>
                    context.results,
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
        clearQuery: assign({
          query: (context) => '',
        }),
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
