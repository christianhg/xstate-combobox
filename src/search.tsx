import { useMachine } from '@xstate/react';
import * as React from 'react';
import { assign, createMachine } from 'xstate';

type Item = string;

export const Search = () => {
  const inputRef = React.useRef(null);
  const search = (items: Item[], query: string) => {
    return items.filter((item) =>
      item.toLowerCase().includes(query.toLowerCase())
    );
  };
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
  const [current, send] = useMachine(() =>
    createSearchMachine({ items, search })
  );

  // React.useEffect(() => {
  //   const inputField = inputRef.current;

  //   return () => {

  //   }
  // },[send, inputRef])

  return (
    <>
      <h1>Search</h1>
      <input
        type="text"
        ref={inputRef}
        onChange={(e) => {
          send({ type: 'QUERY_CHANGED', query: e.currentTarget.value });
        }}
      />
      <pre>{JSON.stringify(current.value)}</pre>
      <pre>{JSON.stringify(current.context.items)}</pre>
      <pre>{JSON.stringify(current.context.query)}</pre>
      <pre>{JSON.stringify(current.context.results)}</pre>
    </>
  );
};

function createSearchMachine({
  items,
  search,
}: {
  items: Item[];
  search: (items: Item[], query: string) => Item[];
}) {
  type SearchContext = {
    items: Item[];
    query: string;
    results: Item[];
  };
  type SearchEvent = { type: 'QUERY_CHANGED'; query: string };

  return createMachine<SearchContext, SearchEvent>(
    {
      id: 'search',
      initial: 'idle',
      context: {
        items,
        query: '',
        results: [],
      },
      on: {
        QUERY_CHANGED: {
          target: 'searching',
          actions: ['performSearch'],
        },
      },
      states: {
        idle: {},
        searching: {
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
        hasResults: {},
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
