import { handle } from '@/backend/handler.js';
import { addFoodOrder, listFoodOrders } from '@/backend/services/food.js';

export const GET = (request) =>
  handle(() => listFoodOrders(new URL(request.url).searchParams.get('token')));

export const POST = (request) => handle(async () => addFoodOrder(await request.json()), 201);

// Always talk to the database on request; never cache these responses.
export const dynamic = 'force-dynamic';
