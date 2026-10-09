const { neon } = require('@neondatabase/serverless');

module.exports = async (req, res) => {
  try {
    const sql = neon(process.env.DATABASE_URL);

    /* GET ?ref=ETH-XXXXXX  → status only */
    if (req.method === 'GET') {
      const ref = String(req.query.ref || '').toUpperCase().slice(0, 20);
      if (!/^ETH-[A-F0-9]{6}$/.test(ref)) {
        return res.status(400).json({ error: 'Invalid reference.' });
      }
      const rows = await sql`select status, full_name from candidate_applications where ref_code = ${ref}`;
      if (!rows.length) return res.status(404).json({ error: 'Not found.' });
      return res.status(200).json({ status: rows[0].status, name: rows[0].full_name });
    }

    /* POST { ref, email } → full application (for editing) */
    if (req.method === 'POST') {
      const b = req.body || {};
      const ref = String(b.ref || '').toUpperCase().trim().slice(0, 20);
      const email = String(b.email || '').toLowerCase().trim().slice(0, 200);

      if (!/^ETH-[A-F0-9]{6}$/.test(ref) || !email) {
        return res.status(400).json({ error: 'Please enter your reference code and email.' });
      }

      const rows = await sql`
        select * from candidate_applications
        where ref_code = ${ref} and email = ${email}
      `;
      if (!rows.length) {
        return res.status(404).json({ error: 'No application found with that reference and email.' });
      }

      const r = rows[0];
      if (r.status !== 'pending') {
        return res.status(403).json({ error: 'This application has already been reviewed and can no longer be edited.' });
      }

      return res.status(200).json({
        ref: r.ref_code,
        status: r.status,
        application: {
          fullName: r.full_name,
          email: r.email,
          phone: r.phone,
          location: r.location || '',
          linkedin: r.linkedin || '',
          portfolio: r.portfolio || '',
          role: r.role,
          level: r.experience_level,
          skills: r.skills || [],
          topAchievement: r.top_achievement,
          hasExperience: r.has_experience,
          company: r.company || '',
          jobTitle: r.job_title || '',
          duration: r.duration || '',
          responsibilities: r.responsibilities || '',
          expAchievement: r.experience_achievement || '',
          weeklyAvailable: r.weekly_available,
          hours: r.hours_per_week || '',
          startDate: r.start_date || '',
          timezone: r.timezone || '',
          rate: r.hourly_rate || '',
          resumeName: r.resume_name || '',
        },
      });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('status error:', err);
    return res.status(500).json({ error: 'Server error.' });
  }
};