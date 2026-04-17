import { useState, useEffect } from 'react'
import Spinner from '../components/Spinner'
import { apiFetch } from '../api'

function Section({ title, children }) {
  return (
    <div className="py-7 border-b border-[#E8E6E3] last:border-0">
      <h3 className="text-[13px] font-semibold text-gray-900 mb-5 tracking-tight">{title}</h3>
      {children}
    </div>
  )
}

function Field({ label, children }) {
  return (
    <div className="mb-4">
      <label className="field-label">{label}</label>
      {children}
    </div>
  )
}

function ToggleRow({ label, sub, checked, onChange, disabled }) {
  return (
    <div className="flex items-center justify-between gap-4 py-3 border-b border-[#F0EFED] last:border-0">
      <div>
        <p className="text-[13px] font-medium text-gray-800">{label}</p>
        {sub && <p className="text-[12px] text-gray-500 mt-0.5">{sub}</p>}
      </div>
      <label className="relative inline-block w-[38px] h-[22px] flex-shrink-0 cursor-pointer">
        <input
          type="checkbox"
          checked={checked}
          onChange={onChange}
          disabled={disabled}
          className="opacity-0 w-0 h-0 absolute"
        />
        <span
          className={`absolute inset-0 rounded-full transition-colors duration-200 ${
            disabled ? (checked ? 'bg-[#7ab8ba]' : 'bg-gray-200') :
            checked ? 'bg-[#0D7377]' : 'bg-gray-300'
          }`}
        />
        <span
          className="absolute w-4 h-4 bg-white rounded-full top-[3px] left-[3px] transition-transform duration-200"
          style={{ transform: checked ? 'translateX(16px)' : 'translateX(0)' }}
        />
      </label>
    </div>
  )
}

