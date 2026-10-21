import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { formatExpenses } from '../src/utils/formatExpenses.js';

const user = (id, fullname) => ({ _id: id, fullname });

const base = {
  _id: 'e1',
  description: 'Dinner',
  group: 'g1',
  createdAt: new Date('2026-01-01T00:00:00Z'),
};

describe('formatExpenses: equal split', () => {
  const expense = {
    ...base,
    amount: 90,
    paidby: user('A', 'Alice'),
    splitType: 'equal',
    splitamong: [user('A', 'Alice'), user('B', 'Bob'), user('C', 'Cara')],
    settledBy: [],
  };

  test('payer sees what others owe them', () => {
    const [row] = formatExpenses([expense], 'A');
    assert.equal(row.status, 'YOU PAID');
    assert.equal(row.othersOweYou, 60);
    assert.equal(row.youOwe, 0);
    assert.equal(row.paidBy, 'Alice');
    assert.equal(row.isSettlementRecord, false);
  });

  test('participant sees their share and a PENDING status', () => {
    const [row] = formatExpenses([expense], 'B');
    assert.equal(row.status, 'PENDING');
    assert.equal(row.youOwe, 30);
    assert.equal(row.othersOweYou, 0);
    assert.deepEqual(row.splitWith, ['Alice', 'You', 'Cara']);
  });

  test('payer reaches SETTLED once everyone else has settled', () => {
    const [row] = formatExpenses([{ ...expense, settledBy: ['B', 'C'] }], 'A');
    assert.equal(row.status, 'SETTLED');
    assert.equal(row.othersOweYou, 0);
  });

  test('participant who settled sees SETTLED and owes nothing', () => {
    const [row] = formatExpenses([{ ...expense, settledBy: ['B'] }], 'B');
    assert.equal(row.status, 'SETTLED');
    assert.equal(row.youOwe, 0);
  });

  test('payer only counts unsettled participants', () => {
    const [row] = formatExpenses([{ ...expense, settledBy: ['B'] }], 'A');
    assert.equal(row.othersOweYou, 30);
  });
});

describe('formatExpenses: custom split', () => {
  const expense = {
    ...base,
    amount: 100,
    paidby: user('A', 'Alice'),
    splitType: 'custom',
    customSplits: [
      { user: user('A', 'Alice'), amount: 50 },
      { user: user('B', 'Bob'), amount: 30 },
      { user: user('C', 'Cara'), amount: 20 },
    ],
    settledBy: [],
  };

  test('participant owes exactly their custom amount', () => {
    const [row] = formatExpenses([expense], 'C');
    assert.equal(row.youOwe, 20);
    assert.equal(row.status, 'PENDING');
  });

  test('payer is owed the sum of other participants custom amounts', () => {
    const [row] = formatExpenses([expense], 'A');
    assert.equal(row.othersOweYou, 50);
  });

  test('user not in the split owes nothing', () => {
    const [row] = formatExpenses([expense], 'Z');
    assert.equal(row.youOwe, 0);
  });
});

describe('formatExpenses: settlement records', () => {
  const record = {
    ...base,
    description: undefined,
    amount: 40,
    paidby: user('B', 'Bob'),
    splitType: 'settlement',
    splitamong: [user('A', 'Alice')],
  };

  test('is flagged as a settlement record and always SETTLED', () => {
    const [row] = formatExpenses([record], 'B');
    assert.equal(row.isSettlementRecord, true);
    assert.equal(row.status, 'SETTLED');
    assert.equal(row.youOwe, 0);
    assert.equal(row.othersOweYou, 0);
    assert.equal(row.title, 'Settlement Payment');
  });

  test('receiver is shown as "You" to the receiving user', () => {
    const [row] = formatExpenses([record], 'A');
    assert.deepEqual(row.splitWith, ['You']);
  });

  test('receiver is shown by name to other users', () => {
    const [row] = formatExpenses([record], 'B');
    assert.deepEqual(row.splitWith, ['Alice']);
  });
});

describe('formatExpenses: edge cases', () => {
  test('returns an empty array for no expenses', () => {
    assert.deepEqual(formatExpenses([], 'A'), []);
  });

  test('accepts a numeric-like ObjectId via toString()', () => {
    const id = { toString: () => 'A' };
    const [row] = formatExpenses(
      [{ ...base, amount: 20, paidby: 'A', splitType: 'equal', splitamong: ['A', 'B'], settledBy: [] }],
      id
    );
    assert.equal(row.status, 'YOU PAID');
    assert.equal(row.othersOweYou, 10);
  });
});
