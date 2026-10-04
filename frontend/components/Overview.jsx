'use client';

import { useEffect, useState } from 'react';
import { api, currentMonth, expectedDeparture, isInHouse, money, roomType, sameDay, shortDate } from '../api.js';
import { Card, Empty, Icon, Note } from './ui.jsx';
import OccupancyChart from './OccupancyChart.jsx';

export default function Overview({ go }) {
  const [rooms, setRooms] = useState(null);
  const [guests, setGuests] = useState([]);
  const [occupancy, setOccupancy] = useState(null);
  const [note, setNote] = useState(null);

  const load = () => {
    setNote(null);
    Promise.all([api('/rooms'), api('/reservations?status=booked'), api(`/occupancy?month=${currentMonth()}`)])
      .then(([roomRows, guestRows, occupancyRow]) => {
        setRooms(roomRows);
        setGuests(guestRows);
        setOccupancy(occupancyRow);
      })
      .catch((error) => {
        setRooms([]);
        setNote({ kind: 'error', text: error.message });
      });
  };

  useEffect(load, []);

  if (rooms === null) return <Empty>Loading the hotel at a glance...</Empty>;

  const now = new Date();
  const inHouse = guests.filter((guest) => isInHouse(guest, now));
  const occupiedRoomIds = new Set(inHouse.map((guest) => guest.room_id));
  const arrivals = guests.filter((guest) => sameDay(guest.arrival_time, now));
  const departures = guests.filter((guest) => sameDay(expectedDeparture(guest), now));
  const upcoming = guests.filter((guest) => new Date(guest.arrival_time) > now);
  const occupiedNow = rooms.filter((room) => occupiedRoomIds.has(room.id)).length;
  const sharePercent = rooms.length ? Math.round((occupiedNow / rooms.length) * 100) : 0;

  const kpis = [
    { icon: 'rooms', label: 'Rooms', value: rooms.length },
    { icon: 'key', label: 'Occupied now', value: `${occupiedNow}`, gold: true },
    { icon: 'reception', label: 'Free now', value: rooms.length - occupiedNow },
    { icon: 'arrive', label: 'Arrivals today', value: arrivals.length, gold: true },
    { icon: 'depart', label: 'Due out today', value: departures.length },
    { icon: 'percent', label: 'Month occupancy', value: `${occupancy?.average_occupancy_percent ?? 0}%`, gold: true },
  ];

  return (
    <>
      <Note note={note} />

      <div className="kpis">
        {kpis.map((kpi) => (
          <div className={`kpi${kpi.gold ? ' gold' : ''}`} key={kpi.label}>
            <div className="badge">
              <Icon name={kpi.icon} />
            </div>
            <div>
              <span>{kpi.label}</span>
              <strong>{kpi.value}</strong>
            </div>
          </div>
        ))}
      </div>

      <Card
        title="Room board"
        hint={`${occupiedNow} of ${rooms.length} rooms occupied right now (${sharePercent}%). Click a room to see its guest's bill.`}
        actions={
          <button className="mini" type="button" onClick={load}>
            Refresh
          </button>
        }
      >
        <div className="meter">
          <div style={{ width: `${sharePercent}%` }} />
        </div>
        {rooms.length === 0 ? (
          <Empty>No rooms have been added yet.</Empty>
        ) : (
          <div className="board">
            {rooms.map((room) => {
              const current = guests.find((guest) => guest.room_id === room.id && isInHouse(guest, now));
              const next = guests
                .filter((guest) => guest.room_id === room.id && new Date(guest.arrival_time) > now)
                .sort((a, b) => new Date(a.arrival_time) - new Date(b.arrival_time))[0];
              return (
                <div
                  className={`room${current ? ' busy' : ''}`}
                  key={room.id}
                  style={{ cursor: current ? 'pointer' : 'default' }}
                  onClick={() => current && go('checkout', current.token_number)}
                >
                  <div className="number">{room.room_number}</div>
                  <div className="type">{roomType(room.bed_type, room.is_ac)}</div>
                  {current ? (
                    <>
                      <div className="who">{current.guest_name}</div>
                      <div className="when">Until {shortDate(expectedDeparture(current))}</div>
                    </>
                  ) : (
                    <>
                      <div className="who">
                        <span className="tag free">Free</span>
                      </div>
                      <div className="when">{next ? `Booked from ${shortDate(next.arrival_time)}` : 'No bookings'}</div>
                    </>
                  )}
                  <div className="rate">{money(room.rate)} / night</div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      <div className="columns" style={{ marginBottom: 20 }}>
        <Card title="Arrivals today" hint="Guests whose reservation starts today.">
          <GuestList guests={arrivals} empty="No arrivals today." go={go} when={(g) => g.arrival_time} />
        </Card>
        <Card title="Due out today" hint="Guests whose approximate stay ends today.">
          <GuestList guests={departures} empty="Nobody is due to leave today." go={go} when={expectedDeparture} />
        </Card>
        <Card title="Upcoming reservations" hint="Advance bookings that have not arrived yet.">
          <GuestList guests={upcoming.slice(0, 6)} empty="No advance bookings." go={go} when={(g) => g.arrival_time} />
        </Card>
      </div>

      {occupancy ? (
        <Card
          title="Occupancy this month"
          hint={`Average ${occupancy.average_occupancy_percent}% across ${occupancy.total_rooms} rooms. Hover a bar for that day.`}
        >
          <OccupancyChart daily={occupancy.daily} />
        </Card>
      ) : null}
    </>
  );
}

function GuestList({ guests, empty, go, when }) {
  if (guests.length === 0) return <Empty>{empty}</Empty>;
  return (
    <ul className="list">
      {guests.map((guest) => (
        <li key={guest.token_number}>
          <div>
            {guest.guest_name}
            <span className="sub">
              Token {guest.token_number} &middot; Room {guest.rooms.room_number} &middot; {shortDate(when(guest))}
            </span>
          </div>
          <button className="mini" type="button" onClick={() => go('checkout', guest.token_number)}>
            Bill
          </button>
        </li>
      ))}
    </ul>
  );
}
