import { useState, useEffect, useLayoutEffect, useCallback, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Nav from '../components/layout/Nav';
import Sidebar from '../components/layout/Sidebar';
import { Modal, Spinner } from '../components/ui';
import { TabBar, TabContent } from '../components/ui/TabBar';
import {
  createExpense, deleteExpense, leaveGroup,
  initiateSettlement, confirmSettlement, cancelSettlement,
} from '../api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useDataCache } from '../context/DataCache';
import {
  ShareIcon,
  TrashIcon,
  CheckIcon,
  CheckCircleIcon,
  ArrowRightIcon,
  ClipboardDocumentIcon,
  ArrowLeftIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  ArrowDownIcon,
  PaperAirplaneIcon,
  PlusIcon,
  XMarkIcon,
  BanknotesIcon,
  ClockIcon,
  UserPlusIcon,
} from '@heroicons/react/24/outline';

/* ── Helpers ────────────────────────────────────────────────────────────────── */

const G_COLORS = ['#0056c6', '#ff6b35', '#7a5cff', '#00a67e', '#e5486b', '#141414'];
const SENDER_COLORS = ['#0056c6', '#c24a17', '#7a5cff', '#0a7a57', '#d6336c', '#8a6d00'];
const groupColor = (s = '') => G_COLORS[(s.charCodeAt(0) || 0) % G_COLORS.length];
const initial = (n = '?') => (n[0] || '?').toUpperCase();
const money = (n) => `₹${(Number(n) || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
const moneyRound = (n) => `₹${Math.round(Number(n) || 0).toLocaleString('en-IN')}`;

function timeLabel(t) {
  if (!t) return '';
  return new Date(t).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true }).toLowerCase();
}

function dayLabel(t) {
  const d = new Date(t);
  const today = new Date();
  const yest = new Date(); yest.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return 'Today';
  if (d.toDateString() === yest.toDateString()) return 'Yesterday';
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

/** "Dinner 450" → { description: 'Dinner', amount: '450' } */
function parseDraft(text) {
  const m = text.match(/(\d[\d,]*(?:\.\d+)?)(?!.*\d)/);
  if (!m) return { description: text.trim(), amount: '' };
  const amount = m[1].replace(/,/g, '');
  const description = (text.slice(0, m.index) + ' ' + text.slice(m.index + m[0].length))
    .replace(/₹|\brs\.?\b|\binr\b/gi, ' ')
    .replace(/\s+/g, ' ')
    .replace(/^[\s\-:,]+|[\s\-:,]+$/g, '');
  return { description, amount };
}

export default function GroupDetailRoute() {
  const { groupId } = useParams();
  return <GroupDetail key={groupId} />;
}

function GroupDetail() {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const showToast = useToast();
  const { fetchGroupData, peekGroupData, invalidateGroups } = useDataCache();

  // Paint instantly from the cache when we have it; only show a spinner on a true cold start.
  const [cached0] = useState(() => peekGroupData(groupId));
  const [group,    setGroup]    = useState(cached0?.group ?? null);
  const [expenses, setExpenses] = useState(cached0?.expenses ?? []);
  const [summary,  setSummary]  = useState(cached0?.summary ?? null);
  const [loading,  setLoading]  = useState(!cached0);
  const [freshIds, setFreshIds] = useState(() => new Set());
  const seenIds = useRef(new Set([
    ...(cached0?.expenses || []).map(e => e._id),
    ...(cached0?.summary?.pendingSettlements || []).map(p => p._id),
  ]));
  const [activeTab, setActiveTab] = useState('balances');
  const [tabSwitched, setTabSwitched] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [expenseModal, setExpenseModal] = useState(false);
  const [shareModal,   setShareModal]   = useState(false);
  const [expForm, setExpForm] = useState({ description: '', amount: '', paidby: '', splitamong: [], splitType: 'equal', customSplits: {} });
  const [submitting, setSubmitting] = useState(false);
  const [settlingId, setSettlingId] = useState(null);

  const [confirmTarget, setConfirmTarget] = useState(null);
  const [confirming,    setConfirming]    = useState(false);

  // chat UI state
  const [infoOpen, setInfoOpen] = useState(false);
  const [draft, setDraft] = useState('');
  const [menuId, setMenuId] = useState(null);
  const [showJump, setShowJump] = useState(false);
  const scrollRef = useRef(null);
  const firstScroll = useRef(true);

  // Cache-first load. With a warm cache this paints immediately (no spinner) and only
  // re-requests in the background when the entry is stale or after a mutation (force).
  const applyData = useCallback(({ group: g, expenses: exps, summary: s }, animate) => {
    if (animate) {
      const ids = [...exps.map(e => e._id), ...(s?.pendingSettlements || []).map(p => p._id)];
      const fresh = ids.filter(id => id && !seenIds.current.has(id));
      if (fresh.length) {
        setFreshIds(new Set(fresh));
        setTimeout(() => setFreshIds(new Set()), 1400);
      }
    }
    exps.forEach(e => e._id && seenIds.current.add(e._id));
    (s?.pendingSettlements || []).forEach(p => p._id && seenIds.current.add(p._id));
    setGroup(g);
    setExpenses(exps);
    setSummary(s);
  }, []);

  const loadData = useCallback(async ({ force = false } = {}) => {
    const peek = peekGroupData(groupId);
    try {
      if (peek && !force && !peek.stale) {
        applyData(peek, false);          // fresh cache: zero network
        setLoading(false);
        return;
      }
      if (!peek) setLoading(true);       // cold start only
      const data = await fetchGroupData(groupId, { force });
      applyData(data, !!peek);           // animate only genuinely new rows
    } catch (err) {
      if (!peek) {
        showToast(err.response?.data?.message || 'Failed to load group');
        navigate('/groups');
      }
    } finally {
      setLoading(false);
    }
  }, [groupId, fetchGroupData, peekGroupData, applyData, navigate, showToast]);

  // After any mutation, refetch quietly in the background; the UI updates in place.
  const refetch = useCallback(() => {
    loadData({ force: true });          // force-fetch overwrites the cache entry on success
  }, [loadData]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleAddExpense = async () => {
    const { description, amount, paidby, splitamong, splitType, customSplits } = expForm;
    if (!description)                   { showToast('Add a description'); return; }
    if (!amount || Number(amount) <= 0) { showToast('Enter a valid amount'); return; }
    if (!paidby)                        { showToast('Select who paid'); return; }
    if (!splitamong.length)             { showToast('Select who to split with'); return; }

    let payload = { description, amount: Number(amount), paidby, splitamong, splitType };

    if (splitType === 'custom') {
      const customSplitArr = splitamong.map(id => ({
        user: id,
        amount: Number(customSplits[id] || 0)
      }));
      const customTotal = customSplitArr.reduce((s, cs) => s + cs.amount, 0);
      const remaining = Number(amount) - customTotal;
      if (remaining > 0.01) {
        showToast(`₹${remaining.toFixed(2)} still unassigned — please distribute the full amount`);
        return;
      }
      if (remaining < -0.01) {
        showToast(`Amounts exceed total by ₹${Math.abs(remaining).toFixed(2)} — please reduce`);
        return;
      }
      payload.customSplits = customSplitArr;
    }

    setSubmitting(true);
    try {
      await createExpense(groupId, payload);
      showToast('Expense added!');
      setExpenseModal(false);
      setExpForm({ description: '', amount: '', paidby: '', splitamong: [], splitType: 'equal', customSplits: {} });
      refetch();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to add expense');
    } finally { setSubmitting(false); }
  };

  const handleInitiateSettle = async (settlement) => {
    setSettlingId(settlement.fromId + settlement.toId);
    try {
      await initiateSettlement(groupId, {
        fromId: settlement.fromId,
        toId:   settlement.toId,
        amount: Number(settlement.amount),
      });
      showToast(`Settlement request sent to ${settlement.to} — waiting for confirmation`);
      refetch();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to initiate settlement');
    } finally {
      setSettlingId(null);
    }
  };

  const handleOpenConfirm = (pending) => {
    setConfirmTarget(pending);
  };

  const handleConfirmSettle = async () => {
    if (!confirmTarget) return;
    setConfirming(true);
    try {
      await confirmSettlement(groupId, { pendingId: confirmTarget._id });
      showToast(`Settlement confirmed — ₹${confirmTarget.amount} from ${confirmTarget.from} recorded`);
      setConfirmTarget(null);
      refetch();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to confirm settlement');
    } finally {
      setConfirming(false);
    }
  };

  const handleCancelPending = async (pending) => {
    try {
      await cancelSettlement(groupId, { pendingId: pending._id });
      showToast('Settlement cancelled');
      refetch();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to cancel');
    }
  };

  const handleDeleteExpense = async (expenseId) => {
    if (!window.confirm('Delete this expense?')) return;
    try {
      await deleteExpense(expenseId);
      showToast('Expense deleted');
      refetch();
    } catch (err) {
      showToast(err.response?.data?.message || 'Cannot delete — only the payer can');
    }
  };

  const handleLeave = async () => {
    if (!window.confirm('Leave this group?')) return;
    try {
      await leaveGroup(groupId);
      // Group list is now stale too
      invalidateGroups();
      showToast('Left group');
      navigate('/groups');
    } catch (err) {
      showToast(err.response?.data?.message || 'Cannot leave');
    }
  };

  const toggleSplit = (memberId) => {
    setExpForm(f => ({
      ...f,
      splitamong: f.splitamong.includes(memberId)
        ? f.splitamong.filter(id => id !== memberId)
        : [...f.splitamong, memberId]
    }));
  };


  /* ── Chat UI effects ── */
  const pendingCount = summary?.pendingSettlements?.length || 0;

  // Keep the newest message in view (instantly on first load, smoothly after)
  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (!el || loading) return;
    el.scrollTo({ top: el.scrollHeight, behavior: firstScroll.current ? 'auto' : 'smooth' });
    firstScroll.current = false;
  }, [loading, expenses.length, pendingCount]);

  useEffect(() => {
    if (!menuId) return undefined;
    const close = () => setMenuId(null);
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, [menuId]);

  useEffect(() => {
    if (!infoOpen) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') setInfoOpen(false); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [infoOpen]);

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    setShowJump(el.scrollHeight - el.scrollTop - el.clientHeight > 260);
  };

  const jumpToBottom = () => scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });

  const openInfo = (tab = 'balances') => {
    setTabSwitched(false);
    setActiveTab(tab);
    setInfoOpen(true);
  };

  const openExpenseForm = (prefill = {}) => {
    setExpForm({ description: '', amount: '', paidby: '', splitamong: [], splitType: 'equal', customSplits: {}, ...prefill });
    setExpenseModal(true);
  };

  const submitDraft = (e) => {
    e.preventDefault();
    const text = draft.trim();
    if (!text) { openExpenseForm(); return; }
    openExpenseForm(parseDraft(text));
    setDraft('');
  };

  if (loading) return (
    <div className="app-page chat-page">
      <Nav showMenu onMenuClick={() => setSidebarOpen(true)} />
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Spinner /></div>
    </div>
  );

  const totalExpense        = summary?.totalExpense        || 0;
  const settlements         = summary?.settlements         || [];
  const pendingSettlements  = summary?.pendingSettlements  || [];
  const myId                = user?._id;

  const myNetBalance = settlements.reduce((net, s) => {
    if (s.fromId === myId) return net - s.amount;
    if (s.toId   === myId) return net + s.amount;
    return net;
  }, 0);

  const settlementRecords = expenses.filter(e => e.isSettlementRecord);
  const regularExpenses   = expenses.filter(e => !e.isSettlementRecord);

  const activeExpenses = regularExpenses.filter(e => !e.settled);
  const myPending      = activeExpenses.filter(e => e.status === 'PENDING');
  const myPaid         = activeExpenses.filter(e => e.status === 'YOU PAID');
  const totalIOwe      = myPending.reduce((s, e) => s + (e.youOwe || 0), 0);
  const totalOwedToMe  = myPaid.reduce((s, e) => s + (e.othersOweYou || 0), 0);

  const sharePreview = expForm.amount && expForm.splitamong.length
    ? (Number(expForm.amount) / expForm.splitamong.length).toFixed(2)
    : null;

  const members = group?.members || [];
  const memberColor = (id) => {
    const i = members.findIndex(m => m._id === id);
    return SENDER_COLORS[(i < 0 ? 0 : i) % SENDER_COLORS.length];
  };
  const memberLine = [
    ...members.filter(m => m._id !== myId).map(m => (m.fullname || m.username || '?').split(' ')[0]),
    ...(members.some(m => m._id === myId) ? ['You'] : []),
  ].join(', ');

  /* ── Build the chat timeline (oldest → newest) ── */
  const items = [];
  expenses.forEach((e, i) => items.push({
    kind: e.isSettlementRecord ? 'settled' : 'expense',
    e, i, key: e._id || `e${i}`, t: new Date(e.createdAt).getTime() || 0, sender: e.payerId,
  }));
  pendingSettlements.forEach((ps, i) => items.push({
    kind: 'request', ps, i: 1e6 + i, key: `ps-${ps._id}`, t: new Date(ps.initiatedAt).getTime() || 0, sender: ps.fromId,
  }));
  // undated items (t = 0) sort by original order; undated payment requests go last
  const sortKey = (it) => it.t || (it.kind === 'request' ? Number.MAX_SAFE_INTEGER : 0);
  items.sort((a, b) => sortKey(a) - sortKey(b) || a.i - b.i);

  const rows = [];
  let prev = null;
  let prevDay = null;
  items.forEach((it) => {
    const day = it.t ? new Date(it.t).toDateString() : null;
    if (day && day !== prevDay) {
      rows.push(<div className="chat-day" key={`day-${day}`}><span>{dayLabel(it.t)}</span></div>);
      prev = null;
      prevDay = day;
    }
    const talks = it.kind === 'expense' || it.kind === 'request';
    const prevTalks = prev && (prev.kind === 'expense' || prev.kind === 'request');
    const first = !(talks && prevTalks && prev.sender === it.sender);
    const mine = it.sender === myId;

    if (it.kind === 'expense') {
      const canDelete = mine && !it.e.settled;
      rows.push(
        <ExpenseBubble
          key={it.key} e={it.e} mine={mine} first={first} color={memberColor(it.sender)} fresh={freshIds.has(it.e._id)}
          canDelete={canDelete} menuOpen={menuId === it.e._id}
          onMenu={() => setMenuId(id => (id === it.e._id ? null : it.e._id))}
          onDelete={() => { setMenuId(null); handleDeleteExpense(it.e._id); }}
        />
      );
    } else if (it.kind === 'request') {
      rows.push(
        <RequestBubble
          key={it.key} ps={it.ps} myId={myId} mine={mine} first={first} t={it.t} color={memberColor(it.sender)} fresh={freshIds.has(it.ps._id)}
          onConfirm={() => handleOpenConfirm(it.ps)} onCancel={() => handleCancelPending(it.ps)}
        />
      );
    } else {
      rows.push(<SettledNote key={it.key} e={it.e} myId={myId} t={it.t} fresh={freshIds.has(it.e._id)} />);
    }
    prev = it;
  });

  const netTone = myNetBalance > 0.01 ? 'owed' : myNetBalance < -0.01 ? 'owe' : 'even';
  const netTitle = netTone === 'owed' ? `You're owed ${moneyRound(myNetBalance)}`
    : netTone === 'owe' ? `You owe ${moneyRound(-myNetBalance)}`
    : 'All settled up';
  const netSub = settlements.length
    ? `${settlements.length} payment${settlements.length !== 1 ? 's' : ''} left to settle`
    : 'Nobody owes anything';

  return (
    <div className="app-page chat-page">
      <Nav showMenu onMenuClick={() => setSidebarOpen(true)} />

      <div className="app-layout">
        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        <div className="main-content chat-main">
          <section className="chat-col" aria-label={`${group?.name} expenses`}>
            {/* Header */}
            <header className="chat-head">
              <button className="chat-back" onClick={() => navigate('/groups')} aria-label="Back to groups">
                <ArrowLeftIcon style={{ width: 20, height: 20 }} />
              </button>
              <button className="chat-id" onClick={() => openInfo('balances')} aria-label="Open group info">
                <span className="chat-av" style={{ background: groupColor(group?.name) }}>{initial(group?.name)}</span>
                <span className="chat-id-text">
                  <span className="chat-title">{group?.name}</span>
                  <span className="chat-sub">{memberLine}</span>
                </span>
              </button>
              <div className="chat-head-actions">
                <button className="icon-btn" onClick={() => setShareModal(true)} title="Invite with group code" aria-label="Invite with group code">
                  <ShareIcon style={{ width: 20, height: 20 }} />
                </button>
              </div>
            </header>

            {/* Pinned balance */}
            <button className={`chat-pin ${netTone}`} onClick={() => openInfo('balances')}>
              <span className="pin-bar" />
              <span className="pin-text">
                <span className="pin-title" key={netTitle}>{netTitle}</span>
                <span className="pin-sub">Group total {moneyRound(totalExpense)} · {netSub}</span>
              </span>
              <span className="pin-go">Balances <ChevronRightIcon style={{ width: 14, height: 14 }} /></span>
            </button>

            {/* Messages */}
            <div className="chat-body">
              <div className="chat-scroll" ref={scrollRef} onScroll={handleScroll} role="log" aria-label="Group expenses">
                {rows.length === 0 ? (
                  <div className="chat-note">No expenses yet. Type one below, like “Dinner 450”.</div>
                ) : rows}
              </div>
              {showJump && (
                <button className="chat-jump" onClick={jumpToBottom} aria-label="Jump to latest">
                  <ArrowDownIcon style={{ width: 18, height: 18 }} />
                </button>
              )}
            </div>

            {/* Composer */}
            <form className="composer" onSubmit={submitDraft}>
              <input
                className="composer-input"
                value={draft}
                onChange={e => setDraft(e.target.value)}
                placeholder="Add an expense, e.g. Dinner 450"
                aria-label="Add an expense"
                enterKeyHint="send"
              />
              <button
                type="submit"
                className={`composer-send ${draft.trim() ? 'ready' : ''}`}
                aria-label={draft.trim() ? 'Continue to split details' : 'Open the expense form'}
              >
                {draft.trim()
                  ? <PaperAirplaneIcon style={{ width: 20, height: 20 }} />
                  : <PlusIcon style={{ width: 22, height: 22 }} />}
              </button>
            </form>
          </section>

          {/* Group info panel */}
          {infoOpen && (
            <>
              <div className="info-backdrop" onClick={() => setInfoOpen(false)} />
              <aside className="chat-info" aria-label="Group info">
                <div className="info-head">
                  <button className="icon-btn" onClick={() => setInfoOpen(false)} aria-label="Close group info">
                    <XMarkIcon style={{ width: 20, height: 20 }} />
                  </button>
                  <span>Group info</span>
                </div>

                <div className="info-scroll">
                  <div className="info-id">
                    <span className="info-av" style={{ background: groupColor(group?.name) }}>{initial(group?.name)}</span>
                    <div className="info-name">{group?.name}</div>
                    <div className="info-count">{members.length === 1 ? '1 member' : `${members.length} members`}</div>
                  </div>

                  <div className="info-stats">
                    <div><b>{moneyRound(totalExpense)}</b><span>Group total</span></div>
                    <div><b className="c-owe">{moneyRound(totalIOwe)}</b><span>You owe</span></div>
                    <div><b className="c-owed">{moneyRound(totalOwedToMe)}</b><span>Owed to you</span></div>
                  </div>

                  <TabBar
                    value={activeTab}
                    onChange={(id) => { setTabSwitched(true); setActiveTab(id); }}
                    tabs={[
                      ['balances', `Balances${settlements.length ? ` (${settlements.length})` : ''}`],
                      ['settled',  `Settled${settlementRecords.length ? ` (${settlementRecords.length})` : ''}`],
                      ['members',  `Members`],
                    ]}
                  />

                  <TabContent id={activeTab} animate={tabSwitched}>
                    {activeTab === 'balances' && (
                      <div className="info-list">
                        {settlements.length === 0 && pendingSettlements.length === 0 ? (
                          <div className="info-empty">
                            <CheckCircleIcon style={{ width: 28, height: 28, color: 'var(--success)' }} />
                            All settled up. No one owes anything.
                          </div>
                        ) : (
                          <>
                            {pendingSettlements.length > 0 && (
                              <>
                                <div className="info-label">Awaiting confirmation</div>
                                {pendingSettlements.map(ps => (
                                  <PendingCard key={ps._id} ps={ps} myId={myId} onConfirm={() => handleOpenConfirm(ps)} onCancel={() => handleCancelPending(ps)} />
                                ))}
                              </>
                            )}
                            {settlements.length > 0 && (
                              <>
                                <div className="info-label">
                                  {settlements.length} net payment{settlements.length !== 1 ? 's' : ''} needed after cancelling all debts
                                </div>
                                {settlements.map((s, i) => {
                                  const isPending = pendingSettlements.some(ps => ps.fromId === s.fromId && ps.toId === s.toId);
                                  return (
                                    <PayCard key={i} s={s} myId={myId} isPending={isPending} isLoading={settlingId === s.fromId + s.toId} onSettle={() => handleInitiateSettle(s)} />
                                  );
                                })}
                              </>
                            )}
                          </>
                        )}
                      </div>
                    )}

                    {activeTab === 'settled' && (
                      <div className="info-list">
                        {settlementRecords.length === 0 ? (
                          <div className="info-empty">No settlements recorded yet.</div>
                        ) : [...settlementRecords].reverse().map((e, i) => (
                          <div className="rec-row" key={e._id || i}>
                            <span className="rec-ic"><CheckIcon style={{ width: 14, height: 14 }} /></span>
                            <div className="rec-text">
                              <div className="rec-who">{e.payerId === myId ? 'You' : e.paidBy}<ArrowRightIcon style={{ width: 12, height: 12 }} />{e.splitWith?.[0]}</div>
                              <div className="rec-when">{e.createdAt ? `${dayLabel(e.createdAt)}, ${timeLabel(e.createdAt)}` : 'Settled'}</div>
                            </div>
                            <b className="rec-amt">{money(e.amount)}</b>
                          </div>
                        ))}
                      </div>
                    )}

                    {activeTab === 'members' && (
                      <div className="info-list">
                        <button className="info-invite" onClick={() => setShareModal(true)}>
                          <span className="info-invite-ic"><UserPlusIcon style={{ width: 18, height: 18 }} /></span>
                          <span>
                            <b>Invite with group code</b>
                            <small>{group?.groupcode}</small>
                          </span>
                        </button>
                        {members.map((m, i) => (
                          <div className="member-row" key={m._id}>
                            <span className="msg-av lg" style={{ background: SENDER_COLORS[i % SENDER_COLORS.length] }}>
                              {initial(m.fullname || m.username)}
                            </span>
                            <div className="member-text">
                              <div className="member-nm">{m.fullname || m.username}{m._id === myId && <em>You</em>}</div>
                              {m.username && <div className="member-un">@{m.username}</div>}
                            </div>
                          </div>
                        ))}
                        <button className="info-leave" onClick={handleLeave}>Leave group</button>
                      </div>
                    )}
                  </TabContent>
                </div>
              </aside>
            </>
          )}
        </div>
      </div>

      {/* ── Modals (unchanged) ── */}
      {/* Add Expense Modal */}
      <Modal open={expenseModal} onClose={() => setExpenseModal(false)} title="New Expense" maxWidth={480}>
        <p style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 13, color: 'var(--on-surface-variant)', marginBottom: 20, fontWeight: 500 }}>
          Add a shared expense to this group.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label className="form-label">Description</label>
            <input className="input-field" placeholder="Dinner, Rent, Groceries..." value={expForm.description}
              onChange={e => setExpForm(f => ({ ...f, description: e.target.value }))} />
          </div>
          <div>
            <label className="form-label">Amount (₹)</label>
            <input className="input-field" type="number" placeholder="500" value={expForm.amount}
              onChange={e => setExpForm(f => ({ ...f, amount: e.target.value }))} />
          </div>
          <div>
            <label className="form-label">Paid By</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 4 }}>
              {group?.members?.map(m => (
                <button key={m._id} type="button" onClick={() => setExpForm(f => ({ ...f, paidby: m._id }))}
                  style={{ padding: '8px 14px', borderRadius: 12, border: '1.5px solid', borderColor: expForm.paidby === m._id ? 'var(--primary)' : 'var(--outline-variant)', background: expForm.paidby === m._id ? 'var(--primary-fixed)' : 'var(--surface-container-low)', color: expForm.paidby === m._id ? 'var(--primary)' : 'var(--on-surface-variant)', fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: 13, cursor: 'pointer', transition: 'all 0.15s' }}>
                  {m.fullname || m.username}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="form-label">
              Split With <span style={{ fontSize: 10, letterSpacing: 0, fontWeight: 500, textTransform: 'none' }}>(select everyone sharing this cost)</span>
            </label>
            <div style={{ display: 'flex', gap: 8, marginBottom: 10, marginTop: 4 }}>
              {['equal', 'custom'].map(mode => (
                <button key={mode} type="button" onClick={() => setExpForm(f => ({ ...f, splitType: mode, customSplits: {} }))}
                  style={{ padding: '5px 14px', borderRadius: 20, border: '1.5px solid', borderColor: expForm.splitType === mode ? 'var(--primary)' : 'var(--outline-variant)', background: expForm.splitType === mode ? 'var(--primary-fixed)' : 'transparent', color: expForm.splitType === mode ? 'var(--primary)' : 'var(--on-surface-variant)', fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: 12, cursor: 'pointer', textTransform: 'capitalize', transition: 'all 0.15s' }}>
                  {mode === 'equal' ? 'Equal' : 'Custom'}
                </button>
              ))}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {group?.members?.map(m => (
                <button key={m._id} type="button" onClick={() => toggleSplit(m._id)}
                  style={{ padding: '8px 14px', borderRadius: 12, border: '1.5px solid', borderColor: expForm.splitamong.includes(m._id) ? 'var(--secondary-container)' : 'var(--outline-variant)', background: expForm.splitamong.includes(m._id) ? 'var(--secondary-fixed)' : 'var(--surface-container-low)', color: expForm.splitamong.includes(m._id) ? 'var(--secondary)' : 'var(--on-surface-variant)', fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: 13, cursor: 'pointer', transition: 'all 0.15s' }}>
                  {m.fullname || m.username}
                  {m._id === expForm.paidby && <span style={{ fontSize: 9, marginLeft: 4, opacity: 0.6 }}> (payer)</span>}
                </button>
              ))}
            </div>
          </div>

          {/* Custom split inputs */}
          {expForm.splitType === 'custom' && expForm.splitamong.length > 0 && (() => {
            const customTotal = expForm.splitamong.reduce((s, id) => s + Number(expForm.customSplits[id] || 0), 0);
            const remaining = Number(expForm.amount || 0) - customTotal;
            const isBalanced = Math.abs(remaining) < 0.01;
            return (
              <div style={{ background: 'var(--surface-container-low)', border: `1.5px solid ${isBalanced ? 'var(--secondary-container)' : 'var(--outline-variant)'}`, borderRadius: 14, padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 11, fontWeight: 700, color: 'var(--on-surface-variant)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                  Assign amounts
                </div>
                {expForm.splitamong.map(id => {
                  const member = group?.members?.find(m => m._id === id);
                  return (
                    <div key={id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'var(--secondary-fixed)', color: 'var(--secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 800, fontSize: 12, flexShrink: 0 }}>
                        {(member?.fullname || member?.username || '?')[0].toUpperCase()}
                      </div>
                      <span style={{ flex: 1, fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 13, fontWeight: 600, color: 'var(--on-surface)' }}>
                        {member?.fullname || member?.username}
                        {id === expForm.paidby && <span style={{ fontSize: 10, opacity: 0.55, marginLeft: 4 }}>(payer)</span>}
                      </span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'var(--surface)', border: '1.5px solid var(--outline-variant)', borderRadius: 10, padding: '4px 10px' }}>
                        <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 13, color: 'var(--on-surface-variant)', fontWeight: 600 }}>₹</span>
                        <input type="number" className="no-spinner" min="0" step="0.01" placeholder="0"
                          value={expForm.customSplits[id] || ''}
                          onChange={e => setExpForm(f => ({ ...f, customSplits: { ...f.customSplits, [id]: e.target.value } }))}
                          style={{ width: 70, border: 'none', outline: 'none', background: 'transparent', fontFamily: "'Be Vietnam Pro', sans-serif", fontSize: 14, fontWeight: 700, color: 'var(--on-surface)', textAlign: 'right', MozAppearance: 'textfield', appearance: 'textfield' }} />
                      </div>
                    </div>
                  );
                })}
                <div style={{ borderTop: '1px solid var(--outline-variant)', paddingTop: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 11, fontWeight: 600, color: 'var(--on-surface-variant)' }}>
                    {isBalanced
                      ? <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><CheckCircleIcon style={{ width: 14, height: 14, color: 'var(--secondary)' }} /> Balanced!</span>
                      : remaining > 0
                        ? `₹${remaining.toFixed(2)} left to assign`
                        : `₹${Math.abs(remaining).toFixed(2)} over budget`}
                  </span>
                  <span style={{ fontFamily: "'Be Vietnam Pro', sans-serif", fontSize: 15, fontWeight: 800, color: isBalanced ? 'var(--secondary)' : 'var(--error)' }}>
                    ₹{customTotal.toFixed(2)} / ₹{Number(expForm.amount || 0).toFixed(2)}
                  </span>
                </div>
              </div>
            );
          })()}

          {/* Equal split preview */}
          {expForm.splitType === 'equal' && sharePreview && (
            <div style={{ background: 'var(--surface-container-low)', border: '1px solid var(--outline-variant)', borderRadius: 14, padding: '14px 16px', display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'center' }}>
              <div>
                <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 11, color: 'var(--on-surface-variant)', fontWeight: 600 }}>Each person's share: </span>
                <span style={{ fontFamily: "'Be Vietnam Pro', sans-serif", fontSize: 20, fontWeight: 800, color: 'var(--on-surface)', letterSpacing: '-0.02em' }}>₹{sharePreview}</span>
              </div>
              <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 11, color: 'var(--on-surface-variant)', fontWeight: 600 }}>
                {expForm.splitamong.length} {expForm.splitamong.length === 1 ? 'person' : 'people'}
              </span>
            </div>
          )}

          {(() => {
            const isCustomUnbalanced = expForm.splitType === 'custom' && expForm.splitamong.length > 0 && (() => {
              const t = expForm.splitamong.reduce((s, id) => s + Number(expForm.customSplits[id] || 0), 0);
              return Math.abs(t - Number(expForm.amount || 0)) > 0.01;
            })();
            return (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {isCustomUnbalanced && (
                  <div style={{ background: 'color-mix(in srgb, var(--error) 10%, transparent)', border: '1px solid color-mix(in srgb, var(--error) 30%, transparent)', borderRadius: 10, padding: '8px 12px', fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 12, fontWeight: 600, color: 'var(--error)', textAlign: 'center' }}>
                    ⚠️ Assign the full ₹{Number(expForm.amount || 0).toFixed(2)} before adding
                  </div>
                )}
                <div className="modal-actions">
                  <button className="btn btn-ghost" onClick={() => setExpenseModal(false)}>Cancel</button>
                  <button className="btn btn-primary" style={{ borderRadius: 14, opacity: isCustomUnbalanced ? 0.45 : 1, cursor: isCustomUnbalanced ? 'not-allowed' : 'pointer' }} onClick={handleAddExpense} disabled={submitting || isCustomUnbalanced}>
                    {submitting ? <Spinner /> : 'Add Expense +'}
                  </button>
                </div>
              </div>
            );
          })()}
        </div>
      </Modal>

      {/* Share Code Modal */}
      <Modal open={shareModal} onClose={() => setShareModal(false)} title="Share Group">
        <p style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 13, color: 'var(--on-surface-variant)', marginBottom: 20, fontWeight: 500 }}>
          Share this code to invite members:
        </p>
        <div style={{ background: 'var(--primary)', borderRadius: 20, padding: '28px 24px', textAlign: 'center', marginBottom: 16 }}>
          <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.65)', marginBottom: 8 }}>
            Invite Code
          </div>
          <div style={{ fontFamily: "'Be Vietnam Pro', sans-serif", fontSize: 40, fontWeight: 900, letterSpacing: 8, color: 'var(--on-primary)' }}>
            {group?.groupcode}
          </div>
        </div>
        <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', borderRadius: 14, padding: 14, fontSize: 14, display: 'flex', alignItems: 'center', gap: 8 }}
          onClick={() => { navigator.clipboard.writeText(group?.groupcode || '').catch(() => {}); showToast('Copied: ' + group?.groupcode); setShareModal(false); }}>
          <ClipboardDocumentIcon style={{ width: 18, height: 18 }} />
          Copy Code
        </button>
      </Modal>

      {/* Confirm Settlement Modal */}
      <Modal open={!!confirmTarget} onClose={() => !confirming && setConfirmTarget(null)} title="Confirm Settlement">
        {confirmTarget && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div style={{ background: 'var(--surface-container-low)', borderRadius: 16, padding: '20px 24px', textAlign: 'center', border: '1.5px solid var(--outline-variant)' }}>
              <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 12, fontWeight: 700, color: 'var(--on-surface-variant)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>
                Payment to you
              </div>
              <div style={{ fontFamily: "'Be Vietnam Pro', sans-serif", fontSize: 36, fontWeight: 900, color: '#15803d', letterSpacing: '-0.03em', marginBottom: 4 }}>
                ₹{Number(confirmTarget.amount).toLocaleString('en-IN')}
              </div>
              <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 14, fontWeight: 600, color: 'var(--on-surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <span style={{ fontWeight: 700 }}>{confirmTarget.from}</span>
                <ArrowRightIcon style={{ width: 14, height: 14, color: 'var(--outline)' }} />
                <span style={{ fontWeight: 700, color: '#15803d' }}>you</span>
              </div>
            </div>
            <p style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 13, color: 'var(--on-surface-variant)', fontWeight: 500, lineHeight: 1.5, margin: 0 }}>
              <strong>{confirmTarget.from}</strong> has marked this payment as sent. Please confirm only if you have actually received ₹{Number(confirmTarget.amount).toLocaleString('en-IN')}.
            </p>
            <div className="modal-actions">
              <button className="btn btn-ghost" onClick={() => setConfirmTarget(null)} disabled={confirming}>Not yet</button>
              <button className="btn btn-primary" style={{ borderRadius: 14, background: '#15803d', borderColor: '#15803d' }} onClick={handleConfirmSettle} disabled={confirming}>
                {confirming ? <Spinner /> : <><CheckIcon style={{ width: 15, height: 15 }} /> Yes, I received it</>}
              </button>
            </div>
          </div>
        )}
      </Modal>

    </div>
  );
}

