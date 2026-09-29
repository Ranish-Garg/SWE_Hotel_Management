import { db, unwrap } from '../supabase.js';
import { ApiError } from '../errors.js';
import { DAY_MS, overlaps, round2, stayEnd } from '../billing.js';

/**
 * Average occupancy rate for a month, so the manager can decide whether to
 * revise the tariff. For every day of the month the rooms occupied that day
 * are counted; the rate is the average of those daily figures over the
 * number of rooms in the hotel.
 * @param {string} month  'YYYY-MM'
 */
export async function monthlyOccupancy(month) {
  const match = /^(\d{4})-(\d{2})$/.exec(month ?? '');
  if (!match) throw new ApiError(400, 'month must be given as YYYY-MM');

  const year = Number(match[1]);
  const monthIndex = Number(match[2]) - 1;
  if (monthIndex < 0 || monthIndex > 11) throw new ApiError(400, 'month must be between 01 and 12');

  const monthStart = new Date(Date.UTC(year, monthIndex, 1));
  const monthEnd = new Date(Date.UTC(year, monthIndex + 1, 1));
  const daysInMonth = Math.round((monthEnd - monthStart) / DAY_MS);

  const [{ count: totalRooms }, reservations] = await Promise.all([
    db.from('rooms').select('id', { count: 'exact', head: true }),
    db
      .from('reservations')
      .select('room_id, arrival_time, duration_days, checkout_time')
      .lt('arrival_time', monthEnd.toISOString())
      .then(unwrap),
  ]);

  if (!totalRooms) throw new ApiError(400, 'The hotel has no rooms yet');

  const daily = [];
  let occupiedRoomDays = 0;

  for (let day = 0; day < daysInMonth; day += 1) {
    const dayStart = new Date(monthStart.getTime() + day * DAY_MS);
    const dayEnd = new Date(dayStart.getTime() + DAY_MS);

    const occupiedRooms = new Set(
      reservations
        .filter((r) => overlaps(dayStart, dayEnd, new Date(r.arrival_time), stayEnd(r)))
        .map((r) => r.room_id)
    );

    occupiedRoomDays += occupiedRooms.size;
    daily.push({
      date: dayStart.toISOString().slice(0, 10),
      occupied_rooms: occupiedRooms.size,
      occupancy_percent: round2((occupiedRooms.size / totalRooms) * 100),
    });
  }

  return {
    month,
    total_rooms: totalRooms,
    days_in_month: daysInMonth,
    occupied_room_days: occupiedRoomDays,
    average_occupancy_percent: round2((occupiedRoomDays / (totalRooms * daysInMonth)) * 100),
    daily,
  };
}
