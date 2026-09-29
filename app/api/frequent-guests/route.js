import { handle } from '@/backend/handler.js';
import { addFrequentGuest, listFrequentGuests } from '@/backend/services/frequentGuests.js';

export const GET = () => handle(() => listFrequentGuests());
export const POST = (request) => handle(async () => addFrequentGuest(await request.json()), 201);

// Always talk to the database on request; never cache these responses.
export const dynamic = 'force-dynamic';
