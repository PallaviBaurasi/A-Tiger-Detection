import React, { useState, useEffect, useCallback } from 'react';
import {
  Phone, PhoneCall, PhoneOff, ShieldAlert, CheckCircle, Plus, Trash2,
  RefreshCw, AlertTriangle, Users, Bell, ChevronDown, ChevronUp,
  Eye, Settings2, TestTube2, X, Save, ToggleLeft, ToggleRight,
} from 'lucide-react';
import {
  fetchEmergencyStatus, fetchEmergencyEvents, fetchEmergencyContacts,
  createEmergencyContact, updateEmergencyContact, deleteEmergencyContact,
  acknowledgeEmergencyEvent, triggerTestCall,
} from '../api/client';
import {
  EmergencyCallEvent, EmergencyContact, EmergencySystemStatus,
} from '../types';

// ──────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────
const CALL_STATUS_META: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  PENDING:      { label: 'Pending',      color: 'bg-slate-200 text-slate-800', icon: <RefreshCw className="w-3 h-3 animate-spin" /> },
  CALLING:      { label: 'Calling…',     color: 'bg-blue-100 text-blue-800 animate-pulse', icon: <PhoneCall className="w-3 h-3" /> },
  ANSWERED:     { label: 'Answered',     color: 'bg-green-100 text-green-800', icon: <Phone className="w-3 h-3" /> },
  NO_ANSWER:    { label: 'No Answer',    color: 'bg-amber-100 text-amber-800', icon: <PhoneOff className="w-3 h-3" /> },
  FAILED:       { label: 'Failed',       color: 'bg-red-100 text-red-800', icon: <X className="w-3 h-3" /> },
  ESCALATED:    { label: 'Escalated',    color: 'bg-purple-100 text-purple-800', icon: <ShieldAlert className="w-3 h-3" /> },
  DEMO_SUCCESS: { label: 'Demo Call ✓', color: 'bg-teal-100 text-teal-800', icon: <TestTube2 className="w-3 h-3" /> },
  MOCK_SENT:    { label: 'Mock Sent',    color: 'bg-teal-100 text-teal-800', icon: <TestTube2 className="w-3 h-3" /> },
};

const SEVERITY_BADGE: Record<string, string> = {
  CRITICAL: 'bg-red-600 text-white',
  HIGH:     'bg-amber-500 text-white',
  MEDIUM:   'bg-yellow-400 text-slate-900',
  LOW:      'bg-slate-300 text-slate-800',
};

