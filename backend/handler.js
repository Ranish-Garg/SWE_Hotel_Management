import { NextResponse } from 'next/server';
import { ApiError } from './errors.js';

/**
 * Wraps a service call for a Next.js route handler: successful results become
 * JSON, ApiErrors become their own status code, anything else becomes a 500.
 */
export async function handle(work, successStatus = 200) {
  try {
    return NextResponse.json(await work(), { status: successStatus });
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json({ error: error.message, ...error.extra }, { status: error.status });
    }
    console.error(error);
    return NextResponse.json({ error: 'Something went wrong on the server' }, { status: 500 });
  }
}
