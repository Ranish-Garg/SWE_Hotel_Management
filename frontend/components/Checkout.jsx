'use client';

import { useState } from 'react';
import { api, dateTime, money } from '../api.js';
import { Card, Field, Note } from './ui.jsx';

export default function Checkout() {
  const [token, setToken] = useState('');
  const [bill, setBill] = useState(null);
  const [note, setNote] = useState(null);

  async function run(path, successNote) {
    setNote(null);
    try {
      const data = await api(path, { method: successNote ? 'POST' : 'GET' });
      setBill(data);
      if (successNote) setNote({ kind: 'ok', text: successNote });
    } catch (error) {
      setBill(null);
      setNote({ kind: 'error', text: error.message });
    }
  }

  return (
    <>
      <Card title="Bill and check-out" hint="Shows the bill as it stands; checking out frees the room for other guests.">
        <form
          onSubmit={(event) => {
            event.preventDefault();
            run(`/bill/${token}`);
          }}
        >
          <div className="grid">
            <Field label="Guest token number">
              <input type="number" required value={token} onChange={(event) => setToken(event.target.value)} />
            </Field>
          </div>
          <button className="primary" type="submit">
            Show bill
          </button>
          <Note note={note} />
        </form>
      </Card>

      {bill ? (
        <Card title={`Bill for token ${bill.token_number} - ${bill.guest_name}`}>
          <div className="bill">
            <div className="row">
              <span>
                Room {bill.room_number} &middot; {bill.nights} night(s) &times; {money(bill.rate_per_night)}
              </span>
              <span>{money(bill.room_charge)}</span>
            </div>
            {bill.food_items.map((item) => (
              <div className="row" key={item.id}>
                <span>
                  {item.item_name} &times; {item.quantity} &middot; {dateTime(item.consumed_at)}
                </span>
                <span>{money(item.amount)}</span>
              </div>
            ))}
            <div className="row sum">
              <span>Food total</span>
              <span>{money(bill.food_charge)}</span>
            </div>
            <div className="row sum">
              <span>Subtotal</span>
              <span>{money(bill.subtotal)}</span>
            </div>
            <div className="row sum">
              <span>Frequent guest discount ({bill.discount_percent}%)</span>
              <span>- {money(bill.discount)}</span>
            </div>
            <div className="row">
              <span>Total</span>
              <span>{money(bill.total)}</span>
            </div>
            <div className="row sum">
              <span>Advance paid</span>
              <span>- {money(bill.advance_paid)}</span>
            </div>
            <div className="row total">
              <span>Balance payable</span>
              <span>{money(bill.balance_payable)}</span>
            </div>
          </div>

          <p className="hint" style={{ marginTop: 16 }}>
            Stay: {dateTime(bill.arrival_time)} to {dateTime(bill.departure_time)} &middot;{' '}
            {bill.status === 'checked_out' ? 'already checked out' : 'still in the hotel'}
          </p>

          {bill.status === 'checked_out' ? (
            <button className="link" type="button" onClick={() => window.print()}>
              Print bill
            </button>
          ) : (
            <button
              className="primary"
              type="button"
              onClick={() => run(`/checkout/${bill.token_number}`, `Token ${bill.token_number} checked out.`)}
            >
              Check out and close bill
            </button>
          )}
        </Card>
      ) : null}
    </>
  );
}
