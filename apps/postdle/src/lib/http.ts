// 라우트 핸들러 공용 헬퍼
import { NextResponse } from 'next/server';

export function ok(data: Record<string, unknown> = {}) {
  return NextResponse.json({ ok: true, ...data });
}
export function fail(message: string, status = 400) {
  return NextResponse.json({ ok: false, message }, { status });
}

export class HttpError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

export function handle(fn: () => Promise<NextResponse>): Promise<NextResponse> {
  return fn().catch((e) => {
    if (e instanceof HttpError) return fail(e.message, e.status);
    console.error(e);
    return fail('서버 오류', 500);
  });
}