function CallStatusBadge({ status }: { status: string }) {
  const meta = CALL_STATUS_META[status] ?? { label: status, color: 'bg-slate-100 text-slate-700', icon: null };
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold ${meta.color}`}>
      {meta.icon} {meta.label}
    </span>
  );
}

// ──────────────────────────────────────────────────────────────
// Sub-component: System Status Banner
// ──────────────────────────────────────────────────────────────
function DemoModeBanner({ status }: { status: EmergencySystemStatus | null }) {
  if (!status) return null;
  return (
    <div className={`rounded-xl p-3 flex items-center gap-3 text-sm font-semibold border ${
      status.demo_mode
        ? 'bg-teal-50 border-teal-300 text-teal-800'
        : 'bg-emerald-50 border-emerald-300 text-emerald-900'
    }`}>
      <TestTube2 className="w-5 h-5 shrink-0" />
      <div className="flex-1">
        {status.demo_mode ? (
          <>
            <span className="uppercase tracking-wide font-black">SIMULATION MODE</span>
            {' — '}Demonstration alert triggers active. Voice calls and messages are simulated in the audit log.
          </>
        ) : (
          <>
            <span className="uppercase tracking-wide font-black">⚡ LIVE DISPATCH ACTIVE</span>
            {' — '}Automated voice calls and alerts are dispatched to the on-duty forest officer on priority.
          </>
        )}
      </div>
      <div className="text-right shrink-0 text-xs font-medium space-y-0.5">
        <div>Active officers: <strong>{status.active_contacts_count}</strong></div>
        <div>Pending review: <strong>{status.pending_acknowledgements}</strong></div>
        <div>Today: <strong>{status.total_events_today} alerts</strong></div>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// Sub-component: Emergency Event Row
// ──────────────────────────────────────────────────────────────
function EventRow({ event, onAcknowledge, onRefresh }: {
  event: EmergencyCallEvent;
  onAcknowledge: (id: number) => void;
  onRefresh: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [acking, setAcking] = useState(false);

  const handleAck = async () => {
    setAcking(true);
    await onAcknowledge(event.id);
    setAcking(false);
  };

  return (
    <div className={`bg-white rounded-2xl border shadow-sm overflow-hidden transition-all ${
      event.is_demo ? 'border-teal-200' : 'border-red-200'
    } ${!event.acknowledged && 'ring-1 ring-red-300'}`}>
      {/* Main row */}
      <div className="p-4 flex flex-col sm:flex-row sm:items-center gap-3">
        {/* Left: severity + type */}
        <div className="flex items-center gap-2 shrink-0">
          <span className={`px-2 py-0.5 text-[10px] font-black uppercase rounded ${SEVERITY_BADGE[event.risk_level] ?? 'bg-slate-200'}`}>
            {event.risk_level}
          </span>
          {event.is_demo && (
            <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded bg-teal-100 text-teal-700 border border-teal-300">
              DEMO
            </span>
          )}
        </div>

        {/* Centre: details */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-slate-900 text-sm">{event.alert_type.replace(/_/g, ' ')}</span>
            {event.tiger_code && <span className="text-xs text-slate-500 font-mono">{event.tiger_code}</span>}
            {event.camera_id && <span className="text-xs text-slate-500">📷 {event.camera_id}</span>}
            {event.zone && <span className="text-xs text-slate-500">📍 {event.zone}</span>}
          </div>
          <div className="flex items-center gap-3 mt-1 flex-wrap">
            <span className="text-[11px] text-slate-400">{new Date(event.created_at).toLocaleString()}</span>
            <span className="text-[11px] text-slate-500">
              Officer: <strong>{event.selected_contact_name ?? 'Unassigned'}</strong>
            </span>
            <span className="text-[11px] text-slate-500">
              Attempts: <strong>{event.retry_count}/{event.max_retries}</strong>
            </span>
          </div>
        </div>

        {/* Right: call status + actions */}
        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          <CallStatusBadge status={event.call_status} />

          {event.acknowledged ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-green-100 text-green-800">
              <CheckCircle className="w-3 h-3" /> Acknowledged
            </span>
          ) : (
            <button
              id={`ack-event-${event.id}`}
              onClick={handleAck}
              disabled={acking}
              className="px-3 py-1.5 bg-forest-800 hover:bg-forest-900 text-white text-xs font-bold rounded-lg flex items-center gap-1 transition-colors disabled:opacity-50"
            >
              <CheckCircle className="w-3.5 h-3.5" />
              {acking ? 'Acknowledging…' : 'Acknowledge'}
            </button>
          )}

          <button
            onClick={() => setExpanded(!expanded)}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors"
            title="Show attempts"
          >
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Reason */}
      {event.reason && (
        <div className="px-4 pb-3 text-xs text-slate-600 border-t border-slate-100 pt-2">
          {event.reason}
        </div>
      )}

      {/* Attempts detail */}
      {expanded && (
        <div className="border-t border-slate-100 bg-slate-50 p-4">
          <p className="text-[11px] font-bold uppercase text-slate-400 mb-2 tracking-wide">Call Attempts</p>
          {event.attempts.length === 0 ? (
            <p className="text-xs text-slate-400 italic">No attempts recorded yet.</p>
          ) : (
            <div className="space-y-2">
              {event.attempts.map(attempt => (
                <div key={attempt.id} className="flex items-center gap-3 text-xs bg-white rounded-lg px-3 py-2 border border-slate-200">
                  <span className="font-mono text-slate-400 w-6 text-center">#{attempt.attempt_number}</span>
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600 uppercase">
                    {attempt.attempt_type}
                  </span>
                  <CallStatusBadge status={attempt.status} />
                  <span className="text-slate-500 flex-1">{new Date(attempt.initiated_at).toLocaleTimeString()}</span>
                  {attempt.phone_dialed && (
                    <span className="font-mono text-slate-400">{attempt.phone_dialed}</span>
                  )}
                  {attempt.provider_call_id && (
                    <span className="font-mono text-[10px] text-slate-400 truncate max-w-[120px]" title={attempt.provider_call_id}>
                      {attempt.provider_call_id}
                    </span>
                  )}
                  {attempt.error_message && (
                    <span className="text-red-500 truncate max-w-[200px]" title={attempt.error_message}>
                      {attempt.error_message}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}

          {event.acknowledged && (
            <div className="mt-3 p-2 bg-green-50 border border-green-200 rounded-lg text-xs text-green-800">
              ✓ Acknowledged by <strong>{event.acknowledged_by}</strong> at{' '}
              {event.acknowledged_at ? new Date(event.acknowledged_at).toLocaleString() : '—'}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// Sub-component: Emergency Events Tab
// ──────────────────────────────────────────────────────────────
function EmergencyEventsTab({
  status,
  events,
  loading,
  onAcknowledge,
  onRefresh,
  onTestCall,
  testResult,
  testLoading,
}: {
  status: EmergencySystemStatus | null;
  events: EmergencyCallEvent[];
  loading: boolean;
  onAcknowledge: (id: number) => Promise<void>;
  onRefresh: () => void;
  onTestCall: () => void;
  testResult: any;
  testLoading: boolean;
}) {
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [filterAck, setFilterAck] = useState('ALL');

  const filtered = events.filter(e => {
    if (filterStatus !== 'ALL' && e.call_status !== filterStatus) return false;
    if (filterAck === 'PENDING' && e.acknowledged) return false;
    if (filterAck === 'ACKNOWLEDGED' && !e.acknowledged) return false;
    return true;
  });

  return (
    <div className="space-y-4">
      <DemoModeBanner status={status} />

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 justify-between">
        <div className="flex items-center gap-2">
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700"
          >
            <option value="ALL">All Statuses</option>
            <option value="PENDING">Pending</option>
            <option value="CALLING">Calling</option>
            <option value="DEMO_SUCCESS">Demo Success</option>
            <option value="ANSWERED">Answered</option>
            <option value="FAILED">Failed</option>
            <option value="ESCALATED">Escalated</option>
          </select>
          <select
            value={filterAck}
            onChange={e => setFilterAck(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700"
          >
            <option value="ALL">All Ack Status</option>
            <option value="PENDING">Unacknowledged</option>
            <option value="ACKNOWLEDGED">Acknowledged</option>
          </select>
          <button onClick={onRefresh} className="p-2 rounded-xl hover:bg-slate-100 text-slate-500 transition-colors" title="Refresh">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {/* TEST CALL BUTTON */}
        <button
          id="btn-test-emergency-call"
          onClick={onTestCall}
          disabled={testLoading}
          className="px-4 py-2 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl flex items-center gap-2 shadow transition-colors"
        >
          <TestTube2 className="w-4 h-4" />
          {testLoading ? 'Testing…' : '🧪 TEST EMERGENCY CALL'}
        </button>
      </div>

      {/* Test result */}
      {testResult && (
        <div className="p-4 bg-teal-50 border border-teal-300 rounded-xl text-sm space-y-1">
          <p className="font-bold text-teal-800 flex items-center gap-2">
            <TestTube2 className="w-4 h-4" /> Test Call Result — {testResult.status}
          </p>
          <p className="text-teal-700 text-xs">Contact: <strong>{testResult.contact_name}</strong></p>
          <p className="text-teal-700 text-xs">Dialed (masked): <code className="font-mono">{testResult.contact_phone_masked}</code></p>
          <p className="text-teal-700 text-xs">Mock ID: <code className="font-mono">{testResult.mock_call_id}</code></p>
          <p className="text-teal-600 text-xs italic mt-1">{testResult.note}</p>
        </div>
      )}

      {/* Events list */}
      {loading ? (
        <div className="py-12 text-center text-slate-500">
          <RefreshCw className="w-8 h-8 mx-auto animate-spin text-red-500 mb-2" />
          <p className="text-sm font-semibold">Loading emergency events…</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-12 text-center text-slate-400">
          <PhoneOff className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p className="text-sm font-semibold">No emergency events found.</p>
          <p className="text-xs mt-1">
            Events appear here when the AI detects a CRITICAL alert and triggers the call workflow.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(event => (
            <EventRow
              key={event.id}
              event={event}
              onAcknowledge={async (id) => {
                await onAcknowledge(id);
              }}
              onRefresh={onRefresh}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// Sub-component: Officer Contacts Tab
// ──────────────────────────────────────────────────────────────
const EMPTY_FORM = {
  name: '', role: '', primary_phone: '', secondary_phone: '',
  priority: 1, is_active: true, notes: '',
};

function ContactsTab({
  contacts,
  loading,
  onRefresh,
}: {
  contacts: EmergencyContact[];
  loading: boolean;
  onRefresh: () => void;
}) {
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [editId, setEditId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState('');

  const resetForm = () => { setForm({ ...EMPTY_FORM }); setEditId(null); setError(''); };

  const startEdit = (c: EmergencyContact) => {
    setForm({
      name: c.name, role: c.role,
      primary_phone: '', // never pre-fill masked phone — user must re-enter
      secondary_phone: '',
      priority: c.priority, is_active: c.is_active, notes: c.notes ?? '',
    });
    setEditId(c.id);
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.role) { setError('Name and Role are required.'); return; }
    if (!editId && !form.primary_phone) { setError('Primary phone is required for new contacts.'); return; }
    setSaving(true);
    setError('');
    try {
      const payload: any = {
        name: form.name, role: form.role, priority: form.priority,
        is_active: form.is_active, notes: form.notes || undefined,
      };
      if (form.primary_phone) payload.primary_phone = form.primary_phone;
      if (form.secondary_phone) payload.secondary_phone = form.secondary_phone;

      if (editId) {
        await updateEmergencyContact(editId, payload);
      } else {
        await createEmergencyContact(payload);
      }
      resetForm();
      setShowForm(false);
      onRefresh();
    } catch (e: any) {
      setError(e?.response?.data?.detail ?? 'Save failed. Check all fields.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Delete this emergency contact?')) return;
    try {
      await deleteEmergencyContact(id);
      onRefresh();
    } catch {
      alert('Delete failed.');
    }
  };

  return (
    <div className="space-y-4">
      {/* Info banner */}
      <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800">
        <strong>📋 Note:</strong> Phone numbers entered here are stored <strong>server-side only</strong> and
        never displayed in full. Only masked versions are shown. Contacts are called in <strong>priority order</strong> (1 = first).
      </div>

      {/* Add button */}
      <div className="flex justify-between items-center">
        <p className="text-sm font-semibold text-slate-600">{contacts.length} contact{contacts.length !== 1 ? 's' : ''} configured</p>
        <button
          id="btn-add-emergency-contact"
          onClick={() => { resetForm(); setShowForm(true); }}
          className="px-4 py-2 bg-forest-800 hover:bg-forest-900 text-white font-bold text-xs rounded-xl flex items-center gap-2 transition-colors"
        >
          <Plus className="w-4 h-4" /> Add Contact
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
          <h3 className="font-bold text-slate-800 text-sm">{editId ? 'Edit Contact' : 'New Emergency Contact'}</h3>
          {error && <p className="text-xs text-red-600 font-semibold">{error}</p>}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { label: 'Name *', key: 'name', placeholder: 'Shri Ramesh Kumar' },
              { label: 'Role *', key: 'role', placeholder: 'Range Forest Officer' },
              { label: 'Primary Phone *', key: 'primary_phone', placeholder: '+91XXXXXXXXXX' },
              { label: 'Secondary Phone', key: 'secondary_phone', placeholder: '+91XXXXXXXXXX (optional)' },
            ].map(({ label, key, placeholder }) => (
              <div key={key}>
                <label className="block text-xs font-bold text-slate-600 mb-1">{label}</label>
                <input
                  type={key.includes('phone') ? 'tel' : 'text'}
                  placeholder={placeholder}
                  value={(form as any)[key]}
                  onChange={e => setForm(prev => ({ ...prev, [key]: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-forest-500 outline-none"
                />
              </div>
            ))}
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Priority (1 = first called)</label>
              <input
                type="number" min={1} max={99}
                value={form.priority}
                onChange={e => setForm(prev => ({ ...prev, priority: parseInt(e.target.value) || 1 }))}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-forest-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Notes</label>
              <input
                type="text" placeholder="Duty zone, shift info…"
                value={form.notes}
                onChange={e => setForm(prev => ({ ...prev, notes: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-forest-500 outline-none"
              />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setForm(prev => ({ ...prev, is_active: !prev.is_active }))}
              className="flex items-center gap-2 text-xs font-bold text-slate-600"
            >
              {form.is_active
                ? <ToggleRight className="w-5 h-5 text-green-600" />
                : <ToggleLeft className="w-5 h-5 text-slate-400" />}
              {form.is_active ? 'Active' : 'Inactive'}
            </button>
          </div>
          <div className="flex gap-2 justify-end">
            <button
              onClick={() => { resetForm(); setShowForm(false); }}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors"
            >Cancel</button>
            <button
              id="btn-save-emergency-contact"
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 bg-forest-800 hover:bg-forest-900 disabled:opacity-50 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors"
            >
              <Save className="w-3.5 h-3.5" />
              {saving ? 'Saving…' : 'Save Contact'}
            </button>
          </div>
        </div>
      )}

      {/* Contacts list */}
      {loading ? (
        <div className="py-8 text-center text-slate-400">
          <RefreshCw className="w-6 h-6 mx-auto animate-spin mb-2" />
          <p className="text-xs">Loading contacts…</p>
        </div>
      ) : contacts.length === 0 ? (
        <div className="py-10 text-center text-slate-400 border-2 border-dashed border-slate-200 rounded-2xl">
          <Users className="w-8 h-8 mx-auto mb-2 opacity-40" />
          <p className="text-sm font-semibold">No emergency contacts configured.</p>
          <p className="text-xs mt-1">Add at least one contact to enable automated calls.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {contacts.map(c => (
            <div key={c.id}
              className={`bg-white rounded-2xl border px-5 py-4 flex items-center gap-4 shadow-sm transition-all ${
                c.is_active ? 'border-slate-200' : 'border-slate-100 opacity-60'
              }`}>
              {/* Priority badge */}
              <div className="w-8 h-8 rounded-full bg-forest-50 border-2 border-forest-200 flex items-center justify-center font-black text-forest-800 text-sm shrink-0">
                {c.priority}
              </div>
              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900 text-sm">{c.name}</span>
                  <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${
                    c.is_active ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'
                  }`}>{c.is_active ? 'Active' : 'Inactive'}</span>
                </div>
                <div className="text-xs text-slate-500 mt-0.5">{c.role}</div>
                <div className="flex gap-3 mt-1 text-[11px] text-slate-400 font-mono">
                  <span>📞 {c.primary_phone_masked}</span>
                  {c.secondary_phone_masked && <span>📱 {c.secondary_phone_masked}</span>}
                  {c.notes && <span className="font-sans text-slate-400 truncate max-w-[200px]">{c.notes}</span>}
                </div>
              </div>
              {/* Actions */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => startEdit(c)}
                  className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors"
                  title="Edit"
                >
                  <Settings2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(c.id)}
                  className="p-1.5 rounded-lg hover:bg-red-50 text-red-400 transition-colors"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// Main Page Component
