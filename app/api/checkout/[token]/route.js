import { handle } from '@/backend/handler.js';
import { checkOut } from '@/backend/services/bills.js';

export const POST = (_request, { params }) => handle(() => checkOut(params.token));

// Always talk to the database on request; never cache these responses.
export const dynamic = 'force-dynamic';
