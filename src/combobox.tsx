import * as React from 'react';
import { useCombobox } from './use-combobox';

type Item = string;

export const Combobox = () => {
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
