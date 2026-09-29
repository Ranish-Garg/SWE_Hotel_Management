'use client';

import { useState } from 'react';
import Reception from './Reception.jsx';
import Rooms from './Rooms.jsx';
import Catering from './Catering.jsx';
import Checkout from './Checkout.jsx';
import Manager from './Manager.jsx';

const TABS = [
  { id: 'reception', label: 'Reception', View: Reception },
  { id: 'rooms', label: 'Rooms', View: Rooms },
  { id: 'catering', label: 'Catering', View: Catering },
  { id: 'checkout', label: 'Check-out', View: Checkout },
  { id: 'manager', label: 'Manager', View: Manager },
];

export default function Dashboard() {
  const [active, setActive] = useState('reception');
  const { View } = TABS.find((tab) => tab.id === active);

  return (
    <>
      <nav className="tabs">
        {TABS.map((tab) => (
          <button key={tab.id} type="button" aria-current={tab.id === active} onClick={() => setActive(tab.id)}>
            {tab.label}
          </button>
        ))}
      </nav>
      <View />
    </>
  );
}
