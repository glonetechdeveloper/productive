const { query } = require('../lib/db');
const { hashPassword, generateToken } = require('../lib/auth');

module.exports = async function handler(req, res) {
  // CORS Preflight handling
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed. Use POST.' });
  }

  try {
    const { email, password } = req.body || {};

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const trimmedEmail = String(email).trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      return res.status(400).json({ error: 'Please provide a valid email address.' });
    }

    if (String(password).length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
    }

    // Check if user already exists
    const existingUser = await query('SELECT id FROM users WHERE email = $1', [trimmedEmail]);
    if (existingUser.rows.length > 0) {
      return res.status(409).json({ error: 'An account with this email already exists.' });
    }

    // Hash password and insert user
    const passwordHash = await hashPassword(password);
    const userResult = await query(
      'INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id, email, created_at',
      [trimmedEmail, passwordHash]
    );
    const newUser = userResult.rows[0];

    // Initialize user_goals record
    await query(
      'INSERT INTO user_goals (user_id, year_data) VALUES ($1, $2) ON CONFLICT (user_id) DO NOTHING',
      [newUser.id, JSON.stringify({})]
    );

    // Generate JWT token
    const token = generateToken(newUser);

    return res.status(201).json({
      success: true,
      message: 'Account registered successfully.',
      token,
      user: {
        id: newUser.id,
        email: newUser.email,
        created_at: newUser.created_at,
      },
    });
  } catch (error) {
    console.error('Registration Error:', error);
    return res.status(500).json({
      error: 'Failed to register user. ' + (error.message || 'Server error.'),
    });
  }
};
