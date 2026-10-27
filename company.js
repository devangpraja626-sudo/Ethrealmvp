const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = (s) => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const INDUSTRIES = ['Technology', 'Finance & Fintech', 'E-commerce', 'Healthcare', 'Education', 'Media & Marketing', 'Real Estate', 'Other'];
const SIZES = ['Just me', '2–10', '11–50', '51–200', '200+'];
const CATEGORIES = ['Software development', 'Design / UI-UX', 'Data / AI', 'Marketing & Growth', 'Content & Writing', 'Sales & BizDev', 'Operations / Finance', 'Other'];
const ENGAGEMENTS = ['Weekly', 'Hourly', 'Fixed price', 'Not sure yet'];
const HOURS = ['Under 10 hrs/wk', '10–20 hrs/wk', '20–30 hrs/wk', '30+ hrs/wk'];
const DURATIONS = ['1–2 weeks', 'About a month', '2–3 months', 'Ongoing'];
const BUDGETS = ['Under $500', '$500 – $2k', '$2k – $5k', '$5k – $15k', '$15k+', 'Not sure yet'];
const STARTS = ['As soon as possible', 'Within 2 weeks', 'Within a month', 'Flexible'];

const STEPS = 3;
let current = 0;

/* ---------- Floating icons ---------- */
const ICONS = [
  '<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 13h18"/>',
  '<path d="M12 3l2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5z"/>',
  '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/>',
  '<path d="M8 8l-5 4 5 4M16 8l5 4-5 4M14 4l-4 16"/>',
  '<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/><path d="M9 12l2 2 4-4"/>',
  '<path d="M4 20V4M4 20h16M8 16v-5M12 16V8M16 16v-3"/>',
  '<path d="M13 2L4 14h7l-1 8 9-12h-7z"/>',
  '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>',
  '<path d="M12 3l9 5-9 5-9-5z"/><path d="M3 13l9 5 9-5"/>',
  '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c.5-4 3-6 6.5-6s6 2 6.5 6M16 4.5a3.5 3.5 0 0 1 0 7M18 14c2 .7 3.2 2.6 3.5 6"/>',
  '<path d="M12 2l9 10-9 10L3 12z"/>',
  '<path d="M5 15c-1.5 1.5-2 5-2 5s3.5-.5 5-2M12 15l-3-3a22 22 0 0 1 2-4 12 12 0 0 1 11-5c0 3-1 8-5 11a22 22 0 0 1-4 2z"/><path d="M9 12H4s.5-3 2-4c1.6-1 5 0 5 0M12 15v5s3-.5 4-2c1-1.6 0-5 0-5"/>',
];

function buildFloaters() {
  const box = $('#floaters');
  const n = window.innerWidth < 640 ? 12 : 22;
  for (let i = 0; i < n; i++) {
    const el = document.createElement('span');
    el.className = 'fl';
    const size = 22 + Math.random() * 36;
    el.style.cssText =
      `left:${Math.random() * 100}%;top:${Math.random() * 100}%;` +
      `--s:${size.toFixed(0)}px;--d:${(14 + Math.random() * 18).toFixed(1)}s;--delay:-${(Math.random() * 24).toFixed(1)}s;` +
      `--o:${(0.1 + Math.random() * 0.24).toFixed(2)};--b:${Math.random() < 0.35 ? 1.6 : 0}px;--r:${Math.round(Math.random() * 40 - 20)}deg`;
    el.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round">${ICONS[i % ICONS.length]}</svg>`;
    box.appendChild(el);
  }
  if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    window.addEventListener('mousemove', (e) => {
      const x = (e.clientX / window.innerWidth - 0.5) * -26;
      const y = (e.clientY / window.innerHeight - 0.5) * -26;
      box.style.transform = `translate(${x}px,${y}px)`;
    });
  }
}
buildFloaters();

/* ---------- Chips ---------- */
function chips(id, name, options) {
  $(id).innerHTML = options
    .map((o) => `<label class="chip"><input type="radio" name="${name}" value="${esc(o)}"><span>${esc(o)}</span></label>`)
    .join('');
}
chips('#industryChips', 'industry', INDUSTRIES);
chips('#sizeChips', 'size', SIZES);
chips('#categoryChips', 'category', CATEGORIES);
chips('#engagementChips', 'engagement', ENGAGEMENTS);
chips('#hoursChips', 'hours', HOURS);
chips('#durationChips', 'duration', DURATIONS);
chips('#budgetChips', 'budget', BUDGETS);
chips('#startChips', 'startDate', STARTS);

