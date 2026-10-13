import React, { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  Trophy, ShieldCheck, Monitor, Users, RotateCcw, LockKeyhole,
  Download, Maximize, Minimize, Settings, Check, X, Sparkles, Eye, EyeOff,
  ArrowLeft, Save, AlertTriangle
} from 'lucide-react'

const STORAGE_KEY = 'spl-season-2-captain-reveal-v2'
const PLAYER_IMAGES = Array.from({ length: 12 }, (_, i) => `/players/player${i + 1}.jpg`)
const CAPTAIN_NAMES = [
  'Vaibav C',
  'Srajan S Kundar',
  'Shreyas Shetty',
  'Shree Ram',
  'Vinesh Shetty',
  'Sujal S Kumar',
  'Prashanth',
  'Prathvi Raj',
  'Nithesh Kumar',
  'Prajwal Poojary',
  'Sumanth',
  'Thanvish',
]
const initialCaptains = Array.from({ length: 12 }, (_, i) => ({
  id: `captain-${i + 1}`,
  name: CAPTAIN_NAMES[i],
  department: '',
  details: '',
  image: PLAYER_IMAGES[i],
}))

function sanitizeCaptains(list) {
  return PLAYER_IMAGES.map((src, i) => {
    const c = Array.isArray(list) ? list[i] : null
    return {
      id: `captain-${i + 1}`,
      name: c?.name || CAPTAIN_NAMES[i],
      department: c?.department || '',
      details: c?.details || '',
      image: src,
    }
  })
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object') return null
    return { ...parsed, captains: sanitizeCaptains(parsed.captains) }
  } catch {
    return null
  }
}

