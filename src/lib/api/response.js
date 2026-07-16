import { NextResponse } from 'next/server';

export function ok(data = {}, init = {}) {
  return NextResponse.json({ success: true, ...data }, init);
}

export function fail(message, status = 400, details = undefined) {
  return NextResponse.json(
    { success: false, error: message, details },
    { status }
  );
}
