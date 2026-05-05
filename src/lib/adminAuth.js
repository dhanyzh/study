/**
 * Admin Authentication Helper
 * 
 * Verifies that a request comes from an authenticated admin user.
 * Used by all /api/admin/* routes.
 */

import { authenticateRequest } from '@/lib/auth';

/**
 * Verify admin access from request.
 * Returns { authorized, payload, error, status } object.
 */
export function requireAdmin(request) {
  const payload = authenticateRequest(request);
  
  if (!payload) {
    return {
      authorized: false,
      payload: null,
      error: 'Unauthorized. Please log in.',
      status: 401,
    };
  }

  if (payload.role !== 'admin') {
    return {
      authorized: false,
      payload,
      error: 'Forbidden. Admin access required.',
      status: 403,
    };
  }

  return {
    authorized: true,
    payload,
    error: null,
    status: 200,
  };
}
