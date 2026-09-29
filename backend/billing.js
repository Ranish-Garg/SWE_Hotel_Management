// Pure business rules: no database access, so they are easy to read and test.

export const DAY_MS = 24 * 60 * 60 * 1000;

/** Nights charged for a stay. Any part of a day counts as a full night. */
export function nightsBetween(arrival, departure) {
  const nights = Math.ceil((new Date(departure) - new Date(arrival)) / DAY_MS);
  return Math.max(1, nights);
}

/** End of the period a booking keeps its room blocked for. */
export function stayEnd(reservation) {
  if (reservation.checkout_time) return new Date(reservation.checkout_time);
  return new Date(new Date(reservation.arrival_time).getTime() + reservation.duration_days * DAY_MS);
}

/** Do the half-open intervals [aStart, aEnd) and [bStart, bEnd) overlap? */
export function overlaps(aStart, aEnd, bStart, bEnd) {
  return aStart < bEnd && bStart < aEnd;
}

export const round2 = (n) => Math.round(n * 100) / 100;

/**
 * Build a guest's bill.
 * @param {object} reservation      row from `reservations`
 * @param {Array}  foodOrders       rows from `food_orders`
 * @param {number} discountPercent  frequent-guest discount, 0 for a normal guest
 * @param {Date|string} departure   actual or expected departure time
 */
export function buildBill(reservation, foodOrders, discountPercent, departure) {
  const nights = nightsBetween(reservation.arrival_time, departure);
  const roomCharge = nights * Number(reservation.rate_per_night);

  const foodItems = foodOrders.map((order) => ({
    ...order,
    amount: round2(order.quantity * Number(order.unit_price)),
  }));
  const foodCharge = foodItems.reduce((sum, item) => sum + item.amount, 0);

  const subtotal = roomCharge + foodCharge;
  const discount = (subtotal * discountPercent) / 100;
  const total = subtotal - discount;
  const advance = Number(reservation.advance_paid);

  return {
    token_number: reservation.token_number,
    guest_name: reservation.guest_name,
    room_number: reservation.rooms?.room_number ?? null,
    arrival_time: reservation.arrival_time,
    departure_time: new Date(departure).toISOString(),
    nights,
    rate_per_night: Number(reservation.rate_per_night),
    room_charge: round2(roomCharge),
    food_items: foodItems,
    food_charge: round2(foodCharge),
    subtotal: round2(subtotal),
    discount_percent: discountPercent,
    discount: round2(discount),
    total: round2(total),
    advance_paid: round2(advance),
    balance_payable: round2(total - advance),
  };
}
