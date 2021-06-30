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

function App() {
  return (
    <div className="App">
      <Combobox
        comparator={(a, b) => a.id === b.id}
        footer={"Can't find your fruit?"}
        items={fruit}
        itemToString={(item) => item.label}
        onFooterSelected={() => {
          // Redirect to another page
          console.log('footer selected')
        }}
        search={searchFruit}
      />
    </div>
  );
}

export default App;