export default function Settings({ profile: initialProfile, onSaved }) {
  const [form, setForm] = useState({
    name: '', school: '', year: '', major: '', hometown: '',
    goal: '', recruiting_stage: '', target_areas: '',
    background_blurb: '', activities: '', timeline: '',
  })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [hasResume, setHasResume] = useState(false)
  const [resumeFilename, setResumeFilename] = useState('')
  const [attachResume, setAttachResume] = useState(false)
  const [uploadingResume, setUploadingResume] = useState(false)
  const [gmailConnected, setGmailConnected] = useState(false)

  useEffect(() => {
    if (initialProfile) {
      setForm({
        name:             initialProfile.name             || '',
        school:           initialProfile.school           || '',
        year:             initialProfile.year             || '',
        major:            initialProfile.major            || '',
        hometown:         initialProfile.hometown         || '',
        goal:             initialProfile.goal             || '',
        recruiting_stage: initialProfile.recruiting_stage || '',
        target_areas:     initialProfile.target_areas     || '',
        background_blurb: initialProfile.background_blurb || '',
        activities:       initialProfile.activities       || '',
        timeline:         initialProfile.timeline         || '',
      })
      setHasResume(!!initialProfile.has_resume)
      setResumeFilename(initialProfile.resume_filename || '')
      setAttachResume(!!initialProfile.attach_resume)
    }
    setGmailConnected(localStorage.getItem('gmail_connected') === 'true')
  }, [initialProfile])

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  async function saveProfile() {
    setSaving(true); setSaved(false)
    try {
      await apiFetch('/profile', { method: 'POST', body: JSON.stringify(form) })
      setSaved(true)
      onSaved?.()
      setTimeout(() => setSaved(false), 3000)
    } catch (_) {}
    setSaving(false)
  }

  async function toggleAttachResume(checked) {
    setAttachResume(checked)
    try {
      await apiFetch('/profile', { method: 'PATCH', body: JSON.stringify({ attach_resume: checked }) })
    } catch (_) { setAttachResume(!checked) }
  }

  async function uploadResume(file) {
    if (!file || file.type !== 'application/pdf') { alert('Only PDF files are supported.'); return }
    setUploadingResume(true)
    const fd = new FormData()
    fd.append('resume', file)
    try {
      await apiFetch('/profile/parse-resume', { method: 'POST', body: fd })
      setHasResume(true)
      setResumeFilename(file.name)
    } catch (_) { alert('Upload failed. Try again.') }
    setUploadingResume(false)
  }

  async function connectGmail() {
    try {
      const data = await apiFetch('/auth/gmail/auth')
      if (data.authUrl) window.location.href = data.authUrl
    } catch (_) { alert('Could not start Gmail connection.') }
  }

  return (
    <div>
      <div className="mb-7">
        <h2 className="text-2xl font-light tracking-tight text-gray-900">Settings</h2>
        <p className="text-[14px] text-gray-500 mt-1">Manage your profile, resume, and connected accounts.</p>
      </div>

      <div className="bg-white border border-[#E8E6E3] rounded-xl px-7">

        <Section title="About You">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Full name">
              <input value={form.name} onChange={e => set('name', e.target.value)} className="input-base" placeholder="Your name" />
            </Field>
            <Field label="School">
              <input value={form.school} onChange={e => set('school', e.target.value)} className="input-base" placeholder="e.g. University of Michigan" />
            </Field>
            <Field label="Year">
              <input value={form.year} onChange={e => set('year', e.target.value)} className="input-base" placeholder="e.g. 2026" />
            </Field>
            <Field label="Major">
              <input value={form.major} onChange={e => set('major', e.target.value)} className="input-base" placeholder="e.g. Finance" />
            </Field>
            <Field label="Hometown">
              <input value={form.hometown} onChange={e => set('hometown', e.target.value)} className="input-base" placeholder="e.g. Chicago, IL" />
            </Field>
          </div>
        </Section>

        <Section title="Goals & Context">
          <Field label="What are you trying to do?">
            <input value={form.goal} onChange={e => set('goal', e.target.value)} className="input-base" placeholder="e.g. Break into investment banking" />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Recruiting stage">
              <select value={form.recruiting_stage} onChange={e => set('recruiting_stage', e.target.value)} className="input-base">
                <option value="">Select…</option>
                <option>Exploring</option>
                <option>Actively recruiting</option>
                <option>Have offers, deciding</option>
              </select>
            </Field>
            <Field label="Timeline">
              <input value={form.timeline} onChange={e => set('timeline', e.target.value)} className="input-base" placeholder="e.g. Summer 2026" />
            </Field>
          </div>
          <Field label="Target areas / firms">
            <input value={form.target_areas} onChange={e => set('target_areas', e.target.value)} className="input-base" placeholder="e.g. Bulge bracket IBD, PE, NYC" />
          </Field>
        </Section>

        <Section title="Background">
          <Field label="Background summary">
            <textarea
              value={form.background_blurb}
              onChange={e => set('background_blurb', e.target.value)}
              className="input-base resize-y min-h-[90px]"
              placeholder="Brief summary of your background — used to personalize cold emails…"
            />
          </Field>
          <Field label="Activities & clubs">
            <textarea
              value={form.activities}
              onChange={e => set('activities', e.target.value)}
              className="input-base resize-y min-h-[70px]"
              placeholder="Investment club, case competitions, student government…"
            />
          </Field>
        </Section>

        {/* Save button */}
        <div className="py-5 flex items-center gap-3 border-b border-[#E8E6E3]">
          <button onClick={saveProfile} disabled={saving} className="btn-primary">
            {saving ? <><Spinner size="xs" className="border-white/30 border-t-white" /> Saving…</> : 'Save profile'}
          </button>
          {saved && <span className="text-[13px] text-green-600 font-medium">✓ Saved</span>}
        </div>

        <Section title="Resume">
          <div className="flex items-center justify-between gap-4 mb-4">
            <div>
              {hasResume ? (
                <p className="text-[13px] text-green-600 font-medium">✓ Resume uploaded{resumeFilename ? ` — ${resumeFilename}` : ''}</p>
              ) : (
                <p className="text-[13px] text-gray-500">No resume uploaded yet.</p>
              )}
            </div>
            <label className={`btn-ghost text-[12px] py-1.5 cursor-pointer ${uploadingResume ? 'opacity-50 pointer-events-none' : ''}`}>
              {uploadingResume ? <><Spinner size="xs" /> Uploading…</> : hasResume ? 'Replace resume' : 'Upload resume (PDF)'}
              <input
                type="file"
                accept=".pdf"
                className="hidden"
                onChange={e => { if (e.target.files[0]) uploadResume(e.target.files[0]); e.target.value = '' }}
              />
            </label>
          </div>
          <ToggleRow
            label="Attach resume to emails"
            sub="Your resume PDF will be attached to every Gmail draft."
            checked={attachResume}
            onChange={e => toggleAttachResume(e.target.checked)}
            disabled={!hasResume}
          />
          {!hasResume && (
            <p className="text-[11px] text-amber-600 mt-2">Upload a resume above to enable this option.</p>
          )}
        </Section>

        <Section title="Gmail">
          <div className="flex items-center justify-between gap-4">
            <div>
              {gmailConnected ? (
                <p className="text-[13px] text-green-600 font-medium">✓ Gmail connected</p>
              ) : (
                <p className="text-[13px] text-gray-600">Connect Gmail to save drafts directly from ColdMatch.</p>
              )}
            </div>
            <button onClick={connectGmail} className="btn-ghost text-[12px] py-1.5 flex-shrink-0">
              {gmailConnected ? 'Reconnect Gmail' : 'Connect Gmail'}
            </button>
          </div>
        </Section>

      </div>
    </div>
  )
}
