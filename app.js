const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];

const ROLES = [
  'Software Engineer', 'UI/UX Designer', 'Data / AI', 'Product Manager',
  'Marketing & Growth', 'Content & Writing', 'Sales & BizDev', 'Operations / Finance', 'Other'
];
const LEVELS = ['Student / Fresher', '1–3 years', '3–6 years', '6+ years'];
const HOURS = ['5–10 hrs', '10–20 hrs', '20–30 hrs', '30+ hrs'];
const STARTS = ['Immediately', 'Within 2 weeks', 'Within a month'];

const STEPS = 4;
let current = 0;
let skills = [];
let resumeFile = null;

/* ---------- Render chips ---------- */
function renderChips(id, name, options) {
  $(id).innerHTML = options
    .map((o) => `<label class="chip"><input type="radio" name="${name}" value="${o}"><span>${o}</span></label>`)
    .join('');
}
renderChips('#roleChips', 'role', ROLES);
renderChips('#levelChips', 'level', LEVELS);
renderChips('#hoursChips', 'hours', HOURS);
renderChips('#startChips', 'startDate', STARTS);

const val = (id) => $(id).value.trim();
const radio = (name) => ($(`input[name="${name}"]:checked`) || {}).value || '';

/* ---------- Skills tag input ---------- */
const skillInput = $('#skillInput');
function renderTags() {
  $$('.tag', $('#tagBox')).forEach((t) => t.remove());
  skills.forEach((s, i) => {
    const el = document.createElement('span');
    el.className = 'tag';
    el.innerHTML = `${s.replace(/</g, '&lt;')}<button type="button" aria-label="Remove">×</button>`;
    el.querySelector('button').onclick = () => { skills.splice(i, 1); renderTags(); };
    $('#tagBox').insertBefore(el, skillInput);
  });
}
function addSkill() {
  const v = skillInput.value.replace(/,/g, '').trim();
  if (v && skills.length < 25 && !skills.some((s) => s.toLowerCase() === v.toLowerCase())) {
    skills.push(v.slice(0, 40));
    renderTags();
  }
  skillInput.value = '';
}
skillInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addSkill(); }
  if (e.key === 'Backspace' && !skillInput.value && skills.length) { skills.pop(); renderTags(); }
});
skillInput.addEventListener('blur', addSkill);

/* ---------- Resume upload ---------- */
const drop = $('#drop');
const fileInput = $('#resume');
drop.addEventListener('click', () => fileInput.click());
['dragenter', 'dragover'].forEach((ev) =>
  drop.addEventListener(ev, (e) => { e.preventDefault(); drop.classList.add('over'); }));
['dragleave', 'drop'].forEach((ev) =>
  drop.addEventListener(ev, (e) => { e.preventDefault(); drop.classList.remove('over'); }));
drop.addEventListener('drop', (e) => { if (e.dataTransfer.files[0]) setResume(e.dataTransfer.files[0]); });
fileInput.addEventListener('change', () => { if (fileInput.files[0]) setResume(fileInput.files[0]); });

function setResume(file) {
  if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
    return showError('Please upload a PDF file.');
  }
  if (file.size > 3 * 1024 * 1024) {
    return showError('Your PDF is over 3 MB. Please upload a smaller file.');
  }
  resumeFile = file;
  drop.classList.add('has');
  drop.classList.remove('invalid');
  $('#dropText').innerHTML = `<b>${file.name.replace(/</g, '&lt;')}</b><br>${(file.size / 1024).toFixed(0)} KB · click to replace`;
  showError('');
}

/* ---------- Conditional sections ---------- */
$$('input[name="hasExperience"]').forEach((r) =>
  r.addEventListener('change', () => {
    const yes = radio('hasExperience') === 'yes';
    $('#expYes').classList.toggle('show', yes);
    $('#expNo').classList.toggle('show', !yes);
  }));
$$('input[name="weeklyAvailable"]').forEach((r) =>
  r.addEventListener('change', () => {
    $('#availYes').classList.toggle('show', radio('weeklyAvailable') === 'yes');
  }));

