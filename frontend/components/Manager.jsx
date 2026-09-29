'use client';

import { useEffect, useState } from 'react';
import { api, currentMonth, money, roomType } from '../api.js';
import { Card, Empty, Field, Note, RoomTypeFields } from './ui.jsx';

export default function Manager() {
  const [month, setMonth] = useState(currentMonth());
  const [occupancy, setOccupancy] = useState(null);
  const [rates, setRates] = useState([]);
  const [revision, setRevision] = useState({ bed_type: 'single', is_ac: true, percent: '' });
  const [guests, setGuests] = useState([]);
  const [guestForm, setGuestForm] = useState({ identity_number: '', name: '', discount_percent: 10 });
  const [note, setNote] = useState(null);

  const loadRates = () => api('/rates').then(setRates);
  const loadGuests = () => api('/frequent-guests').then(setGuests);

  const showOccupancy = async (value) => {
    setNote(null);
    try {
      setOccupancy(await api(`/occupancy?month=${value}`));
    } catch (error) {
      setOccupancy(null);
      setNote({ kind: 'error', text: error.message });
    }
  };

  useEffect(() => {
    loadRates();
    loadGuests();
    showOccupancy(currentMonth());
  }, []);

  async function revise(event) {
    event.preventDefault();
    setNote(null);
    try {
      const updated = await api('/rates', { method: 'PATCH', body: { ...revision, percent: Number(revision.percent) } });
      setNote({
        kind: 'ok',
        text: `${roomType(updated.bed_type, updated.is_ac)} tariff revised from ${money(
          updated.previous_rate
        )} to ${money(updated.rate)}.`,
      });
      setRevision({ ...revision, percent: '' });
      await loadRates();
    } catch (error) {
      setNote({ kind: 'error', text: error.message });
    }
  }

  async function issueIdentity(event) {
    event.preventDefault();
    setNote(null);
    try {
      await api('/frequent-guests', {
        method: 'POST',
        body: { ...guestForm, discount_percent: Number(guestForm.discount_percent) },
      });
      setNote({ kind: 'ok', text: `Identity number ${guestForm.identity_number} issued.` });
      setGuestForm({ identity_number: '', name: '', discount_percent: 10 });
      await loadGuests();
    } catch (error) {
      setNote({ kind: 'error', text: error.message });
    }
  }

  return (
    <>
      <Note note={note} />

      <Card title="Average occupancy rate" hint="The basis on which the tariff is revised for a part of the year.">
        <form
          onSubmit={(event) => {
            event.preventDefault();
            showOccupancy(month);
          }}
        >
          <div className="grid">
            <Field label="Month">
              <input type="month" required value={month} onChange={(event) => setMonth(event.target.value)} />
            </Field>
          </div>
          <button className="primary" type="submit">
            Show occupancy
          </button>
        </form>

        {occupancy ? (
          <div className="stat" style={{ marginTop: 20 }}>
            <div>
              <span>Average occupancy</span>
              <strong>{occupancy.average_occupancy_percent}%</strong>
            </div>
            <div>
              <span>Rooms in the hotel</span>
              <strong>{occupancy.total_rooms}</strong>
            </div>
            <div>
              <span>Occupied room-days</span>
              <strong>
                {occupancy.occupied_room_days} / {occupancy.total_rooms * occupancy.days_in_month}
              </strong>
            </div>
          </div>
        ) : null}
      </Card>

      <Card title="Room tariff" hint="Revise a category upwards with a positive percentage, downwards with a negative one.">
        <div className="scroll">
          <table>
            <thead>
              <tr>
                <th>Category</th>
                <th className="num">Tariff / night</th>
              </tr>
            </thead>
            <tbody>
              {rates.map((rate) => (
                <tr key={`${rate.bed_type}-${rate.is_ac}`}>
                  <td>{roomType(rate.bed_type, rate.is_ac)}</td>
                  <td className="num">{money(rate.rate)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <form onSubmit={revise} style={{ marginTop: 16 }}>
          <div className="grid">
            <RoomTypeFields
              bedType={revision.bed_type}
              isAc={revision.is_ac}
              onChange={(patch) =>
                setRevision({
                  ...revision,
                  ...(patch.bedType !== undefined ? { bed_type: patch.bedType } : {}),
                  ...(patch.isAc !== undefined ? { is_ac: patch.isAc } : {}),
                })
              }
            />
            <Field label="Revise by (%)">
              <input
                type="number"
                step="0.01"
                required
                placeholder="e.g. 10 or -5"
                value={revision.percent}
                onChange={(event) => setRevision({ ...revision, percent: event.target.value })}
              />
            </Field>
          </div>
          <button className="primary" type="submit">
            Revise tariff
          </button>
        </form>
      </Card>

      <Card title="Frequent guests" hint="Identity numbers entitle a guest to a discount on every bill.">
        {guests.length === 0 ? (
          <Empty>No identity numbers issued yet.</Empty>
        ) : (
          <div className="scroll">
            <table>
              <thead>
                <tr>
                  <th>Identity number</th>
                  <th>Name</th>
                  <th className="num">Discount</th>
                </tr>
              </thead>
              <tbody>
                {guests.map((guest) => (
                  <tr key={guest.identity_number}>
                    <td>{guest.identity_number}</td>
                    <td>{guest.name}</td>
                    <td className="num">{guest.discount_percent}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <form onSubmit={issueIdentity} style={{ marginTop: 16 }}>
          <div className="grid">
            <Field label="Identity number">
              <input
                required
                placeholder="FG-003"
                value={guestForm.identity_number}
                onChange={(event) => setGuestForm({ ...guestForm, identity_number: event.target.value })}
              />
            </Field>
            <Field label="Guest name">
              <input
                required
                value={guestForm.name}
                onChange={(event) => setGuestForm({ ...guestForm, name: event.target.value })}
              />
            </Field>
            <Field label="Discount (%)">
              <input
                type="number"
                min="0"
                max="100"
                step="0.01"
                required
                value={guestForm.discount_percent}
                onChange={(event) => setGuestForm({ ...guestForm, discount_percent: event.target.value })}
              />
            </Field>
          </div>
          <button className="primary" type="submit">
            Issue identity number
          </button>
        </form>
      </Card>
    </>
  );
}
