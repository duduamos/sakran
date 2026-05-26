import app from '@/backend/hono';

const handler = (request: Request): Response | Promise<Response> =>
  app.fetch(request);

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const DELETE = handler;
export const PATCH = handler;
export const OPTIONS = handler;