/* ── Chat pieces ────────────────────────────────────────────────────────────── */

function Ticks({ done }) {
  const p = 'M1 5.9 4.2 9 10 1.6';
  return (
    <svg className={`ticks ${done ? 'done' : ''}`} width="17" height="11" viewBox="0 0 17 11" fill="none" role="img" aria-label={done ? 'Settled' : 'Not settled yet'}>
      <path d={p} />
      {done && <path d={p} transform="translate(5 0)" />}
    </svg>
  );
}

function ExpenseBubble({ e, mine, first, color, fresh, canDelete, menuOpen, onMenu, onDelete }) {
  const settled = !!e.settled || e.status === 'SETTLED';
  const names = (e.splitWith || []).join(', ');

  return (
    <div className={`msg-row ${mine ? 'mine' : ''} ${first ? 'first' : ''} ${fresh ? 'fresh' : ''}`}>
      {!mine && (first
        ? <span className="msg-av" style={{ background: color }}>{initial(e.paidBy)}</span>
        : <span className="msg-av ghost" />)}

      <div className={`bubble ${first ? (mine ? 'tail-out' : 'tail-in') : ''}`}>
        {!mine && first && <div className="b-name" style={{ color }}>{e.paidBy}</div>}

        {canDelete && (
          <>
            <button className="b-menu-btn" onClick={(ev) => { ev.stopPropagation(); onMenu(); }} aria-label="Expense options" aria-expanded={menuOpen}>
              <ChevronDownIcon style={{ width: 16, height: 16 }} />
            </button>
            {menuOpen && (
              <div className="b-menu" onClick={(ev) => ev.stopPropagation()}>
                <button className="b-menu-item" onClick={onDelete}>
                  <TrashIcon style={{ width: 16, height: 16 }} /> Delete expense
                </button>
              </div>
            )}
          </>
        )}

        <div className="b-title">{e.title}</div>
        <div className="b-amt">{money(e.amount)}</div>
        <div className="b-meta">{e.splitType === 'custom' ? 'Custom split' : 'Split equally'} between {names}</div>

        {settled ? (
          <span className="b-chip even"><CheckIcon style={{ width: 12, height: 12 }} /> Settled</span>
        ) : mine && e.othersOweYou > 0 ? (
          <span className="b-chip owed">Others owe you {money(e.othersOweYou)}</span>
        ) : !mine && e.youOwe > 0 ? (
          <span className="b-chip owe">Your share {money(e.youOwe)}</span>
        ) : null}

        <div className="b-foot">
          {timeLabel(e.createdAt)}
          {mine && <Ticks done={settled} />}
        </div>
      </div>
    </div>
  );
}

