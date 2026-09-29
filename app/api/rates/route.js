import { handle } from '@/backend/handler.js';
import { listRates, reviseRate } from '@/backend/services/rates.js';

export const GET = () => handle(() => listRates());
export const PATCH = (request) => handle(async () => reviseRate(await request.json()));

// Always talk to the database on request; never cache these responses.
export const dynamic = 'force-dynamic';
