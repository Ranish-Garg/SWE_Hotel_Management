import { db, unwrap } from '../supabase.js';
import { ApiError } from '../errors.js';

export async function listFrequentGuests() {
  const guests = unwrap(await db.from('frequent_guests').select('*').order('identity_number'));
  return guests.map((guest) => ({ ...guest, discount_percent: Number(guest.discount_percent) }));
}

/** Issue an identity number to a frequent guest, with their discount. */
export async function addFrequentGuest({ identity_number, name, discount_percent }) {
  const discount = Number(discount_percent);
  if (!identity_number || !name || Number.isNaN(discount) || discount < 0 || discount > 100) {
    throw new ApiError(400, 'identity_number, name and a discount_percent between 0 and 100 are required');
  }
  return unwrap(
    await db
      .from('frequent_guests')
      .upsert({ identity_number, name, discount_percent: discount })
      .select()
      .single()
  );
}

/** Discount a guest is entitled to; 0 when they hold no identity number. */
export async function discountFor(identity_number) {
  if (!identity_number) return 0;
  const guest = unwrap(
    await db.from('frequent_guests').select('discount_percent').eq('identity_number', identity_number).maybeSingle()
  );
  if (!guest) throw new ApiError(400, `Unknown identity number ${identity_number}`);
  return Number(guest.discount_percent);
}
