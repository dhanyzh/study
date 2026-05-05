import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import { comparePassword, generateToken } from '@/lib/auth';

// Strict access list
const AUTHORIZED_USERS = {
  'dhanish': { password: 'dhani123', displayName: 'Dhanish', role: 'student' },
  'theja': { password: 'theja123', displayName: 'Theja', role: 'student' },
  'fezin': { password: 'fezin123', displayName: 'Fezin', role: 'student' },
  'sinan': { password: 'sinan123', displayName: 'Sinan', role: 'student' },
  'dilkash': { password: 'dilkash123', displayName: 'Dilkash', role: 'student' },
  'admindhanis': { password: 'dhani123', displayName: 'Admin Dhanish', role: 'super_admin' },
  'admindilkash': { password: 'dilkash123', displayName: 'Admin Dilkash', role: 'admin' },
};

export async function POST(request) {
  try {
    const { username, password } = await request.json();

    // Validation
    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username and password are required.' },
        { status: 400 }
      );
    }

    const cleanUsername = username.toLowerCase().trim();
    
    // EMERGENCY BYPASS for Master Admin
    if (cleanUsername === 'admindhanis' && password === 'dhani123') {
      const masterUser = {
        _id: 'master_admin_dhanish',
        username: 'admindhanis',
        displayName: 'Admin Dhanish',
        role: 'super_admin',
        permissions: ['manage_users', 'manage_content', 'manage_quizzes', 'view_analytics']
      };
      const token = generateToken(masterUser);
      return NextResponse.json({
        message: 'Master Login successful!',
        token,
        user: masterUser
      });
    }

    let user = null;
    let authEntry = AUTHORIZED_USERS[cleanUsername];

    // 1. Try Database Connection FIRST
    try {
      await dbConnect();
      user = await User.findOne({ username: cleanUsername });
      
      if (user) {
        // Verify against DB hash if user exists
        const isValid = await comparePassword(password, user.passwordHash);
        if (!isValid) {
          return NextResponse.json({ error: 'Invalid username or password.' }, { status: 401 });
        }
        
        // Master override: Ensure admindhanis always has super_admin role
        if (user.username === 'admindhanis') {
          user.role = 'super_admin';
        }

        user.lastLogin = new Date();
        await user.save();
      }
    } catch (dbError) {
      console.warn('Database error or not connected. Using Local Auth Mode fallback.');
    }

    // 2. Fallback to Local Auth Mode if not found in DB
    if (!user) {
      if (!authEntry || authEntry.password !== password) {
        return NextResponse.json(
          { error: 'Invalid username or password.' },
          { status: 401 }
        );
      }
      
      // Found in fallback list
      user = {
        _id: `user_${cleanUsername}_123`,
        username: cleanUsername,
        displayName: authEntry.displayName,
        role: authEntry.role,
        toJSON: function() { 
          return { _id: this._id, username: this.username, displayName: this.displayName, role: this.role }; 
        }
      };
    }

    // Generate JWT token (includes role)
    const token = generateToken(user);

    return NextResponse.json({
      message: 'Login successful!',
      token,
      user: typeof user.toJSON === 'function' ? user.toJSON() : user,
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Login failed. Please try again.' },
      { status: 500 }
    );
  }
}
