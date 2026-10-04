'use client';

import { useState } from 'react';
import Overview from './Overview.jsx';
import Reception from './Reception.jsx';
import Rooms from './Rooms.jsx';
import Catering from './Catering.jsx';
import Checkout from './Checkout.jsx';
import Manager from './Manager.jsx';
import { Icon } from './ui.jsx';

const TABS = [
  { id: 'overview', label: 'Overview', View: Overview },
  { id: 'reception', label: 'Reception', View: Reception },
  { id: 'rooms', label: 'Rooms', View: Rooms },
  { id: 'catering', label: 'Catering', View: Catering },
  { id: 'checkout', label: 'Check-out', View: Checkout },
  { id: 'manager', label: 'Manager', View: Manager },
];

export default function Dashboard() {
  // `token` lets one screen open another on a particular guest, e.g. "Bill" in Reception.
  const [route, setRoute] = useState({ tab: 'overview', token: null });
  const { View } = TABS.find((tab) => tab.id === route.tab);

  const go = (tab, token = null) => {
    setRoute({ tab, token });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <>
      <nav className="tabs">
        {TABS.map((tab) => (
          <button key={tab.id} type="button" aria-current={tab.id === route.tab} onClick={() => go(tab.id)}>
            <Icon name={tab.id} />
            <span className="label">{tab.label}</span>
          </button>
        ))}
      </nav>
      <div className="view" key={`${route.tab}-${route.token ?? ''}`}>
        <View go={go} token={route.token} />
      </div>
    </>
  );
}
