import { assign, createMachine, sendParent } from 'xstate';

type ListContext<TItem> = {
  items: TItem[];
  pointer?: number;
};
type ListEvent =
  | { type: 'UP' }
  | { type: 'DOWN' }
  | { type: 'MOUSE_ENTER_ITEM'; index: number }
  | { type: 'MOUSE_LEAVE_ITEM'; }
  | { type: 'MOUSE_ENTER_FOOTER'}
  | { type: 'MOUSE_LEAVE_FOOTER'}
  | { type: 'OPEN' }
  | { type: 'CLOSE' }
  | { type: 'SELECT' };

export function createListMachine<TItem>() {
  return createMachine<ListContext<TItem>, ListEvent>(
    {
      id: 'list',
      context: {
        pointer: undefined,
        items: [],
      },
      initial: 'closed',
      states: {
        closed: {
          on: {
            OPEN: { target: 'opened' },
          },
        },
        opened: {
          on: {
            CLOSE: { target: 'closed' },
            MOUSE_ENTER_ITEM: {
              actions: ['setPointer'],
              target: 'opened.browsingList',
            },
            MOUSE_LEAVE_ITEM: {
              actions: ['clearPointer'],
              target: 'opened.idle',
            },
            MOUSE_ENTER_FOOTER: {
              target: 'opened.focusingFooter'
            },
            MOUSE_LEAVE_FOOTER: {
              actions: ['clearPointer'],
              target: 'opened.idle'
            }
          },
          initial: 'idle',
          states: {
            idle: {
              entry: ['sendListPointer'],
              always: [{ cond: 'hasPointer', target: 'browsingList' }],
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
              entry: ['sendListPointer'],
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
              entry: ['sendFooterPointer'],
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
        setPointer: assign((context, event) =>
          event.type === 'MOUSE_ENTER_ITEM' ? { pointer: event.index } : context
        ),
        clearPointer: assign({
          pointer: (context) => undefined,
        }),
      },
      guards: {
        hasPointer: (context) => context.pointer !== undefined,
        hasItems: (context) => context.items.length > 0,
        firstItem: (context) => context.pointer === 0,
        lastItem: (context) => context.items.length - 1 === context.pointer,
      },
    }
  );
}