const val = (id) => $(id).value.trim();
const radio = (name) => ($(`input[name="${name}"]:checked`) || {}).value || '';

function syncChips(group) {
  $$('.chip', group).forEach((c) => c.classList.toggle('on', c.querySelector('input').checked));
}
function setChip(name, value) {
  const el = $$(`input[name="${name}"]`).find((i) => i.value === value);
  if (el) { el.checked = true; syncChips(el.closest('.chips')); }
}
document.addEventListener('change', (e) => {
  if (e.target.matches('.chip input')) {
    syncChips(e.target.closest('.chips'));
    const f = e.target.closest('.field');
    if (f) f.classList.remove('invalid');
  }
});
$$('input[type="text"],input[type="email"],input[type="tel"],input[type="url"],textarea').forEach((el) =>
  el.addEventListener('input', () => { const f = el.closest('.field'); if (f) f.classList.remove('invalid'); }));

/* ---------- Tag boxes ---------- */
function tagBox(boxSel, inputSel) {
  const box = $(boxSel);
  const input = $(inputSel);
  const list = [];
  const render = () => {
    $$('.tag', box).forEach((t) => t.remove());
    list.forEach((s, i) => {
      const el = document.createElement('span');
      el.className = 'tag';
      el.innerHTML = `${esc(s)}<button type="button" aria-label="Remove">×</button>`;
      el.querySelector('button').onclick = () => { list.splice(i, 1); render(); };
      box.insertBefore(el, input);
    });
  };
  const add = () => {
    const v = input.value.replace(/,/g, '').trim();
    if (v && list.length < 20 && !list.some((s) => s.toLowerCase() === v.toLowerCase())) {
      list.push(v.slice(0, 40));
      render();
      const f = box.closest('.field');
      if (f) f.classList.remove('invalid');
    }
    input.value = '';
  };
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); add(); }
    if (e.key === 'Backspace' && !input.value && list.length) { list.pop(); render(); }
  });
  input.addEventListener('blur', add);
  box.addEventListener('click', () => input.focus());
  return { list, add, render, input, clear: () => { list.length = 0; render(); } };
}
const must = tagBox('#mustBox', '#mustInput');
const nice = tagBox('#niceBox', '#niceInput');

/* ---------- Description counter ---------- */
$('#description').addEventListener('input', () => {
  const n = $('#description').value.trim().length;
  $('#descCount').textContent = `${n} / 80 min`;
});

/* ---------- Validation ---------- */
function showError(msg) {
  const el = $('#stepError');
  el.textContent = '';
  if (msg) { void el.offsetWidth; el.textContent = msg; }
}
function flag(el, bad) {
  const f = el.closest('.field') || el.closest('.consent');
  if (f) f.classList.toggle('invalid', !!bad);
  return !!bad;
}

function validate(step) {
  let msg = '';
  const chk = (el, bad, m) => { if (flag(el, bad) && !msg) msg = m; };

  if (step === 0) {
    chk($('#companyName'), val('#companyName').length < 2, 'Please enter your company name.');
    const w = val('#website');
    chk($('#website'), !!w && !/^https?:\/\/.+/i.test(w), 'Website should start with https://');
    chk($('#industryChips'), !radio('industry'), 'Please choose your industry.');
    chk($('#sizeChips'), !radio('size'), 'Please choose your company size.');
    chk($('#contactName'), val('#contactName').length < 2, 'Please enter your name.');
    chk($('#email'), !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val('#email')), 'Please enter a valid work email.');
    const p = val('#phone');
    chk($('#phone'), !!p && p.replace(/\D/g, '').length < 7, 'Please enter a valid phone number or leave it empty.');
    chk($('#country'), val('#country').length < 2, 'Please enter your country.');
    chk($('#about'), val('#about').length < 20, 'Tell us a bit more about what your company does.');
  }

  if (step === 1) {
    chk($('#projectTitle'), val('#projectTitle').length < 4, 'Please give your project a title.');
    chk($('#categoryChips'), !radio('category'), 'Please choose a category.');
    chk($('#description'), val('#description').length < 80, 'Please describe the project in more detail (at least 80 characters).');
    chk($('#deliverables'), val('#deliverables').length < 20, 'Please describe the deliverables and success criteria.');
    must.add();
    nice.add();
    chk($('#mustInput'), must.list.length === 0, 'Add at least one must-have skill.');
    chk($('#engagementChips'), !radio('engagement'), 'Please choose an engagement type.');
    chk($('#hoursChips'), !radio('hours'), 'Please choose the expected workload.');
    chk($('#durationChips'), !radio('duration'), 'Please choose the project duration.');
    chk($('#budgetChips'), !radio('budget'), 'Please choose a budget.');
    chk($('#startChips'), !radio('startDate'), 'Please tell us when it should start.');
  }

  if (step === 2) {
    chk($('#consent'), !$('#consent').checked, 'Please confirm the checkbox to join the waitlist.');
  }

  showError(msg);
  return !msg;
}

