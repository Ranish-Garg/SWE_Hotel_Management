import { handle } from '@/backend/handler.js';
import { getBill } from '@/backend/services/bills.js';

export const GET = (_request, { params }) => handle(() => getBill(params.token));

// Always talk to the database on request; never cache these responses.
export const dynamic = 'force-dynamic';
