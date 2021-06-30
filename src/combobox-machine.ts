import { assign, createMachine, send } from "xstate";
import { listMachine } from "./list-machine";

type Item = string;

export type ComboboxContext = {
  items: Item[];
  query: string;
  results: Item[];
  selection?: Item;
  pointer:
    | { placement: 'none' }
    | { placement: 'list'; index: number }
    | { placement: 'footer' };
};

export type ComboboxEvent =
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

export function createComboboxMachine({
  items,
  search,
}: {
  items: Item[];
  search: (items: Item[], query: string) => Item[];
}) {
  return createMachine<ComboboxContext, ComboboxEvent>(
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
                  items: (context: ComboboxContext) => context.items,
                  pointer: (context: ComboboxContext) =>
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
                  items: (context: ComboboxContext) => context.results,
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
