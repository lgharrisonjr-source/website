// Customer dashboard preview — fictional sample data, calculations from the tested engine.
import { analyze, baseline, money } from './engine.js';

const initial = { income: 5400, extra: 150, states: ['To do', 'To do', 'To do'] };
let data = structuredClone(initial);
let persistent = true;
const KEY = 'ft360-site-demo.v1';
try {
  const raw = JSON.parse(localStorage.getItem(KEY));
  if (raw && [5400, 5600].includes(raw.income) && Number.isFinite(raw.extra) && raw.extra >= 0 && raw.extra <= 600 && Array.isArray(raw.states) && raw.states.length === 3) {
    data = { ...initial, ...raw };
  }
} catch { persistent = false; }

const $ = (s) => document.querySelector(s);
const $$ = (s) => [...document.querySelectorAll(s)];

function save() {
  try { localStorage.setItem(KEY, JSON.stringify(data)); } catch { persistent = false; }
  render();
}

const incomeOriginal = $('#income-original');
const incomeCorrected = $('#income-corrected');
if (incomeOriginal) incomeOriginal.addEventListener('click', () => { data.income = 5400; save(); });
if (incomeCorrected) incomeCorrected.addEventListener('click', () => { data.income = 5600; save(); });

const slider = $('#extra-payment');
if (slider) slider.addEventListener('input', () => { data.extra = Number(slider.value); save(); });

$$('.action-item').forEach((action, i) => {
  action.querySelectorAll('button').forEach((b) => b.addEventListener('click', () => {
    data.states[i] = b.textContent.trim();
    save();
    const note = $('#action-status');
    if (note) note.textContent = `Action ${i + 1}: ${data.states[i]}. Demo tracking only, saved in this browser.`;
  }));
});

const reset = $('#demo-reset');
if (reset) reset.addEventListener('click', () => {
  data = structuredClone(initial);
  save();
  const note = $('#action-status');
  if (note) note.textContent = 'Demo reset to the original sample.';
});

function render() {
  const r = analyze({ ...baseline, income: data.income }, data.extra);
  const store = $('#storage-status');
  if (store) store.textContent = persistent ? 'Demo choices are saved in this browser only.' : 'Storage unavailable. Changes last only while this page is open.';

  const takeHome = $('#m-takehome');
  if (takeHome) {
    takeHome.textContent = money(data.income);
    $('#m-takehome-note').textContent = data.income === 5400 ? 'Sample source' : 'Corrected sample';
    $('#m-cash').textContent = money(r.cash);
  }
  if (incomeOriginal) incomeOriginal.setAttribute('aria-pressed', String(data.income === 5400));
  if (incomeCorrected) incomeCorrected.setAttribute('aria-pressed', String(data.income === 5600));

  if (slider) {
    slider.value = data.extra;
    const label = $('#extra-label');
    if (label) label.textContent = `${money(data.extra)} extra per month`;
    $('#scenario-payment').textContent = `${money(300 + data.extra)}/mo`;
    $('#scenario-result').textContent = `${r.scenario.months} months · ${money(r.scenario.interest)} interest`;
    $('#scenario-diff').textContent = `${r.base.months - r.scenario.months} fewer months; ${money(r.base.interest - r.scenario.interest)} less interest.`;
    $('#scenario-room').textContent = `${money(r.afterExtra)} left after listed costs and the scenario card payment.`;
  }

  $$('.action-item').forEach((action, i) => {
    action.querySelectorAll('button').forEach((b) => b.setAttribute('aria-pressed', String(b.textContent.trim() === data.states[i])));
  });
}
render();
