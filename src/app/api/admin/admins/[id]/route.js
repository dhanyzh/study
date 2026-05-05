import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import { requireSuperAdmin } from '@/lib/adminAuth';

/**
 * PATCH /api/admin/admins/[id] — Update admin permissions or role
 */
export async function PATCH(request, { params }) {
  const auth = requireSuperAdmin(request);
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { id } = params;

  try {
    const { permissions, role, displayName } = await request.json();
    await dbConnect();

    const updateData = {};
    if (permissions !== undefined) updateData.permissions = permissions;
    if (role !== undefined) updateData.role = role;
    if (displayName !== undefined) updateData.displayName = displayName;

    // Prevent modifying the last super_admin if needed, but for now just update
    const admin = await User.findByIdAndUpdate(id, updateData, { new: true });
    
    if (!admin) {
      return NextResponse.json({ error: 'Admin not found.' }, { status: 404 });
    }

    return NextResponse.json({ 
      admin, 
      message: 'Admin updated successfully.' 
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update admin.' }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/admins/[id] — Delete an admin user
 */
export async function DELETE(request, { params }) {
  const auth = requireSuperAdmin(request);
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { id } = params;

  try {
    await dbConnect();
    
    // Safety: Prevent Super Admin from deleting themselves via this API
    if (id === auth.payload.userId) {
      return NextResponse.json({ error: 'Cannot delete your own account.' }, { status: 400 });
    }

    const admin = await User.findByIdAndDelete(id);
    if (!admin) {
      return NextResponse.json({ error: 'Admin not found.' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Admin deleted successfully.' });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete admin.' }, { status: 500 });
  }
}
