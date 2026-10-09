const { neon } = require('@neondatabase/serverless');
const crypto = require('crypto');

const MAX_PDF = 3 * 1024 * 1024; // 3 MB
const str = (v, max = 600) => (typeof v === 'string' ? v.trim().slice(0, max) : '');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const b = req.body || {};

    const d = {
      fullName: str(b.fullName, 120),
      email: str(b.email, 200).toLowerCase(),
      phone: str(b.phone, 40),
      location: str(b.location, 120),
      linkedin: str(b.linkedin, 300),
      portfolio: str(b.portfolio, 300),
      role: str(b.role, 100),
      level: str(b.level, 60),
      skills: Array.isArray(b.skills)
        ? b.skills.map((s) => str(s, 40)).filter(Boolean).slice(0, 25)
        : [],
      topAchievement: str(b.topAchievement, 1500),
      hasExperience: b.hasExperience === true,
      company: str(b.company, 150),
      jobTitle: str(b.jobTitle, 150),
      duration: str(b.duration, 80),
      responsibilities: str(b.responsibilities, 1500),
      expAchievement: str(b.expAchievement, 1500),
      weeklyAvailable: b.weeklyAvailable === true,
      hours: str(b.hours, 40),
      startDate: str(b.startDate, 60),
      timezone: str(b.timezone, 80),
      rate: str(b.rate, 60),
    };

    // Validation
    if (d.fullName.length < 2) return res.status(400).json({ error: 'Please enter your name.' });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.email)) return res.status(400).json({ error: 'Please enter a valid email.' });
    if (d.phone.replace(/\D/g, '').length < 7) return res.status(400).json({ error: 'Please enter a valid contact number.' });
    if (!d.role || !d.level) return res.status(400).json({ error: 'Please complete your professional details.' });
    if (d.topAchievement.length < 20) return res.status(400).json({ error: 'Tell us a bit more about your top achievement.' });
    if (d.hasExperience && (!d.company || !d.jobTitle || !d.responsibilities)) {
      return res.status(400).json({ error: 'Please complete your work experience details.' });
    }
    if (b.weeklyAvailable === undefined) return res.status(400).json({ error: 'Please tell us your availability.' });

    // Resume (PDF)
    if (!b.resume || !b.resume.data) return res.status(400).json({ error: 'Please upload your resume (PDF).' });
    const buf = Buffer.from(String(b.resume.data), 'base64');
    if (buf.length === 0 || buf.length > MAX_PDF) return res.status(400).json({ error: 'Resume must be a PDF under 3 MB.' });
    if (buf.slice(0, 4).toString() !== '%PDF') return res.status(400).json({ error: 'Resume must be a valid PDF file.' });
    const resumeName = str(b.resume.name, 150) || 'resume.pdf';
    const resumeHex = '\\x' + buf.toString('hex');

    const sql = neon(process.env.DATABASE_URL);
    const ref = 'ETH-' + crypto.randomBytes(3).toString('hex').toUpperCase();

    try {
      await sql`
        insert into candidate_applications (
          ref_code, full_name, email, phone, location, linkedin, portfolio,
          role, experience_level, skills, top_achievement,
          has_experience, company, job_title, duration, responsibilities, experience_achievement,
          weekly_available, hours_per_week, start_date, timezone, hourly_rate,
          resume_name, resume_data
        ) values (
          ${ref}, ${d.fullName}, ${d.email}, ${d.phone}, ${d.location || null}, ${d.linkedin || null}, ${d.portfolio || null},
          ${d.role}, ${d.level},
          ARRAY(select jsonb_array_elements_text(${JSON.stringify(d.skills)}::jsonb)),
          ${d.topAchievement},
          ${d.hasExperience}, ${d.company || null}, ${d.jobTitle || null}, ${d.duration || null},
          ${d.responsibilities || null}, ${d.expAchievement || null},
          ${d.weeklyAvailable}, ${d.hours || null}, ${d.startDate || null}, ${d.timezone || null}, ${d.rate || null},
          ${resumeName}, ${resumeHex}::bytea
        )
      `;
    } catch (e) {
      if (e.code === '23505' || /duplicate key/i.test(e.message || '')) {
        return res.status(409).json({ error: 'An application with this email already exists.' });
      }
      throw e;
    }

    return res.status(200).json({ ok: true, ref });
  } catch (err) {
    console.error('apply error:', err);
    return res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
};