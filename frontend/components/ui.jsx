'use client';

export function Card({ title, hint, actions, children }) {
  return (
    <section className="card">
      <div className="card-head">
        <div>
          <h2>{title}</h2>
          {hint ? <p className="hint">{hint}</p> : null}
        </div>
        {actions ? <div className="no-print">{actions}</div> : null}
      </div>
      {children}
    </section>
  );
}

export function Field({ label, children }) {
  return (
    <div>
      <label>{label}</label>
      {children}
    </div>
  );
}

/** A success or error line under a form. */
export function Note({ note }) {
  if (!note) return null;
  return <p className={`note ${note.kind === 'error' ? 'bad' : 'ok'}`}>{note.text}</p>;
}

export function Empty({ children }) {
  return <p className="empty">{children}</p>;
}

/** The single place the two room attributes are turned into a picker. */
export function RoomTypeFields({ bedType, isAc, onChange }) {
  return (
    <>
      <Field label="Bed type">
        <select value={bedType} onChange={(event) => onChange({ bedType: event.target.value })}>
          <option value="single">Single bed</option>
          <option value="double">Double bed</option>
        </select>
      </Field>
      <Field label="Air conditioning">
        <select value={isAc ? 'ac' : 'non-ac'} onChange={(event) => onChange({ isAc: event.target.value === 'ac' })}>
          <option value="ac">AC</option>
          <option value="non-ac">Non-AC</option>
        </select>
      </Field>
    </>
  );
}

/** Choose a guest who has not checked out yet, by token number. */
export function GuestPicker({ guests, value, onChange, required = true }) {
  return (
    <select required={required} value={value} onChange={(event) => onChange(event.target.value)}>
      <option value="">Select a guest...</option>
      {guests.map((guest) => (
        <option key={guest.token_number} value={guest.token_number}>
          #{guest.token_number} &middot; {guest.guest_name} &middot; Room {guest.rooms?.room_number}
        </option>
      ))}
    </select>
  );
}

const ICONS = {
  overview: 'M3 13h8V3H3zM13 21h8V11h-8zM3 21h8v-6H3zM13 3v6h8V3z',
  reception: 'M4 20h16M6 20V10m12 10V10M3 10l9-6 9 6M10 20v-5h4v5',
  rooms: 'M3 18v-6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v6M3 18h18M3 18v2m18-2v2M6 10V6a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v4',
  catering: 'M5 3v8a2 2 0 0 0 2 2v8M9 3v8a2 2 0 0 1-2 2M7 3v6M17 21V3c-2 0-4 2-4 6v4h4',
  checkout: 'M6 2h12v20l-3-2-3 2-3-2-3 2zM9 7h6M9 11h6M9 15h4',
  manager: 'M4 20V10M10 20V4M16 20v-7M22 20H2',
  guests: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8',
  arrive: 'M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M15 12H3',
  depart: 'M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9',
  key: 'M15 7a4 4 0 1 1-3.9 5H3v3h3v3h3v-3h2.1A4 4 0 0 1 15 7z',
  percent: 'M19 5 5 19M7 9a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM17 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4z',
  print: 'M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2M6 14h12v8H6z',
  refresh: 'M21 12a9 9 0 1 1-3-6.7L21 8M21 3v5h-5',
};

export function Icon({ name }) {
  return (
    <svg className="icon" viewBox="0 0 24 24" aria-hidden="true">
      <path d={ICONS[name]} />
    </svg>
  );
}
