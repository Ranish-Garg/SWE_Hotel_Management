'use client';

import { useEffect, useState } from 'react';
import { api, expectedDeparture, isInHouse, money, roomType, shortDate } from '../api.js';
import { Card, Empty, Field, Note, RoomTypeFields } from './ui.jsx';

const STATUS_FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'free', label: 'Free now' },
  { id: 'busy', label: 'Occupied' },
];

const TYPE_FILTERS = [
  { id: 'all', label: 'Any type' },
  { id: 'single-true', label: 'Single / AC' },
  { id: 'single-false', label: 'Single / Non-AC' },
  { id: 'double-true', label: 'Double / AC' },
  { id: 'double-false', label: 'Double / Non-AC' },
];

export default function Rooms({ go }) {
  const [rooms, setRooms] = useState([]);
  const [form, setForm] = useState({ room_number: '', bed_type: 'single', is_ac: true });
  const [note, setNote] = useState(null);
  const [status, setStatus] = useState('all');
  const [type, setType] = useState('all');

  const load = () =>
    api('/rooms')
      .then(setRooms)
      .catch((error) => setNote({ kind: 'error', text: error.message }));

  useEffect(() => {
    load();
  }, []);

  async function addRoom(event) {
    event.preventDefault();
    setNote(null);
    try {
      await api('/rooms', { method: 'POST', body: form });
      setNote({ kind: 'ok', text: `Room ${form.room_number} added.` });
      setForm({ room_number: '', bed_type: 'single', is_ac: true });
      await load();
    } catch (error) {
      setNote({ kind: 'error', text: error.message });
    }
  }

  const currentGuest = (room) => room.bookings.find((booking) => isInHouse(booking));
  const counts = {
    all: rooms.length,
    busy: rooms.filter(currentGuest).length,
  };
  counts.free = counts.all - counts.busy;

  const shown = rooms.filter((room) => {
    const busy = Boolean(currentGuest(room));
    if (status === 'free' && busy) return false;
    if (status === 'busy' && !busy) return false;
    return type === 'all' || type === `${room.bed_type}-${room.is_ac}`;
  });

  return (
    <>
      <Card title="Rooms" hint="The tariff shown is the current one; a booking keeps the rate it was made at.">
        <div className="toolbar">
          {STATUS_FILTERS.map((filter) => (
            <button
              key={filter.id}
              type="button"
              className="chip"
              aria-pressed={status === filter.id}
              onClick={() => setStatus(filter.id)}
            >
              {filter.label}
              <span className="count">{counts[filter.id]}</span>
            </button>
          ))}
          <select style={{ width: 'auto', marginLeft: 'auto' }} value={type} onChange={(e) => setType(e.target.value)}>
            {TYPE_FILTERS.map((filter) => (
              <option key={filter.id} value={filter.id}>
                {filter.label}
              </option>
            ))}
          </select>
        </div>

        {shown.length === 0 ? (
          <Empty>{rooms.length ? 'No room matches these filters.' : 'No rooms have been added yet.'}</Empty>
        ) : (
          <div className="scroll">
            <table>
              <thead>
                <tr>
                  <th>Room</th>
                  <th>Type</th>
                  <th className="num">Tariff / night</th>
                  <th>Now</th>
                  <th>Bookings</th>
                </tr>
              </thead>
              <tbody>
                {shown.map((room) => {
                  const current = currentGuest(room);
                  const future = room.bookings
                    .filter((booking) => new Date(booking.arrival_time) > new Date())
                    .sort((a, b) => new Date(a.arrival_time) - new Date(b.arrival_time));
                  return (
                    <tr key={room.id}>
                      <td>
                        <strong>{room.room_number}</strong>
                      </td>
                      <td>{roomType(room.bed_type, room.is_ac)}</td>
                      <td className="num">{money(room.rate)}</td>
                      <td>
                        {current ? (
                          <button
                            type="button"
                            className="tag busy"
                            style={{ cursor: 'pointer', font: 'inherit', fontSize: 12 }}
                            onClick={() => go('checkout', current.token_number)}
                          >
                            #{current.token_number} &middot; {current.guest_name} until{' '}
                            {shortDate(expectedDeparture(current))}
                          </button>
                        ) : (
                          <span className="tag free">Free</span>
                        )}
                      </td>
                      <td>
                        {future.length ? (
                          future.map((booking) => (
                            <span className="sub" key={booking.token_number} style={{ display: 'block', fontSize: 12.5 }}>
                              {shortDate(booking.arrival_time)} &rarr; {shortDate(expectedDeparture(booking))} &middot;{' '}
                              {booking.guest_name}
                            </span>
                          ))
                        ) : (
                          <span className="sub">None ahead</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Card title="Add a room" hint="New rooms take the tariff of their category straight away.">
        <form onSubmit={addRoom}>
          <div className="grid">
            <Field label="Room number">
              <input
                required
                value={form.room_number}
                onChange={(event) => setForm({ ...form, room_number: event.target.value })}
              />
            </Field>
            <RoomTypeFields
              bedType={form.bed_type}
              isAc={form.is_ac}
              onChange={(patch) =>
                setForm({
                  ...form,
                  ...(patch.bedType !== undefined ? { bed_type: patch.bedType } : {}),
                  ...(patch.isAc !== undefined ? { is_ac: patch.isAc } : {}),
                })
              }
            />
          </div>
          <button className="primary" type="submit">
            Add room
          </button>
          <Note note={note} />
        </form>
      </Card>
    </>
  );
}
