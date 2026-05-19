import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Nav from '../components/layout/Nav';
import Sidebar from '../components/layout/Sidebar';
import { Modal, EmptyState, Spinner } from '../components/ui';
import BottomNav from '../components/layout/BottomNav';
import {
  getGroupDetails, getGroupExpenses, getGroupSummary,
  createExpense, deleteExpense, settleExpense, leaveGroup
} from '../api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import {
  ShareIcon,
  PlusIcon,
  TrashIcon,
  CheckIcon,
  ArrowRightIcon,
  ClipboardDocumentIcon,
  ArrowLeftIcon
} from '@heroicons/react/24/outline';

export default function GroupDetail() {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const showToast = useToast();

  const [group,    setGroup]    = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [summary,  setSummary]  = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [activeTab, setActiveTab] = useState('balances');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [expenseModal, setExpenseModal] = useState(false);
  const [shareModal,   setShareModal]   = useState(false);
  const [expForm, setExpForm] = useState({ description: '', amount: '', paidby: '', splitamong: [] });
  const [submitting, setSubmitting] = useState(false);
  const [settlingId, setSettlingId] = useState(null);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [gRes, eRes, sRes] = await Promise.all([
        getGroupDetails(groupId),
        getGroupExpenses(groupId),
        getGroupSummary(groupId),
      ]);
      setGroup(gRes.data.group);
      setExpenses(eRes.data.expenses || []);
      setSummary(sRes.data);
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to load group');
      navigate('/groups');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, [groupId]);

  const handleAddExpense = async () => {
    const { description, amount, paidby, splitamong } = expForm;
    if (!description)               { showToast('Add a description'); return; }
    if (!amount || Number(amount) <= 0) { showToast('Enter a valid amount'); return; }
    if (!paidby)                    { showToast('Select who paid'); return; }
    if (!splitamong.length)         { showToast('Select who to split with'); return; }
    setSubmitting(true);
    try {
      await createExpense(groupId, { description, amount: Number(amount), paidby, splitamong });
      showToast('Expense added!');
      setExpenseModal(false);
      setExpForm({ description: '', amount: '', paidby: '', splitamong: [] });
      fetchAll();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to add expense');
    } finally { setSubmitting(false); }
  };

  const handleSettleDebt = async (settlement) => {
    const toSettle = expenses.filter(e => {
      const isReceiverThePayer = e.payerId === settlement.toId;
      const splitNames = e.splitWith || [];
      const isSenderInvolved = splitNames.includes(settlement.from) || splitNames.includes('You');
      return !e.settled && isReceiverThePayer && isSenderInvolved;
    });
    if (!toSettle.length) { showToast('Nothing to settle.'); return; }
    setSettlingId(settlement.fromId + settlement.toId);
    try {
      await Promise.all(toSettle.map(e => settleExpense(e._id, settlement.fromId)));
      showToast(`${settlement.from} → ${settlement.to} settled ✓`);
      fetchAll();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to settle');
    } finally { setSettlingId(null); }
  };

  const handleDeleteExpense = async (expenseId) => {
    if (!window.confirm('Delete this expense?')) return;
    try {
      await deleteExpense(expenseId);
      showToast('Expense deleted');
      fetchAll();
    } catch (err) {
      showToast(err.response?.data?.message || 'Cannot delete — only the payer can');
    }
  };

  const handleLeave = async () => {
    if (!window.confirm('Leave this group?')) return;
    try {
      await leaveGroup(groupId);
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

  if (loading) return (
    <div className="page-enter" style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Nav showMenu onMenuClick={() => setSidebarOpen(true)} actions={<button className="btn btn-ghost btn-sm" onClick={() => navigate('/groups')}>← Groups</button>} />
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Spinner /></div>
    </div>
  );

  const totalExpense = summary?.totalExpense || 0;
  const settlements  = summary?.settlements  || [];
  const myId         = user?._id;

  const myNetBalance = settlements.reduce((net, s) => {
    if (s.fromId === myId) return net - s.amount;
    if (s.toId   === myId) return net + s.amount;
    return net;
  }, 0);

  const activeExpenses  = expenses.filter(e => !e.settled);
  const settledExpenses = expenses.filter(e =>  e.settled);
  const myPending       = activeExpenses.filter(e => e.status === 'PENDING');
  const myPaid          = activeExpenses.filter(e => e.status === 'YOU PAID');
  const totalIOwe       = myPending.reduce((s, e) => s + (e.youOwe || 0), 0);

  const sharePreview = expForm.amount && expForm.splitamong.length
    ? (Number(expForm.amount) / expForm.splitamong.length).toFixed(2)
    : null;

  return (
    <div className="page-enter" style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Nav
        showMenu
        onMenuClick={() => setSidebarOpen(true)}
        actions={
          <>
            <button
            className="btn btn-ghost btn-sm"
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
            onClick={() => navigate('/')}
          >
            <ArrowLeftIcon style={{ width: 15, height: 15 }} />
            Groups
          </button>
            <button
              className="btn btn-primary btn-sm"
              style={{ display: 'flex', alignItems: 'center', gap: 6 }}
              onClick={() => {
                setExpForm({ description: '', amount: '', paidby: '', splitamong: [] });
                setExpenseModal(true);
              }}
            >
              <PlusIcon style={{ width: 15, height: 15 }} />
              Add
            </button>
            <button
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'var(--surface-container-high)',
                border: 'none',
                borderRadius: 10,
                padding: '8px 10px',
                cursor: 'pointer',
                color: 'var(--on-surface-variant)',
              }}
              onClick={() => setShareModal(true)}
              title="Share Group Code"
            >
              <ShareIcon style={{ width: 18, height: 18 }} />
            </button>
          </>
        }
      />

      <div className="app-layout">
        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div className="main-content">

          {/* Group Header Card — fixed alignment */}
          <div
            style={{
              background: 'var(--primary)',
              borderRadius: 24,
              padding: '28px 32px',
              marginBottom: 24,
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {/* Decorative blobs */}
            <div style={{ position: 'absolute', right: -40, top: -40, width: 140, height: 140, background: 'rgba(255,255,255,0.08)', borderRadius: '50%', filter: 'blur(30px)', pointerEvents: 'none' }} />
            <div style={{ position: 'absolute', right: 40, bottom: -60, width: 160, height: 160, background: 'rgba(253,108,0,0.15)', borderRadius: '50%', filter: 'blur(40px)', pointerEvents: 'none' }} />

            {/* Fixed: use align-items: center for vertical alignment, flex-wrap for responsive */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 20,
              position: 'relative',
              zIndex: 1,
            }}>
              {/* Left: group name + members */}
              <div>
                <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.6)', marginBottom: 8 }}>
                  Group
                </div>
                <div style={{ fontFamily: "'Be Vietnam Pro', sans-serif", fontSize: 28, fontWeight: 900, color: 'var(--on-primary)', letterSpacing: '-0.02em', lineHeight: 1.1 }}>
                  {group?.name}
                </div>
                <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 13, color: 'rgba(255,255,255,0.65)', marginTop: 6, fontWeight: 500 }}>
                  {group?.members?.length === 1 ? '1 member' : `${group?.members?.length} members`}
                </div>
              </div>

              {/* Right: Total Expenses + Net Balance — fixed vertical alignment */}
              <div style={{ display: 'flex', gap: 32, alignItems: 'center', flexWrap: 'wrap' }}>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.6)', marginBottom: 4 }}>
                    Total Expenses
                  </div>
                  <div style={{ fontFamily: "'Be Vietnam Pro', sans-serif", fontSize: 32, fontWeight: 900, color: 'var(--on-primary)', letterSpacing: '-0.03em' }}>
                    ₹{totalExpense.toLocaleString('en-IN')}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.6)', marginBottom: 4 }}>
                    Your Net Balance
                  </div>
                  <div style={{ fontFamily: "'Be Vietnam Pro', sans-serif", fontSize: 32, fontWeight: 900, letterSpacing: '-0.03em', color: myNetBalance > 0.01 ? '#86efac' : myNetBalance < -0.01 ? '#fda4af' : 'rgba(255,255,255,0.9)' }}>
                    {myNetBalance > 0.01 ? '+' : myNetBalance < -0.01 ? '−' : ''}
                    ₹{Math.abs(Math.round(myNetBalance)).toLocaleString('en-IN')}
                  </div>
                  <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 2, fontWeight: 600 }}>
                    {myNetBalance > 0.01 ? 'owed to you' : myNetBalance < -0.01 ? 'you owe' : 'all settled ✓'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Balance summary chips */}
          {(totalIOwe > 0 || myPaid.length > 0) && (
            <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
              <BalancePill
                color="var(--secondary-container)"
                bg="var(--secondary-fixed)"
                label="You Owe"
                value={`₹${Math.round(totalIOwe).toLocaleString('en-IN')}`}
              />
              <BalancePill
                color="#15803d"
                bg="#dcfce7"
                label="Others Owe You"
                value={`₹${Math.round(myPaid.reduce((s, e) => s + (e.othersOweYou || 0), 0)).toLocaleString('en-IN')}`}
              />
              <BalancePill
                color="var(--primary)"
                bg="var(--primary-fixed)"
                label="Group Total"
                value={`₹${Math.round(totalExpense).toLocaleString('en-IN')}`}
              />
            </div>
          )}

          <div style={{ display: 'flex', gap: 16 }}>
            {/* Main content */}
            <div style={{ flex: 1, minWidth: 0 }}>
              {/* Tab Bar */}
              <div className="tab-bar">
                {[
                  ['balances', `Balances${settlements.length ? ` (${settlements.length})` : ''}`],
                  ['unpaid',   `Pending${myPending.length ? ` (${myPending.length})` : ''}`],
                  ['received', `Settled${settledExpenses.length ? ` (${settledExpenses.length})` : ''}`],
                  ['all',      `All (${expenses.length})`],
                ].map(([id, label]) => (
                  <button key={id} className={`tab ${activeTab === id ? 'active' : ''}`} onClick={() => setActiveTab(id)}>
                    {label}
                  </button>
                ))}
              </div>

              {/* Balances Tab */}
              {activeTab === 'balances' && (
                <div>
                  {settlements.length === 0 ? (
                    <EmptyState icon="✓" text="All settled up — no one owes anything!" />
                  ) : (
                    <>
                      <p style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 12, color: 'var(--on-surface-variant)', marginBottom: 16, fontWeight: 600 }}>
                        {settlements.length} net payment{settlements.length !== 1 ? 's' : ''} needed after cancelling all debts
                      </p>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {settlements.map((s, i) => (
                          <SettlementRow
                            key={i}
                            s={s}
                            myId={myId}
                            isLoading={settlingId === s.fromId + s.toId}
                            onSettle={() => handleSettleDebt(s)}
                          />
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Pending Tab */}
              {activeTab === 'unpaid' && (
                <div>
                  {myPending.length === 0 ? (
                    <EmptyState icon="✓" text="Nothing pending for you!" />
                  ) : (
                    <>
                      <div
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 8,
                          background: 'var(--secondary-fixed)',
                          borderRadius: 12,
                          padding: '8px 14px',
                          marginBottom: 16,
                          fontFamily: "'Plus Jakarta Sans', sans-serif",
                          fontSize: 12,
                          fontWeight: 700,
                          color: 'var(--secondary)',
                        }}
                      >
                        Total you owe: ₹{Math.round(totalIOwe).toLocaleString('en-IN')}
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        {myPending.map((e, i) => <ExpenseRow key={i} expense={e} myId={myId} onDelete={() => handleDeleteExpense(e._id)} />)}
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Settled Tab */}
              {activeTab === 'received' && (
  <div className="tab-content">
    {settledExpenses.length === 0 ? (
      <EmptyState icon="∅" text="No settled expenses yet." />
    ) : (
      <div className="transactions">
        {[...settledExpenses]
          .reverse()
          .map((e, i) => (
            <ExpenseRow
              key={i}
              expense={e}
              myId={myId}
              isSettled
            />
          ))}
      </div>
    )}
  </div>
)}

              {/* All Expenses Tab */}
              {activeTab === 'all' && (
  <div className="tab-content">
    {expenses.length === 0 ? (
      <EmptyState icon="∅" text="No expenses yet. Add one above." />
    ) : (
      <div className="transactions">
        {[...expenses]
          .reverse()
          .map((e, i) => (
            <ExpenseRow
              key={i}
              expense={e}
              myId={myId}
              onDelete={!e.settled ? () => handleDeleteExpense(e._id) : undefined}
              isSettled={e.settled}
            />
          ))}
      </div>
    )}
  </div>
)}
            </div>

            {/* Members sidebar */}
            <div
              style={{
                width: 220,
                flexShrink: 0,
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
              }}
              className="detail-members-sidebar"
            >
              <div className="chart-card" style={{ padding: 20 }}>
                <div
                  style={{
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    color: 'var(--on-surface-variant)',
                    marginBottom: 12,
                  }}
                >
                  Members ({group?.members?.length})
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {group?.members?.map(m => (
                    <div className="member-item" key={m._id}>
                      <div className="member-avatar" style={{ width: 32, height: 32, fontSize: 12 }}>
                        {(m.fullname || m.username || '?')[0].toUpperCase()}
                      </div>
                      <div>
                        <div className="member-name" style={{ fontSize: 12 }}>{m.fullname || m.username}</div>
                        {m.username && m.fullname && <div className="member-username">@{m.username}</div>}
                      </div>
                    </div>
                  ))}
                </div>
                <button
                  className="btn btn-ghost"
                  style={{ width: '100%', marginTop: 12, justifyContent: 'center', fontSize: 12, color: 'var(--error)' }}
                  onClick={handleLeave}
                >
                  Leave Group
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

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
                <button
                  key={m._id}
                  type="button"
                  onClick={() => setExpForm(f => ({ ...f, paidby: m._id }))}
                  style={{
                    padding: '8px 14px',
                    borderRadius: 12,
                    border: '1.5px solid',
                    borderColor: expForm.paidby === m._id ? 'var(--primary)' : 'var(--outline-variant)',
                    background: expForm.paidby === m._id ? 'var(--primary-fixed)' : 'var(--surface-container-low)',
                    color: expForm.paidby === m._id ? 'var(--primary)' : 'var(--on-surface-variant)',
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                    fontWeight: 700,
                    fontSize: 13,
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                  }}
                >
                  {m.fullname || m.username}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="form-label">
              Split With <span style={{ fontSize: 10, letterSpacing: 0, fontWeight: 500, textTransform: 'none' }}>(select everyone sharing this cost)</span>
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 4 }}>
              {group?.members?.map(m => (
                <button
                  key={m._id}
                  type="button"
                  onClick={() => toggleSplit(m._id)}
                  style={{
                    padding: '8px 14px',
                    borderRadius: 12,
                    border: '1.5px solid',
                    borderColor: expForm.splitamong.includes(m._id) ? 'var(--secondary-container)' : 'var(--outline-variant)',
                    background: expForm.splitamong.includes(m._id) ? 'var(--secondary-fixed)' : 'var(--surface-container-low)',
                    color: expForm.splitamong.includes(m._id) ? 'var(--secondary)' : 'var(--on-surface-variant)',
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                    fontWeight: 700,
                    fontSize: 13,
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                  }}
                >
                  {m.fullname || m.username}
                  {m._id === expForm.paidby && <span style={{ fontSize: 9, marginLeft: 4, opacity: 0.6 }}> (payer)</span>}
                </button>
              ))}
            </div>
          </div>

          {sharePreview && (
            <div
              style={{
                background: 'var(--surface-container-low)',
                border: '1px solid var(--outline-variant)',
                borderRadius: 14,
                padding: '14px 16px',
                display: 'flex',
                flexWrap: 'wrap',
                gap: 16,
                alignItems: 'center',
              }}
            >
              <div>
                <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 11, color: 'var(--on-surface-variant)', fontWeight: 600 }}>Each person's share: </span>
                <span style={{ fontFamily: "'Be Vietnam Pro', sans-serif", fontSize: 20, fontWeight: 800, color: 'var(--on-surface)', letterSpacing: '-0.02em' }}>₹{sharePreview}</span>
              </div>
              <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 11, color: 'var(--on-surface-variant)', fontWeight: 600 }}>
                {expForm.splitamong.length} {expForm.splitamong.length === 1 ? 'person' : 'people'}
              </span>
            </div>
          )}

          <div className="modal-actions">
            <button className="btn btn-ghost" onClick={() => setExpenseModal(false)}>Cancel</button>
            <button className="btn btn-primary" style={{ borderRadius: 14 }} onClick={handleAddExpense} disabled={submitting}>
              {submitting ? <Spinner /> : 'Add Expense +'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Share Code Modal */}
      <Modal open={shareModal} onClose={() => setShareModal(false)} title="Share Group">
        <p style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 13, color: 'var(--on-surface-variant)', marginBottom: 20, fontWeight: 500 }}>
          Share this code to invite members:
        </p>
        <div
          style={{
            background: 'var(--primary)',
            borderRadius: 20,
            padding: '28px 24px',
            textAlign: 'center',
            marginBottom: 16,
          }}
        >
          <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.65)', marginBottom: 8 }}>
            Invite Code
          </div>
          <div style={{ fontFamily: "'Be Vietnam Pro', sans-serif", fontSize: 40, fontWeight: 900, letterSpacing: 8, color: 'var(--on-primary)' }}>
            {group?.groupcode}
          </div>
        </div>
        <button
          className="btn btn-primary"
          style={{ width: '100%', justifyContent: 'center', borderRadius: 14, padding: 14, fontSize: 14, display: 'flex', alignItems: 'center', gap: 8 }}
          onClick={() => {
            navigator.clipboard.writeText(group?.groupcode || '').catch(() => {});
            showToast('Copied: ' + group?.groupcode);
            setShareModal(false);
          }}
        >
          <ClipboardDocumentIcon style={{ width: 18, height: 18 }} />
          Copy Code
        </button>
      </Modal>

      <BottomNav />
    </div>
  );
}

