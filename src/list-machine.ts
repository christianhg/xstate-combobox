import { assign, createMachine, sendParent } from "xstate";

type Item = string;

type ListContext = {
  items: Item[];
  pointer?: number;
};
type ListEvent =
  | { type: 'UP' }
  | { type: 'DOWN' }
  | { type: 'OPEN' }
  | { type: 'CLOSE' }
  | { type: 'SELECT' };

export const listMachine = createMachine<ListContext, ListEvent>(
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