/* ---------- Validation ---------- */
function showError(msg) {
  const el = $('#stepError');
  el.textContent = msg;
  el.classList.remove('shake');
  if (msg) { void el.offsetWidth; el.classList.add('shake'); }
}
function mark(el, bad) {
  const f = el.closest ? el.closest('.field') || el.closest('.consent') : null;
  if (f) f.classList.toggle('invalid', bad);
  return bad;
}
$$('input, textarea').forEach((el) =>
  el.addEventListener('input', () => { const f = el.closest('.field'); if (f) f.classList.remove('invalid'); }));
$$('input[type="radio"]').forEach((el) =>
  el.addEventListener('change', () => { const f = el.closest('.field'); if (f) f.classList.remove('invalid'); }));

function validate(step) {
  let bad = false;
  let msg = '';
  const fail = (m) => { bad = true; if (!msg) msg = m; };

  if (step === 0) {
    if (mark($('#fullName'), val('#fullName').length < 2)) fail('Please enter your full name.');
    if (mark($('#email'), !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val('#email')))) fail('Please enter a valid email address.');
    if (mark($('#phone'), val('#phone').replace(/\D/g, '').length < 7)) fail('Please enter a valid contact number.');
    if (mark($('#location'), val('#location').length < 2)) fail('Please tell us where you are based.');
    const li = val('#linkedin');
    if (mark($('#linkedin'), li && !/^https?:\/\/.+/i.test(li))) fail('LinkedIn link should start with https://');
    const pf = val('#portfolio');
    if (mark($('#portfolio'), pf && !/^https?:\/\/.+/i.test(pf))) fail('Portfolio link should start with https://');
  }

  if (step === 1) {
    if (mark($('#roleChips'), !radio('role'))) fail('Please choose the role that best describes you.');
    if (mark($('#levelChips'), !radio('level'))) fail('Please select your experience level.');
    if (mark($('#tagBox'), skills.length === 0 && !skillInput.value.trim())) fail('Add at least one skill.');
    if (skillInput.value.trim()) addSkill();
    if (mark($('#topAchievement'), val('#topAchievement').length < 20)) fail('Tell us a bit more about your proudest achievement.');
    if (mark($('#drop'), !resumeFile)) fail('Please upload your resume as a PDF.');
  }

  if (step === 2) {
    const exp = radio('hasExperience');
    if (mark($('#expChoice'), !exp)) fail('Please tell us if you have work experience.');
    if (exp === 'yes') {
      if (mark($('#company'), !val('#company'))) fail('Please enter your most recent company.');
      if (mark($('#jobTitle'), !val('#jobTitle'))) fail('Please enter your job title.');
      if (mark($('#duration'), !val('#duration'))) fail('Please tell us how long you worked there.');
      if (mark($('#responsibilities'), val('#responsibilities').length < 10)) fail('Please describe your responsibilities.');
    }
  }

  if (step === 3) {
    const av = radio('weeklyAvailable');
    if (mark($('#availChoice'), !av)) fail('Please tell us if you are available for weekly projects.');
    if (av === 'yes') {
      if (mark($('#hoursChips'), !radio('hours'))) fail('Please pick how many hours you can give weekly.');
      if (mark($('#startChips'), !radio('startDate'))) fail('Please tell us when you can start.');
    }
    if (mark($('#consent'), !$('#consent').checked)) fail('Please confirm the consent checkbox to continue.');
  }

  showError(msg);
  return !bad;
}

/* ---------- Navigation ---------- */
function go(step) {
  current = step;
  $$('.step').forEach((s) => s.classList.toggle('active', Number(s.dataset.step) === step));
  $('#barFill').style.width = ((step + 1) / STEPS) * 100 + '%';
  $$('#stepLabels span').forEach((s, i) => s.classList.toggle('on', i <= step));
  $('#backBtn').classList.toggle('invisible', step === 0);
  $('#nextBtn').textContent = step === STEPS - 1 ? 'Submit application ✦' : 'Continue →';
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
$('#appForm').addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && e.target.tagName === 'INPUT' && e.target.id !== 'skillInput') e.preventDefault();
});

