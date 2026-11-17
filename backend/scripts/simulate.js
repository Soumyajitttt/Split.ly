// Simulation: transfers needed by per-expense settling vs. settleBalances (netting + greedy).
// Run: node scripts/simulate.js [groups=2000] [seed=42]
import { settleBalances } from '../src/utils/settleBalances.js';

const GROUPS = Number(process.argv[2] || 2000);
let s = Number(process.argv[3] || 42) >>> 0;
// mulberry32: small seeded PRNG so results are reproducible
const rand = () => {
  s = (s + 0x6D2B79F5) >>> 0;
  let t = s;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
const int = (lo, hi) => lo + Math.floor(rand() * (hi - lo + 1));

const results = [];
for (let g = 0; g < GROUPS; g++) {
  const n = int(3, 10);                       // members per group
  const e = int(5, 40);                       // expenses per group
  const members = Array.from({ length: n }, (_, i) => `u${i}`);
  const expenses = [];
  let baseline = 0;

  for (let k = 0; k < e; k++) {
    const payer = members[int(0, n - 1)];
    const size = int(2, n);                   // participants incl. possibly payer
    const pool = [...members].sort(() => rand() - 0.5).slice(0, size);
    const amount = int(100, 5000);
    const custom = rand() < 0.3;
    if (custom) {
      let left = amount;
      const cs = pool.map((u, i) => {
        const a = i === pool.length - 1 ? left : Math.min(left, int(1, Math.floor(left / (pool.length - i)) * 2 || 1));
        left -= a;
        return { user: u, amount: a };
      });
      expenses.push({ paidby: payer, amount, splitType: 'custom', customSplits: cs, splitamong: pool });
      baseline += cs.filter(c => c.user !== payer && c.amount > 0).length;
    } else {
      expenses.push({ paidby: payer, amount, splitType: 'equal', splitamong: pool });
      baseline += pool.filter(u => u !== payer).length;
    }
  }

  const { settlements } = settleBalances(expenses, members);
  if (baseline > 0) results.push({ n, baseline, simplified: settlements.length, red: 1 - settlements.length / baseline });
}

const reds = results.map(r => r.red).sort((a, b) => a - b);
const pct = p => reds[Math.floor(p * (reds.length - 1))];
const mean = reds.reduce((a, b) => a + b, 0) / reds.length;
const f = x => (x * 100).toFixed(1) + '%';
console.log(`groups simulated: ${results.length}`);
console.log(`mean reduction: ${f(mean)}  | min ${f(reds[0])}  p10 ${f(pct(0.1))}  median ${f(pct(0.5))}  p90 ${f(pct(0.9))}  max ${f(reds.at(-1))}`);
for (const [lo, hi] of [[3, 4], [5, 6], [7, 8], [9, 10]]) {
  const r = results.filter(x => x.n >= lo && x.n <= hi);
  const m = r.reduce((a, b) => a + b.red, 0) / r.length;
  console.log(`members ${lo}-${hi}: mean reduction ${f(m)} (avg ${(r.reduce((a,b)=>a+b.baseline,0)/r.length).toFixed(0)} -> ${(r.reduce((a,b)=>a+b.simplified,0)/r.length).toFixed(1)} transfers)`);
}