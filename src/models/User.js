import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, 'Username is required'],
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 30,
    lowercase: true,
  },
  email: {
    type: String,
    unique: true,
    sparse: true, // allows null but enforces uniqueness when present
    trim: true,
    lowercase: true,
  },
  passwordHash: {
    type: String,
    required: [true, 'Password is required'],
  },
  displayName: {
    type: String,
    trim: true,
    default: function () {
      return this.username;
    },
  },
  avatar: {
    type: String,
    default: '',
  },
  isDevUser: {
    type: Boolean,
    default: false,
  },
  role: {
    type: String,
    enum: ['student', 'admin'],
    default: 'student',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  lastLogin: {
    type: Date,
    default: Date.now,
  },
});

// Don't return passwordHash in JSON responses
UserSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.passwordHash;
  return obj;
};

export default mongoose.models.User || mongoose.model('User', UserSchema);