/* ── Sub-Components ────────────────────────────────────────────────────────── */

function BalancePill({ color, bg, label, value }) {
  return (
    <div
      style={{
        flex: 1,
        minWidth: 130,
        background: bg,
        borderRadius: 16,
        padding: '14px 18px',
      }}
    >
      <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color, opacity: 0.75, marginBottom: 4 }}>
        {label}
      </div>
      <div style={{ fontFamily: "'Be Vietnam Pro', sans-serif", fontSize: 22, fontWeight: 800, color, letterSpacing: '-0.02em' }}>
        {value}
      </div>
    </div>
  );
}

function SettlementRow({ s, myId, isLoading, onSettle }) {
  const iAmPayer = s.fromId === myId;
  const iAmPayee = s.toId   === myId;
  return (
    <div
      className="settlement-row"
      style={{
        background: iAmPayer
          ? 'rgba(253,108,0,0.05)'
          : iAmPayee
          ? 'rgba(21,128,61,0.05)'
          : 'var(--surface-container-low)',
        border: '1.5px solid',
        borderColor: iAmPayer
          ? 'rgba(253,108,0,0.2)'
          : iAmPayee
          ? 'rgba(21,128,61,0.2)'
          : 'var(--surface-container-high)',
        borderRadius: 16,
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span
            style={{
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontWeight: 700,
              fontSize: 14,
              color: iAmPayer ? 'var(--secondary-container)' : 'var(--on-surface)',
            }}
          >
            {s.from}{iAmPayer ? ' (you)' : ''}
          </span>
          <ArrowRightIcon style={{ width: 14, height: 14, color: 'var(--outline)', flexShrink: 0 }} />
          <span
            style={{
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontWeight: 700,
              fontSize: 14,
              color: iAmPayee ? '#15803d' : 'var(--on-surface)',
            }}
          >
            {s.to}{iAmPayee ? ' (you)' : ''}
          </span>
        </div>
        <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 11, color: 'var(--on-surface-variant)', fontWeight: 500 }}>
          {iAmPayer ? 'you need to pay this' : iAmPayee ? 'you will receive this' : 'pending settlement'}
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {iAmPayer && (
          <button
            onClick={onSettle}
            disabled={isLoading}
            style={{
              padding: '7px 16px',
              borderRadius: 12,
              border: '1.5px solid var(--primary)',
              background: 'var(--primary-fixed)',
              color: 'var(--primary)',
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontWeight: 700,
              fontSize: 12,
              cursor: 'pointer',
              transition: 'all 0.15s',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            {isLoading ? <Spinner /> : (
              <>
                <CheckIcon style={{ width: 14, height: 14 }} />
                Settle
              </>
            )}
          </button>
        )}
        <div
          style={{
            fontFamily: "'Be Vietnam Pro', sans-serif",
            fontSize: 20,
            fontWeight: 800,
            letterSpacing: '-0.02em',
            color: iAmPayer ? 'var(--secondary-container)' : iAmPayee ? '#15803d' : 'var(--on-surface)',
          }}
        >
          ₹{Math.round(s.amount).toLocaleString('en-IN')}
        </div>
      </div>
    </div>
  );
}

function ExpenseRow({ expense, onDelete, isSettled, myId }) {
  const isPayer = expense.status === 'YOU PAID';
  const canDelete = onDelete && expense.payerId === myId && !isSettled;

  return (
    <div
      className="expense-row"
      style={{
        opacity: isSettled ? 0.6 : 1,
        background: 'transparent',
      }}
    >
      <div
        className="expense-icon"
        style={{
          background: isPayer ? 'var(--primary-fixed)' : isSettled ? 'var(--surface-container-high)' : 'var(--secondary-fixed)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {isPayer ? '💸' : isSettled ? <CheckIcon style={{ width: 16, height: 16, color: 'var(--on-surface-variant)' }} /> : '📋'}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="expense-title">{expense.title}</div>
        <div className="expense-meta">{expense.paidBy} paid · split with: {expense.splitWith?.join(', ')}</div>
        {!isPayer && !isSettled && expense.youOwe > 0 && (
          <div style={{ marginTop: 4, fontSize: 12, fontWeight: 700, color: 'var(--secondary-container)' }}>
            Your share: −₹{expense.youOwe.toFixed(2)}
          </div>
        )}
        {isPayer && !isSettled && expense.othersOweYou > 0 && (
          <div style={{ marginTop: 4, fontSize: 12, fontWeight: 700, color: '#15803d' }}>
            Others owe you: +₹{expense.othersOweYou.toFixed(2)}
          </div>
        )}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
        {canDelete && (
          <button
            onClick={onDelete}
            style={{
              padding: '4px 10px',
              borderRadius: 8,
              border: '1px solid var(--error-container)',
              background: 'var(--error-container)',
              color: 'var(--on-error-container)',
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontWeight: 700,
              fontSize: 10,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            <TrashIcon style={{ width: 12, height: 12 }} />
            Delete
          </button>
        )}
        <div
          className={`expense-amount ${!isPayer && !isSettled ? 'you-owe' : ''}`}
          style={{ color: isPayer && !isSettled ? 'var(--primary)' : undefined }}
        >
          ₹{(expense.amount || 0).toLocaleString('en-IN')}
        </div>
      </div>
    </div>
  );
}