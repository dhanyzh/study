/**
 * Admin Authentication Helper
 * 
 * Verifies that a request comes from an authenticated admin or super_admin.
 * Supports granular permission checks.
 */

import { authenticateRequest } from '@/lib/auth';

/**
 * Verify admin/super_admin access from request.
 * Allows both 'admin' and 'super_admin' roles by default.
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

  // Allow both admin and super_admin
  if (payload.role !== 'admin' && payload.role !== 'super_admin') {
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

/**
 * Verify super_admin access from request.
 */
export function requireSuperAdmin(request) {
  const payload = authenticateRequest(request);
  
  if (!payload) {
    return { authorized: false, payload: null, error: 'Unauthorized.', status: 401 };
  }

  if (payload.role !== 'super_admin') {
    return {
      authorized: false,
      payload,
      error: 'Forbidden. Super Admin access required.',
      status: 403,
    };
  }

  return { authorized: true, payload, error: null, status: 200 };
}

/**
 * Verify specific permission for admin users.
 * Super Admin always passes.
 */
export function requirePermission(request, permission) {
  const payload = authenticateRequest(request);
  
  if (!payload) {
    return { authorized: false, payload: null, error: 'Unauthorized.', status: 401 };
  }

  // Super Admin bypasses all permission checks
  if (payload.role === 'super_admin') {
    return { authorized: true, payload, error: null, status: 200 };
  }

  if (payload.role === 'admin') {
    // Admins must have the specific permission in their JWT/payload
    // Note: We should ensure permissions are included in the JWT payload during login
    const permissions = payload.permissions || [];
    if (permissions.includes(permission)) {
      return { authorized: true, payload, error: null, status: 200 };
    }
  }

  return {
    authorized: false,
    payload,
    error: `Forbidden. Missing required permission: ${permission}`,
    status: 403,
  };
}
