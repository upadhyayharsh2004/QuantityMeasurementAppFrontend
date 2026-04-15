// ─── Config ──────────────────────────────────────────────────────────────────
const API = 'http://localhost:5099';

// ─── State ───────────────────────────────────────────────────────────────────
let state = {
  token: null,
  user:  null,
  convType: 'length',
  arithOp:  'addition',
  histFilter: 'all',
  history: [],
  counts: { conversion:0, addition:0, subtraction:0, division:0, comparison:0 },
  recent: [],   // last 5 operations for dashboard
};

// ─── Unit definitions ─────────────────────────────────────────────────────────
const UNITS = {
  length:      ['Feet','Inch','Yard','Centimeter'],
  weight:      ['Kilogram','Gram','Pound'],
  volume:      ['Litre','Millilitre','Gallon'],
  temperature: ['Celsius','Fahrenheit','Kelvin'],
};

// ─── API helpers ──────────────────────────────────────────────────────────────
async function apiFetch(path, method='GET', body=null, auth=false) {
  const headers = { 'Content-Type': 'application/json' };
  if (auth && state.token) headers['Authorization'] = `Bearer ${state.token}`;
  const res = await fetch(API + path, {
    method, headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.title || data?.message || 'Request failed');
  return data;
}

// ─── Response field extractors (camel + pascal both) ─────────────────────────
function extractResultValue(res) {
  return res.ResultValueDTOs ?? res.resultValueDTOs ?? res.ResultValue ?? res.resultValue ?? res.Value ?? res.value ?? null;
}
function extractResultUnit(res) {
  return res.ResultUnitDTOs ?? res.resultUnitDTOs ?? res.ResultUnit ?? res.resultUnit ?? res.Unit ?? res.unit ?? '';
}
function extractResultString(res) {
  return res.ResultStringDTOs ?? res.resultStringDTOs ?? res.ResultString ?? res.resultString ?? null;
}
function extractError(res) {
  return !!(res.IsThereErrorDTOs || res.isThereErrorDTOs || res.IsError || res.isError || res.HasError || res.hasError);
}
function extractErrorMessage(res) {
  return res.ErrorMessageDTOs ?? res.errorMessageDTOs ?? res.ErrorMessage ?? res.errorMessage ?? res.Message ?? res.message ?? 'Unknown error';
}
function extractOp(item) {
  const raw = item.OperationDTOs ?? item.operationDTOs ?? item.EntityOperation ?? item.entityOperation ?? item.Operation ?? item.operation ?? '';
  const map = { convert:'conversion', conversion:'conversion', add:'addition', addition:'addition', subtract:'subtraction', subtraction:'subtraction', divide:'division', division:'division', compare:'comparison', comparison:'comparison' };
  return map[raw.toLowerCase()] || raw.toLowerCase();
}

// ─── Navigation ───────────────────────────────────────────────────────────────
function showPanel(id) {
  document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
  document.getElementById('panel-' + id).classList.add('active');
  // Mark correct sidebar tab
  document.querySelectorAll('.nav-tab').forEach(t => {
    if (t.textContent.toLowerCase().includes(id.slice(0,4))) t.classList.add('active');
  });
  if (id === 'history') fetchHistory();
  if (id === 'home')    renderDashboard();
}

function toggleMobileNav() {
  document.getElementById('mobile-nav').classList.toggle('open');
}

// ─── Count helpers ────────────────────────────────────────────────────────────
const COUNT_KEY = (userId) => `qm_counts_${userId || 'guest'}`;
const RECENT_KEY = (userId) => `qm_recent_${userId || 'guest'}`;

function loadCounts() {
  const userId = state.user?.PersonId ?? state.user?.personId ?? 'guest';
  try {
    const raw = sessionStorage.getItem(COUNT_KEY(userId));
    if (raw) state.counts = JSON.parse(raw);
    else state.counts = { conversion:0, addition:0, subtraction:0, division:0, comparison:0 };
  } catch(e) {
    state.counts = { conversion:0, addition:0, subtraction:0, division:0, comparison:0 };
  }
  try {
    const raw = sessionStorage.getItem(RECENT_KEY(userId));
    if (raw) state.recent = JSON.parse(raw);
    else state.recent = [];
  } catch(e) { state.recent = []; }
}

function saveCounts() {
  const userId = state.user?.PersonId ?? state.user?.personId ?? 'guest';
  try {
    sessionStorage.setItem(COUNT_KEY(userId), JSON.stringify(state.counts));
    sessionStorage.setItem(RECENT_KEY(userId), JSON.stringify(state.recent));
  } catch(e) {}
}

function incrementCount(op) {
  const key = op.toLowerCase();
  if (state.counts[key] !== undefined) {
    state.counts[key]++;
  }
  saveCounts();
  updateStatUI(key);
  updateTotalUI();
}

function updateStatUI(op) {
  const el = document.getElementById('stat-' + op);
  if (!el) return;
  el.textContent = state.counts[op] || 0;
  el.classList.remove('bump');
  void el.offsetWidth; // reflow
  el.classList.add('bump');
}

function updateTotalUI() {
  const total = Object.values(state.counts).reduce((a, b) => a + b, 0);
  const el = document.getElementById('stat-total');
  if (!el) return;
  el.textContent = total;
  el.classList.remove('bump');
  void el.offsetWidth;
  el.classList.add('bump');
}

function renderAllCounts() {
  ['conversion','addition','subtraction','division','comparison'].forEach(op => {
    const el = document.getElementById('stat-' + op);
    if (el) el.textContent = state.counts[op] || 0;
  });
  updateTotalUI();
}

// ─── Recent activity helpers ──────────────────────────────────────────────────
function pushRecent(op, detail, result, isError) {
  const item = { op, detail, result, isError, time: Date.now() };
  state.recent.unshift(item);
  if (state.recent.length > 5) state.recent.pop();
  saveCounts();
  // Update hero float card with last result
  const hEl = document.getElementById('hero-last-result');
  if (hEl) hEl.textContent = isError ? 'Error' : result;
  // Re-render recent list if dashboard is active
  if (document.getElementById('panel-home').classList.contains('active')) {
    renderRecentActivity();
  }
}

function renderRecentActivity() {
  const container = document.getElementById('recent-activity-list');
  if (!container) return;
  if (state.recent.length === 0) {
    container.innerHTML = `<div class="recent-empty"><div class="recent-empty-icon">📋</div><div>No operations yet. Start converting or calculating!</div></div>`;
    return;
  }
  const iconMap = { conversion:'⇄', addition:'+', subtraction:'−', division:'÷', comparison:'≈' };
  const clsMap  = { conversion:'conv', addition:'add', subtraction:'sub', division:'div', comparison:'cmp' };
  const colorMap= {
    conversion:'rgba(16,185,129,.1);color:#10b981',
    addition:  'rgba(124,58,237,.1);color:#7c3aed',
    subtraction:'rgba(14,165,233,.1);color:#0ea5e9',
    division:  'rgba(245,158,11,.1);color:#f59e0b',
    comparison:'rgba(99,102,241,.1);color:#6366f1',
  };
  container.innerHTML = state.recent.map(item => `
    <div class="recent-item">
      <div class="recent-icon" style="background:${colorMap[item.op] || 'rgba(124,58,237,.1);color:#7c3aed'}">
        ${iconMap[item.op] || '?'}
      </div>
      <div class="recent-body">
        <div class="recent-op">${capitalize(item.op)}</div>
        <div class="recent-detail">${item.detail}</div>
      </div>
      <div class="recent-result${item.isError ? ' err' : ''}">${item.result}</div>
    </div>`).join('');
}

function renderDashboard() {
  renderAllCounts();
  renderRecentActivity();
  // Show/hide auth nudge
  const nudge = document.getElementById('auth-nudge');
  if (nudge) nudge.style.display = state.token ? 'none' : 'flex';
}

// ─── Auth state ───────────────────────────────────────────────────────────────
function setLoggedIn(user, token) {
  state.token = token;
  state.user  = user;
  try {
    sessionStorage.setItem('qm_token', token);
    sessionStorage.setItem('qm_user', JSON.stringify(user));
  } catch(e) {}

  // Load this user's counts
  loadCounts();

  const name  = user.PersonName  || user.personName;
  const email = user.PersonEmail || user.personEmail;
  const displayName = name || email || 'User';
  const initials = displayName.split(' ').map(w => w[0]).join('').toUpperCase().slice(0,2);

  const nr = document.getElementById('nav-right');
  nr.innerHTML = `
    <div class="nav-user">
      <div class="nav-avatar">${initials}</div>
      <span class="nav-user-name">${displayName}</span>
    </div>
    <button class="btn-ghost" onclick="doLogout()">Sign out</button>`;

  document.getElementById('mob-signin-btn').textContent = 'Sign out';
  document.getElementById('mob-signin-btn').onclick = () => { doLogout(); toggleMobileNav(); };
  document.getElementById('mob-register-btn').style.display = 'none';
  document.getElementById('history-gate').style.display = 'none';
  document.getElementById('history-content').style.display = 'block';

  renderDashboard();
}

function setLoggedOut() {
  state.token   = null;
  state.user    = null;
  state.history = [];
  try { sessionStorage.removeItem('qm_token'); sessionStorage.removeItem('qm_user'); } catch(e) {}

  // Load guest counts
  loadCounts();

  const nr = document.getElementById('nav-right');
  nr.innerHTML = `
    <div class="sidebar-auth-btns">
      <button class="btn btn-primary btn-full" style="font-size:13px;padding:9px 14px;" onclick="openModal('register')">Register</button>
      <button class="btn-ghost" onclick="openModal('login')">Sign In</button>
    </div>`;

  document.getElementById('mob-signin-btn').textContent = 'Sign In';
  document.getElementById('mob-signin-btn').onclick = () => { openModal('login'); toggleMobileNav(); };
  const mReg = document.getElementById('mob-register-btn');
  if (mReg) { mReg.style.display = 'flex'; mReg.onclick = () => { openModal('register'); toggleMobileNav(); }; }
  document.getElementById('history-gate').style.display = 'flex';
  document.getElementById('history-content').style.display = 'none';
  document.getElementById('history-list').innerHTML = '';

  renderDashboard();
}

function doLogout() {
  setLoggedOut();
  resetInputs();
  toast('Signed out successfully.', 'success');
}

// ─── Modal ────────────────────────────────────────────────────────────────────
function openModal(form='login') {
  document.getElementById('auth-modal').classList.add('open');
  switchForm(form);
}
function closeModal() { document.getElementById('auth-modal').classList.remove('open'); }
function maybeCloseModal(e) { if (e.target === document.getElementById('auth-modal')) closeModal(); }
function switchForm(which) {
  document.getElementById('form-login').style.display    = which === 'login'    ? 'block' : 'none';
  document.getElementById('form-register').style.display = which === 'register' ? 'block' : 'none';
  hideAlert('login-error'); hideAlert('reg-error');
}

// ─── Auth actions ─────────────────────────────────────────────────────────────
async function doLogin() {
  const email = document.getElementById('login-email').value.trim();
  const pass  = document.getElementById('login-password').value;
  if (!email || !pass) { showAlert('login-error','Please fill in all fields.'); return; }
  const btn = document.getElementById('login-btn');
  setLoading(btn, true, 'Signing in…'); hideAlert('login-error');
  try {
    const res = await apiFetch('/api/v1/auth/signin', 'POST', { LoginEmail: email, LoginPassword: pass });
    setLoggedIn(res, res.authorizationId || res.AuthorizationId);
    resetInputs(); closeModal();
    toast(`Welcome back, ${res.PersonName || res.personName || email}!`, 'success');
    if (document.getElementById('panel-history').classList.contains('active')) fetchHistory();
  } catch(e) {
    showAlert('login-error', e.message || 'Invalid credentials.');
  } finally { setLoading(btn, false, 'Sign In'); }
}

async function doRegister() {
  const name  = document.getElementById('reg-name').value.trim();
  const email = document.getElementById('reg-email').value.trim();
  const pass  = document.getElementById('reg-password').value;
  if (!name || !email || !pass) { showAlert('reg-error','Please fill in all fields.'); return; }
  if (pass.length < 6) { showAlert('reg-error','Password must be at least 6 characters.'); return; }
  const btn = document.getElementById('reg-btn');
  setLoading(btn, true, 'Creating account…'); hideAlert('reg-error');
  try {
    await apiFetch('/api/v1/auth/signup', 'POST', { UserName: name, UserEmail: email, UserPassword: pass });
    document.getElementById('reg-name').value = '';
    document.getElementById('reg-email').value = '';
    document.getElementById('reg-password').value = '';
    document.getElementById('login-email').value = email;
    document.getElementById('login-password').value = '';
    switchForm('login');
    toast('Account created! Please sign in to continue.', 'success');
  } catch(e) {
    showAlert('reg-error', e.message || 'Registration failed.');
  } finally { setLoading(btn, false, 'Create Account'); }
}

// ─── Convert ──────────────────────────────────────────────────────────────────
function setConvType(type, el) {
  state.convType = type;
  document.querySelectorAll('#conv-type-tabs .sub-tab').forEach(t => t.classList.remove('active'));
  el.classList.add('active');
  populateConvUnits(); hideResult('conv-result');
}

// Called from dashboard quick-action buttons
function setConvTypeName(type) {
  state.convType = type;
  const tabs = document.querySelectorAll('#conv-type-tabs .sub-tab');
  const map  = { length:0, weight:1, volume:2, temperature:3 };
  tabs.forEach(t => t.classList.remove('active'));
  if (tabs[map[type]]) tabs[map[type]].classList.add('active');
  populateConvUnits(); hideResult('conv-result');
}

function setArithOpName(op) {
  state.arithOp = op;
  const tabs = document.querySelectorAll('#arith-op-tabs .sub-tab');
  const map  = { addition:0, subtraction:1, division:2, comparison:3 };
  tabs.forEach(t => t.classList.remove('active'));
  if (tabs[map[op]]) tabs[map[op]].classList.add('active');
  const ep = document.getElementById('arith-endpoint');
  if (ep) ep.textContent = `POST /api/v1/quantities/${op}`;
  const targetField = document.getElementById('target-unit-field');
  if (targetField) targetField.style.display = (op === 'division' || op === 'comparison') ? 'none' : 'block';
  hideResult('arith-result');
}

function populateConvUnits() {
  const units = UNITS[state.convType];
  const from = document.getElementById('conv-from-unit');
  const to   = document.getElementById('conv-to-unit');
  const prevFrom = from.value, prevTo = to.value;
  [from, to].forEach(sel => { sel.innerHTML = units.map(u => `<option value="${u}">${u}</option>`).join(''); });
  if (units.includes(prevFrom)) from.value = prevFrom;
  if (units.includes(prevTo))   to.value   = prevTo;
  if (from.value === to.value && units.length > 1) to.selectedIndex = 1;
}

function swapConvUnits() {
  const f = document.getElementById('conv-from-unit');
  const t = document.getElementById('conv-to-unit');
  [f.value, t.value] = [t.value, f.value];
}

async function doConvert() {
  const value    = parseFloat(document.getElementById('conv-value').value);
  const fromUnit = document.getElementById('conv-from-unit').value;
  const toUnit   = document.getElementById('conv-to-unit').value;
  if (isNaN(value)) { toast('Please enter a value.', 'error'); return; }
  if (fromUnit === toUnit) { toast('Select different units.', 'error'); return; }
  const btn = document.getElementById('conv-btn');
  setLoading(btn, true, 'Converting…');
  const payload = {
    ThisQuantityDTO: { ValueDTOs: value, UnitNameDTOs: fromUnit, MeasurementTypeDTOs: capitalize(state.convType) },
    TargetUnitDTOs: toUnit,
  };
  try {
    let result;
    if (state.token) {
      result = await apiFetch('/api/v1/quantities/conversion', 'POST', payload, true);
    } else {
      result = localConvert(value, fromUnit, toUnit, state.convType);
    }
    showConvResult(result, value, fromUnit, toUnit);
    if (!extractError(result)) {
      incrementCount('conversion');
      const num = extractResultValue(result) ?? localConvert(value, fromUnit, toUnit, state.convType).ResultValueDTOs;
      pushRecent('conversion', `${value} ${fromUnit} → ${toUnit}`, `${formatNum(num)} ${toUnit}`, false);
    }
  } catch(e) { showConvResultError(e.message); }
  finally { setLoading(btn, false, 'Convert'); }
}

function showConvResult(res, value, from, to) {
  const box = document.getElementById('conv-result');
  const val = document.getElementById('conv-result-val');
  const meta = document.getElementById('conv-result-meta');
  box.classList.remove('error'); box.classList.add('visible');
  if (extractError(res)) {
    val.textContent = extractErrorMessage(res) || 'Error';
    val.className = 'result-value error'; box.classList.add('error'); meta.textContent = ''; return;
  }
  let num = extractResultValue(res);
  if (num === null || num === undefined || (typeof num === 'number' && isNaN(num))) {
    num = localConvert(value, from, to, state.convType).ResultValueDTOs;
  }
  val.textContent = `${formatNum(num)} ${to}`;
  val.className   = 'result-value';
  meta.textContent = `${value} ${from} → ${formatNum(num)} ${to}`;
}
function showConvResultError(msg) {
  const box = document.getElementById('conv-result');
  box.classList.add('visible','error');
  document.getElementById('conv-result-val').textContent = msg || 'Error';
  document.getElementById('conv-result-val').className = 'result-value error';
  document.getElementById('conv-result-meta').textContent = '';
}

// ─── Arithmetic ───────────────────────────────────────────────────────────────
function setArithOp(op, el) {
  state.arithOp = op;
  document.querySelectorAll('#arith-op-tabs .sub-tab').forEach(t => t.classList.remove('active'));
  el.classList.add('active');
  const ep = document.getElementById('arith-endpoint');
  if (ep) ep.textContent = `POST /api/v1/quantities/${op}`;
  document.getElementById('target-unit-field').style.display = (op === 'division' || op === 'comparison') ? 'none' : 'block';
  hideResult('arith-result');
}

function updateArithUnits() {
  const type = document.getElementById('a-type').value;
  const units = UNITS[type];
  ['a-unit','b-unit','target-unit'].forEach(id => {
    const sel = document.getElementById(id);
    sel.innerHTML = units.map(u => `<option value="${u}">${u}</option>`).join('');
  });
}

function syncArithType() {
  const type = document.getElementById('a-type').value;
  const units = UNITS[type];
  ['a-unit','b-unit','target-unit'].forEach(id => {
    const sel = document.getElementById(id);
    const prev = sel.value;
    sel.innerHTML = units.map(u => `<option value="${u}">${u}</option>`).join('');
    if (units.includes(prev)) sel.value = prev;
  });
}

async function doArithmetic() {
  const aVal  = parseFloat(document.getElementById('a-value').value);
  const bVal  = parseFloat(document.getElementById('b-value').value);
  const aUnit = document.getElementById('a-unit').value;
  const bUnit = document.getElementById('b-unit').value;
  const tUnit = document.getElementById('target-unit').value;
  const type  = document.getElementById('a-type').value;
  const op    = state.arithOp;
  if (isNaN(aVal)) { toast('Please enter a value for Quantity A.', 'error'); return; }
  if (isNaN(bVal)) { toast('Please enter a value for Quantity B.', 'error'); return; }
  const btn = document.getElementById('arith-btn');
  setLoading(btn, true, 'Calculating…');
  const thisQty  = { ValueDTOs: aVal, UnitNameDTOs: aUnit, MeasurementTypeDTOs: capitalize(type) };
  const thereQty = { ValueDTOs: bVal, UnitNameDTOs: bUnit, MeasurementTypeDTOs: capitalize(type) };
  const payload  = { ThisQuantityDTO: thisQty, ThereQuantityDTO: thereQty, TargetUnitDTOs: tUnit };
  try {
    let result;
    if (state.token) {
      result = await apiFetch(`/api/v1/quantities/${op}`, 'POST', payload, true);
    } else {
      result = localArithmetic(aVal, aUnit, bVal, bUnit, tUnit, op, type);
    }
    showArithResult(result, op, aVal, aUnit, bVal, bUnit, tUnit, type);
  } catch(e) { showArithResultError(e.message); }
  finally { setLoading(btn, false, 'Calculate'); }
}

function showArithResult(res, op, aVal, aUnit, bVal, bUnit, tUnit, type) {
  const box  = document.getElementById('arith-result');
  const val  = document.getElementById('arith-result-val');
  const meta = document.getElementById('arith-result-meta');
  box.classList.remove('error'); box.classList.add('visible');
  if (extractError(res)) {
    val.textContent = extractErrorMessage(res) || 'Error';
    val.className = 'result-value error'; box.classList.add('error'); meta.textContent = '';
    pushRecent(op, `${aVal} ${aUnit} ${opSymbol(op)} ${bVal} ${bUnit}`, extractErrorMessage(res), true);
    return;
  }
  val.className = 'result-value';
  meta.textContent = `${aVal} ${aUnit} ${opSymbol(op)} ${bVal} ${bUnit}`;
  let displayResult = '';
  if (op === 'comparison') {
    const str = extractResultString(res);
    const num = extractResultValue(res);
    displayResult = str || (num === 0 ? 'A = B' : num > 0 ? 'A > B' : 'A < B');
    val.textContent = displayResult;
  } else {
    let num = extractResultValue(res);
    const unit = extractResultUnit(res) || tUnit;
    if (num === null || num === undefined || (typeof num === 'number' && isNaN(num))) {
      num = localArithmetic(aVal, aUnit, bVal, bUnit, tUnit, op, type).ResultValueDTOs;
    }
    displayResult = `${formatNum(num)} ${unit}`;
    val.textContent = displayResult;
  }
  incrementCount(op);
  pushRecent(op, `${aVal} ${aUnit} ${opSymbol(op)} ${bVal} ${bUnit}`, displayResult, false);
}
function showArithResultError(msg) {
  const box = document.getElementById('arith-result');
  box.classList.add('visible','error');
  document.getElementById('arith-result-val').textContent = msg || 'Error';
  document.getElementById('arith-result-val').className = 'result-value error';
  document.getElementById('arith-result-meta').textContent = '';
}

// ─── History ──────────────────────────────────────────────────────────────────
function setHistFilter(filter, el) {
  state.histFilter = filter;
  document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
  el.classList.add('active');
  renderHistory();
}

async function fetchHistory() {
  if (!state.token) return;
  try {
    let items = [];
    const raw = await apiFetch('/api/v1/quantities/history/all', 'GET', null, true).catch(() => null);
    if (Array.isArray(raw)) {
      items = raw;
    } else {
      const OPS = ['Convert','Add','Subtract','Divide','Compare'];
      const results = await Promise.all(OPS.map(op => apiFetch(`/api/v1/quantities/history/operation/${op}`, 'GET', null, true).catch(() => [])));
      for (const r of results) if (Array.isArray(r)) items = items.concat(r);
    }
    state.history = items;

    // Sync server-side counts into our local counts
    const serverCounts = { conversion:0, addition:0, subtraction:0, division:0, comparison:0 };
    for (const item of items) {
      const op = extractOp(item);
      if (serverCounts[op] !== undefined) serverCounts[op]++;
    }
    // Use max(local, server) so offline ops aren't lost
    for (const op of Object.keys(serverCounts)) {
      state.counts[op] = Math.max(state.counts[op] || 0, serverCounts[op]);
    }
    saveCounts();
    renderAllCounts();
    renderHistory();
  } catch(e) { toast('Could not load history: ' + e.message, 'error'); }
}

function renderHistory() {
  if (!state.token) return;
  const list = document.getElementById('history-list');
  let items = state.history;
  const f = state.histFilter;
  if (f !== 'all') {
    items = f === 'error' ? items.filter(i => extractError(i)) : items.filter(i => extractOp(i) === f);
  }
  if (items.length === 0) {
    list.innerHTML = `<div class="history-empty"><div class="big">📭</div><div>No records found</div></div>`; return;
  }
  list.innerHTML = items.map(item => histItemHTML(item)).join('');
}

function histItemHTML(item) {
  const op    = extractOp(item) || 'op';
  const isErr = extractError(item);
  const iconMap = { addition:'+', subtraction:'−', division:'÷', comparison:'≈', conversion:'⇄' };
  const clsMap  = { addition:'add', subtraction:'sub', division:'div', conversion:'conv', comparison:'cmp' };
  const icon    = iconMap[op] || '?';
  const cls     = isErr ? 'err' : (clsMap[op] || 'cmp');

  const thisVal  = item.ThisValueDTOs  ?? item.thisValueDTOs  ?? item.EntityFirstValue  ?? item.entityFirstValue  ?? '';
  const thisUnit = item.ThisUnitDTOs   ?? item.thisUnitDTOs   ?? item.EntityFirstUnit   ?? item.entityFirstUnit   ?? '';
  const thereVal = item.ThereValueDTOs ?? item.thereValueDTOs ?? item.EntitySecondValue ?? item.entitySecondValue ?? '';
  const thereUnit= item.ThereUnitDTOs  ?? item.thereUnitDTOs  ?? item.EntitySecondUnit  ?? item.entitySecondUnit  ?? '';
  let detail = '';
  if (thisVal !== '' && thisUnit !== '') {
    detail = `${thisVal} ${thisUnit}`;
    if (thereVal !== '' && thereUnit !== '') detail += ` ${opSymbol(op)} ${thereVal} ${thereUnit}`;
  }
  const resVal  = item.ResultValueDTOs ?? item.resultValueDTOs ?? item.EntityResultValue ?? item.entityResultValue ?? null;
  const resUnit = item.ResultUnitDTOs  ?? item.resultUnitDTOs  ?? item.ResultUnit ?? item.resultUnit ?? '';
  const result  = isErr
    ? `<span class="h-result err">${extractErrorMessage(item) || 'error'}</span>`
    : `<span class="h-result">${formatNum(resVal)} ${resUnit}</span>`;

  return `<div class="history-item${isErr?' err-item':''}">
    <div class="h-icon ${cls}">${icon}</div>
    <div class="h-body">
      <div class="h-op">${capitalize(op)}</div>
      <div class="h-detail">${detail}</div>
    </div>
    ${result}
  </div>`;
}

// ─── Local (offline) math ─────────────────────────────────────────────────────
const FACTORS = {
  length:      { Feet:0.3048, Inch:0.0254, Yard:0.9144, Centimeter:0.01 },
  weight:      { Kilogram:1, Gram:0.001, Pound:0.453592 },
  volume:      { Litre:1, Millilitre:0.001, Gallon:3.78541 },
  temperature: null,
};
function toBase(val, unit, type) { return type === 'temperature' ? toBaseTemp(val, unit) : val * (FACTORS[type][unit] || 1); }
function fromBase(val, unit, type) { return type === 'temperature' ? fromBaseTemp(val, unit) : val / (FACTORS[type][unit] || 1); }
function toBaseTemp(val, unit) { if (unit==='Celsius') return val; if (unit==='Fahrenheit') return (val-32)*5/9; if (unit==='Kelvin') return val-273.15; return val; }
function fromBaseTemp(val, unit) { if (unit==='Celsius') return val; if (unit==='Fahrenheit') return val*9/5+32; if (unit==='Kelvin') return val+273.15; return val; }

function localConvert(val, from, to, type) {
  const result = fromBase(toBase(val, from, type), to, type);
  return { ResultValueDTOs: result, ResultUnitDTOs: to, IsThereErrorDTOs: false, OperationDTOs: 'conversion', ThisValueDTOs: val, ThisUnitDTOs: from };
}
function localArithmetic(aVal, aUnit, bVal, bUnit, tUnit, op, type) {
  try {
    const aBase = toBase(aVal, aUnit, type), bBase = toBase(bVal, bUnit, type);
    if (op === 'comparison') {
      const diff = aBase - bBase;
      return { ResultValueDTOs: diff, ResultStringDTOs: diff===0?'A = B':diff>0?'A > B':'A < B', ResultUnitDTOs: '', IsThereErrorDTOs: false, OperationDTOs: op };
    }
    let resultBase;
    if      (op === 'addition')    resultBase = aBase + bBase;
    else if (op === 'subtraction') resultBase = aBase - bBase;
    else if (op === 'division')    { if (bBase===0) throw new Error('Division by zero'); resultBase = aBase / bBase; }
    const result = op === 'division' ? resultBase : fromBase(resultBase, tUnit, type);
    return { ResultValueDTOs: result, ResultUnitDTOs: op==='division' ? '' : tUnit, IsThereErrorDTOs: false, OperationDTOs: op };
  } catch(e) { return { IsThereErrorDTOs: true, ErrorMessageDTOs: e.message, OperationDTOs: op }; }
}

// ─── Utils ────────────────────────────────────────────────────────────────────
function opSymbol(op) { return {addition:'+',subtraction:'−',division:'÷',comparison:'≈',conversion:'→'}[op] || op; }
function capitalize(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : s; }
function formatNum(n) {
  if (n === undefined || n === null || (typeof n === 'number' && isNaN(n))) return '—';
  return parseFloat((Math.round(n * 1e8) / 1e8).toPrecision(8)).toString();
}
function hideResult(id) { document.getElementById(id).classList.remove('visible','error'); }
function setLoading(btn, on, text) { btn.disabled = on; btn.innerHTML = on ? `<span class="spinner"></span> ${text}` : text; }
function showAlert(id, msg) { const el = document.getElementById(id); if(el){ el.textContent = msg; el.classList.add('visible'); } }
function hideAlert(id) { const el = document.getElementById(id); if(el){ el.textContent = ''; el.classList.remove('visible'); } }
function resetInputs() {
  ['conv-value','a-value','b-value'].forEach(id => { const el = document.getElementById(id); if(el) el.value = ''; });
  hideResult('conv-result'); hideResult('arith-result');
}
function toast(msg, type='success') {
  const icons = { success:'✓', error:'✕', info:'i' };
  const t = document.createElement('div');
  t.className = `toast ${type}`;
  t.innerHTML = `<span class="toast-icon">${icons[type]||'i'}</span><span class="toast-msg">${msg}</span>`;
  document.getElementById('toasts').appendChild(t);
  setTimeout(() => { t.style.opacity='0'; t.style.transition='opacity .3s'; setTimeout(()=>t.remove(), 300); }, 3500);
}

// ─── Init ─────────────────────────────────────────────────────────────────────
function init() {
  populateConvUnits();
  updateArithUnits();
  document.getElementById('a-type').addEventListener('change', syncArithType);

  // Restore session
  try {
    const savedToken = sessionStorage.getItem('qm_token');
    const savedUser  = sessionStorage.getItem('qm_user');
    if (savedToken && savedUser) {
      const user = JSON.parse(savedUser);
      setLoggedIn(user, savedToken);
      if (document.getElementById('panel-history').classList.contains('active')) fetchHistory();
    } else {
      // Guest: load guest counts
      loadCounts();
      renderDashboard();
    }
  } catch(e) {
    try { sessionStorage.removeItem('qm_token'); sessionStorage.removeItem('qm_user'); } catch(_) {}
    loadCounts(); renderDashboard();
  }
}

init();