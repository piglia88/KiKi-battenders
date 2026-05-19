import { useState, useEffect, useRef } from 'react'

const CLAUDE_MODEL = 'claude-sonnet-4-5'

const css = `
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=Inter:wght@400;500;600&display=swap');

* { box-sizing: border-box; margin: 0; padding: 0; }
html, body, #root { height: 100%; background: #080604; }

.app {
  width: 100%;
  max-width: 100%;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: #080604;
  font-family: 'Inter', sans-serif;
}

/* HEADER */
.header {
  padding: 2rem 1.5rem 1.2rem;
  text-align: center;
  position: relative;
  border-bottom: 1px solid #2a1f0e;
}
.header::before {
  content: '';
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 3px;
  background: linear-gradient(90deg, transparent, #c9a227, transparent);
}
.logo {
  font-family: 'Playfair Display', serif;
  font-size: 32px;
  font-weight: 900;
  color: #c9a227;
  letter-spacing: 2px;
  line-height: 1;
}
.logo span { color: #fff; }
.tagline {
  font-size: 11px;
  color: #6b5228;
  letter-spacing: 3px;
  text-transform: uppercase;
  margin-top: 6px;
}

/* TABS */
.tabs {
  display: flex;
  background: #0e0a04;
  border-bottom: 1px solid #2a1f0e;
  padding: 0 0.5rem;
}
.tab {
  flex: 1;
  padding: 12px 4px 10px;
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 1.5px;
  text-transform: uppercase;
  border: none;
  background: transparent;
  color: #4a3a1e;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
  transition: color 0.2s;
  position: relative;
}
.tab.active { color: #c9a227; }
.tab.active::after {
  content: '';
  position: absolute;
  bottom: 0; left: 20%; right: 20%;
  height: 2px;
  background: #c9a227;
  border-radius: 2px 2px 0 0;
}
.tab-icon { font-size: 22px; }

/* CONTENT */
.content { flex: 1; padding: 1.25rem; overflow-y: auto; max-width: 500px; width: 100%; margin: 0 auto; }

/* UPLOAD ZONE */
.upload-zone {
  border: 1px solid #2a1f0e;
  border-radius: 16px;
  padding: 2.5rem 1rem;
  text-align: center;
  cursor: pointer;
  margin-bottom: 12px;
  background: #0e0a04;
  position: relative;
  overflow: hidden;
  transition: border-color 0.2s;
}
.upload-zone:active { border-color: #c9a227; }
.upload-zone::before {
  content: '';
  position: absolute;
  inset: 0;
  background: radial-gradient(ellipse at center, #1a1205 0%, transparent 70%);
}
.upload-icon { font-size: 48px; display: block; margin-bottom: 10px; position: relative; }
.upload-title { font-size: 16px; font-weight: 600; color: #e8d08a; position: relative; }
.upload-sub { font-size: 12px; color: #5a4520; margin-top: 4px; position: relative; }

/* BUTTONS */
.btn {
  width: 100%;
  padding: 14px;
  border-radius: 12px;
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.5px;
  cursor: pointer;
  border: 1px solid #2a1f0e;
  background: #0e0a04;
  color: #a07830;
  margin-bottom: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: all 0.2s;
}
.btn:active { background: #1a1205; }
.btn.gold {
  background: #c9a227;
  color: #080604;
  border-color: #c9a227;
  font-weight: 700;
}
.btn.gold:active { background: #b08f20; }

/* SECTION LABEL */
.section-label {
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 2px;
  text-transform: uppercase;
  color: #4a3a1e;
  margin: 16px 0 10px;
  display: flex;
  align-items: center;
  gap: 8px;
}
.section-label::after {
  content: '';
  flex: 1;
  height: 1px;
  background: #1a1205;
}

/* BOTTLE CARD */
.bottle-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  background: #0e0a04;
  border-radius: 12px;
  margin-bottom: 8px;
  border: 1px solid #1e1608;
  transition: border-color 0.2s;
}
.bottle-emoji { font-size: 28px; line-height: 1; }
.bottle-info { flex: 1; min-width: 0; }
.bottle-name { font-size: 14px; font-weight: 600; color: #e8d08a; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.bottle-type { font-size: 11px; color: #6b5228; margin-top: 2px; text-transform: uppercase; letter-spacing: 1px; }
.bottle-price { font-size: 15px; font-weight: 700; color: #c9a227; white-space: nowrap; }
.bottle-del { background: none; border: none; color: #3a2a10; font-size: 16px; cursor: pointer; padding: 6px; }
.bottle-del:active { color: #c05040; }

/* TOTAL */
.total-card {
  border-radius: 12px;
  padding: 16px 18px;
  margin-top: 10px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border: 1px solid #c9a227;
  background: #0e0a04;
}
.total-label { font-size: 11px; color: #6b5228; text-transform: uppercase; letter-spacing: 1.5px; font-weight: 600; }
.total-value { font-family: 'Playfair Display', serif; font-size: 26px; color: #c9a227; font-weight: 700; }

/* DRINK CARD */
.drink-card {
  background: #0e0a04;
  border: 1px solid #1e1608;
  border-radius: 14px;
  padding: 1rem 1.1rem;
  margin-bottom: 10px;
  cursor: pointer;
  transition: border-color 0.2s;
}
.drink-card:active { border-color: #c9a227; }
.drink-top { display: flex; justify-content: space-between; align-items: flex-start; gap: 8px; }
.drink-name { font-family: 'Playfair Display', serif; font-size: 17px; color: #e8d08a; font-weight: 700; line-height: 1.2; }
.drink-badge { font-size: 10px; padding: 4px 10px; border-radius: 20px; background: #1a1205; color: #8a6820; border: 1px solid #2a1f0e; white-space: nowrap; font-weight: 600; letter-spacing: 0.5px; }
.drink-desc { font-size: 13px; color: #6b5228; margin-top: 7px; line-height: 1.5; }
.drink-divider { height: 1px; background: #1a1205; margin: 10px 0; }
.drink-recipe { font-size: 13px; color: #a08050; line-height: 1.8; }
.drink-recipe strong { color: #c9a227; font-size: 10px; text-transform: uppercase; letter-spacing: 1.5px; display: block; margin-bottom: 6px; }
.drink-arrow { font-size: 12px; color: #3a2a10; margin-top: 8px; text-align: right; }

/* CHAT */
.chat-wrap { display: flex; flex-direction: column; height: calc(100vh - 170px); }
.chat-msgs { flex: 1; overflow-y: auto; display: flex; flex-direction: column; gap: 10px; padding-bottom: 12px; }
.msg { padding: 12px 16px; border-radius: 14px; font-size: 14px; line-height: 1.65; max-width: 86%; white-space: pre-wrap; }
.msg.bot { background: #0e0a04; color: #c8b07a; align-self: flex-start; border: 1px solid #1e1608; border-bottom-left-radius: 4px; }
.msg.user { background: #c9a227; color: #080604; align-self: flex-end; font-weight: 600; border-bottom-right-radius: 4px; }
.quick-row { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 10px; }
.quick-btn { font-size: 11px; padding: 6px 12px; border-radius: 20px; border: 1px solid #2a1f0e; background: #0e0a04; color: #7a5a28; cursor: pointer; font-weight: 600; letter-spacing: 0.5px; }
.quick-btn:active { border-color: #c9a227; color: #c9a227; }
.chat-row { display: flex; gap: 8px; }
.chat-input { flex: 1; padding: 12px 16px; border-radius: 12px; border: 1px solid #2a1f0e; background: #0e0a04; color: #e8d08a; font-size: 14px; outline: none; font-family: 'Inter', sans-serif; }
.chat-input::placeholder { color: #3a2a10; }
.chat-input:focus { border-color: #4a3820; }
.chat-send { padding: 12px 18px; background: #c9a227; color: #080604; border: none; border-radius: 12px; cursor: pointer; font-size: 18px; font-weight: 700; }
.chat-send:active { background: #b08f20; }

/* LOADING */
.loading { text-align: center; padding: 2rem; color: #4a3a1e; font-size: 13px; letter-spacing: 1px; }
.spin { display: inline-block; animation: spin 1s linear infinite; font-style: normal; }
@keyframes spin { to { transform: rotate(360deg); } }

/* EMPTY */
.empty { text-align: center; padding: 3rem 1rem; color: #3a2a10; font-size: 14px; line-height: 2; }
.empty-icon { font-size: 48px; display: block; margin-bottom: 12px; opacity: 0.5; }
`

