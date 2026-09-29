import { handle } from '@/backend/handler.js';
import { addRoom, listRooms } from '@/backend/services/rooms.js';

export const GET = () => handle(() => listRooms());
export const POST = (request) => handle(async () => addRoom(await request.json()), 201);

// Always talk to the database on request; never cache these responses.
export const dynamic = 'force-dynamic';
