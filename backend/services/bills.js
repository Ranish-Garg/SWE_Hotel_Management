import { db, unwrap } from '../supabase.js';
import { buildBill, DAY_MS } from '../billing.js';
import { getReservation } from './reservations.js';
import { listFoodOrders } from './food.js';
import { discountFor } from './frequentGuests.js';

/**
 * The bill as it stands now: room charge for the nights stayed, everything
 * eaten, the frequent-guest discount and the balance still payable.
 * A guest who has not checked out yet is billed up to their expected
 * departure, so the receptionist can show them the amount in advance.
 */
export async function getBill(tokenNumber) {
  const reservation = await getReservation(tokenNumber);
  const [foodOrders, discount] = await Promise.all([
    listFoodOrders(tokenNumber),
    discountFor(reservation.identity_number),
  ]);

  const departure =
    reservation.checkout_time ??
    new Date(new Date(reservation.arrival_time).getTime() + reservation.duration_days * DAY_MS);

  return { ...buildBill(reservation, foodOrders, discount, departure), status: reservation.status };
}

/** Check the guest out, freeing the room, and return the final bill. */
export async function checkOut(tokenNumber) {
  const reservation = await getReservation(tokenNumber);
  if (reservation.status === 'checked_out') return getBill(tokenNumber);

  unwrap(
    await db
      .from('reservations')
      .update({ status: 'checked_out', checkout_time: new Date().toISOString() })
      .eq('token_number', tokenNumber)
      .select()
      .single()
  );

  return getBill(tokenNumber);
}
