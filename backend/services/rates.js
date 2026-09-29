import { db, unwrap } from '../supabase.js';
import { ApiError } from '../errors.js';
import { round2 } from '../billing.js';

/** The tariff of each of the four room categories. */
export async function listRates() {
  const rates = unwrap(await db.from('room_rates').select('*').order('bed_type').order('is_ac'));
  return rates.map((rate) => ({ ...rate, rate: Number(rate.rate) }));
}

/**
 * Revise one category's tariff by a percentage.
 * A positive percent raises the rate, a negative one lowers it.
 * Existing bookings are unaffected: they store the rate they were made at.
 */
export async function reviseRate({ bed_type, is_ac, percent }) {
  const change = Number(percent);
  if (!['single', 'double'].includes(bed_type) || Number.isNaN(change)) {
    throw new ApiError(400, 'bed_type (single|double), is_ac and percent are required');
  }

  const current = unwrap(
    await db.from('room_rates').select('rate').eq('bed_type', bed_type).eq('is_ac', Boolean(is_ac)).single()
  );
  const newRate = round2(Number(current.rate) * (1 + change / 100));
  if (newRate <= 0) throw new ApiError(400, 'That revision would make the tariff zero or negative');

  const updated = unwrap(
    await db
      .from('room_rates')
      .update({ rate: newRate })
      .eq('bed_type', bed_type)
      .eq('is_ac', Boolean(is_ac))
      .select()
      .single()
  );

  return { ...updated, rate: Number(updated.rate), previous_rate: Number(current.rate) };
}