function shuffle(items) {
  const arr = [...items]
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

function downloadFile(name, content, type = 'text/plain') {
  const blob = new Blob([content], { type })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = name
  a.click()
  URL.revokeObjectURL(url)
}

function PlayerImage({ src, name }) {
  const [broken, setBroken] = useState(false)
  const filename = String(src).split('/').pop()
  if (broken) {
    return (
      <div className="image-placeholder" role="img" aria-label={`Missing photo for ${name}`}>
        <AlertTriangle size={15} />
        <span>Missing: {filename}</span>
      </div>
    )
  }
  return <img src={src} alt={name} onError={() => setBroken(true)} loading="lazy" />
}

function App() {
  const saved = useMemo(loadState, [])
  const [captains, setCaptains] = useState(saved?.captains || initialCaptains)
  const [sponsors, setSponsors] = useState(saved?.sponsors || Array(12).fill(''))
  const [mapping, setMapping] = useState(saved?.mapping || null)
  const [assignments, setAssignments] = useState(saved?.assignments || {})
  const [mode, setMode] = useState('projector')
  const [currentSponsor, setCurrentSponsor] = useState('')
  const [selectedCard, setSelectedCard] = useState(null)
  const [revealed, setRevealed] = useState(null)
  const [confirm, setConfirm] = useState(null)
  const [message, setMessage] = useState('')
  const [showAdmin, setShowAdmin] = useState(false)
  const [adminPin, setAdminPin] = useState('')
  const [unlocked, setUnlocked] = useState(false)
  const [missingImages, setMissingImages] = useState([])
  const [newPin, setNewPin] = useState(saved?.pin || '2026')
  const [sound, setSound] = useState(false)
  const [fullscreen, setFullscreen] = useState(false)
  const [showFinal, setShowFinal] = useState(false)
  const [editingSponsors, setEditingSponsors] = useState(saved?.sponsors || Array(12).fill(''))
  const [editingCaptains, setEditingCaptains] = useState(saved?.captains || initialCaptains)
  const assignedCount = Object.keys(assignments).length
  const ready = captains.every(c => c.name.trim())

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ captains, sponsors, mapping, assignments, pin: newPin }))
    } catch {
      setMessage('Could not save settings in this browser. Check that storage is enabled and not full.')
    }
  }, [captains, sponsors, mapping, assignments, newPin])

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(''), 4500)
      return () => clearTimeout(timer)
    }
  }, [message])

  useEffect(() => {
    if (!unlocked) {
      setMissingImages([])
      return
    }
    let active = true
    Promise.all(PLAYER_IMAGES.map(src => new Promise(resolve => {
      const img = new Image()
      img.onload = () => resolve(null)
      img.onerror = () => resolve(src)
      img.src = src
    }))).then(results => {
      if (active) setMissingImages(results.filter(Boolean))
    })
    return () => { active = false }
  }, [unlocked])

  async function toggleFullscreen() {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen()
        setFullscreen(true)
      } else {
        await document.exitFullscreen()
        setFullscreen(false)
      }
    } catch {
      setMessage('Full-screen mode is not available in this browser.')
    }
  }

  function openAdmin() {
    setAdminPin('')
    setUnlocked(false)
    setShowAdmin(true)
  }

  function unlockAdmin(e) {
    e.preventDefault()
    if (adminPin === newPin) setUnlocked(true)
    else setMessage('Incorrect organizer PIN.')
  }

  function updateCaptain(index, field, value) {
    setEditingCaptains(prev => prev.map((c, i) => i === index ? { ...c, [field]: value } : c))
  }

  function saveSetup() {
    const missing = editingCaptains.findIndex(c => !c.name.trim())
    if (missing !== -1) {
      setMessage(`Add a captain name for Captain ${String(missing + 1).padStart(2, '0')}.`)
      return
    }
    setCaptains(editingCaptains.map((c, i) => ({ ...c, image: PLAYER_IMAGES[i] })))
    setSponsors(editingSponsors.map(s => s.trim()))
    setMapping(null)
    setAssignments({})
    setRevealed(null)
    setSelectedCard(null)
    setShowFinal(false)
    setShowAdmin(false)
    setMessage('Setup saved. Prepare the draw when you are ready.')
  }

  function prepareDraw() {
    if (!ready) {
      setMessage('Open Organizer Setup and add all 12 captain names first.')
      return
    }
    if (assignedCount > 0) {
      setMessage('Assignments already exist. Use Reset Event before preparing a new draw.')
      return
    }
    setConfirm({ type: 'prepare' })
  }

  function commitDraw() {
    const shuffled = shuffle(captains.map(c => c.id))
    setMapping(shuffled)
    setConfirm(null)
    setMessage('Draw prepared and locked for this browser.')
  }

  function clickCard(number) {
    if (!mapping) {
      setMessage('The draw has not been prepared. Ask the organizer to prepare it.')
      return
    }
    if (assignments[number]) {
      setRevealed(assignments[number])
      setShowFinal(false)
      return
    }
    if (!currentSponsor.trim()) {
      setMessage('Enter the current sponsor name before selecting a card.')
      return
    }
    setSelectedCard(number)
    setConfirm({ type: 'reveal', number })
  }

  function commitReveal() {
    const number = confirm.number
    const captainId = mapping[number - 1]
    const captain = captains.find(c => c.id === captainId)
    if (!captain || Object.values(assignments).some(a => a.captainId === captainId)) {
      setConfirm(null)
      setMessage('Assignment conflict detected. Please check the draw and assignments.')
      return
    }
    const assignment = {
      card: number,
      captainId,
      captainName: captain.name,
      captainImage: captain.image,
      department: captain.department,
      details: captain.details,
      sponsor: currentSponsor.trim(),
      assignedAt: new Date().toISOString(),
    }
    setAssignments(prev => ({ ...prev, [number]: assignment }))
    setRevealed(assignment)
    setCurrentSponsor('')
    setSelectedCard(null)
    setConfirm(null)
    setShowFinal(false)
    if (sound) {
      try {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext
        const ctx = new AudioContextClass()
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.connect(gain); gain.connect(ctx.destination)
        osc.frequency.value = 660
        gain.gain.value = 0.06
        osc.start()
        osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15)
        osc.stop(ctx.currentTime + 0.18)
      } catch {}
    }
  }

  function resetEvent() {
    setConfirm({ type: 'reset' })
  }

  function commitReset() {
    setMapping(null)
    setAssignments({})
    setRevealed(null)
    setSelectedCard(null)
    setShowFinal(false)
    setConfirm(null)
    setMessage('Event assignments have been reset.')
  }

  function exportCsv() {
    const rows = [['Card', 'Sponsor', 'Captain', 'Department', 'Details', 'Assigned At']]
    Object.values(assignments).sort((a, b) => a.card - b.card).forEach(a => {
      rows.push([a.card, a.sponsor, a.captainName, a.department || '', a.details || '', a.assignedAt])
    })
    const csv = rows.map(row => row.map(v => `"${String(v ?? '').replaceAll('"', '""')}"`).join(',')).join('\n')
    downloadFile('SPL-Season-2-Captain-Assignments.csv', csv, 'text/csv;charset=utf-8;')
  }

  const orderedAssignments = Object.values(assignments).sort((a, b) => a.card - b.card)

  return (
    <main className="app-shell">
      <header className="topbar">
        <div className="brand">
          <div className="brand-mark"><Trophy size={25} /></div>
          <div>
            <div className="brand-title">SPL <span>SEASON 2</span></div>
            <div className="brand-subtitle">SMVITM PREMIER LEAGUE</div>
          </div>
        </div>
        <div className="top-actions">
          <button className={`sound-btn ${sound ? 'active' : ''}`} onClick={() => setSound(v => !v)} title="Toggle reveal sound">
            {sound ? 'Sound On' : 'Sound Off'}
          </button>
          <button className="icon-button" onClick={toggleFullscreen} title="Toggle full screen">
            {fullscreen ? <Minimize size={17} /> : <Maximize size={17} />}
            <span>{fullscreen ? 'Exit Fullscreen' : 'Fullscreen'}</span>
          </button>
          <button className="icon-button" onClick={openAdmin}><Settings size={17} /><span>Organizer</span></button>
        </div>
      </header>

      <section className="hero">
        <div className="eyebrow"><span className="eyebrow-line" /> THE AUCTION BEGINS HERE <span className="eyebrow-line" /></div>
        <h1>CAPTAIN <span>REVEAL</span></h1>
        <p className="hero-copy">12 SPONSORS <b>•</b> 12 CAPTAINS <b>•</b> 12 TEAMS</p>
        <div className="progress-wrap">
          <div className="progress-label"><span>CAPTAINS ASSIGNED</span><strong>{assignedCount.toString().padStart(2, '0')} <i>/ 12</i></strong></div>
          <div className="progress-track"><div className="progress-value" style={{ width: `${assignedCount / 12 * 100}%` }} /></div>
        </div>
      </section>

      {showFinal ? (
        <section className="results-section">
          <div className="section-heading">
            <div><span className="small-kicker">OFFICIAL ALLOCATION</span><h2>Final Team Board</h2></div>
            <button className="secondary-btn" onClick={() => setShowFinal(false)}><ArrowLeft size={16} /> Back to Cards</button>
          </div>
          {assignedCount === 0 ? <div className="empty-state">No captains have been assigned yet.</div> : (
            <div className="results-grid">
              {orderedAssignments.map(a => (
                <div className="result-card" key={a.card}>
                  <div className="result-number">{String(a.card).padStart(2, '0')}</div>
                  <PlayerImage src={a.captainImage} name={a.captainName} />
                  <div className="result-info"><span className="result-sponsor">{a.sponsor}</span><h3>{a.captainName}</h3>{a.department && <p>{a.department}</p>}</div>
                </div>
              ))}
            </div>
          )}
          <div className="results-actions">
            <button className="primary-btn" onClick={exportCsv}><Download size={17} /> Export CSV</button>
            <button className="secondary-btn" onClick={() => window.print()}>Print Results</button>
          </div>
        </section>
      ) : (
        <section className="reveal-layout">
          <div className="board-heading">
            <div><span className="small-kicker">CHOOSE YOUR DESTINY</span><h2>Mystery Cards</h2></div>
            <div className="board-status"><span className={`status-dot ${mapping ? 'ready' : ''}`} />{mapping ? 'DRAW READY' : 'DRAW NOT PREPARED'}</div>
          </div>

          {!mapping && <div className="notice"><LockKeyhole size={18} /><span>The 12 captain identities are hidden. Organizer must set up the captains and prepare the draw before the reveal begins.</span></div>}

          <div className="card-grid">
            {Array.from({ length: 12 }, (_, i) => i + 1).map(number => {
              const a = assignments[number]
              const isSelected = selectedCard === number
              return (
                <motion.button
                  key={number}
                  className={`mystery-card ${a ? 'assigned' : ''} ${isSelected ? 'selected' : ''}`}
                  onClick={() => clickCard(number)}
                  whileHover={!a ? { y: -4, scale: 1.015 } : {}}
                  whileTap={!a ? { scale: 0.985 } : {}}
                  aria-label={a ? `Card ${number}, assigned to ${a.sponsor}, captain ${a.captainName}` : `Select mystery card ${number}`}
                >
                  {a ? (
                    <div className="assigned-face">
                      <PlayerImage src={a.captainImage} name={a.captainName} />
                      <div className="assigned-overlay"><span>CAPTAIN ASSIGNED</span><strong>{a.captainName}</strong><small>{a.sponsor}</small></div>
                      <div className="card-number revealed-number">{String(number).padStart(2, '0')}</div>
                    </div>
                  ) : (
                    <div className="mystery-face">
                      <div className="card-orbit orbit-one" /><div className="card-orbit orbit-two" />
                      <div className="card-number">{String(number).padStart(2, '0')}</div>
                      <div className="mystery-symbol"><ShieldCheck size={29} strokeWidth={1.5} /></div>
                      <div className="card-bottom"><span>MYSTERY CAPTAIN</span><span className="mini-star">✦</span></div>
                    </div>
                  )}
                </motion.button>
              )
            })}
          </div>

          <div className="sponsor-panel">
            <div className="sponsor-field">
              <label htmlFor="sponsor-name">CURRENT SPONSOR</label>
              <input id="sponsor-name" value={currentSponsor} onChange={e => setCurrentSponsor(e.target.value)} placeholder="Enter sponsor name before selecting a card" />
            </div>
            <div className="panel-actions">
              <button className="secondary-btn" onClick={() => setShowFinal(true)}><Users size={17} /> Final Team Board</button>
              {assignedCount === 12 && <span className="complete-label"><Check size={16} /> ALL 12 ASSIGNED</span>}
            </div>
          </div>
        </section>
      )}

      <footer className="footer"><span>ONE LEAGUE</span><i>•</i><span>ONE TEAM</span><i>•</i><span>ONE FAMILY</span><div>SMVITM · SPL SEASON 2</div></footer>

      <AnimatePresence>
        {revealed && !confirm && (
          <motion.div className="modal-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div className="reveal-modal" initial={{ opacity: 0, y: 28, scale: 0.94, rotateX: 8 }} animate={{ opacity: 1, y: 0, scale: 1, rotateX: 0 }} exit={{ opacity: 0, scale: 0.96 }} transition={{ type: 'spring', stiffness: 160, damping: 20 }}>
              <button className="modal-close" onClick={() => setRevealed(null)} aria-label="Close reveal"><X size={20} /></button>
              <div className="reveal-spark"><Sparkles size={19} /> CAPTAIN REVEALED <Sparkles size={19} /></div>
              <div className="reveal-image-wrap"><PlayerImage src={revealed.captainImage} name={revealed.captainName} /></div>
              <span className="small-kicker">CARD {String(revealed.card).padStart(2, '0')} · CAPTAIN ASSIGNED</span>
              <h2>{revealed.captainName}</h2>
              {revealed.department && <p className="reveal-detail">{revealed.department}</p>}
              {revealed.details && <p className="reveal-detail">{revealed.details}</p>}
              <div className="sponsor-ribbon"><span>SPONSOR</span><strong>{revealed.sponsor}</strong></div>
              <button className="primary-btn wide-btn" onClick={() => setRevealed(null)}>Return to Team Board</button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {confirm && (
          <motion.div className="modal-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div className="confirm-modal" initial={{ opacity: 0, y: 20, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, scale: 0.97 }}>
              <div className="confirm-icon">{confirm.type === 'reset' ? <AlertTriangle size={24} /> : confirm.type === 'prepare' ? <LockKeyhole size={24} /> : <Sparkles size={24} />}</div>
              <h2>{confirm.type === 'reset' ? 'Reset all assignments?' : confirm.type === 'prepare' ? 'Prepare and lock the draw?' : 'Reveal this captain?'}</h2>
              <p>{confirm.type === 'reset' ? 'This clears all sponsor assignments and the current draw from this browser. Captain setup will remain.' : confirm.type === 'prepare' ? 'The 12 captain identities will be randomly mapped to the 12 numbered cards. This draw stays fixed until reset.' : `Card ${String(confirm.number).padStart(2, '0')} will reveal its captain and assign that captain to ${currentSponsor.trim()}. This cannot be undone from the public screen.`}</p>
              <div className="confirm-actions">
                <button className="secondary-btn" onClick={() => { setConfirm(null); setSelectedCard(null) }}><X size={16} /> Cancel</button>
                <button className={confirm.type === 'reset' ? 'danger-btn' : 'primary-btn'} onClick={confirm.type === 'reset' ? commitReset : confirm.type === 'prepare' ? commitDraw : commitReveal}><Check size={16} /> {confirm.type === 'reset' ? 'Reset Event' : confirm.type === 'prepare' ? 'Prepare Draw' : 'Confirm Reveal'}</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showAdmin && (
          <motion.div className="admin-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.aside className="admin-panel" initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', stiffness: 180, damping: 24 }}>
              <div className="admin-header">
                <div><span className="small-kicker">CONTROL ROOM</span><h2>Organizer Setup</h2></div>
                <button className="icon-button" onClick={() => setShowAdmin(false)}><X size={18} /><span>Close</span></button>
              </div>
              {!unlocked ? (
                <form className="pin-form" onSubmit={unlockAdmin}>
                  <div className="lock-large"><LockKeyhole size={30} /></div>
                  <h3>Organizer access</h3>
                  <p>Enter your organizer PIN to edit captain details and draw settings.</p>
                  <label htmlFor="pin">Organizer PIN</label>
                  <input id="pin" type="password" value={adminPin} onChange={e => setAdminPin(e.target.value)} placeholder="Enter PIN" autoFocus />
                  <button className="primary-btn wide-btn" type="submit">Unlock Controls</button>
                  <small>Default demo PIN: 2026. Change it before your event.</small>
                </form>
              ) : (
                <div className="admin-content">
                  <div className="admin-warning"><AlertTriangle size={18} /><span>Captain photos are loaded from the local <code>public/players/</code> folder and are publicly accessible once deployed. Settings are saved in this browser only, and the PIN is a convenience gate, not real security. Use an authenticated backend for a secure public draw.</span></div>
                  {missingImages.length > 0 && (
                    <div className="admin-warning"><AlertTriangle size={18} /><span>Missing image files: {missingImages.map(m => m.split('/').pop()).join(', ')}. Add these files to the <code>public/players/</code> folder and redeploy. Those captains show a placeholder until then.</span></div>
                  )}
                  <div className="setup-section-title"><span>01</span><div><h3>Captain identities</h3><p>Enter the 12 captain names. Photos are the local files player1.jpg to player12.jpg.</p></div></div>
                  <div className="captain-editor-list">
                    {editingCaptains.map((c, i) => (
                      <div className="captain-editor" key={c.id}>
                        <div className="editor-number">{String(i + 1).padStart(2, '0')}</div>
                        <div className="editor-photo">
                          <PlayerImage src={PLAYER_IMAGES[i]} name={c.name || `Captain ${i + 1}`} />
                        </div>
                        <div className="editor-fields">
                          <div className="editor-file-label">Image: /players/player{i + 1}.jpg</div>
                          <input value={c.name} onChange={e => updateCaptain(i, 'name', e.target.value)} placeholder={`Captain ${i + 1} name`} />
                          <input value={c.department} onChange={e => updateCaptain(i, 'department', e.target.value)} placeholder="Department (optional)" />
                          <input value={c.details} onChange={e => updateCaptain(i, 'details', e.target.value)} placeholder="Player detail (optional)" />
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="setup-section-title"><span>02</span><div><h3>Sponsor names</h3><p>Optional: pre-fill the 12 sponsors, or enter them live.</p></div></div>
                  <div className="sponsor-editor-list">
                    {editingSponsors.map((s, i) => <div className="sponsor-editor" key={i}><span>{String(i + 1).padStart(2, '0')}</span><input value={s} onChange={e => setEditingSponsors(prev => prev.map((v, j) => j === i ? e.target.value : v))} placeholder={`Sponsor ${i + 1} name`} /></div>)}
                  </div>
                  <div className="setup-section-title"><span>03</span><div><h3>Organizer security</h3><p>Change the demo PIN.</p></div></div>
                  <label className="field-label" htmlFor="new-pin">New organizer PIN</label>
                  <input className="pin-change" id="new-pin" value={newPin} onChange={e => setNewPin(e.target.value)} placeholder="Choose a PIN" />
                  <div className="admin-bottom-actions">
                    <button className="secondary-btn" onClick={() => { setEditingCaptains(captains.map(c => ({...c}))); setEditingSponsors([...sponsors]); setShowAdmin(false) }}>Cancel</button>
                    <button className="primary-btn" onClick={saveSetup}><Save size={16} /> Save Setup</button>
                  </div>
                  <div className="admin-bottom-actions">
                    <button className="secondary-btn" onClick={prepareDraw}><ShieldCheck size={16} /> Prepare Draw</button>
                    <button className="danger-btn" onClick={resetEvent}><RotateCcw size={16} /> Reset Event</button>
                  </div>
                  <div className="setup-note"><EyeOff size={16} /><span>Keep this organizer panel off the projector while configuring the real captain data.</span></div>
                </div>
              )}
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {message && <motion.div className="toast" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}><AlertTriangle size={17} />{message}<button onClick={() => setMessage('')}><X size={15} /></button></motion.div>}
      </AnimatePresence>
    </main>
  )
}

export default App
