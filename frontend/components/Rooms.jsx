'use client';

import { useEffect, useState } from 'react';
import { api, dateTime, money, roomType } from '../api.js';
import { Card, Empty, Field, Note, RoomTypeFields } from './ui.jsx';

export default function Rooms() {
  const [rooms, setRooms] = useState([]);
  const [form, setForm] = useState({ room_number: '', bed_type: 'single', is_ac: true });
  const [note, setNote] = useState(null);

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

  return (
    <>
      <Card title="Rooms" hint="The tariff shown is the current one; a booking keeps the rate it was made at.">
        {rooms.length === 0 ? (
          <Empty>No rooms have been added yet.</Empty>
        ) : (
          <div className="scroll">
            <table>
              <thead>
                <tr>
                  <th>Room</th>
                  <th>Type</th>
                  <th className="num">Tariff / night</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {rooms.map((room) => {
                  const current = room.bookings[0];
                  return (
                    <tr key={room.id}>
                      <td>{room.room_number}</td>
                      <td>{roomType(room.bed_type, room.is_ac)}</td>
                      <td className="num">{money(room.rate)}</td>
                      <td>
                        {current ? (
                          <span className="tag">
                            Token {current.token_number} &middot; {current.guest_name} from{' '}
                            {dateTime(current.arrival_time)}
                          </span>
                        ) : (
                          <span className="tag free">Free</span>
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

      <Card title="Add a room">
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
