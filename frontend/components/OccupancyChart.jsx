'use client';

import { shortDate } from '../api.js';

/** Daily occupancy for a month as thin bars; today is picked out in gold. */
export default function OccupancyChart({ daily }) {
  if (!daily?.length) return null;
  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="chart" role="img" aria-label="Rooms occupied on each day of the month">
      <div className="plot">
        {daily.map((day) => (
          <div className={`bar${day.date === today ? ' today' : ''}`} key={day.date}>
            <i style={{ height: `${day.occupancy_percent}%` }} />
            <span className="tip">
              {shortDate(day.date)}: {day.occupied_rooms} room(s) &middot; {day.occupancy_percent}%
            </span>
          </div>
        ))}
      </div>
      <div className="axis">
        <span>{shortDate(daily[0].date)}</span>
        <span>{shortDate(daily[Math.floor(daily.length / 2)].date)}</span>
        <span>{shortDate(daily[daily.length - 1].date)}</span>
      </div>
    </div>
  );
}
