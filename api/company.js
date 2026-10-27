const { neon } = require('@neondatabase/serverless');
const crypto = require('crypto');

const str = (v, max = 600) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
const list = (v, n = 20) =>
  Array.isArray(v) ? v.map((s) => str(s, 40)).filter(Boolean).slice(0, n) : [];

function clean(b) {
  return {
    companyName: str(b.companyName, 150),
    website: str(b.website, 300),
    industry: str(b.industry, 80),
    size: str(b.size, 40),
    country: str(b.country, 100),
    contactName: str(b.contactName, 120),
    email: str(b.email, 200).toLowerCase(),
    phone: str(b.phone, 40),
    about: str(b.about, 1500),
    projectTitle: str(b.projectTitle, 200),
    category: str(b.category, 80),
    description: str(b.description, 4000),
    deliverables: str(b.deliverables, 2000),
    mustHave: list(b.mustHave),
    niceHave: list(b.niceHave),
    engagement: str(b.engagement, 40),
    hours: str(b.hours, 40),
    duration: str(b.duration, 40),
    budget: str(b.budget, 40),
    startDate: str(b.startDate, 60),
    timezone: str(b.timezone, 80),
    notes: str(b.notes, 500),
  };
}

function validate(d, b) {
  if (d.companyName.length < 2) return 'Please enter your company name.';
  if (d.website && !/^https?:\/\/.+/i.test(d.website)) return 'Website should start with https://';
  if (!d.industry || !d.size) return 'Please complete your company details.';
  if (d.contactName.length < 2) return 'Please enter your name.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.email)) return 'Please enter a valid email.';
  if (d.country.length < 2) return 'Please enter your country.';
  if (d.about.length < 20) return 'Tell us a bit more about your company.';
  if (d.projectTitle.length < 4) return 'Please give your project a title.';
  if (!d.category) return 'Please choose a project category.';
  if (d.description.length < 80) return 'Please describe the project in more detail.';
  if (d.deliverables.length < 20) return 'Please describe the deliverables.';
  if (d.mustHave.length < 1) return 'Add at least one must-have skill.';
  if (!d.engagement || !d.hours || !d.duration || !d.budget || !d.startDate) {
    return 'Please complete the project details.';
  }
  if (b.consent !== true) return 'Please confirm the consent checkbox.';
  return null;
}

module.exports = async (req, res) => {
  try {
    const sql = neon(process.env.DATABASE_URL);

    /* GET ?refs=CMP-AAAAAA,CMP-BBBBBB  → status + queue position */
    if (req.method === 'GET') {
      const raw = String(req.query.refs || req.query.ref || '');
      const refs = [...new Set(raw.split(',').map((s) => s.trim().toUpperCase()))]
        .filter((r) => /^CMP-[A-F0-9]{6}$/.test(r))
        .slice(0, 20);
      if (!refs.length) return res.status(400).json({ error: 'Invalid reference.' });

      const rows = await sql`
        select r.ref_code, r.project_title, r.status,
          (select count(*)::int from company_requests w
            where w.status = 'waitlist' and w.created_at <= r.created_at) as queue_pos
        from company_requests r
        where r.ref_code = any(ARRAY(select jsonb_array_elements_text(${JSON.stringify(refs)}::jsonb)))
      `;
      const byRef = {};
      rows.forEach((r) => { byRef[r.ref_code] = r; });
      const items = refs
        .filter((r) => byRef[r])
        .map((r) => ({
          ref: r,
          title: byRef[r].project_title,
          status: byRef[r].status,
          position: Number(byRef[r].queue_pos) || 1,
        }));
      return res.status(200).json({ items });
    }

    /* POST → create a company request and join the waitlist */
    if (req.method === 'POST') {
      const b = req.body || {};
      const d = clean(b);
      const problem = validate(d, b);
      if (problem) return res.status(400).json({ error: problem });

      const open = await sql`
        select count(*)::int as n from company_requests
        where email = ${d.email} and status in ('waitlist', 'matching')
      `;
      if (open[0].n >= 10) {
        return res.status(429).json({ error: 'You already have several open requests. Please wait for a match before adding more.' });
      }

      let ref = '';
      for (let i = 0; i < 4; i++) {
        ref = 'CMP-' + crypto.randomBytes(3).toString('hex').toUpperCase();
        try {
          await sql`
            insert into company_requests (
              ref_code, company_name, website, industry, company_size, country,
              contact_name, email, phone, about,
              project_title, category, description, deliverables,
              must_have_skills, nice_skills,
              engagement, hours_per_week, duration, budget, start_date, timezone, notes
            ) values (
              ${ref}, ${d.companyName}, ${d.website || null}, ${d.industry}, ${d.size}, ${d.country},
              ${d.contactName}, ${d.email}, ${d.phone || null}, ${d.about},
              ${d.projectTitle}, ${d.category}, ${d.description}, ${d.deliverables},
              ARRAY(select jsonb_array_elements_text(${JSON.stringify(d.mustHave)}::jsonb)),
              ARRAY(select jsonb_array_elements_text(${JSON.stringify(d.niceHave)}::jsonb)),
              ${d.engagement}, ${d.hours}, ${d.duration}, ${d.budget}, ${d.startDate},
              ${d.timezone || null}, ${d.notes || null}
            )
          `;
          break;
        } catch (e) {
          if ((e.code === '23505' || /duplicate key/i.test(e.message || '')) && i < 3) continue;
          throw e;
        }
      }

      const pos = await sql`select count(*)::int as n from company_requests where status = 'waitlist'`;
      return res.status(200).json({ ok: true, ref, position: pos[0].n });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('company error:', err);
    return res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
};