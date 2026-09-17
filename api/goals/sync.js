const { query } = require('../lib/db');
const { verifyToken } = require('../lib/auth');

module.exports = async function handler(req, res) {
  // CORS Preflight handling
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Verify JWT Authentication
  const authUser = verifyToken(req);
  if (!authUser) {
    return res.status(401).json({
      error: 'Unauthorized. Please provide a valid Bearer JWT token in the Authorization header.',
    });
  }

  const userId = authUser.id;

  try {
    if (req.method === 'GET') {
      // Fetch user's saved productivity log / goals data
      const result = await query(
        'SELECT year_data, updated_at FROM user_goals WHERE user_id = $1',
        [userId]
      );

      if (result.rows.length === 0) {
        // Create initial empty structure if not present
        await query(
          'INSERT INTO user_goals (user_id, year_data) VALUES ($1, $2) ON CONFLICT (user_id) DO NOTHING',
          [userId, JSON.stringify({})]
        );
        return res.status(200).json({
          success: true,
          data: {},
          updated_at: new Date().toISOString(),
        });
      }

      return res.status(200).json({
        success: true,
        data: result.rows[0].year_data || {},
        updated_at: result.rows[0].updated_at,
      });
    }

    if (req.method === 'POST') {
      // Expecting year_data in body
      const payload = req.body;
      const yearData = payload?.year_data !== undefined ? payload.year_data : payload;

      if (!yearData || typeof yearData !== 'object') {
        return res.status(400).json({ error: 'Invalid payload. Object expected for year_data.' });
      }

      // Upsert user_goals
      const result = await query(
        `INSERT INTO user_goals (user_id, year_data, updated_at)
         VALUES ($1, $2, NOW())
         ON CONFLICT (user_id)
         DO UPDATE SET year_data = EXCLUDED.year_data, updated_at = NOW()
         RETURNING updated_at`,
        [userId, JSON.stringify(yearData)]
      );

      return res.status(200).json({
        success: true,
        message: 'Productivity log successfully synchronized.',
        updated_at: result.rows[0]?.updated_at || new Date().toISOString(),
      });
    }

    return res.status(405).json({ error: `Method ${req.method} Not Allowed.` });
  } catch (error) {
    console.error('Goal Sync Error:', error);
    return res.status(500).json({
      error: 'Failed to synchronize goals data. ' + (error.message || 'Server error.'),
    });
  }
};
