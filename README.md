# Hotel Automation Software

A minimal Next.js application that automates the day-to-day activities of a
5-star hotel: room reservation, room tariff revision, catering entries and
billing at check-out. Supabase (PostgreSQL) is the database.

## Folders

| Folder      | What is inside                                                                 |
| ----------- | ------------------------------------------------------------------------------ |
| `backend/`  | Supabase client, the business rules (`billing.js`) and one service per feature. |
| `frontend/` | The user interface: React components, styles and the small fetch helper.        |
| `app/`      | Next.js wiring only - the page and the thin `/api/*` route handlers.            |

The API routes never contain logic; they call a service in `backend/services/`
and turn its result (or its `ApiError`) into JSON. `backend/` never imports
anything from `frontend/`, so the two layers stay independent.

## Setup

1. Create a project at [supabase.com](https://supabase.com).
2. Open **SQL Editor** and run the whole of `backend/schema.sql`. It creates the
   tables and seeds four tariffs, six rooms and two frequent guests.
3. Copy the credentials from **Project settings -> API** into `.env.local`:

   ```
   SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
   SUPABASE_SERVICE_KEY=<the service_role key>
   ```

   The `service_role` key is read on the server only and must never be shipped
   to the browser.
4. Install and run:

   ```
   npm install
   npm run dev
   ```

   The app is at <http://localhost:3000>.

## The screens

- **Reception** - reserve a room in advance or on the spot. The receptionist
  enters the guest's name, arrival time, approximate stay, advance paid, the
  room type wanted and, if the guest has one, their frequent-guest identity
  number. A free room of that type is allotted and a unique token number is
  returned; if nothing suitable is free, an apology message is shown instead.
- **Rooms** - every room, its category, its current tariff and whether it is
  free. New rooms can be added here.
- **Catering** - the catering manager records each food item against a token
  number with its quantity, price and the date and time it was consumed.
- **Check-out** - the full bill for a token: room charge for the nights stayed,
  every food item, the frequent-guest discount, the advance already paid and
  the balance payable. Checking out frees the room.
- **Manager** - the average occupancy rate for a chosen month, on the strength
  of which the tariff of any of the four categories can be revised up or down by
  a percentage; frequent-guest identity numbers are issued here too.

## Rules worth knowing

- **Room categories.** Single/double bed crossed with AC/Non-AC gives four
  categories, each with its own tariff in `room_rates`.
- **Tariff revision.** A revision changes `room_rates` only. Each reservation
  stores the `rate_per_night` it was made at, so a revision never alters a
  booking that already exists.
- **Availability.** A room is free for a requested period when no live booking
  overlaps it, so advance reservations for future dates are handled correctly.
- **Occupancy rate.** For every day of the month the rooms occupied that day
  are counted; the average occupancy is those occupied room-days divided by
  (rooms x days in the month).
- **Nights charged.** Any part of a day counts as a full night, and a stay is
  at least one night. A guest who has not checked out yet is billed up to the
  expected departure, so the amount can be shown in advance.

## API

| Method  | Path                     | Purpose                                     |
| ------- | ------------------------ | ------------------------------------------- |
| `GET`   | `/api/rooms`             | Rooms with tariff and current bookings      |
| `POST`  | `/api/rooms`             | Add a room                                  |
| `GET`   | `/api/rates`             | Tariff of the four categories               |
| `PATCH` | `/api/rates`             | Revise one category by a percentage         |
| `GET`   | `/api/reservations`      | Reservations (`?status=booked\|checked_out`) |
| `POST`  | `/api/reservations`      | Allot a room, or return an apology (409)    |
| `GET`   | `/api/food?token=`       | Food consumed by a guest                    |
| `POST`  | `/api/food`              | Record a consumed item                      |
| `GET`   | `/api/bill/:token`       | Bill as it stands                           |
| `POST`  | `/api/checkout/:token`   | Check out and return the final bill         |
| `GET`   | `/api/occupancy?month=`  | Average occupancy for `YYYY-MM`             |
| `GET`   | `/api/frequent-guests`   | Frequent guests and their discounts         |
| `POST`  | `/api/frequent-guests`   | Issue an identity number                    |
