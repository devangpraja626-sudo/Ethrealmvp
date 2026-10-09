const { neon } = require('@neondatabase/serverless');
const crypto = require('crypto');

const MAX_PDF = 3 * 1024 * 1024; // 3 MB
const str = (v, max = 600) => (typeof v === 'string' ? v.trim().slice(0, max) : '');

function clean(b) {
  return {
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
}

function validate(d, b) {
  if (d.fullName.length < 2) return 'Please enter your name.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.email)) return 'Please enter a valid email.';
  if (d.phone.replace(/\D/g, '').length < 7) return 'Please enter a valid contact number.';
  if (!d.role || !d.level) return 'Please complete your professional details.';
  if (d.topAchievement.length < 20) return 'Tell us a bit more about your top achievement.';
  if (d.hasExperience && (!d.company || !d.jobTitle || !d.responsibilities)) {
    return 'Please complete your work experience details.';
  }
  if (b.weeklyAvailable === undefined) return 'Please tell us your availability.';
  return null;
}

function readResume(b) {
  if (!b.resume || !b.resume.data) return { none: true };
  const buf = Buffer.from(String(b.resume.data), 'base64');
  if (buf.length === 0 || buf.length > MAX_PDF) return { error: 'Resume must be a PDF under 3 MB.' };
  if (buf.slice(0, 4).toString() !== '%PDF') return { error: 'Resume must be a valid PDF file.' };
  return {
    name: str(b.resume.name, 150) || 'resume.pdf',
    hex: '\\x' + buf.toString('hex'),
  };
}

module.exports = async (req, res) => {
  if (req.method !== 'POST' && req.method !== 'PUT') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const b = req.body || {};
    const d = clean(b);

    const problem = validate(d, b);
    if (problem) return res.status(400).json({ error: problem });

    const resume = readResume(b);
    if (resume.error) return res.status(400).json({ error: resume.error });

    const sql = neon(process.env.DATABASE_URL);

    /* ---------- UPDATE (edit & resubmit) ---------- */
    if (req.method === 'PUT') {
      const ref = str(b.ref, 20).toUpperCase();
      const rows = await sql`
        select status from candidate_applications
        where ref_code = ${ref} and email = ${d.email}
      `;
      if (!rows.length) {
        return res.status(404).json({ error: 'No application found with that reference and email.' });
      }
      if (rows[0].status !== 'pending') {
        return res.status(403).json({ error: 'This application can no longer be edited because it has already been reviewed.' });
      }

      const newName = resume.none ? null : resume.name;
      const newHex = resume.none ? null : resume.hex;

      await sql`
        update candidate_applications set
          full_name = ${d.fullName},
          phone = ${d.phone},
          location = ${d.location || null},
          linkedin = ${d.linkedin || null},
          portfolio = ${d.portfolio || null},
          role = ${d.role},
          experience_level = ${d.level},
          skills = ARRAY(select jsonb_array_elements_text(${JSON.stringify(d.skills)}::jsonb)),
          top_achievement = ${d.topAchievement},
          has_experience = ${d.hasExperience},
          company = ${d.company || null},
          job_title = ${d.jobTitle || null},
          duration = ${d.duration || null},
          responsibilities = ${d.responsibilities || null},
          experience_achievement = ${d.expAchievement || null},
          weekly_available = ${d.weeklyAvailable},
          hours_per_week = ${d.hours || null},
          start_date = ${d.startDate || null},
          timezone = ${d.timezone || null},
          hourly_rate = ${d.rate || null},
          resume_name = coalesce(${newName}::text, resume_name),
          resume_data = coalesce(${newHex}::bytea, resume_data),
          status = 'pending',
          updated_at = now(),
          edit_count = coalesce(edit_count, 0) + 1
        where ref_code = ${ref} and email = ${d.email}
      `;

      return res.status(200).json({ ok: true, ref, updated: true });
    }

    /* ---------- CREATE ---------- */
    if (resume.none) return res.status(400).json({ error: 'Please upload your resume (PDF).' });

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
          ${resume.name}, ${resume.hex}::bytea
        )
      `;
    } catch (e) {
      if (e.code === '23505' || /duplicate key/i.test(e.message || '')) {
        return res.status(409).json({ error: 'An application with this email already exists. Use "Edit your application" to update it.' });
      }
      throw e;
    }

    return res.status(200).json({ ok: true, ref });
  } catch (err) {
    console.error('apply error:', err);
    return res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
};