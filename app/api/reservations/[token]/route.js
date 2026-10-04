import { handle } from '@/backend/handler.js';
import { cancelReservation, getReservation } from '@/backend/services/reservations.js';

export const GET = (_request, { params }) => handle(() => getReservation(params.token));
export const DELETE = (_request, { params }) => handle(() => cancelReservation(params.token));

// Always talk to the database on request; never cache these responses.
export const dynamic = 'force-dynamic';
