import * as React from 'react';
import { ComboboxItem, ComboboxItemComparator, ComboboxSearch } from './combobox-machine';
import { useCombobox } from './use-combobox';

type Props<TItem extends ComboboxItem> = {
  items: TItem[];
  search: ComboboxSearch<TItem>;
  itemToString: (item: TItem) => string;
  comparator: ComboboxItemComparator<TItem>
};

export const Combobox = <TItem extends ComboboxItem>({
  comparator,
  items,
  itemToString,
  search,
}: Props<TItem>) => {
  const inputRef = React.useRef<HTMLInputElement>(null);
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
    comparator,
    inputRef,
    items,
    search,
  });

  console.log(debug);

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