/* ---------- Review ---------- */
function buildReview() {
  const row = (k, v) => `<div class="rv"><small>${esc(k)}</small><div>${v || '—'}</div></div>`;
  const tags = (arr) => (arr.length ? `<div class="tags">${arr.map((s) => `<span class="tag" style="padding:5px 12px">${esc(s)}</span>`).join('')}</div>` : '—');
  $('#review').innerHTML =
    row('Company', `${esc(val('#companyName'))} · ${esc(radio('industry'))} · ${esc(radio('size'))}`) +
    row('Contact', `${esc(val('#contactName'))} · ${esc(val('#email'))}`) +
    row('Project', esc(val('#projectTitle')) + '\n' + esc(radio('category'))) +
    row('Description', esc(val('#description'))) +
    row('Deliverables', esc(val('#deliverables'))) +
    `<div class="rv"><small>Must-have skills</small>${tags(must.list)}</div>` +
    (nice.list.length ? `<div class="rv"><small>Nice-to-have skills</small>${tags(nice.list)}</div>` : '') +
    row('Engagement', `${esc(radio('engagement'))} · ${esc(radio('hours'))} · ${esc(radio('duration'))}`) +
    row('Budget & start', `${esc(radio('budget'))} · ${esc(radio('startDate'))}`);
}

/* ---------- Navigation ---------- */
function go(step) {
  current = step;
  $$('.step').forEach((s) => s.classList.toggle('active', Number(s.dataset.step) === step));
  $('#barFill').style.width = ((step + 1) / STEPS) * 100 + '%';
  $$('#stepLabels span').forEach((s, i) => s.classList.toggle('on', i <= step));
  $('#backBtn').classList.toggle('invisible', step === 0);
  $('#nextBtn').textContent = step === STEPS - 1 ? 'Join the waitlist ✦' : 'Continue →';
  if (step === STEPS - 1) buildReview();
  showError('');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}
go(0);

$('#backBtn').addEventListener('click', () => current > 0 && go(current - 1));
$('#nextBtn').addEventListener('click', () => {
  if (!validate(current)) return;
  if (current < STEPS - 1) go(current + 1);
  else submit();
});
$('#coForm').addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && e.target.tagName === 'INPUT' && !e.target.closest('.tagbox')) e.preventDefault();
});

/* ---------- Local storage helpers ---------- */
const getRefs = () => { try { return JSON.parse(localStorage.getItem('eth_company_refs') || '[]'); } catch (e) { return []; } };
const getProfile = () => { try { return JSON.parse(localStorage.getItem('eth_company_profile') || 'null'); } catch (e) { return null; } };

/* ---------- Submit ---------- */
async function submit() {
  const btn = $('#nextBtn');
  btn.disabled = true;
  btn.textContent = 'Joining…';
  showError('');

  const payload = {
    companyName: val('#companyName'),
    website: val('#website'),
    industry: radio('industry'),
    size: radio('size'),
    country: val('#country'),
    contactName: val('#contactName'),
    email: val('#email').toLowerCase(),
    phone: val('#phone'),
    about: val('#about'),
    projectTitle: val('#projectTitle'),
    category: radio('category'),
    description: val('#description'),
    deliverables: val('#deliverables'),
    mustHave: must.list,
    niceHave: nice.list,
    engagement: radio('engagement'),
    hours: radio('hours'),
    duration: radio('duration'),
    budget: radio('budget'),
    startDate: radio('startDate'),
    timezone: val('#timezone'),
    notes: val('#notes'),
    consent: $('#consent').checked,
  };

  try {
    const res = await fetch('/api/company', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || 'Something went wrong. Please try again.');

    const refs = getRefs();
    refs.push(data.ref);
    localStorage.setItem('eth_company_refs', JSON.stringify(refs.slice(-20)));
    localStorage.setItem('eth_company_profile', JSON.stringify({
      companyName: payload.companyName, website: payload.website, industry: payload.industry, size: payload.size,
      country: payload.country, contactName: payload.contactName, email: payload.email, phone: payload.phone, about: payload.about,
    }));

    resetProject();
    showWaiting();
  } catch (err) {
    showError(err.message);
    btn.disabled = false;
    btn.textContent = 'Join the waitlist ✦';
  }
}

