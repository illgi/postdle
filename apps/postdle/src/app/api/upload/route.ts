import { getToken } from '@/lib/session';
import { ok, handle, HttpError } from '@/lib/http';
import { pdUploadImage } from '@/lib/pagedle';

// POST /api/upload (multipart, field 'file') → 에디터 이미지 업로드 (로그인 필요)
export const POST = (r: Request) =>
  handle(async () => {
    const token = await getToken();
    if (!token) throw new HttpError('로그인이 필요해요', 401);
    const form = await r.formData();
    const file = form.get('file');
    if (!(file instanceof File)) throw new HttpError('파일이 필요해요');
    const url = await pdUploadImage(token, file);
    return ok({ url });
  });
