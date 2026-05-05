/**
 * Database Seed Script
 * 
 * Seeds demo users (dhanish, theja) and all 5 subjects with chapters, topics, notes, and quizzes.
 * Run with: node scripts/seed.js
 */

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const MONGODB_URI = process.env.MONGODB_URI;

// ─── Schemas (inline for standalone script) ───
const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, lowercase: true },
  email: { type: String, unique: true, sparse: true },
  passwordHash: { type: String, required: true },
  displayName: { type: String },
  avatar: { type: String, default: '' },
  isDevUser: { type: Boolean, default: false },
  role: { type: String, enum: ['student', 'admin'], default: 'student' },
  createdAt: { type: Date, default: Date.now },
  lastLogin: { type: Date, default: Date.now },
});

const SubjectSchema = new mongoose.Schema({
  name: String, slug: { type: String, unique: true }, icon: String,
  color: String, description: String, order: Number,
});

const ChapterSchema = new mongoose.Schema({
  subjectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject' },
  title: String, slug: String, order: Number, description: String,
});

const TopicSchema = new mongoose.Schema({
  chapterId: { type: mongoose.Schema.Types.ObjectId, ref: 'Chapter' },
  subjectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject' },
  title: String, slug: String, order: Number, videoUrl: String,
});

const NoteSchema = new mongoose.Schema({
  topicId: { type: mongoose.Schema.Types.ObjectId, ref: 'Topic' },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  content: String, source: { type: String, default: 'system' },
  createdAt: { type: Date, default: Date.now }, updatedAt: { type: Date, default: Date.now },
});

const QuizSchema = new mongoose.Schema({
  topicId: { type: mongoose.Schema.Types.ObjectId, ref: 'Topic' },
  subjectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject' },
  question: String, options: [String], correctAnswer: Number,
  explanation: String, difficulty: { type: String, default: 'medium' },
  source: { type: String, default: 'system' },
});

const User = mongoose.models.User || mongoose.model('User', UserSchema);
const Subject = mongoose.models.Subject || mongoose.model('Subject', SubjectSchema);
const Chapter = mongoose.models.Chapter || mongoose.model('Chapter', ChapterSchema);
const Topic = mongoose.models.Topic || mongoose.model('Topic', TopicSchema);
const Note = mongoose.models.Note || mongoose.model('Note', NoteSchema);
const Quiz = mongoose.models.Quiz || mongoose.model('Quiz', QuizSchema);

// ─── Seed Data ───

const SUBJECTS_DATA = [
  { name: 'DSA', slug: 'dsa', icon: '🧮', color: '#6C63FF', description: 'Data Structures & Algorithms', order: 0 },
  { name: 'Electronics', slug: 'electronics', icon: '⚡', color: '#FF6B6B', description: 'Digital & Analog Electronics', order: 1 },
  { name: 'Chemistry', slug: 'chemistry', icon: '🧪', color: '#4ECDC4', description: 'Organic, Inorganic & Physical Chemistry', order: 2 },
  { name: 'SQL', slug: 'sql', icon: '🗄️', color: '#FFE66D', description: 'Structured Query Language', order: 3 },
  { name: 'Excel', slug: 'excel', icon: '📊', color: '#2ECC71', description: 'Microsoft Excel Mastery', order: 4 },
];

