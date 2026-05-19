import { useState, useEffect, useRef } from 'react'

const CLAUDE_MODEL = 'claude-sonnet-4-20250514'

const styles = `
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #0d0804; min-height: 100vh; }
  #root { min-height: 100vh; }
  .app { max-width: 430px; margin: 0 auto; min-height: 100vh; display: flex; flex-direction: column; background: #0d0804; }
  .header { background: #1a1008; padding: 1.2rem 1.25rem 0.8rem; text-align: center; border-bottom: 1px solid #3a2a10; }
  .header h1 { font-size: 24px; font-weight: 600; color: #e8c87a; letter-spacing: 1px; }
  .header p { font-size: 12px; color: #7a5a28; margin-top: 2px; }
  .tabs { display: flex; background: #1a1008; border-bottom: 1px solid #3a2a10; }
  .tab { flex: 1; padding: 10px 4px 8px; font-size: 11px; font-weight: 500; border: none; background: transparent; color: #7a5a28; cursor: pointer; display: flex; flex-direction: column; align-items: center; gap: 3px; transition: color 0.15s; }
  .tab.active { color: #e8c87a; border-bottom: 2px solid #e8c87a; }
  .tab-icon { font-size: 20px; }
  .content { flex: 1; padding: 1rem; overflow-y: auto; }
  .upload-zone { border: 1.5px dashed #3a2a10; border-radius: 12px; padding: 2rem 1rem; text-align: center; cursor: pointer; margin-bottom: 10px; color: #7a5a28; font-size: 14px; background: #1a1008; }
  .upload-zone:active { background: #221508; }
  .upload-icon { font-size: 40px; display: block; margin-bottom: 8px; }
  .btn { width: 100%; padding: 13px; border-radius: 10px; font-size: 14px; font-weight: 500; cursor: pointer; border: 1px solid #3a2a10; background: #1a1008; color: #c8a858; margin-bottom: 8px; display: flex; align-items: center; justify-content: center; gap: 8px; transition: background 0.15s; }
  .btn:active { background: #221508; }
  .btn.primary { background: #e8c87a; color: #1a1008; border-color: #e8c87a; }
  .btn.primary:active { background: #d4b060; }
  .btn.danger { background: transparent; color: #c06050; border-color: #5a2a20; }
  .bottle-item { display: flex; align-items: center; gap: 10px; padding: 10px 12px; background: #1a1008; border-radius: 10px; margin-bottom: 6px; border: 0.5px solid #3a2a10; }
  .bottle-info { flex: 1; }
  .bottle-name { font-size: 14px; font-weight: 500; color: #e8d4a0; }
  .bottle-cat { font-size: 12px; color: #7a5a28; margin-top: 2px; }
  .bottle-price { font-size: 14px; font-weight: 600; color: #a08040; }
  .bottle-del { background: none; border: none; color: #5a3a20; font-size: 18px; cursor: pointer; padding: 4px; }
  .total-bar { background: #e8c87a; border-radius: 10px; padding: 12px 16px; display: flex; justify-content: space-between; align-items: center; margin-top: 8px; }
  .total-bar span { font-size: 13px; color: #5a3a10; font-weight: 500; }
  .total-bar strong { font-size: 20px; color: #1a1008; }
  .drink-card { background: #1a1008; border: 0.5px solid #3a2a10; border-radius: 12px; padding: 1rem; margin-bottom: 8px; cursor: pointer; }
  .drink-card:active { background: #221508; }
  .drink-header { display: flex; justify-content: space-between; align-items: flex-start; gap: 8px; }
  .drink-name { font-size: 15px; font-weight: 600; color: #e8d4a0; }
  .drink-tag { font-size: 11px; padding: 3px 10px; border-radius: 20px; background: #2a1a08; color: #a08040; border: 0.5px solid #4a2a10; white-space: nowrap; }
  .drink-desc { font-size: 13px; color: #7a5a38; margin-top: 6px; line-height: 1.5; }
  .drink-detail { margin-top: 10px; padding-top: 10px; border-top: 0.5px solid #3a2a10; font-size: 13px; color: #a08060; line-height: 1.7; }
  .chat-wrap { display: flex; flex-direction: column; height: calc(100vh - 160px); }
  .chat-msgs { flex: 1; overflow-y: auto; display: flex; flex-direction: column; gap: 8px; padding-bottom: 8px; }
  .msg { padding: 10px 14px; border-radius: 12px; font-size: 14px; line-height: 1.6; max-width: 88%; white-space: pre-wrap; }
  .msg.bot { background: #1a1008; color: #e8d4a0; align-self: flex-start; border: 0.5px solid #3a2a10; }
  .msg.user { background: #e8c87a; color: #1a1008; align-self: flex-end; font-weight: 500; }
  .quick-btns { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 8px; }
  .quick-btn { font-size: 12px; padding: 6px 12px; border-radius: 20px; border: 0.5px solid #3a2a10; background: #1a1008; color: #a08040; cursor: pointer; }
  .quick-btn:active { background: #221508; }
  .chat-row { display: flex; gap: 8px; }
  .chat-row input { flex: 1; padding: 11px 14px; border-radius: 10px; border: 0.5px solid #3a2a10; background: #1a1008; color: #e8d4a0; font-size: 14px; outline: none; }
  .chat-row input::placeholder { color: #4a3a20; }
  .chat-row button { padding: 11px 16px; background: #e8c87a; color: #1a1008; border: none; border-radius: 10px; cursor: pointer; font-size: 18px; }
  .loading { text-align: center; padding: 1.5rem; color: #7a5a28; font-size: 13px; }
  .spin { display: inline-block; animation: spin 1s linear infinite; }
  @keyframes spin { to { transform: rotate(360deg); } }
  .section-title { font-size: 12px; color: #7a5a28; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px; margin-top: 4px; }
  .empty { text-align: center; padding: 2rem 1rem; color: #5a3a18; font-size: 14px; line-height: 1.7; }
`

