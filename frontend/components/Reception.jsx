'use client';

import { useEffect, useState } from 'react';
import { api, dateTime, expectedDeparture, isInHouse, localDateTimeValue, money, roomType, shortDate } from '../api.js';
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

export default function Reception({ go }) {
  const [form, setForm] = useState(emptyForm);
  const [note, setNote] = useState(null);
  const [listNote, setListNote] = useState(null);
  const [busy, setBusy] = useState(false);
  const [reservations, setReservations] = useState([]);
  const [rates, setRates] = useState([]);
  const [frequentGuests, setFrequentGuests] = useState([]);
  const [search, setSearch] = useState('');

  const loadReservations = () =>
    api('/reservations?status=booked')
      .then(setReservations)
      .catch((error) => setListNote({ kind: 'error', text: error.message }));

  useEffect(() => {
    loadReservations();
    api('/rates').then(setRates).catch(() => {});
    api('/frequent-guests').then(setFrequentGuests).catch(() => {});
  }, []);

  const set = (patch) => setForm((current) => ({ ...current, ...patch }));

  // Live estimate of the room charge, using the current tariff and any frequent-guest discount.
  const rate = rates.find((r) => r.bed_type === form.bed_type && r.is_ac === form.is_ac)?.rate ?? 0;
  const days = Math.max(1, Number(form.duration_days) || 1);
  const member = frequentGuests.find((g) => g.identity_number === form.identity_number.trim());
  const roomCharge = rate * days;
  const discount = member ? (roomCharge * member.discount_percent) / 100 : 0;
  const advance = Number(form.advance_paid) || 0;

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

  async function cancel(reservation) {
    if (!window.confirm(`Cancel reservation ${reservation.token_number} for ${reservation.guest_name}?`)) return;
    setListNote(null);
    try {
      const result = await api(`/reservations/${reservation.token_number}`, { method: 'DELETE' });
      setListNote({ kind: 'ok', text: result.message });
      await loadReservations();
    } catch (error) {
      setListNote({ kind: 'error', text: error.message });
    }
  }

  const query = search.trim().toLowerCase();
  const shown = reservations.filter(
    (r) =>
      !query ||
      [r.guest_name, r.phone, r.identity_number, r.rooms.room_number, String(r.token_number)]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(query))
  );

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
              <input type="tel" value={form.phone} onChange={(event) => set({ phone: event.target.value })} />
            </Field>
            <Field label="Identity number (frequent guest)">
              <input
                placeholder="optional, e.g. FG-001"
                list="frequent-guests"
                value={form.identity_number}
                onChange={(event) => set({ identity_number: event.target.value })}
              />
              <datalist id="frequent-guests">
                {frequentGuests.map((guest) => (
                  <option key={guest.identity_number} value={guest.identity_number}>
                    {guest.name}
                  </option>
                ))}
              </datalist>
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

          {rate ? (
            <div className="estimate">
              <span>
                Tariff <strong>{money(rate)}</strong> &times; {days} night(s) = <strong>{money(roomCharge)}</strong>
              </span>
              {member ? (
                <span>
                  {member.name} gets <strong>{member.discount_percent}%</strong> off: &minus;{money(discount)}
                </span>
              ) : null}
              <span>
                Estimated balance at check-out <strong>{money(roomCharge - discount - advance)}</strong> + food
              </span>
            </div>
          ) : null}

          <button className="primary" type="submit" disabled={busy}>
            {busy ? 'Checking availability...' : 'Allot room'}
          </button>
          <Note note={note} />
        </form>
      </Card>

      <Card
        title="Guests in the hotel"
        hint="Every reservation that has not been checked out yet, including advance bookings."
      >
        <div className="toolbar">
          <input
            type="search"
            placeholder="Search name, phone, room or token..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <span className="tag">{shown.length} shown</span>
        </div>
        <Note note={listNote} />
        {shown.length === 0 ? (
          <Empty>{reservations.length ? 'No guest matches that search.' : 'No guests are staying at the moment.'}</Empty>
        ) : (
          <div className="scroll">
            <table>
              <thead>
                <tr>
                  <th>Token</th>
                  <th>Guest</th>
                  <th>Room</th>
                  <th>Stay</th>
                  <th className="num">Rate</th>
                  <th className="num">Advance</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {shown.map((reservation) => (
                  <tr key={reservation.token_number}>
                    <td>#{reservation.token_number}</td>
                    <td>
                      {reservation.guest_name}{' '}
                      {reservation.identity_number ? <span className="tag gold">{reservation.identity_number}</span> : null}
                      <span className="sub">{reservation.phone || 'No phone'}</span>
                    </td>
                    <td>
                      {reservation.rooms.room_number}
                      <span className="sub">{roomType(reservation.rooms.bed_type, reservation.rooms.is_ac)}</span>
                    </td>
                    <td>
                      {shortDate(reservation.arrival_time)} &rarr; {shortDate(expectedDeparture(reservation))}
                      <span className="sub">{stayLabel(reservation)}</span>
                    </td>
                    <td className="num">{money(reservation.rate_per_night)}</td>
                    <td className="num">{money(reservation.advance_paid)}</td>
                    <td>
                      <div className="row-actions">
                        <button className="mini" type="button" onClick={() => go('catering', reservation.token_number)}>
                          Food
                        </button>
                        <button className="mini" type="button" onClick={() => go('checkout', reservation.token_number)}>
                          Bill
                        </button>
                        <button className="mini danger" type="button" onClick={() => cancel(reservation)}>
                          Cancel
                        </button>
                      </div>
                    </td>
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

function stayLabel(reservation) {
  if (isInHouse(reservation)) return 'In house';
  if (new Date(reservation.arrival_time) > new Date()) return `Arriving ${dateTime(reservation.arrival_time)}`;
  return 'Past expected departure';
}
