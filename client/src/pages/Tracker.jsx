import { useState, useEffect } from 'react'
import Spinner from '../components/Spinner'
import { apiFetch } from '../api'

const STAGES = ['Drafted', 'Contacted', 'Replied', 'Meeting Scheduled', 'Offer']

const STAGE_STYLE = {
  'Drafted':          'bg-gray-100 text-gray-600',
  'Contacted':        'bg-[#d4eced] text-[#0A5F63]',
  'Replied':          'bg-green-50 text-green-700',
  'Meeting Scheduled':'bg-purple-50 text-purple-700',
  'Offer':            'bg-amber-50 text-amber-700',
}

function formatDate(s) {
  if (!s) return null
  const [y, m, d] = String(s).split('T')[0].split('-').map(Number)
  if (!y) return null
  return new Date(y, m - 1, d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function InlineText({ value, onSave, placeholder = '—' }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value || '')

  if (editing) return (
    <input
      autoFocus
      value={draft}
      onChange={e => setDraft(e.target.value)}
      onBlur={() => { onSave(draft); setEditing(false) }}
      onKeyDown={e => {
        if (e.key === 'Enter') e.target.blur()
        if (e.key === 'Escape') { setDraft(value || ''); setEditing(false) }
      }}
      className="w-full px-1.5 py-0.5 border border-[#0D7377] rounded text-[13px] outline-none shadow-[0_0_0_2px_rgba(13,115,119,0.1)] bg-white"
    />
  )

  return (
    <span
      onClick={() => { setDraft(value || ''); setEditing(true) }}
      className="cursor-text block text-[13px] truncate hover:underline hover:decoration-dotted hover:decoration-gray-400"
      title={value || undefined}
    >
      {value || <span className="text-gray-300">{placeholder}</span>}
    </span>
  )
}

function InlineDate({ value, onSave }) {
  const [editing, setEditing] = useState(false)
  const current = value ? String(value).split('T')[0] : ''

  if (editing) return (
    <input
      type="date"
      autoFocus
      defaultValue={current}
      onBlur={e => { onSave(e.target.value || null); setEditing(false) }}
      onKeyDown={e => {
        if (e.key === 'Escape') setEditing(false)
      }}
      className="w-full px-1 py-0.5 border border-[#0D7377] rounded text-[12px] outline-none bg-white shadow-[0_0_0_2px_rgba(13,115,119,0.1)]"
    />
  )

  const display = formatDate(value)
  return (
    <span
      onClick={() => setEditing(true)}
      className="cursor-text block text-[13px] truncate hover:underline hover:decoration-dotted hover:decoration-gray-400"
    >
      {display || <span className="text-gray-300">—</span>}
    </span>
  )
}

function StageSelect({ stage, onChange }) {
  return (
    <select
      value={stage}
      onChange={e => onChange(e.target.value)}
      className={`border-0 rounded-full px-3 py-1 text-[11px] font-semibold cursor-pointer appearance-none outline-none transition-opacity hover:opacity-80 ${STAGE_STYLE[stage] || STAGE_STYLE['Drafted']}`}
      style={{ WebkitAppearance: 'none' }}
    >
      {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
    </select>
  )
}

function ContactModal({ onSave, onClose }) {
  const [form, setForm] = useState({ name: '', firm: '', role: '', stage: 'Drafted', follow_up_date: '', notes: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  async function submit() {
    if (!form.name.trim()) { setError('Name is required.'); return }
    setSaving(true)
    try {
      await onSave({
        name: form.name.trim(),
        firm: form.firm.trim() || null,
        role: form.role.trim() || null,
        stage: form.stage,
        follow_up_date: form.follow_up_date || null,
        notes: form.notes.trim() || null,
      })
      onClose()
    } catch (_) { setError('Could not save. Try again.') }
    setSaving(false)
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-2xl p-7 w-full max-w-md shadow-2xl">
        <h3 className="text-[17px] font-semibold tracking-tight mb-5">Add contact</h3>

        <div className="mb-3.5">
          <label className="field-label">Name *</label>
          <input autoFocus value={form.name} onChange={e => set('name', e.target.value)} className="input-base" placeholder="Full name" />
        </div>

        <div className="grid grid-cols-2 gap-3 mb-3.5">
          <div>
            <label className="field-label">Firm</label>
            <input value={form.firm} onChange={e => set('firm', e.target.value)} className="input-base" placeholder="e.g. Goldman Sachs" />
          </div>
          <div>
            <label className="field-label">Role</label>
            <input value={form.role} onChange={e => set('role', e.target.value)} className="input-base" placeholder="e.g. Analyst" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-3.5">
          <div>
            <label className="field-label">Stage</label>
            <select value={form.stage} onChange={e => set('stage', e.target.value)} className="input-base">
              {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="field-label">Follow-up date</label>
            <input type="date" value={form.follow_up_date} onChange={e => set('follow_up_date', e.target.value)} className="input-base" />
          </div>
        </div>

        <div className="mb-4">
          <label className="field-label">Notes</label>
          <textarea value={form.notes} onChange={e => set('notes', e.target.value)} className="input-base resize-y min-h-[72px]" placeholder="Any context…" />
        </div>

        {error && <p className="text-[12px] text-red-500 mb-3">{error}</p>}

        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="btn-ghost">Cancel</button>
          <button onClick={submit} disabled={saving} className="btn-primary">
            {saving ? <><Spinner size="xs" className="border-white/30 border-t-white" /> Saving…</> : 'Save'}
          </button>
        </div>
      </div>
    </div>
  )
}

function FollowupModal({ entry, onClose }) {
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [draftStatus, setDraftStatus] = useState('')
  const [copied, setCopied] = useState(false)

  useEffect(() => { generate() }, [])

  async function generate() {
    setLoading(true); setError(''); setSubject(''); setBody('')
    try {
      const data = await apiFetch('/outreach/follow-up', {
        method: 'POST',
        body: JSON.stringify({ outreachId: entry.id }),
      })
      setSubject(data.subject || '')
      setBody(data.body || '')
    } catch (err) {
      setError('Could not generate follow-up. Try again.')
    }
    setLoading(false)
  }

  async function saveDraft() {
    setDraftStatus('saving')
    try {
      await apiFetch('/auth/gmail/draft', {
        method: 'POST',
        body: JSON.stringify({ subject, body }),
      })
      setDraftStatus('saved')
      setTimeout(() => setDraftStatus(''), 2500)
    } catch (_) {
      setDraftStatus('error')
      setTimeout(() => setDraftStatus(''), 2500)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-2xl p-7 w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
        <h3 className="text-[16px] font-semibold tracking-tight mb-4">Follow-up: {entry.name}</h3>

        {loading && (
          <div className="flex items-center gap-2 text-[13px] text-gray-500 py-8 justify-center">
            <Spinner /> Generating follow-up…
          </div>
        )}

        {error && <p className="text-[13px] text-gray-500 py-4">{error}</p>}

        {!loading && !error && (
          <>
            <p className="text-[12px] text-gray-500 mb-2">Subject: <strong className="text-gray-800">{subject}</strong></p>
            <div className="bg-[#fafaf9] border border-[#E8E6E3] rounded-lg px-4 py-3 text-[13px] leading-relaxed text-gray-900 whitespace-pre-wrap mb-4 min-h-[110px]">
              {body}
            </div>
          </>
        )}

        <div className="flex justify-end gap-2 mt-2">
          <button onClick={onClose} className="btn-ghost">Close</button>
          {!loading && !error && (
            <>
              <button
                onClick={() => navigator.clipboard.writeText(body).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000) })}
                className="btn-ghost"
              >{copied ? '✓ Copied' : 'Copy'}</button>
              <button onClick={saveDraft} disabled={draftStatus === 'saving'} className="btn-primary">
                {draftStatus === 'saving' ? 'Saving…' : draftStatus === 'saved' ? '✓ Saved' : 'Save as draft'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default function Tracker() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [followupEntry, setFollowupEntry] = useState(null)
  const [checkingReplies, setCheckingReplies] = useState(false)
  const [repliesStatus, setRepliesStatus] = useState('')

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    try {
      const d = await apiFetch('/outreach')
      setData(d || [])
    } catch (_) {}
    setLoading(false)
  }

  async function patch(id, fields) {
    try {
      await apiFetch(`/outreach/${id}`, { method: 'PATCH', body: JSON.stringify(fields) })
      setData(prev => prev.map(e => e.id === id ? { ...e, ...fields } : e))
    } catch (_) {}
  }

  async function del(id) {
    if (!confirm('Delete this contact?')) return
    try {
      await apiFetch(`/outreach/${id}`, { method: 'DELETE' })
      setData(prev => prev.filter(e => e.id !== id))
    } catch (_) {}
  }

  async function addContact(payload) {
    const d = await apiFetch('/outreach', { method: 'POST', body: JSON.stringify(payload) })
    setData(prev => [d, ...prev])
  }

  async function checkReplies() {
    setCheckingReplies(true)
    try {
      const d = await apiFetch('/outreach/check-replies', { method: 'POST' })
      if (d.updated > 0) { await load(); setRepliesStatus(`${d.updated} updated`) }
      else setRepliesStatus('Up to date')
    } catch (_) { setRepliesStatus('') }
    setCheckingReplies(false)
    setTimeout(() => setRepliesStatus(''), 3000)
  }

  // Follow-ups due
  const today = new Date().toISOString().split('T')[0]
  const due = data.filter(e =>
    e.follow_up_date &&
    String(e.follow_up_date).split('T')[0] <= today &&
    ['Drafted', 'Contacted'].includes(e.stage)
  )

  return (
    <div>
      {/* Follow-up reminders */}
      {due.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-5 py-4 mb-6">
          <p className="text-[12px] font-semibold text-amber-800 mb-2.5">Follow-ups due</p>
          <div className="space-y-2">
            {due.map(e => (
              <div key={e.id} className="flex items-center justify-between gap-3">
                <div>
                  <span className="text-[13px] font-semibold text-gray-900">{e.name}</span>
                  <span className="text-[12px] text-gray-500 ml-2">{[e.firm, e.role].filter(Boolean).join(' · ')}</span>
                  <span className="text-[11px] text-amber-600 ml-2">due {formatDate(e.follow_up_date)}</span>
                </div>
                <button onClick={() => setFollowupEntry(e)} className="btn-sm text-amber-700 border-amber-300 hover:bg-amber-50 whitespace-nowrap">
                  Generate follow-up
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-light tracking-tight text-gray-900">Outreach Tracker</h2>
        <div className="flex items-center gap-2">
          <button onClick={checkReplies} disabled={checkingReplies} className="btn-ghost text-xs py-1.5">
            {checkingReplies ? <><Spinner size="xs" /> Checking…</> : repliesStatus || 'Check for replies'}
          </button>
          <button onClick={() => setShowAdd(true)} className="btn-primary">+ Add contact</button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-[#E8E6E3] rounded-xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16 gap-2 text-[13px] text-gray-400">
            <Spinner /> Loading…
          </div>
        ) : data.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-[14px] text-gray-400">No outreach tracked yet.</p>
            <p className="text-[13px] text-gray-400 mt-1">Save a draft from the extension or add one manually.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-[13px] border-collapse" style={{ tableLayout: 'fixed' }}>
              <colgroup>
                <col style={{ width: '16%' }} />
                <col style={{ width: '18%' }} />
                <col style={{ width: '12%' }} />
                <col style={{ width: '12%' }} />
                <col style={{ width: '14%' }} />
                <col style={{ width: '12%' }} />
                <col style={{ width: '11%' }} />
                <col style={{ width: '5%' }} />
              </colgroup>
              <thead>
                <tr className="border-b border-[#E8E6E3] bg-[#fafaf9]">
                  {['Name', 'Firm', 'Role', 'Date', 'Stage', 'Follow-up', 'Notes', ''].map((h, i) => (
                    <th key={i} className="text-left px-4 py-3 text-[10.5px] font-semibold tracking-widest uppercase text-gray-400 whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.map((e, idx) => (
                  <tr key={e.id} className={`border-b border-[#F0EFED] hover:bg-[#fafaf9] transition-colors ${idx === data.length - 1 ? 'border-b-0' : ''}`}>
                    <td className="px-4 py-3">
                      <span className="font-semibold truncate block" title={e.name}>{e.name}</span>
                    </td>
                    <td className="px-4 py-3">
                      <InlineText value={e.firm} onSave={v => patch(e.id, { firm: v || null })} />
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-gray-500 truncate block" title={e.role}>{e.role || <span className="text-gray-300">—</span>}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-gray-600">{formatDate(e.date_added) || '—'}</span>
                      <span className="block text-[10px] text-gray-400 mt-0.5">{e.source === 'extension' ? 'Extension' : 'Manual'}</span>
                    </td>
                    <td className="px-4 py-3">
                      <StageSelect stage={e.stage} onChange={v => patch(e.id, { stage: v })} />
                    </td>
                    <td className="px-4 py-3">
                      <InlineDate value={e.follow_up_date} onSave={v => patch(e.id, { follow_up_date: v })} />
                    </td>
                    <td className="px-4 py-3">
                      <InlineText value={e.notes} onSave={v => patch(e.id, { notes: v || null })} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => del(e.id)} className="text-[12px] text-red-400 hover:text-red-600 cursor-pointer bg-transparent border-0 outline-none transition-colors">
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showAdd    && <ContactModal onSave={addContact} onClose={() => setShowAdd(false)} />}
      {followupEntry && <FollowupModal entry={followupEntry} onClose={() => setFollowupEntry(null)} />}
    </div>
  )
}
