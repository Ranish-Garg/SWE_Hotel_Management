/** Small fetch wrapper: returns parsed JSON, throws the server's message. */
export async function api(path, { method = 'GET', body } = {}) {
  const response = await fetch(`/api${path}`, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || 'Request failed');
  return data;
}

export const money = (amount) =>
  `₹${Number(amount ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export const dateTime = (value) => (value ? new Date(value).toLocaleString('en-IN') : '-');

export const roomType = (bedType, isAc) => `${bedType} / ${isAc ? 'AC' : 'Non-AC'}`;

/** Value for a datetime-local input, in the browser's own timezone. */
export function localDateTimeValue(date = new Date()) {
  const offset = date.getTimezoneOffset() * 60 * 1000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

export const currentMonth = () => new Date().toISOString().slice(0, 7);
