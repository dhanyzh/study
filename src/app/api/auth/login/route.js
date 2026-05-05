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
  'admindhanis': { password: 'dhani123', displayName: 'Admin Dhanish', role: 'admin' },
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

    // 1. Strict Restriction Check
    if (!AUTHORIZED_USERS[cleanUsername] || AUTHORIZED_USERS[cleanUsername].password !== password) {
      return NextResponse.json(
        { error: 'Access Denied. Invalid credentials or unauthorized user.' },
        { status: 401 }
      );
    }

    const authEntry = AUTHORIZED_USERS[cleanUsername];
    let user;

    // 2. Try Database Connection
    try {
      await dbConnect();
      user = await User.findOne({ username: cleanUsername });
      
      if (user) {
        // Verify against DB hash if user exists
        const isValid = await comparePassword(password, user.passwordHash);
        if (isValid) {
          user.lastLogin = new Date();
          // Sync role from authorized list
          if (user.role !== authEntry.role) {
            user.role = authEntry.role;
          }
          await user.save();
        } else {
          // Fallback to strict list if DB hash fails for some reason
        }
      }
    } catch (dbError) {
      console.warn('Database not connected. Using Local Auth Mode for authorized user.');
    }

    // 3. Local Auth Mode (Fallback if DB is missing or empty but user is in authorized list)
    if (!user) {
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
