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
    const sql = neon(process.env.DATABASE_URL);
    const b = req.body || {};

    if (b.action === 'setStatus') {
      const ref = String(b.ref || '').toUpperCase().slice(0, 20);
      const status = String(b.status || '');
      if (!/^ETH-[A-F0-9]{6}$/.test(ref)) return res.status(400).json({ error: 'Invalid reference.' });
      if (!['pending', 'approved', 'rejected'].includes(status)) return res.status(400).json({ error: 'Invalid status.' });
      await sql`update candidate_applications set status = ${status} where ref_code = ${ref}`;
      return res.status(200).json({ ok: true });
    }

    // default: list everyone (resume file data is NOT included here)
    const rows = await sql`
      select ref_code, full_name, email, phone, location, linkedin, portfolio,
             role, experience_level, skills, top_achievement,
             has_experience, company, job_title, duration, responsibilities, experience_achievement,
             weekly_available, hours_per_week, start_date, timezone, hourly_rate,
             resume_name, status, created_at, updated_at, edit_count
      from candidate_applications
      order by coalesce(updated_at, created_at) desc
    `;
    return res.status(200).json({ rows });
  } catch (err) {
    console.error('admin error:', err);
    return res.status(500).json({ error: 'Server error.' });
  }
};