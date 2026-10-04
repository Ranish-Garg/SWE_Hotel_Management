'use client';

import { useEffect, useState } from 'react';
import { api, dateTime, money, shortDate } from '../api.js';
import { Card, Empty, Field, GuestPicker, Icon, Note } from './ui.jsx';

export default function Checkout({ token: openToken }) {
  const [guests, setGuests] = useState([]);
  const [history, setHistory] = useState([]);
  const [token, setToken] = useState(openToken ? String(openToken) : '');
  const [bill, setBill] = useState(null);
  const [note, setNote] = useState(null);

  const loadLists = () => {
    api('/reservations?status=booked').then(setGuests).catch(() => {});
    api('/reservations?status=checked_out').then(setHistory).catch(() => {});
  };

  async function run(path, successNote) {
    setNote(null);
    try {
      const data = await api(path, { method: successNote ? 'POST' : 'GET' });
      setBill(data);
      if (successNote) {
        setNote({ kind: 'ok', text: successNote });
        loadLists();
      }
    } catch (error) {
      setBill(null);
      setNote({ kind: 'error', text: error.message });
    }
  }

  const show = (value) => {
    setToken(String(value));
    run(`/bill/${value}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    loadLists();
    if (openToken) run(`/bill/${openToken}`);
  }, []);

  const checkOut = () => {
    if (!window.confirm(`Check out ${bill.guest_name} (token ${bill.token_number}) and close the bill?`)) return;
    run(`/checkout/${bill.token_number}`, `Token ${bill.token_number} checked out. Room ${bill.room_number} is free.`);
  };

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
            <Field label="Guest in the hotel">
              <GuestPicker guests={guests} value={token} required={false} onChange={(value) => value && show(value)} />
            </Field>
            <Field label="Or any token number">
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
        <Card
          title={`Invoice · Token ${bill.token_number}`}
          hint={bill.status === 'checked_out' ? 'Checked out - final bill.' : 'Guest still in the hotel - provisional bill up to the expected departure.'}
          actions={
            <button className="mini" type="button" onClick={() => window.print()}>
              Print
            </button>
          }
        >
          <div className="bill" style={{ marginTop: 18 }}>
            <div className="bill-head">
              <div>
                <strong>{bill.guest_name}</strong>
                Room {bill.room_number}
              </div>
              <div>
                <strong>{bill.nights} night(s)</strong>
                {dateTime(bill.arrival_time)} &rarr; {dateTime(bill.departure_time)}
              </div>
            </div>
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
              <span>{bill.balance_payable < 0 ? 'Refund due to guest' : 'Balance payable'}</span>
              <span>{money(Math.abs(bill.balance_payable))}</span>
            </div>
          </div>

          {bill.status === 'checked_out' ? (
            <button className="link" type="button" onClick={() => window.print()}>
              <Icon name="print" /> Print bill
            </button>
          ) : (
            <button className="primary" type="button" onClick={checkOut}>
              <Icon name="depart" /> Check out and close bill
            </button>
          )}
        </Card>
      ) : null}

      <Card title="Recent check-outs" hint="Guests who have already left. Open any of them to reprint the bill.">
        {history.length === 0 ? (
          <Empty>No guest has checked out yet.</Empty>
        ) : (
          <div className="scroll">
            <table>
              <thead>
                <tr>
                  <th>Token</th>
                  <th>Guest</th>
                  <th>Room</th>
                  <th>Stayed</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {history.slice(0, 15).map((stay) => (
                  <tr key={stay.token_number}>
                    <td>#{stay.token_number}</td>
                    <td>{stay.guest_name}</td>
                    <td>{stay.rooms.room_number}</td>
                    <td>
                      {shortDate(stay.arrival_time)} &rarr; {shortDate(stay.checkout_time)}
                    </td>
                    <td>
                      <div className="row-actions">
                        <button className="mini" type="button" onClick={() => show(stay.token_number)}>
                          View bill
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