async function callClaude(systemPrompt, userMsg, imageB64, imageType) {
  const content = []
  if (imageB64) content.push({ type: 'image', source: { type: 'base64', media_type: imageType, data: imageB64 } })
  content.push({ type: 'text', text: userMsg })
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: CLAUDE_MODEL, max_tokens: 1000, system: systemPrompt, messages: [{ role: 'user', content }] })
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
  const [tragoAbierto, setTragoAbierto] = useState(null)
  const [chatMsgs, setChatMsgs] = useState([{ role: 'bot', text: '¡Bienvenido a Kiki Battenders! 🥃 Preguntame lo que quieras sobre tragos, técnicas o inventame algo nuevo.' }])
  const [chatInput, setChatInput] = useState('')
  const [loadingBarra, setLoadingBarra] = useState(false)
  const [loadingTragos, setLoadingTragos] = useState(false)
  const [loadingChat, setLoadingChat] = useState(false)
  const msgsRef = useRef(null)

  useEffect(() => {
    localStorage.setItem('kb_botellas', JSON.stringify(botellas))
  }, [botellas])

  useEffect(() => {
    if (msgsRef.current) msgsRef.current.scrollTop = msgsRef.current.scrollHeight
  }, [chatMsgs])

  const agregarBotella = (b) => setBotellas(prev => [...prev, b])
  const eliminarBotella = (i) => setBotellas(prev => prev.filter((_, idx) => idx !== i))

  const analizarFoto = async (file) => {
    setLoadingBarra(true)
    const reader = new FileReader()
    reader.onload = async (e) => {
      const b64 = e.target.result.split(',')[1]
      try {
        const txt = await callClaude(
          'Sos un bartender experto. Analizá la foto y devolvé SOLO un JSON array sin markdown. Cada objeto: {"nombre":"...","tipo":"...","precio_ars": número}. precio_ars es precio estimado en pesos argentinos 2025.',
          'Identificá todas las botellas de la foto.',
          b64, file.type
        )
        const items = JSON.parse(txt.replace(/```json|```/g, '').trim())
        items.forEach(it => agregarBotella({ nombre: it.nombre, tipo: it.tipo, precio: it.precio_ars || 0 }))
      } catch (e) { alert('No pude analizar la imagen. Probá de nuevo.') }
      setLoadingBarra(false)
    }
    reader.readAsDataURL(file)
  }

  const agregarManual = async () => {
    const nombre = window.prompt('Nombre de la botella:')
    if (!nombre) return
    const tipo = window.prompt('Tipo (ej: Whisky, Gin, Vodka...):') || 'Bebida'
    setLoadingBarra(true)
    try {
      const txt = await callClaude(
        'Devolvé SOLO un número entero en pesos argentinos 2025, sin texto ni símbolos.',
        `Precio promedio de: ${nombre}`
      )
      const precio = parseInt(txt.replace(/\D/g, '')) || 0
      agregarBotella({ nombre, tipo, precio })
    } catch {
      agregarBotella({ nombre, tipo, precio: 0 })
    }
    setLoadingBarra(false)
  }

  const sugerirTragos = async () => {
    if (!botellas.length) { alert('Primero agregá botellas a tu barra.'); return }
    setLoadingTragos(true)
    setTragos([])
    try {
      const lista = botellas.map(b => b.nombre).join(', ')
      const txt = await callClaude(
        'Sos un bartender creativo. Devolvé SOLO un JSON array sin markdown. Cada objeto: {"nombre":"...","descripcion_corta":"...","receta":"...","guarnicion":"..."}.',
        `Con estas bebidas: ${lista}. Sugerí 4 tragos que puedo hacer, incluyendo clásicos y alguna combinación creativa.`
      )
      setTragos(JSON.parse(txt.replace(/```json|```/g, '').trim()))
    } catch { }
    setLoadingTragos(false)
  }

  const sorprendeme = async () => {
    const bebidas = botellas.length ? botellas.map(b => b.nombre).join(', ') : 'whisky, gin, vermouth'
    setLoadingTragos(true)
    setTragos([])
    try {
      const txt = await callClaude(
        'Sos un bartender creativo. Devolvé SOLO un JSON array con UN objeto inventado: {"nombre":"...","descripcion_corta":"...","receta":"...","guarnicion":"..."}.',
        `Inventame un trago original y con nombre divertido usando: ${bebidas}.`
      )
      const parsed = JSON.parse(txt.replace(/```json|```/g, '').trim())
      setTragos(Array.isArray(parsed) ? parsed : [parsed])
    } catch { }
    setLoadingTragos(false)
  }

  const enviarChat = async (texto) => {
    const txt = texto || chatInput.trim()
    if (!txt) return
    setChatInput('')
    setChatMsgs(prev => [...prev, { role: 'user', text: txt }])
    setLoadingChat(true)
    const inventario = botellas.length ? ' Mi barra tiene: ' + botellas.map(b => b.nombre).join(', ') + '.' : ''
    try {
      const reply = await callClaude(
        `Sos Kiki Battenders, un bartender amigable y experto. Respondé en español rioplatense, conciso, con emojis ocasionales.${inventario}`,
        txt
      )
      setChatMsgs(prev => [...prev, { role: 'bot', text: reply }])
    } catch {
      setChatMsgs(prev => [...prev, { role: 'bot', text: 'Hubo un error. Probá de nuevo.' }])
    }
    setLoadingChat(false)
  }

  const total = botellas.reduce((a, b) => a + (b.precio || 0), 0)

  return (
    <>
      <style>{styles}</style>
      <div className="app">
        <div className="header">
          <h1>🥃 Kiki Battenders</h1>
          <p>Tu barra personal con IA</p>
        </div>

        <div className="tabs">
          {[['barra','🍾','Mi barra'],['tragos','✨','Tragos'],['chat','💬','Bartender']].map(([id, icon, label]) => (
            <button key={id} className={`tab ${tab === id ? 'active' : ''}`} onClick={() => setTab(id)}>
              <span className="tab-icon">{icon}</span>{label}
            </button>
          ))}
        </div>

        <div className="content">
          {tab === 'barra' && (
            <>
              <label className="upload-zone">
                <span className="upload-icon">📸</span>
                Sacá una foto de tu barra<br />
                <span style={{ fontSize: 12 }}>La IA identifica las botellas automáticamente</span>
                <input type="file" accept="image/*" capture="environment" style={{ display: 'none' }} onChange={e => e.target.files[0] && analizarFoto(e.target.files[0])} />
              </label>
              <button className="btn" onClick={agregarManual}>➕ Agregar botella manualmente</button>
              {loadingBarra && <div className="loading"><span className="spin">⏳</span> Analizando...</div>}
              {botellas.length > 0 && (
                <>
                  <div className="section-title" style={{ marginTop: 12 }}>Tu barra ({botellas.length} botellas)</div>
                  {botellas.map((b, i) => (
                    <div key={i} className="bottle-item">
                      <div style={{ fontSize: 24 }}>🍾</div>
                      <div className="bottle-info">
                        <div className="bottle-name">{b.nombre}</div>
                        <div className="bottle-cat">{b.tipo}</div>
                      </div>
                      <div className="bottle-price">{b.precio ? '$' + b.precio.toLocaleString('es-AR') : '—'}</div>
                      <button className="bottle-del" onClick={() => eliminarBotella(i)}>✕</button>
                    </div>
                  ))}
                  <div className="total-bar">
                    <span>Valor total de tu barra</span>
                    <strong>${total.toLocaleString('es-AR')}</strong>
                  </div>
                </>
              )}
              {!botellas.length && !loadingBarra && (
                <div className="empty">Todavía no cargaste botellas.<br />Sacá una foto de tu barra o agregá manualmente. 🍾</div>
              )}
            </>
          )}

          {tab === 'tragos' && (
            <>
              <button className="btn primary" onClick={sugerirTragos}>✨ ¿Qué puedo hacer con lo que tengo?</button>
              <button className="btn" onClick={sorprendeme}>🎲 Sorprendeme — inventá algo nuevo</button>
              {loadingTragos && <div className="loading"><span className="spin">⏳</span> Pensando tragos...</div>}
              {tragos.map((t, i) => (
                <div key={i} className="drink-card" onClick={() => setTragoAbierto(tragoAbierto === i ? null : i)}>
                  <div className="drink-header">
                    <div className="drink-name">{t.nombre}</div>
                    <div className="drink-tag">{t.guarnicion || 'classic'}</div>
                  </div>
                  <div className="drink-desc">{t.descripcion_corta}</div>
                  {tragoAbierto === i && (
                    <div className="drink-detail">{t.receta}</div>
                  )}
                </div>
              ))}
              {!tragos.length && !loadingTragos && (
                <div className="empty">Tocá un botón arriba para ver qué tragos podés hacer con tu barra. 🍹</div>
              )}
            </>
          )}

          {tab === 'chat' && (
            <div className="chat-wrap">
              <div className="chat-msgs" ref={msgsRef}>
                {chatMsgs.map((m, i) => (
                  <div key={i} className={`msg ${m.role}`}>{m.text}</div>
                ))}
                {loadingChat && <div className="msg bot"><span className="spin">⏳</span></div>}
              </div>
              <div className="quick-btns">
                {['Old Fashioned','Negroni','Con whisky','Martini seco','Inventame algo'].map(q => (
                  <button key={q} className="quick-btn" onClick={() => enviarChat('¿Cómo hago un ' + q + '?')}>{q}</button>
                ))}
              </div>
              <div className="chat-row">
                <input
                  value={chatInput}
                  onChange={e => setChatInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && enviarChat()}
                  placeholder="Preguntá algo..."
                />
                <button onClick={() => enviarChat()}>➤</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