// ──────────────────────────────────────────────────────────────
export const EmergencyAlerts: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'events' | 'contacts'>('events');
  const [sysStatus, setSysStatus] = useState<EmergencySystemStatus | null>(null);
  const [events, setEvents] = useState<EmergencyCallEvent[]>([]);
  const [contacts, setContacts] = useState<EmergencyContact[]>([]);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [contactsLoading, setContactsLoading] = useState(true);
  const [testResult, setTestResult] = useState<any>(null);
  const [testLoading, setTestLoading] = useState(false);

  const loadStatus = useCallback(async () => {
    try { setSysStatus(await fetchEmergencyStatus()); } catch {}
  }, []);

  const loadEvents = useCallback(async () => {
    setEventsLoading(true);
    try {
      setEvents(await fetchEmergencyEvents({ limit: 100 }));
    } catch {
      setEvents([]);
    } finally {
      setEventsLoading(false);
    }
  }, []);

  const loadContacts = useCallback(async () => {
    setContactsLoading(true);
    try {
      setContacts(await fetchEmergencyContacts());
    } catch {
      setContacts([]);
    } finally {
      setContactsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStatus();
    loadEvents();
    loadContacts();
  }, []);

  const handleAcknowledge = async (id: number) => {
    try {
      await acknowledgeEmergencyEvent(id, 'Dashboard Officer');
      await loadEvents();
      await loadStatus();
    } catch { }
  };

  const handleTestCall = async () => {
    setTestLoading(true);
    setTestResult(null);
    try {
      const result = await triggerTestCall();
      setTestResult(result);
    } catch (e: any) {
      setTestResult({ status: 'ERROR', note: e?.response?.data?.detail ?? 'Test call failed.' });
    } finally {
      setTestLoading(false);
    }
  };

  const tabs = [
    { id: 'events', label: '🚨 Emergency Calls', icon: <Bell className="w-4 h-4" /> },
    { id: 'contacts', label: '👮 Officer Contacts', icon: <Users className="w-4 h-4" /> },
  ] as const;

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold font-serif text-slate-800 flex items-center gap-2">
              <ShieldAlert className="w-6 h-6 text-red-600" />
              Autonomous Emergency Response System
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              When AI detects a CRITICAL tiger event, the system automatically initiates a voice call to
              the configured forest officer. Full audit trail, retry logic, and escalation included.
            </p>
          </div>
          {sysStatus && (
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-black uppercase ${
              sysStatus.demo_mode ? 'bg-teal-100 text-teal-700' : 'bg-red-100 text-red-700'
            }`}>
              {sysStatus.demo_mode ? <TestTube2 className="w-3.5 h-3.5" /> : <Phone className="w-3.5 h-3.5" />}
              {sysStatus.demo_mode ? 'DEMO MODE' : 'LIVE MODE'}
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mt-5 border-b border-slate-200">
          {tabs.map(tab => (
            <button
              key={tab.id}
              id={`tab-emergency-${tab.id}`}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2.5 text-sm font-bold rounded-t-xl flex items-center gap-1.5 border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-red-500 text-red-700 bg-red-50'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'
              }`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'events' && (
        <EmergencyEventsTab
          status={sysStatus}
          events={events}
          loading={eventsLoading}
          onAcknowledge={handleAcknowledge}
          onRefresh={() => { loadEvents(); loadStatus(); }}
          onTestCall={handleTestCall}
          testResult={testResult}
          testLoading={testLoading}
        />
      )}
      {activeTab === 'contacts' && (
        <ContactsTab
          contacts={contacts}
          loading={contactsLoading}
          onRefresh={() => { loadContacts(); loadStatus(); }}
        />
      )}
    </div>
  );
};

export default EmergencyAlerts;
