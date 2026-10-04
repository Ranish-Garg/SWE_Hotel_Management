'use client';

import { useEffect, useState } from 'react';
import { api, dateTime, isInHouse, localDateTimeValue, money } from '../api.js';
import { Card, Empty, Field, GuestPicker, Note } from './ui.jsx';

// Quick picks for the commonest orders; any item can still be typed in by hand.
const MENU = [
  { name: 'Breakfast buffet', price: 650 },
  { name: 'Masala tea', price: 120 },
  { name: 'Filter coffee', price: 150 },
  { name: 'Club sandwich', price: 420 },
  { name: 'Paneer tikka', price: 480 },
  { name: 'Veg thali', price: 550 },
  { name: 'Butter chicken', price: 690 },
  { name: 'Biryani', price: 620 },
  { name: 'Fresh lime soda', price: 180 },
  { name: 'Dessert platter', price: 380 },
];

const emptyForm = (token_number = '') => ({
  token_number,
  item_name: '',
  quantity: 1,
  unit_price: '',
  consumed_at: localDateTimeValue(),
});

export default function Catering({ token }) {
  const [guests, setGuests] = useState([]);
  const [form, setForm] = useState(() => emptyForm(token ? String(token) : ''));
  const [orders, setOrders] = useState([]);
  const [note, setNote] = useState(null);

  const set = (patch) => setForm((current) => ({ ...current, ...patch }));

  useEffect(() => {
    // Only guests staying right now can order food: not advance bookings, not past their stay.
    api('/reservations?status=booked')
      .then((rows) => {
        const active = rows.filter((row) => isInHouse(row));
        setGuests(active);
        if (token && !active.some((row) => String(row.token_number) === String(token))) {
          setForm((current) => ({ ...current, token_number: '' }));
          setNote({ kind: 'error', text: `Token ${token} is not staying in the hotel right now.` });
        }
      })
      .catch((error) => setNote({ kind: 'error', text: error.message }));
  }, []);

  // Whenever a guest is chosen, show what they have had so far.
  useEffect(() => {
    if (!form.token_number) {
      setOrders([]);
      return;
    }
    api(`/food?token=${form.token_number}`).then(setOrders).catch(() => setOrders([]));
  }, [form.token_number]);

  async function submit(event) {
    event.preventDefault();
    setNote(null);
    try {
      await api('/food', {
        method: 'POST',
        body: {
          ...form,
          token_number: Number(form.token_number),
          quantity: Number(form.quantity),
          unit_price: Number(form.unit_price) || 0,
          consumed_at: new Date(form.consumed_at).toISOString(),
        },
      });
      setNote({ kind: 'ok', text: `${form.quantity} × ${form.item_name} recorded against token ${form.token_number}.` });
      setOrders(await api(`/food?token=${form.token_number}`));
      setForm(emptyForm(form.token_number));
    } catch (error) {
      setNote({ kind: 'error', text: error.message });
    }
  }

  const guest = guests.find((g) => String(g.token_number) === String(form.token_number));
  const foodTotal = orders.reduce((sum, order) => sum + order.quantity * order.unit_price, 0);
  const lineTotal = (Number(form.quantity) || 0) * (Number(form.unit_price) || 0);

  return (
    <>
      <Card title="Record food consumed" hint="Entered by the catering manager as and when a guest consumes an item.">
        <form onSubmit={submit}>
          <div className="grid">
            <Field label="Guest">
              <GuestPicker guests={guests} value={form.token_number} onChange={(value) => set({ token_number: value })} />
            </Field>
            <Field label="Food item">
              <input required value={form.item_name} onChange={(event) => set({ item_name: event.target.value })} />
            </Field>
            <Field label="Quantity">
              <input
                type="number"
                min="1"
                required
                value={form.quantity}
                onChange={(event) => set({ quantity: event.target.value })}
              />
            </Field>
            <Field label="Price per unit">
              <input
                type="number"
                min="0"
                step="0.01"
                required
                value={form.unit_price}
                onChange={(event) => set({ unit_price: event.target.value })}
              />
            </Field>
            <Field label="Date and time">
              <input
                type="datetime-local"
                required
                value={form.consumed_at}
                onChange={(event) => set({ consumed_at: event.target.value })}
              />
            </Field>
          </div>

          <label style={{ marginTop: 18 }}>Quick menu</label>
          <div className="menu" style={{ marginTop: 0 }}>
            {MENU.map((item) => (
              <button
                key={item.name}
                type="button"
                onClick={() => set({ item_name: item.name, unit_price: item.price })}
              >
                <strong>{item.name}</strong>
                <span>{money(item.price)}</span>
              </button>
            ))}
          </div>

          <div className="actions">
            <button className="primary" type="submit">
              Record item{lineTotal ? ` · ${money(lineTotal)}` : ''}
            </button>
          </div>
          <Note note={note} />
        </form>
      </Card>

      {guest ? (
        <Card
          title={`${guest.guest_name}'s orders`}
          hint={`Token ${guest.token_number} · Room ${guest.rooms.room_number} · Food so far ${money(foodTotal)}`}
        >
          {orders.length === 0 ? (
            <Empty>Nothing recorded yet.</Empty>
          ) : (
            <div className="scroll">
              <table>
                <thead>
                  <tr>
                    <th>Item</th>
                    <th className="num">Qty</th>
                    <th className="num">Rate</th>
                    <th className="num">Amount</th>
                    <th>When</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr key={order.id}>
                      <td>{order.item_name}</td>
                      <td className="num">{order.quantity}</td>
                      <td className="num">{money(order.unit_price)}</td>
                      <td className="num">{money(order.quantity * order.unit_price)}</td>
                      <td>{dateTime(order.consumed_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      ) : null}
    </>
  );
}
