import * as React from 'react';
import { ComboboxItem } from './combobox-machine';
import { useCombobox } from './use-combobox';

type Props<TItem> = {
  items: TItem[];
  search: (items: TItem[], query: string) => TItem[];
  itemToString: (item: TItem) => string;
};

export const Combobox = <TItem extends ComboboxItem>({
  items,
  itemToString,
  search,
}: Props<TItem>) => {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const {
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
      <input
        type="text"
        {...getInputProps()}
        value={selection !== undefined ? itemToString(selection) : query}
      />
      {isOpen ? (
        <div className="combobox-list">
          <ul>
            {list.map((item, index) => (
              <li {...getItemProps(index)} key={index}>
                {itemToString(item)}
              </li>
            ))}
          </ul>
          <p {...getFooterProps()}>Can't find your journal?</p>
        </div>
      ) : undefined}
    </>
  );
};
