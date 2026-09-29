'use client';

export function Card({ title, hint, children }) {
  return (
    <section className="card">
      <h2>{title}</h2>
      {hint ? <p className="hint">{hint}</p> : null}
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
