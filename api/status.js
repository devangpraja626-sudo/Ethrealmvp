const { neon } = require('@neondatabase/serverless');

module.exports = async (req, res) => {
  try {
    const ref = String(req.query.ref || '').toUpperCase().slice(0, 20);
    if (!/^ETH-[A-F0-9]{6}$/.test(ref)) {
      return res.status(400).json({ error: 'Invalid reference.' });
    }
    const sql = neon(process.env.DATABASE_URL);
    const rows = await sql`select status, full_name from candidate_applications where ref_code = ${ref}`;
    if (!rows.length) return res.status(404).json({ error: 'Not found.' });
    return res.status(200).json({ status: rows[0].status, name: rows[0].full_name });
  } catch (err) {
    console.error('status error:', err);
    return res.status(500).json({ error: 'Server error.' });
  }
};