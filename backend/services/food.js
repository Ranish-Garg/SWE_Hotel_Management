import { db, unwrap } from '../supabase.js';
import { ApiError } from '../errors.js';
import { getReservation } from './reservations.js';

export async function listFoodOrders(tokenNumber) {
  return unwrap(
    await db.from('food_orders').select('*').eq('token_number', tokenNumber).order('consumed_at')
  );
}

/** The catering manager records an item as and when the guest consumes it. */
export async function addFoodOrder({ token_number, item_name, quantity, unit_price, consumed_at }) {
  if (!token_number || !item_name || !(Number(quantity) > 0)) {
    throw new ApiError(400, 'token_number, item_name and a positive quantity are required');
  }

  const reservation = await getReservation(token_number);
  if (reservation.status === 'checked_out') {
    throw new ApiError(400, `Token number ${token_number} has already checked out`);
  }

  return unwrap(
    await db
      .from('food_orders')
      .insert({
        token_number: Number(token_number),
        item_name,
        quantity: Number(quantity),
        unit_price: Number(unit_price) || 0,
        consumed_at: consumed_at ? new Date(consumed_at).toISOString() : new Date().toISOString(),
      })
      .select()
      .single()
  );
}