function RequestBubble({ ps, myId, mine, first, t, color, fresh, onConfirm, onCancel }) {
  const iAmDebtor   = ps.fromId === myId;
  const iAmCreditor = ps.toId   === myId;
  const route = iAmDebtor ? `You → ${ps.to}` : iAmCreditor ? `${ps.from} → You` : `${ps.from} → ${ps.to}`;

  return (
    <div className={`msg-row ${mine ? 'mine' : ''} ${first ? 'first' : ''} ${fresh ? 'fresh' : ''}`}>
      {!mine && (first
        ? <span className="msg-av" style={{ background: color }}>{initial(ps.from)}</span>
        : <span className="msg-av ghost" />)}

      <div className={`bubble request ${first ? (mine ? 'tail-out' : 'tail-in') : ''}`}>
        {!mine && first && <div className="b-name" style={{ color }}>{ps.from}</div>}
        <div className="b-kicker"><BanknotesIcon style={{ width: 15, height: 15 }} /> Payment request</div>
        <div className="b-amt">{money(ps.amount)}</div>
        <div className="b-meta">{route}</div>
        <div className="b-meta">
          {iAmCreditor ? 'Marked as paid. Confirm only if you received it.' : `Waiting for ${ps.to} to confirm receipt`}
        </div>
        <div className="b-actions">
          {iAmCreditor && (
            <button className="b-btn go" onClick={onConfirm}><CheckIcon style={{ width: 14, height: 14 }} /> Confirm</button>
          )}
          <button className="b-btn" onClick={onCancel}>Cancel</button>
        </div>
        <div className="b-foot">
          {timeLabel(t)}
          <ClockIcon style={{ width: 12, height: 12 }} aria-label="Pending" />
        </div>
      </div>
    </div>
  );
}

