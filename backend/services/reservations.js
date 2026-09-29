import { db, unwrap } from '../supabase.js';
import { ApiError } from '../errors.js';
import { DAY_MS, overlaps, stayEnd } from '../billing.js';
import { discountFor } from './frequentGuests.js';

const RESERVATION_FIELDS = '*, rooms(room_number, bed_type, is_ac)';

export async function listReservations(status) {
  let query = db.from('reservations').select(RESERVATION_FIELDS).order('token_number', { ascending: false });
  if (status) query = query.eq('status', status);
  return unwrap(await query);
}

export async function getReservation(tokenNumber) {
  const reservation = unwrap(
    await db.from('reservations').select(RESERVATION_FIELDS).eq('token_number', tokenNumber).maybeSingle()
  );
  if (!reservation) throw new ApiError(404, `No guest holds token number ${tokenNumber}`);
  return reservation;
}

/**
 * Reserve a room, in advance or on the spot.
 * The receptionist supplies the arrival time, the advance paid, the
 * approximate duration of stay and the type of room wanted. If a suitable
 * room is free for that whole period it is allotted and a unique token
 * number is returned; otherwise an apology is raised.
 */
export async function reserveRoom(input) {
  const { guest_name, phone, identity_number, bed_type, is_ac, arrival_time, duration_days, advance_paid } = input;

  if (!guest_name || !['single', 'double'].includes(bed_type) || !arrival_time) {
    throw new ApiError(400, 'guest_name, bed_type (single|double), is_ac and arrival_time are required');
  }

  const wantsAc = Boolean(is_ac);
  const days = Number(duration_days);
  const start = new Date(arrival_time);
  if (Number.isNaN(start.getTime())) throw new ApiError(400, 'arrival_time is not a valid date and time');
  if (!(days > 0)) throw new ApiError(400, 'duration_days must be a positive number');
  const end = new Date(start.getTime() + days * DAY_MS);

  // Validates the identity number before any room is held.
  const discount_percent = await discountFor(identity_number);

  const [rooms, booked] = await Promise.all([
    db.from('rooms').select('id, room_number').eq('bed_type', bed_type).eq('is_ac', wantsAc).order('room_number'),
    db.from('reservations').select('room_id, arrival_time, duration_days, checkout_time').eq('status', 'booked'),
  ]).then((results) => results.map(unwrap));

  const room = rooms.find(
    (candidate) =>
      !booked.some(
        (booking) =>
          booking.room_id === candidate.id && overlaps(start, end, new Date(booking.arrival_time), stayEnd(booking))
      )
  );

  if (!room) {
    throw new ApiError(
      409,
      `We are sorry - no ${wantsAc ? 'AC' : 'Non-AC'} ${bed_type} bed room is free for ${days} day(s) ` +
        `from ${start.toLocaleString('en-IN')}. Please try another date or another room type.`,
      { apology: true }
    );
  }

  const rate = unwrap(
    await db.from('room_rates').select('rate').eq('bed_type', bed_type).eq('is_ac', wantsAc).single()
  );

  const reservation = unwrap(
    await db
      .from('reservations')
      .insert({
        guest_name,
        phone: phone || null,
        identity_number: identity_number || null,
        room_id: room.id,
        arrival_time: start.toISOString(),
        duration_days: days,
        advance_paid: Number(advance_paid) || 0,
        rate_per_night: Number(rate.rate),
      })
      .select(RESERVATION_FIELDS)
      .single()
  );

  return {
    ...reservation,
    discount_percent,
    message: `Room ${room.room_number} allotted. Token number ${reservation.token_number}.`,
  };
}
