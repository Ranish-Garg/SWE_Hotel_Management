import { db, unwrap } from '../supabase.js';
import { ApiError } from '../errors.js';

const BED_TYPES = ['single', 'double'];

/** Every room with its current tariff and the bookings still holding it. */
export async function listRooms() {
  const [rooms, rates, bookings] = await Promise.all([
    db.from('rooms').select('id, room_number, bed_type, is_ac').order('room_number'),
    db.from('room_rates').select('bed_type, is_ac, rate'),
    db
      .from('reservations')
      .select('token_number, room_id, guest_name, arrival_time, duration_days, checkout_time')
      .eq('status', 'booked'),
  ]).then((results) => results.map(unwrap));

  const rateOf = (room) =>
    rates.find((rate) => rate.bed_type === room.bed_type && rate.is_ac === room.is_ac);

  return rooms.map((room) => ({
    ...room,
    rate: Number(rateOf(room)?.rate ?? 0),
    bookings: bookings.filter((booking) => booking.room_id === room.id),
  }));
}

export async function addRoom({ room_number, bed_type, is_ac }) {
  if (!room_number || !BED_TYPES.includes(bed_type)) {
    throw new ApiError(400, 'room_number and bed_type (single|double) are required');
  }
  return unwrap(
    await db
      .from('rooms')
      .insert({ room_number: String(room_number), bed_type, is_ac: Boolean(is_ac) })
      .select()
      .single()
  );
}
