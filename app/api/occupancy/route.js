import { handle } from '@/backend/handler.js';
import { monthlyOccupancy } from '@/backend/services/occupancy.js';

export const GET = (request) =>
  handle(() => monthlyOccupancy(new URL(request.url).searchParams.get('month')));

// Always talk to the database on request; never cache these responses.
export const dynamic = 'force-dynamic';
