import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { settleBalances } from '../src/utils/settleBalances.js';
import { equal, custom, settlement, netFlow, round2 } from '../testUtils/helpers.js';

const sortByFrom = (s) => [...s].sort((a, b) => a.from.localeCompare(b.from));

describe('settleBalances: core cases', () => {
  test('no expenses -> no settlements', () => {
    const { settlements, balances } = settleBalances([], ['A', 'B', 'C']);
    assert.deepEqual(settlements, []);
    assert.deepEqual(balances, { A: 0, B: 0, C: 0 });
  });

  test('simple 3-person case: A paid 30 for all, B and C each owe A 10', () => {
    const { settlements } = settleBalances([equal('A', 30, ['A', 'B', 'C'])], ['A', 'B', 'C']);
    assert.deepEqual(sortByFrom(settlements), [
      { from: 'B', to: 'A', amount: 10 },
      { from: 'C', to: 'A', amount: 10 },
    ]);
  });

  test('payer who is the only participant creates no debt', () => {
    const { settlements } = settleBalances([equal('A', 50, ['A'])], ['A', 'B']);
    assert.deepEqual(settlements, []);
  });

  test('expense with empty splitamong is ignored', () => {
    const { settlements } = settleBalances([equal('A', 50, [])], ['A', 'B']);
    assert.deepEqual(settlements, []);
  });

  test('one creditor, many debtors: everyone pays the creditor directly', () => {
    const members = ['A', 'B', 'C', 'D', 'E'];
    const { settlements } = settleBalances([equal('A', 100, members)], members);
    assert.equal(settlements.length, 4);
    assert.ok(settlements.every((s) => s.to === 'A' && s.amount === 20));
  });

  test('one debtor, many creditors: debtor pays each creditor', () => {
    const members = ['A', 'B', 'C', 'D'];
    const expenses = [
      custom('B', { A: 10 }),
      custom('C', { A: 20 }),
      custom('D', { A: 30 }),
    ];
    const { settlements } = settleBalances(expenses, members);
    assert.equal(settlements.length, 3);
    assert.ok(settlements.every((s) => s.from === 'A'));
    assert.deepEqual(
      settlements.map((s) => [s.to, s.amount]).sort(),
      [['B', 10], ['C', 20], ['D', 30]]
    );
  });
});

describe('settleBalances: debt simplification', () => {
  test('circular chain A->B->C->A of equal amounts cancels to zero transfers', () => {
    const members = ['A', 'B', 'C'];
    const expenses = [
      custom('B', { A: 100 }), // A owes B 100
      custom('C', { B: 100 }), // B owes C 100
      custom('A', { C: 100 }), // C owes A 100
    ];
    const { settlements } = settleBalances(expenses, members);
    assert.deepEqual(settlements, []);
  });

  test('chain A owes B, B owes C collapses to A paying C directly', () => {
    const members = ['A', 'B', 'C'];
    const expenses = [custom('B', { A: 50 }), custom('C', { B: 50 })];
    const { settlements } = settleBalances(expenses, members);
    assert.deepEqual(settlements, [{ from: 'A', to: 'C', amount: 50 }]);
  });

  test('partially overlapping chain nets correctly', () => {
    // A owes B 100, B owes C 40 -> B nets +60, A -100, C +40
    const members = ['A', 'B', 'C'];
    const expenses = [custom('B', { A: 100 }), custom('C', { B: 40 })];
    const { settlements } = settleBalances(expenses, members);
    assert.deepEqual(netFlow(settlements), { A: -100, B: 60, C: 40 });
    assert.equal(settlements.length, 2);
  });

  test('never produces more than n-1 transfers', () => {
    const members = ['A', 'B', 'C', 'D', 'E', 'F'];
    const expenses = [
      equal('A', 120, ['A', 'B', 'C']),
      equal('D', 90, ['C', 'D', 'E', 'F']),
      custom('F', { A: 17, B: 23, E: 9 }),
      equal('B', 60, members),
      custom('E', { C: 31, D: 14 }),
    ];
    const { settlements } = settleBalances(expenses, members);
    assert.ok(settlements.length <= members.length - 1, `got ${settlements.length}`);
  });

  test('greedy is not always minimal: documented counterexample (5 transfers vs optimal 4)', () => {
    // Net balances: A -8, B -7, C -4, D +6, E +6, F +7.
    // Optimal pairs {B,F} (7/7) and {A,C,D,E}: 1 + 3 = 4 transfers.
    // Largest-first greedy never isolates the {B,F} pair and needs 5.
    const members = ['A', 'B', 'C', 'D', 'E', 'F', 'Z'];
    const expenses = [
      custom('Z', { A: 8 }), custom('Z', { B: 7 }), custom('Z', { C: 4 }),
      custom('D', { Z: 6 }), custom('E', { Z: 6 }), custom('F', { Z: 7 }),
    ];
    const { settlements } = settleBalances(expenses, members);
    assert.equal(settlements.length, 5);
    assert.deepEqual(netFlow(settlements), { A: -8, B: -7, C: -4, D: 6, E: 6, F: 7 });
  });
});

