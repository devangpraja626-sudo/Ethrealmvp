const { neon } = require('@neondatabase/serverless');
const crypto = require('crypto');

function authorized(req) {
  const given = String(req.headers['x-admin-password'] || '');
  const real = String(process.env.ADMIN_PASSWORD || '');
  if (!real || !given) return false;
  const a = crypto.createHash('sha256').update(given).digest();
  const b = crypto.createHash('sha256').update(real).digest();
  return crypto.timingSafeEqual(a, b);
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (!authorized(req)) return res.status(401).json({ error: 'Wrong password.' });

  try {
    const ref = String((req.body || {}).ref || '').toUpperCase().slice(0, 20);
    if (!/^ETH-[A-F0-9]{6}$/.test(ref)) return res.status(400).json({ error: 'Invalid reference.' });

    const sql = neon(process.env.DATABASE_URL);
    const rows = await sql`
      select resume_name, encode(resume_data, 'base64') as b64
      from candidate_applications where ref_code = ${ref}
    `;
    if (!rows.length || !rows[0].b64) return res.status(404).json({ error: 'Resume not found.' });

    const buf = Buffer.from(rows[0].b64, 'base64');
    const name = String(rows[0].resume_name || 'resume.pdf').replace(/[^\w.\- ]/g, '_');

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${name}"`);
    return res.status(200).send(buf);
  } catch (err) {
    console.error('resume error:', err);
    return res.status(500).json({ error: 'Server error.' });
  }
};