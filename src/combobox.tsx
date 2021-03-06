import * as React from 'react';
import {
  ComboboxItemComparator,
  ComboboxSearch,
} from './use-combobox/combobox-machine';
import { useCombobox } from './use-combobox/use-combobox';

type ComboboxItem = {
  label: string;
  id: string;
};

type Props<TItem extends ComboboxItem> = {
  comparator: ComboboxItemComparator<TItem>;
  footer: React.ReactNode;
  items: TItem[];
  itemToString: (item: TItem) => string;
  onFooterSelected: () => void;
  placeholder: string;
  search: ComboboxSearch<TItem>;
};

export const Combobox = <TItem extends ComboboxItem>({
  comparator,
  footer,
  items,
  itemToString,
  onFooterSelected,
  placeholder,
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
    comparator,
    inputRef,
    items,
    onFooterSelected,
    search,
  });

  return (
    <>
      <input
        type="text"
        {...getInputProps()}
        value={selection !== undefined ? itemToString(selection) : query}
        placeholder={placeholder}
      />
      {isOpen ? (
        <ul>
          {list.map((item, index) => (
            <li {...getItemProps(index)} key={index}>
              {itemToString(item)}
            </li>
          ))}
          <li className="combobox-footer" {...getFooterProps()}>
            {footer}
          </li>
        </ul>
      ) : undefined}
    </>
  );
};