const CHAPTERS_DATA = {
  dsa: [
    { title: 'Arrays & Strings', slug: 'arrays-strings', order: 0, description: 'Fundamental data structures',
      topics: [
        { title: 'Introduction to Arrays', slug: 'intro-arrays', order: 0,
          notes: '# Introduction to Arrays\n\nAn **array** is a collection of elements stored at contiguous memory locations.\n\n## Key Properties\n- **Fixed size** (in most languages)\n- **O(1) random access** via index\n- **O(n) insertion/deletion** in worst case\n\n## Declaration\n```javascript\nlet arr = [1, 2, 3, 4, 5];\nlet arr2 = new Array(10); // size 10\n```\n\n## Common Operations\n| Operation | Time Complexity |\n|-----------|----------------|\n| Access | O(1) |\n| Search | O(n) |\n| Insert | O(n) |\n| Delete | O(n) |\n\n## Important Concepts\n- **Two Pointer Technique**\n- **Sliding Window**\n- **Prefix Sum**',
          quizzes: [
            { question: 'What is the time complexity of accessing an element in an array by index?', options: ['O(1)', 'O(n)', 'O(log n)', 'O(n²)'], correctAnswer: 0, explanation: 'Arrays provide O(1) random access because elements are stored in contiguous memory.' },
            { question: 'What is the worst-case time complexity of inserting an element at the beginning of an array?', options: ['O(1)', 'O(log n)', 'O(n)', 'O(n²)'], correctAnswer: 2, explanation: 'All elements must be shifted right, requiring O(n) time.' },
          ]
        },
        { title: 'Two Pointer Technique', slug: 'two-pointer', order: 1,
          notes: '# Two Pointer Technique\n\nThe **two pointer technique** uses two pointers to iterate through a data structure, typically from different positions.\n\n## Types\n1. **Opposite Direction**: Start from both ends\n2. **Same Direction**: Fast and slow pointers\n\n## Example: Two Sum (Sorted Array)\n```javascript\nfunction twoSum(arr, target) {\n  let left = 0, right = arr.length - 1;\n  while (left < right) {\n    const sum = arr[left] + arr[right];\n    if (sum === target) return [left, right];\n    if (sum < target) left++;\n    else right--;\n  }\n  return [-1, -1];\n}\n```\n\n## When to Use\n- Sorted arrays\n- Finding pairs with a specific sum\n- Removing duplicates\n- Palindrome checking',
          quizzes: [
            { question: 'In the two pointer technique for a sorted array, what do you do when the sum is less than the target?', options: ['Move right pointer left', 'Move left pointer right', 'Move both pointers', 'Reset both pointers'], correctAnswer: 1, explanation: 'Moving the left pointer right increases the sum since the array is sorted.' },
          ]
        },
      ]
    },
    { title: 'Linked Lists', slug: 'linked-lists', order: 1, description: 'Dynamic data structures',
      topics: [
        { title: 'Singly Linked List', slug: 'singly-linked-list', order: 0,
          notes: '# Singly Linked List\n\nA **linked list** is a linear data structure where elements are stored in nodes, each pointing to the next.\n\n## Structure\n```javascript\nclass Node {\n  constructor(data) {\n    this.data = data;\n    this.next = null;\n  }\n}\n```\n\n## Advantages over Arrays\n- Dynamic size\n- Easy insertion/deletion at beginning: O(1)\n- No memory waste\n\n## Disadvantages\n- No random access (O(n) to reach element)\n- Extra memory for pointers',
          quizzes: [
            { question: 'What is the time complexity of inserting a node at the beginning of a singly linked list?', options: ['O(n)', 'O(1)', 'O(log n)', 'O(n²)'], correctAnswer: 1, explanation: 'Just create a new node and point it to the current head. O(1) operation.' },
          ]
        },
      ]
    },
    { title: 'Sorting Algorithms', slug: 'sorting', order: 2, description: 'Sorting techniques',
      topics: [
        { title: 'Bubble Sort', slug: 'bubble-sort', order: 0,
          notes: '# Bubble Sort\n\n**Bubble Sort** repeatedly steps through the list, compares adjacent elements, and swaps them if they are in the wrong order.\n\n## Algorithm\n```javascript\nfunction bubbleSort(arr) {\n  const n = arr.length;\n  for (let i = 0; i < n-1; i++) {\n    for (let j = 0; j < n-i-1; j++) {\n      if (arr[j] > arr[j+1]) {\n        [arr[j], arr[j+1]] = [arr[j+1], arr[j]];\n      }\n    }\n  }\n  return arr;\n}\n```\n\n## Complexity\n- Time: O(n²) average/worst, O(n) best\n- Space: O(1)\n- Stable: Yes',
          quizzes: []
        },
      ]
    },
  ],
  electronics: [
    { title: 'Digital Logic', slug: 'digital-logic', order: 0, description: 'Logic gates and circuits',
      topics: [
        { title: 'Logic Gates', slug: 'logic-gates', order: 0,
          notes: '# Logic Gates\n\n**Logic gates** are the basic building blocks of digital circuits.\n\n## Basic Gates\n| Gate | Symbol | Truth Table |\n|------|--------|------------|\n| AND | A·B | Output 1 only when both inputs are 1 |\n| OR | A+B | Output 1 when any input is 1 |\n| NOT | A\' | Inverts the input |\n\n## Universal Gates\n- **NAND** — Can implement any other gate\n- **NOR** — Can implement any other gate\n\n## De Morgan\'s Theorems\n1. (A·B)\' = A\' + B\'\n2. (A+B)\' = A\' · B\'',
          quizzes: [
            { question: 'Which gate is called a Universal Gate?', options: ['AND', 'OR', 'NAND', 'XOR'], correctAnswer: 2, explanation: 'NAND gate can be used to implement any other logic gate, making it universal.' },
            { question: 'What is the output of AND gate when inputs are 1 and 0?', options: ['1', '0', 'Undefined', 'Depends on clock'], correctAnswer: 1, explanation: 'AND gate outputs 1 only when ALL inputs are 1.' },
          ]
        },
      ]
    },
    { title: 'Analog Electronics', slug: 'analog-electronics', order: 1, description: 'Op-amps and amplifiers',
      topics: [
        { title: 'Operational Amplifiers', slug: 'op-amps', order: 0,
          notes: '# Operational Amplifiers (Op-Amps)\n\nAn **Op-Amp** is a high-gain voltage amplifier with differential input.\n\n## Ideal Op-Amp Properties\n- Infinite open-loop gain\n- Infinite input impedance\n- Zero output impedance\n- Infinite bandwidth\n\n## Common Configurations\n1. **Inverting Amplifier**: Gain = -Rf/Rin\n2. **Non-Inverting Amplifier**: Gain = 1 + Rf/Rin\n3. **Voltage Follower**: Gain = 1 (buffer)',
          quizzes: []
        },
      ]
    },
  ],
  chemistry: [
    { title: 'Organic Chemistry', slug: 'organic', order: 0, description: 'Carbon compounds and reactions',
      topics: [
        { title: 'Hydrocarbons', slug: 'hydrocarbons', order: 0,
          notes: '# Hydrocarbons\n\nCompounds made entirely of **carbon** and **hydrogen**.\n\n## Classification\n1. **Alkanes** (CₙH₂ₙ₊₂) — Single bonds only\n2. **Alkenes** (CₙH₂ₙ) — At least one double bond\n3. **Alkynes** (CₙH₂ₙ₋₂) — At least one triple bond\n4. **Aromatic** — Benzene ring structure\n\n## Naming (IUPAC)\n| Carbon | Prefix |\n|--------|--------|\n| 1 | Meth- |\n| 2 | Eth- |\n| 3 | Prop- |\n| 4 | But- |',
          quizzes: [
            { question: 'What is the general formula for alkanes?', options: ['CₙH₂ₙ', 'CₙH₂ₙ₊₂', 'CₙH₂ₙ₋₂', 'CₙHₙ'], correctAnswer: 1, explanation: 'Alkanes are saturated hydrocarbons with the formula CₙH₂ₙ₊₂.' },
          ]
        },
      ]
    },
    { title: 'Physical Chemistry', slug: 'physical', order: 1, description: 'Thermodynamics and kinetics',
      topics: [
        { title: 'Chemical Kinetics', slug: 'kinetics', order: 0,
          notes: '# Chemical Kinetics\n\nStudy of **reaction rates** and the factors affecting them.\n\n## Rate of Reaction\nRate = -d[R]/dt = d[P]/dt\n\n## Factors Affecting Rate\n1. Concentration\n2. Temperature\n3. Catalyst\n4. Surface area\n\n## Rate Law\nRate = k[A]ᵐ[B]ⁿ\n\nWhere k = rate constant, m,n = order of reaction',
          quizzes: []
        },
      ]
    },
  ],
  sql: [
    { title: 'SQL Basics', slug: 'sql-basics', order: 0, description: 'Fundamental SQL queries',
      topics: [
        { title: 'SELECT Statement', slug: 'select', order: 0,
          notes: '# SELECT Statement\n\nThe **SELECT** statement is used to retrieve data from a database.\n\n## Syntax\n```sql\nSELECT column1, column2\nFROM table_name\nWHERE condition;\n```\n\n## Examples\n```sql\n-- Select all columns\nSELECT * FROM employees;\n\n-- Select specific columns\nSELECT name, salary FROM employees;\n\n-- With WHERE clause\nSELECT * FROM employees WHERE salary > 50000;\n\n-- With aliases\nSELECT name AS employee_name FROM employees;\n```\n\n## Key Clauses\n- **DISTINCT** — Remove duplicates\n- **ORDER BY** — Sort results\n- **LIMIT** — Restrict rows returned',
          quizzes: [
            { question: 'Which SQL clause is used to filter rows?', options: ['SELECT', 'FROM', 'WHERE', 'ORDER BY'], correctAnswer: 2, explanation: 'WHERE clause filters rows based on conditions.' },
          ]
        },
        { title: 'JOINs', slug: 'joins', order: 1,
          notes: '# SQL JOINs\n\n**JOINs** combine rows from two or more tables based on related columns.\n\n## Types of JOINs\n1. **INNER JOIN** — Matching rows in both tables\n2. **LEFT JOIN** — All from left + matching from right\n3. **RIGHT JOIN** — All from right + matching from left\n4. **FULL OUTER JOIN** — All rows from both\n\n## Example\n```sql\nSELECT e.name, d.department_name\nFROM employees e\nINNER JOIN departments d\nON e.dept_id = d.id;\n```',
          quizzes: [
            { question: 'Which JOIN returns all rows from the left table?', options: ['INNER JOIN', 'LEFT JOIN', 'RIGHT JOIN', 'CROSS JOIN'], correctAnswer: 1, explanation: 'LEFT JOIN returns all rows from the left table and matching rows from the right table.' },
          ]
        },
      ]
    },
  ],
  excel: [
    { title: 'Excel Fundamentals', slug: 'fundamentals', order: 0, description: 'Core Excel skills',
      topics: [
        { title: 'Essential Formulas', slug: 'formulas', order: 0,
          notes: '# Essential Excel Formulas\n\n## Math Functions\n| Formula | Purpose | Example |\n|---------|---------|--------|\n| SUM | Add values | =SUM(A1:A10) |\n| AVERAGE | Mean of values | =AVERAGE(B1:B10) |\n| COUNT | Count numbers | =COUNT(A1:A10) |\n| MAX/MIN | Largest/Smallest | =MAX(A1:A10) |\n\n## Text Functions\n- **CONCATENATE/CONCAT**: Join text\n- **UPPER/LOWER**: Change case\n- **LEN**: Count characters\n- **TRIM**: Remove spaces\n\n## Lookup Functions\n- **VLOOKUP**: Vertical lookup\n- **HLOOKUP**: Horizontal lookup\n- **INDEX/MATCH**: Flexible lookup',
          quizzes: [
            { question: 'Which Excel function adds up a range of cells?', options: ['COUNT', 'SUM', 'AVERAGE', 'MAX'], correctAnswer: 1, explanation: 'SUM function adds all numbers in a given range.' },
          ]
        },
      ]
    },
  ],
};

