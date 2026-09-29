import { handle } from '@/backend/handler.js';
import { listReservations, reserveRoom } from '@/backend/services/reservations.js';

export const GET = (request) =>
  handle(() => listReservations(new URL(request.url).searchParams.get('status')));

export const POST = (request) => handle(async () => reserveRoom(await request.json()), 201);

// Always talk to the database on request; never cache these responses.
export const dynamic = 'force-dynamic';