/* ---------- Submit ---------- */
const toBase64 = (file) =>
  new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result).split(',')[1]);
    r.onerror = () => reject(new Error('Could not read the file.'));
    r.readAsDataURL(file);
  });

async function submit() {
  const btn = $('#nextBtn');
  btn.disabled = true;
  btn.textContent = 'Submitting…';
  showError('');

  try {
    const hasExperience = radio('hasExperience') === 'yes';
    const weeklyAvailable = radio('weeklyAvailable') === 'yes';

    const payload = {
      fullName: val('#fullName'),
      email: val('#email'),
      phone: val('#phone'),
      location: val('#location'),
      linkedin: val('#linkedin'),
      portfolio: val('#portfolio'),
      role: radio('role'),
      level: radio('level'),
      skills,
      topAchievement: val('#topAchievement'),
      hasExperience,
      company: hasExperience ? val('#company') : '',
      jobTitle: hasExperience ? val('#jobTitle') : '',
      duration: hasExperience ? val('#duration') : '',
      responsibilities: hasExperience ? val('#responsibilities') : '',
      expAchievement: hasExperience ? val('#expAchievement') : '',
      weeklyAvailable,
      hours: weeklyAvailable ? radio('hours') : '',
      startDate: weeklyAvailable ? radio('startDate') : '',
      timezone: weeklyAvailable ? val('#timezone') : '',
      rate: weeklyAvailable ? val('#rate') : '',
      resume: { name: resumeFile.name, data: await toBase64(resumeFile) },
    };

    const res = await fetch('/api/apply', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || 'Something went wrong. Please try again.');

    localStorage.setItem('ethereal_ref', data.ref);
    showWaiting(data.ref);
  } catch (err) {
    showError(err.message);
    btn.disabled = false;
    btn.textContent = 'Submit application ✦';
  }
}

/* ---------- Waiting screen ---------- */
function showWaiting(ref) {
  $('#formView').classList.add('hidden');
  $('#waitView').classList.remove('hidden');
  $('#refCode').textContent = ref;
  window.scrollTo({ top: 0, behavior: 'smooth' });
  checkStatus(true);
}

async function checkStatus(silent) {
  const ref = localStorage.getItem('ethereal_ref');
  if (!ref) return;
  const line = $('#statusLine');
  const btn = $('#checkBtn');
  if (!silent) { btn.disabled = true; line.textContent = 'Checking…'; }

  try {
    const res = await fetch('/api/status?ref=' + encodeURIComponent(ref));
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Could not check status.');

    const review = $('#tReview');
    const decision = $('#tDecision');

    if (data.status === 'approved') {
      $('#waitTitle').innerHTML = 'Welcome to <em>Ethereal</em>';
      $('#waitText').textContent = 'Great news! Your application has been approved. Check your email for next steps.';
      review.className = 't done';
      decision.className = 't done';
      decision.querySelector('b').textContent = 'Approved 🎉';
      line.textContent = 'Status: Approved';
    } else if (data.status === 'rejected') {
      $('#waitTitle').innerHTML = 'Thank you for <em>applying</em>';
      $('#waitText').textContent = "We're not able to move forward right now, but we truly appreciate your interest. Feel free to apply again in the future.";
      review.className = 't done';
      decision.className = 't done';
      decision.querySelector('b').textContent = 'Not selected this time';
      line.textContent = 'Status: Not selected';
    } else {
      review.className = 't now';
      decision.className = 't';
      line.textContent = silent ? '' : 'Status: Still under review. We\'ll email you soon.';
    }
  } catch (e) {
    line.textContent = silent ? '' : e.message;
  } finally {
    btn.disabled = false;
  }
}
$('#checkBtn').addEventListener('click', () => checkStatus(false));

/* Returning candidate who already applied on this device */
const savedRef = localStorage.getItem('ethereal_ref');
if (savedRef) showWaiting(savedRef);