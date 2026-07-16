import { ok } from '@/lib/api/response';
import { clearAuthCookies } from '@/lib/auth/session';

export async function POST() {
  const response = ok({ message: 'Signed out.' });
  clearAuthCookies(response);
  return response;
}
