import React from 'react';
import { Combobox } from './combobox';

type Fruit = {
  id: string;
  label: string;
};

const fruit: Fruit[] = [
  'Apple',
  'Banana',
  'Coconut',
  'Orange',
  'Watermelon',
  'Pear',
  'Strawberry',
  'Peach',
  'Mango',
  'Blueberry',
  'Kiwi',
  'Lime',
  'Grape',
  'Raspberry',
].map((fruit) => ({ id: fruit.toLowerCase(), label: fruit }));
const searchFruit = (items: Fruit[], query: string) => {
  return items.filter((item) =>
    item.label.toLowerCase().includes(query.toLowerCase())
  );
};

/**
 * - Select input text on refocus
 * - Clear input text on blur if no selection
 * - Trigger pointer movement on mouse move
 * - Include footer in mouse movement
 * - DOWN when no results
 */

function App() {
  return (
    <div className="App">
      <Combobox
        items={fruit}
        itemToString={(item) => item.label}
        comparator={(a, b) => a.id === b.id}
        onFooterSelected={() => {
          console.log('footer selected')
        }}
        search={searchFruit}
      />
    </div>
  );
}

export default App;
