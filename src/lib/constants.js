/**
 * App-wide Constants
 * 
 * Centralized configuration values used across the application.
 */

// Subject definitions with icons and colors
export const SUBJECTS = [
  {
    name: 'DSA',
    slug: 'dsa',
    icon: '🧮',
    color: '#6C63FF',
    description: 'Data Structures & Algorithms — Master problem solving with an integrated code compiler'
  },
  {
    name: 'Electronics',
    slug: 'electronics',
    icon: '⚡',
    color: '#FF6B6B',
    description: 'Digital & Analog Electronics — Circuit analysis, logic design, and signal processing'
  },
  {
    name: 'Chemistry',
    slug: 'chemistry',
    icon: '🧪',
    color: '#4ECDC4',
    description: 'Organic, Inorganic & Physical Chemistry — Reactions, bonding, and molecular structures'
  },
  {
    name: 'SQL',
    slug: 'sql',
    icon: '🗄️',
    color: '#FFE66D',
    description: 'Structured Query Language — Write and execute SQL queries with a built-in compiler'
  },
  {
    name: 'Excel',
    slug: 'excel',
    icon: '📊',
    color: '#2ECC71',
    description: 'Microsoft Excel — Formulas, data analysis, and spreadsheet mastery with live practice'
  }
];

// Judge0 language IDs for code execution
export const LANGUAGE_IDS = {
  javascript: 63,
  python: 71,
  cpp: 54,
  c: 50,
  java: 62,
};

// Quiz difficulty levels
export const DIFFICULTY_LEVELS = ['easy', 'medium', 'hard'];

// Pomodoro timer defaults (in minutes)
export const POMODORO = {
  WORK_DURATION: 25,
  SHORT_BREAK: 5,
  LONG_BREAK: 15,
  SESSIONS_BEFORE_LONG_BREAK: 4,
};

// API response helpers
export const API_ERRORS = {
  UNAUTHORIZED: { error: 'Unauthorized. Please log in.' },
  NOT_FOUND: { error: 'Resource not found.' },
  SERVER_ERROR: { error: 'Internal server error.' },
  VALIDATION: { error: 'Validation failed. Check your input.' },
};
