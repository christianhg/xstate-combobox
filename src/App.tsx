import React from 'react';
import { Combobox } from './combobox';
import './App.css';

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
        items={fruit}
        search={searchFruit}
        itemToString={(item) => item.label}
      />
    </div>
  );
}

export default App;
