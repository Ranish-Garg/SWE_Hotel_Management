'use client';

import { useState } from 'react';
import { api, dateTime, localDateTimeValue, money } from '../api.js';
import { Card, Empty, Field, Note } from './ui.jsx';

const emptyForm = () => ({
  token_number: '',
  item_name: '',
  quantity: 1,
  unit_price: '',
  consumed_at: localDateTimeValue(),
});

export default function Catering() {
  const [form, setForm] = useState(emptyForm);
  const [orders, setOrders] = useState([]);
  const [shownToken, setShownToken] = useState(null);
  const [note, setNote] = useState(null);

  const set = (patch) => setForm((current) => ({ ...current, ...patch }));

  async function showOrders(token) {
    const rows = await api(`/food?token=${token}`);
    setOrders(rows);
    setShownToken(token);
  }

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
      setNote({ kind: 'ok', text: `${form.item_name} recorded against token ${form.token_number}.` });
      await showOrders(form.token_number);
      setForm({ ...emptyForm(), token_number: form.token_number });
    } catch (error) {
      setNote({ kind: 'error', text: error.message });
    }
  }

  return (
    <>
      <Card title="Record food consumed" hint="Entered by the catering manager as and when a guest consumes an item.">
        <form onSubmit={submit}>
          <div className="grid">
            <Field label="Guest token number">
              <input
                type="number"
                required
                value={form.token_number}
                onChange={(event) => set({ token_number: event.target.value })}
              />
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
          <button className="primary" type="submit">
            Record item
          </button>
          <Note note={note} />
        </form>
      </Card>

      {shownToken ? (
        <Card title={`Items consumed by token ${shownToken}`}>
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