describe('settleBalances: invariants', () => {
  test('money is conserved: total paid equals total received', () => {
    const members = ['A', 'B', 'C', 'D'];
    const expenses = [
      equal('A', 100, members),
      equal('B', 47.5, ['A', 'B', 'C']),
      custom('C', { A: 12.25, D: 30.1 }),
    ];
    const { settlements } = settleBalances(expenses, members);
    const flow = netFlow(settlements);
    const total = Object.values(flow).reduce((a, b) => a + b, 0);
    assert.ok(Math.abs(total) < 0.005, `net flow should be ~0, got ${total}`);
  });

  test('applying the settlements brings every member to zero', () => {
    const members = ['A', 'B', 'C', 'D'];
    const expenses = [equal('A', 200, members), equal('C', 80, ['B', 'C', 'D'])];
    const { settlements } = settleBalances(expenses, members);
    // Record the proposed transfers as settlement expenses; nothing should remain.
    const recorded = settlements.map((s) => settlement(s.from, s.to, s.amount));
    const after = settleBalances([...expenses, ...recorded], members);
    assert.deepEqual(after.settlements, []);
  });

  test('balances map mirrors the settlements', () => {
    const members = ['A', 'B', 'C'];
    const { settlements, balances } = settleBalances([equal('A', 30, members)], members);
    assert.deepEqual(balances, { A: 20, B: -10, C: -10 });
    assert.deepEqual(balances, netFlow(settlements));
  });
});

describe('settleBalances: decimals and rounding', () => {
  test('100 split three ways: amounts are rounded to cents and conserve money', () => {
    const members = ['A', 'B', 'C'];
    const { settlements } = settleBalances([equal('A', 100, members)], members);
    assert.equal(settlements.length, 2);
    for (const s of settlements) {
      assert.equal(s.amount, 33.33);
      assert.equal(s.amount, round2(s.amount), 'no floating-point residue');
    }
  });

  test('0.1 + 0.2 style amounts do not leave residue', () => {
    const members = ['A', 'B'];
    const expenses = [equal('A', 0.1, ['A', 'B']), equal('A', 0.2, ['A', 'B'])];
    const { settlements } = settleBalances(expenses, members);
    assert.deepEqual(settlements, [{ from: 'B', to: 'A', amount: 0.15 }]);
  });

  test('sub-cent imbalances (< 0.01) are ignored', () => {
    const members = ['A', 'B'];
    const { settlements } = settleBalances([custom('A', { B: 0.004 })], members);
    assert.deepEqual(settlements, []);
  });

  test('custom split amounts are respected exactly', () => {
    const members = ['A', 'B', 'C'];
    const { settlements } = settleBalances([custom('A', { A: 40, B: 35.5, C: 24.5 })], members);
    assert.deepEqual(
      sortByFrom(settlements),
      [{ from: 'B', to: 'A', amount: 35.5 }, { from: 'C', to: 'A', amount: 24.5 }]
    );
  });
});

describe('settleBalances: settlements and settledBy', () => {
  test('a recorded settlement clears that debt only (partial settle)', () => {
    const members = ['R', 'P', 'S'];
    const expenses = [
      custom('R', { P: 10, S: 70 }),
      settlement('P', 'R', 10),
    ];
    const { settlements } = settleBalances(expenses, members);
    assert.deepEqual(settlements, [{ from: 'S', to: 'R', amount: 70 }]);
  });

  test('a full settlement leaves nothing outstanding', () => {
    const members = ['A', 'B'];
    const expenses = [equal('A', 100, ['A', 'B']), settlement('B', 'A', 50)];
    assert.deepEqual(settleBalances(expenses, members).settlements, []);
  });

  test('participants listed in settledBy are skipped (equal split)', () => {
    const members = ['A', 'B', 'C'];
    const expenses = [equal('A', 30, members, { settledBy: ['B'] })];
    const { settlements } = settleBalances(expenses, members);
    assert.deepEqual(settlements, [{ from: 'C', to: 'A', amount: 10 }]);
  });

  test('participants listed in settledBy are skipped (custom split)', () => {
    const members = ['A', 'B', 'C'];
    const expenses = [custom('A', { B: 20, C: 5 }, { settledBy: ['B'] })];
    const { settlements } = settleBalances(expenses, members);
    assert.deepEqual(settlements, [{ from: 'C', to: 'A', amount: 5 }]);
  });
});

describe('settleBalances: input shapes', () => {
  test('accepts populated documents ({ _id }) as well as raw ids', () => {
    const members = [{ _id: 'A' }, { _id: 'B' }];
    const expenses = [
      { paidby: { _id: 'A' }, amount: 20, splitType: 'equal', splitamong: [{ _id: 'A' }, { _id: 'B' }], settledBy: [] },
    ];
    const { settlements } = settleBalances(expenses, members);
    assert.deepEqual(settlements, [{ from: 'B', to: 'A', amount: 10 }]);
  });

  test('payer missing from the members list is still handled', () => {
    const { settlements } = settleBalances([equal('X', 20, ['X', 'A'])], ['A']);
    assert.deepEqual(settlements, [{ from: 'A', to: 'X', amount: 10 }]);
  });
});