function SettledNote({ e, myId, t, fresh }) {
  const to = e.splitWith?.[0] || 'someone';
  const text = e.payerId === myId
    ? `You paid ${to} ${money(e.amount)}`
    : to === 'You'
      ? `${e.paidBy} paid you ${money(e.amount)}`
      : `${e.paidBy} paid ${to} ${money(e.amount)}`;
  return (
    <div className={`chat-note settled ${fresh ? 'fresh' : ''}`}>
      <CheckCircleIcon style={{ width: 15, height: 15 }} />
      <span>{text}</span>
      {t ? <i>{timeLabel(t)}</i> : null}
    </div>
  );
}

/* ── Group info pieces ──────────────────────────────────────────────────────── */

function PayCard({ s, myId, isLoading, isPending, onSettle }) {
  const iAmPayer = s.fromId === myId;
  const iAmPayee = s.toId   === myId;
  const tone = iAmPayer ? 'out' : iAmPayee ? 'in' : '';
  return (
    <div className={`pay-card ${tone}`} style={{ opacity: isPending ? 0.55 : 1 }}>
      <div className="pay-main">
        <div className="pay-who">
          <span>{s.from}{iAmPayer ? ' (you)' : ''}</span>
          <span className="to"><ArrowRightIcon style={{ width: 13, height: 13, flexShrink: 0 }} />{s.to}{iAmPayee ? ' (you)' : ''}</span>
        </div>
        <div className="pay-note">
          {isPending ? 'Waiting for recipient to confirm'
            : iAmPayer ? 'You need to pay this. Tap Settle to send a request.'
            : iAmPayee ? 'You will receive this'
            : 'Transfer required'}
        </div>
      </div>
      <div className="pay-side">
        <b className="pay-amt">{moneyRound(s.amount)}</b>
        {iAmPayer && !isPending && (
          <button className="pay-btn" onClick={onSettle} disabled={isLoading}>
            {isLoading ? <Spinner /> : <><CheckIcon style={{ width: 13, height: 13 }} /> Settle</>}
          </button>
        )}
      </div>
    </div>
  );
}

function PendingCard({ ps, myId, onConfirm, onCancel }) {
  const iAmDebtor   = ps.fromId === myId;
  const iAmCreditor = ps.toId   === myId;
  return (
    <div className={`pay-card ${iAmCreditor ? 'in' : 'out'}`}>
      <div className="pay-main">
        <div className="pay-who">
          <span>{ps.from}{iAmDebtor ? ' (you)' : ''}</span>
          <span className="to"><ArrowRightIcon style={{ width: 13, height: 13, flexShrink: 0 }} />{ps.to}{iAmCreditor ? ' (you)' : ''}</span>
        </div>
        <div className="pay-note">{iAmCreditor ? 'Confirm you received this payment' : 'Waiting for recipient to confirm receipt'}</div>
      </div>
      <div className="pay-side">
        <b className="pay-amt">{moneyRound(ps.amount)}</b>
        <div className="pay-btns">
          {iAmCreditor && (
            <button className="pay-btn go" onClick={onConfirm}><CheckIcon style={{ width: 13, height: 13 }} /> Confirm</button>
          )}
          <button className="pay-btn plain" onClick={onCancel}>Cancel</button>
        </div>
      </div>
    </div>
  );
}