async function callClaude(system, user, imgB64, imgType) {
  const content = []
  if (imgB64) content.push({ type: 'image', source: { type: 'base64', media_type: imgType, data: imgB64 } })
  content.push({ type: 'text', text: user })
  const res = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: CLAUDE_MODEL, max_tokens: 1000, system, messages: [{ role: 'user', content }] })
  })
  const data = await res.json()
  return data.content?.find(c => c.type === 'text')?.text || ''
}

export default function App() {
  const [tab, setTab] = useState('barra')
  const [botellas, setBotellas] = useState(() => {
    try { return JSON.parse(localStorage.getItem('kb_botellas') || '[]') } catch { return [] }
  })
  const [tragos, setTragos] = useState([])
  const [abierto, setAbierto] = useState(null)
  const [msgs, setMsgs] = useState([{ role: 'bot', text: 'Buenas noches. Soy tu bartender personal. ¿Qué estás buscando tomar esta noche? 🥃' }])
  const [input, setInput] = useState('')
  const [loadBarra, setLoadBarra] = useState(false)
  const [loadTragos, setLoadTragos] = useState(false)
  const [loadChat, setLoadChat] = useState(false)
  const msgsEnd = useRef(null)

  useEffect(() => { localStorage.setItem('kb_botellas', JSON.stringify(botellas)) }, [botellas])
  useEffect(() => { msgsEnd.current?.scrollIntoView({ behavior: 'smooth' }) }, [msgs])

  const addBotella = b => setBotellas(p => [...p, b])
  const delBotella = i => setBotellas(p => p.filter((_, idx) => idx !== i))

  const analizarFoto = file => {
    setLoadBarra(true)
    const r = new FileReader()
    r.onload = async e => {
      const b64 = e.target.result.split(',')[1]
      try {
        const txt = await callClaude(
          'Sos un experto en bebidas. Analizá la foto y devolvé SOLO un JSON array sin markdown. Cada objeto: {"nombre":"...","tipo":"...","precio_ars":número}. precio_ars es precio estimado en pesos argentinos 2025.',
          'Identificá todas las botellas.',
          b64, file.type
        )
        JSON.parse(txt.replace(/```json|```/g, '').trim()).forEach(it =>
          addBotella({ nombre: it.nombre, tipo: it.tipo, precio: it.precio_ars || 0 })
        )
      } catch { alert('No pude analizar la imagen.') }
      setLoadBarra(false)
    }
    r.readAsDataURL(file)
  }

  const agregarManual = async () => {
    const nombre = window.prompt('Nombre de la botella:')
    if (!nombre) return
    const tipo = window.prompt('Tipo (ej: Whisky, Gin, Vodka...):') || 'Bebida'
    setLoadBarra(true)
    try {
      const txt = await callClaude('Devolvé SOLO un número entero en pesos argentinos 2025, sin texto.', `Precio de: ${nombre}`)
      addBotella({ nombre, tipo, precio: parseInt(txt.replace(/\D/g, '')) || 0 })
    } catch { addBotella({ nombre, tipo, precio: 0 }) }
    setLoadBarra(false)
  }

  const sugerirTragos = async () => {
    if (!botellas.length) { alert('Primero agregá botellas a tu barra.'); return }
    setLoadTragos(true); setTragos([])
    try {
      const txt = await callClaude(
        'Sos un bartender creativo. Devolvé SOLO un JSON array sin markdown. Cada objeto: {"nombre":"...","descripcion_corta":"...","receta":"...","guarnicion":"..."}.',
        `Con estas bebidas: ${botellas.map(b => b.nombre).join(', ')}. Sugerí 4 tragos, incluí clásicos y alguno creativo.`
      )
      setTragos(JSON.parse(txt.replace(/```json|```/g, '').trim()))
    } catch { }
    setLoadTragos(false)
  }

  const sorprendeme = async () => {
    const bebidas = botellas.length ? botellas.map(b => b.nombre).join(', ') : 'whisky, gin, vermouth'
    setLoadTragos(true); setTragos([])
    try {
      const txt = await callClaude(
        'Bartender creativo. Devolvé SOLO un JSON array con UN objeto: {"nombre":"...","descripcion_corta":"...","receta":"...","guarnicion":"..."}.',
        `Inventame un trago original con nombre divertido usando: ${bebidas}.`
      )
      const p = JSON.parse(txt.replace(/```json|```/g, '').trim())
      setTragos(Array.isArray(p) ? p : [p])
    } catch { }
    setLoadTragos(false)
  }

  const enviar = async (texto) => {
    const txt = texto || input.trim()
    if (!txt) return
    setInput('')
    setMsgs(p => [...p, { role: 'user', text: txt }])
    setLoadChat(true)
    const inv = botellas.length ? ' Mi barra: ' + botellas.map(b => b.nombre).join(', ') + '.' : ''
    try {
      const reply = await callClaude(
        `Sos Kiki Battenders, bartender experto y sofisticado. Respondé en español rioplatense, conciso, elegante, con algún emoji ocasional.${inv}`,
        txt
      )
      setMsgs(p => [...p, { role: 'bot', text: reply }])
    } catch {
      setMsgs(p => [...p, { role: 'bot', text: 'Error de conexión. Probá de nuevo.' }])
    }
    setLoadChat(false)
  }

  const total = botellas.reduce((a, b) => a + (b.precio || 0), 0)

  return (
    <>
      <style>{css}</style>
      <div className="app">

        <div className="header">
          <div className="logo">KIKI <span>BATTENDERS</span></div>
          <div className="tagline">Tu barra personal · IA</div>
        </div>

        <div className="tabs">
          {[['barra','🍾','Mi Barra'],['tragos','🍸','Tragos'],['chat','💬','Bartender']].map(([id,icon,label]) => (
            <button key={id} className={`tab${tab===id?' active':''}`} onClick={() => setTab(id)}>
              <span className="tab-icon">{icon}</span>{label}
            </button>
          ))}
        </div>

        <div className="content">

          {tab === 'barra' && <>
            <label className="upload-zone">
              <span className="upload-icon">📸</span>
              <div className="upload-title">Fotografiá tu barra</div>
              <div className="upload-sub">La IA identifica las botellas automáticamente</div>
              <input type="file" accept="image/*" capture="environment" style={{display:'none'}} onChange={e => e.target.files[0] && analizarFoto(e.target.files[0])} />
            </label>
            <button className="btn" onClick={agregarManual}>＋ &nbsp;Agregar botella manualmente</button>
            {loadBarra && <div className="loading"><i className="spin">⏳</i>&nbsp; Analizando...</div>}
            {botellas.length > 0 && <>
              <div className="section-label">Inventario</div>
              {botellas.map((b,i) => (
                <div key={i} className="bottle-card">
                  <div className="bottle-emoji">🍾</div>
                  <div className="bottle-info">
                    <div className="bottle-name">{b.nombre}</div>
                    <div className="bottle-type">{b.tipo}</div>
                  </div>
                  <div className="bottle-price">{b.precio ? '$'+b.precio.toLocaleString('es-AR') : '—'}</div>
                  <button className="bottle-del" onClick={() => delBotella(i)}>✕</button>
                </div>
              ))}
              <div className="total-card">
                <div>
                  <div className="total-label">Valor total</div>
                  <div className="total-value">${total.toLocaleString('es-AR')}</div>
                </div>
                <span style={{fontSize:32}}>🥃</span>
              </div>
            </>}
            {!botellas.length && !loadBarra && (
              <div className="empty">
                <span className="empty-icon">🍾</span>
                Fotografiá tu barra o agregá<br/>botellas manualmente<br/>para empezar
              </div>
            )}
          </>}

          {tab === 'tragos' && <>
            <button className="btn gold" onClick={sugerirTragos}>✨ &nbsp;¿Qué puedo hacer con lo que tengo?</button>
            <button className="btn" onClick={sorprendeme}>🎲 &nbsp;Sorprendeme — inventá algo</button>
            {loadTragos && <div className="loading"><i className="spin">⏳</i>&nbsp; Preparando tragos...</div>}
            {tragos.map((t,i) => (
              <div key={i} className="drink-card" onClick={() => setAbierto(abierto===i?null:i)}>
                <div className="drink-top">
                  <div className="drink-name">{t.nombre}</div>
                  <div className="drink-badge">{t.guarnicion||'Classic'}</div>
                </div>
                <div className="drink-desc">{t.descripcion_corta}</div>
                {abierto === i && <>
                  <div className="drink-divider"/>
                  <div className="drink-recipe">
                    <strong>Preparación</strong>
                    {t.receta}
                  </div>
                </>}
                <div className="drink-arrow">{abierto===i ? '▲ cerrar' : '▼ ver receta'}</div>
              </div>
            ))}
            {!tragos.length && !loadTragos && (
              <div className="empty">
                <span className="empty-icon">🍸</span>
                Tocá un botón para ver<br/>qué podés preparar con<br/>tu barra esta noche
              </div>
            )}
          </>}

          {tab === 'chat' && (
            <div className="chat-wrap">
              <div className="chat-msgs">
                {msgs.map((m,i) => <div key={i} className={`msg ${m.role}`}>{m.text}</div>)}
                {loadChat && <div className="msg bot"><i className="spin">⏳</i></div>}
                <div ref={msgsEnd}/>
              </div>
              <div className="quick-row">
                {['Old Fashioned','Negroni','Con whisky','Martini seco','Inventame algo'].map(q => (
                  <button key={q} className="quick-btn" onClick={() => enviar(q)}>{q}</button>
                ))}
              </div>
              <div className="chat-row">
                <input className="chat-input" value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key==='Enter'&&enviar()} placeholder="Preguntá algo..." />
                <button className="chat-send" onClick={() => enviar()}>➤</button>
              </div>
            </div>
          )}

        </div>
      </div>
    </>
  )
}
