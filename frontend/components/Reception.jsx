'use client';

import { useEffect, useState } from 'react';
import { api, dateTime, localDateTimeValue, money, roomType } from '../api.js';
import { Card, Empty, Field, Note, RoomTypeFields } from './ui.jsx';

const emptyForm = () => ({
  guest_name: '',
  phone: '',
  identity_number: '',
  bed_type: 'single',
  is_ac: true,
  arrival_time: localDateTimeValue(),
  duration_days: 1,
  advance_paid: '',
});

export default function Reception() {
  const [form, setForm] = useState(emptyForm);
  const [note, setNote] = useState(null);
  const [busy, setBusy] = useState(false);
  const [reservations, setReservations] = useState([]);

  const loadReservations = () =>
    api('/reservations?status=booked')
      .then(setReservations)
      .catch((error) => setNote({ kind: 'error', text: error.message }));

  useEffect(() => {
    loadReservations();
  }, []);

  const set = (patch) => setForm((current) => ({ ...current, ...patch }));

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setNote(null);
    try {
      const reservation = await api('/reservations', {
        method: 'POST',
        body: {
          ...form,
          identity_number: form.identity_number.trim() || null,
          arrival_time: new Date(form.arrival_time).toISOString(),
          duration_days: Number(form.duration_days),
          advance_paid: Number(form.advance_paid) || 0,
        },
      });
      setNote({ kind: 'ok', text: reservation.message });
      setForm(emptyForm());
      await loadReservations();
    } catch (error) {
      // An unavailable room comes back as the hotel's apology message.
      setNote({ kind: 'error', text: error.message });
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <Card
        title="Reserve a room"
        hint="Works both for an advance reservation and for a guest walking in. A free room of the requested type is allotted automatically."
      >
        <form onSubmit={submit}>
          <div className="grid">
            <Field label="Guest name">
              <input
                required
                value={form.guest_name}
                onChange={(event) => set({ guest_name: event.target.value })}
              />
            </Field>
            <Field label="Phone">
              <input value={form.phone} onChange={(event) => set({ phone: event.target.value })} />
            </Field>
            <Field label="Identity number (frequent guest)">
              <input
                placeholder="optional, e.g. FG-001"
                value={form.identity_number}
                onChange={(event) => set({ identity_number: event.target.value })}
              />
            </Field>
            <RoomTypeFields
              bedType={form.bed_type}
              isAc={form.is_ac}
              onChange={(patch) =>
                set({
                  ...(patch.bedType !== undefined ? { bed_type: patch.bedType } : {}),
                  ...(patch.isAc !== undefined ? { is_ac: patch.isAc } : {}),
                })
              }
            />
            <Field label="Arrival time">
              <input
                type="datetime-local"
                required
                value={form.arrival_time}
                onChange={(event) => set({ arrival_time: event.target.value })}
              />
            </Field>
            <Field label="Approximate stay (days)">
              <input
                type="number"
                min="1"
                required
                value={form.duration_days}
                onChange={(event) => set({ duration_days: event.target.value })}
              />
            </Field>
            <Field label="Advance paid">
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.advance_paid}
                onChange={(event) => set({ advance_paid: event.target.value })}
              />
            </Field>
          </div>
          <button className="primary" type="submit" disabled={busy}>
            {busy ? 'Checking availability...' : 'Allot room'}
          </button>
          <Note note={note} />
        </form>
      </Card>

      <Card title="Guests in the hotel" hint="Every reservation that has not been checked out yet.">
        {reservations.length === 0 ? (
          <Empty>No guests are staying at the moment.</Empty>
        ) : (
          <div className="scroll">
            <table>
              <thead>
                <tr>
                  <th>Token</th>
                  <th>Guest</th>
                  <th>Room</th>
                  <th>Type</th>
                  <th>Arrival</th>
                  <th className="num">Days</th>
                  <th className="num">Rate</th>
                  <th className="num">Advance</th>
                </tr>
              </thead>
              <tbody>
                {reservations.map((reservation) => (
                  <tr key={reservation.token_number}>
                    <td>{reservation.token_number}</td>
                    <td>
                      {reservation.guest_name}
                      {reservation.identity_number ? ` (${reservation.identity_number})` : ''}
                    </td>
                    <td>{reservation.rooms.room_number}</td>
                    <td>{roomType(reservation.rooms.bed_type, reservation.rooms.is_ac)}</td>
                    <td>{dateTime(reservation.arrival_time)}</td>
                    <td className="num">{reservation.duration_days}</td>
                    <td className="num">{money(reservation.rate_per_night)}</td>
                    <td className="num">{money(reservation.advance_paid)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </>
  );
}