/* ---------- Reset / add another project ---------- */
function resetProject() {
  ['#projectTitle', '#description', '#deliverables', '#timezone', '#notes'].forEach((id) => { $(id).value = ''; });
  $('#descCount').textContent = '0 / 80 min';
  ['category', 'engagement', 'hours', 'duration', 'budget', 'startDate'].forEach((n) => {
    $$(`input[name="${n}"]`).forEach((i) => { i.checked = false; });
    const g = $$(`input[name="${n}"]`)[0];
    if (g) syncChips(g.closest('.chips'));
  });
  must.clear();
  nice.clear();
  $('#consent').checked = false;
  $$('.invalid').forEach((x) => x.classList.remove('invalid'));
}

function fillCompany(p) {
  $('#companyName').value = p.companyName || '';
  $('#website').value = p.website || '';
  setChip('industry', p.industry);
  setChip('size', p.size);
  $('#contactName').value = p.contactName || '';
  $('#email').value = p.email || '';
  $('#phone').value = p.phone || '';
  $('#country').value = p.country || '';
  $('#about').value = p.about || '';
}

function showView(id) {
  ['formView', 'waitView'].forEach((v) => $('#' + v).classList.toggle('hidden', v !== id));
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

$('#newProjBtn').addEventListener('click', () => {
  const p = getProfile();
  resetProject();
  if (p) {
    fillCompany(p);
    $('#bannerCo').textContent = p.companyName;
    $('#banner').classList.remove('hidden');
  }
  $('#nextBtn').disabled = false;
  showView('formView');
  go(p ? 1 : 0);
});
$('#cancelNew').addEventListener('click', () => {
  $('#banner').classList.add('hidden');
  showView('waitView');
  refresh(true);
});

/* ---------- Waitlist screen ---------- */
const STATE = {
  waitlist: { eyebrow: 'Request received', title: "You're on the <em>waitlist</em>", text: "Your project is in the queue. Matching starts when it's your turn, and we'll email you as soon as a match is ready.", tl: ['done', 'now', '', ''] },
  matching: { eyebrow: 'Matching in progress', title: "We're <em>matching</em> you", text: 'Our team is finding the most capable specialist for your project right now.', tl: ['done', 'done', 'now', ''] },
  matched: { eyebrow: 'Match ready', title: 'Your match is <em>ready</em>', text: "We've found your best-fit specialist. Our team will share their work proof with you by email.", tl: ['done', 'done', 'done', 'done'] },
  closed: { eyebrow: 'Request closed', title: 'This request is <em>closed</em>', text: 'This project request has been closed. You can add another project any time.', tl: ['done', 'done', '', ''] },
};

function showWaiting() {
  showView('waitView');
  refresh(true);
}

async function refresh(silent) {
  const refs = getRefs();
  if (!refs.length) return;
  const line = $('#statusLine');
  const btn = $('#checkBtn');
  if (!silent) { btn.disabled = true; line.textContent = 'Checking…'; }

  try {
    const res = await fetch('/api/company?refs=' + encodeURIComponent(refs.join(',')));
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || 'Could not check status.');
    const items = data.items || [];
    if (!items.length) throw new Error('No requests found.');

    const main = items[items.length - 1];
    const st = STATE[main.status] || STATE.waitlist;

    $('#waitEyebrow').textContent = st.eyebrow;
    $('#waitTitle').innerHTML = st.title;
    $('#waitText').textContent = st.text;
    $('#refCode').textContent = main.ref;
    $('#posBox').classList.toggle('hidden', main.status !== 'waitlist');
    $('#posNum').textContent = '#' + (main.position || 1);
    st.tl.forEach((c, i) => { $('#t' + i).className = 't ' + c; });

    $('#projWrap').classList.toggle('hidden', items.length < 2);
    $('#projList').innerHTML = items
      .slice()
      .reverse()
      .map((it) => `<div class="pj"><div><b>${esc(it.title)}</b><small>${esc(it.ref)}</small></div><span class="pill ${esc(it.status)}">${esc(it.status)}</span></div>`)
      .join('');

    line.textContent = silent ? '' : 'Status: ' + main.status;
  } catch (e) {
    line.textContent = silent ? '' : e.message;
  } finally {
    btn.disabled = false;
  }
}
$('#checkBtn').addEventListener('click', () => refresh(false));

/* Returning company on this device */
if (getRefs().length) showWaiting();