// ─── Seed Function ───
async function seed() {
  try {
    console.log('🌱 Starting database seed...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Clear existing data
    await User.deleteMany({});
    await Subject.deleteMany({});
    await Chapter.deleteMany({});
    await Topic.deleteMany({});
    await Note.deleteMany({});
    await Quiz.deleteMany({});
    console.log('🗑️  Cleared existing data');

    // Seed demo users
    const hash1 = await bcrypt.hash('dhani123', 12);
    const hash2 = await bcrypt.hash('theja123', 12);
    const hash3 = await bcrypt.hash('fezin123', 12);
    const hash4 = await bcrypt.hash('sinan123', 12);
    const hash5 = await bcrypt.hash('dilkash123', 12);

    await User.create([
      { username: 'dhanish', passwordHash: hash1, displayName: 'Dhanish', isDevUser: true, email: 'dhanish@dev.local', role: 'student' },
      { username: 'theja', passwordHash: hash2, displayName: 'Theja', isDevUser: true, email: 'theja@dev.local', role: 'student' },
      { username: 'fezin', passwordHash: hash3, displayName: 'Fezin', isDevUser: true, email: 'fezin@dev.local', role: 'student' },
      { username: 'sinan', passwordHash: hash4, displayName: 'Sinan', isDevUser: true, email: 'sinan@dev.local', role: 'student' },
      { username: 'dilkash', passwordHash: hash5, displayName: 'Dilkash', isDevUser: true, email: 'dilkash@dev.local', role: 'student' },
      { username: 'admindhanis', passwordHash: hash1, displayName: 'Admin Dhanish', isDevUser: true, email: 'admindhanis@dev.local', role: 'admin' },
      { username: 'admindilkash', passwordHash: hash5, displayName: 'Admin Dilkash', isDevUser: true, email: 'admindilkash@dev.local', role: 'admin' },
    ]);
    console.log('👤 Users created (5 students + 2 admins)');

    // Seed subjects
    const subjects = await Subject.insertMany(SUBJECTS_DATA);
    console.log(`📚 ${subjects.length} subjects created`);

    // Seed chapters, topics, notes, quizzes for each subject
    let totalChapters = 0, totalTopics = 0, totalNotes = 0, totalQuizzes = 0;

    for (const subject of subjects) {
      const chaptersData = CHAPTERS_DATA[subject.slug];
      if (!chaptersData) continue;

      for (const chData of chaptersData) {
        const chapter = await Chapter.create({
          subjectId: subject._id, title: chData.title,
          slug: chData.slug, order: chData.order, description: chData.description || '',
        });
        totalChapters++;

        if (chData.topics) {
          for (const tData of chData.topics) {
            const topic = await Topic.create({
              chapterId: chapter._id, subjectId: subject._id,
              title: tData.title, slug: tData.slug, order: tData.order,
              videoUrl: tData.videoUrl || '',
            });
            totalTopics++;

            if (tData.notes) {
              await Note.create({ topicId: topic._id, content: tData.notes, source: 'system' });
              totalNotes++;
            }

            if (tData.quizzes) {
              for (const qData of tData.quizzes) {
                await Quiz.create({ topicId: topic._id, subjectId: subject._id, ...qData, source: 'system' });
                totalQuizzes++;
              }
            }
          }
        }
      }
    }

    console.log(`📖 ${totalChapters} chapters created`);
    console.log(`📝 ${totalTopics} topics created`);
    console.log(`📄 ${totalNotes} notes created`);
    console.log(`❓ ${totalQuizzes} quizzes created`);
    console.log('\n✅ Database seeded successfully!');

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Seed error:', error);
    process.exit(1);
  }
}

seed();
