import { useState, useEffect, useRef } from 'react'

const MODEL = 'claude-sonnet-4-5'

const css = `
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600;700&family=Inter:wght@300;400;500;600&display=swap');

*{box-sizing:border-box;margin:0;padding:0;}
html,body,#root{height:100%;background:#05040A;}
.app{width:100%;min-height:100vh;display:flex;flex-direction:column;background:#05040A;font-family:'Inter',sans-serif;color:#E8D9B8;}

.header{padding:2rem 1.5rem 1.5rem;text-align:center;border-bottom:1px solid #1C1508;}
.header-line{width:40px;height:1px;background:#8B6914;margin:0 auto 1rem;}
.logo{font-family:'Cormorant Garamond',serif;font-size:34px;font-weight:700;color:#C9A227;letter-spacing:4px;line-height:1;}
.logo-sub{font-size:9px;color:#5A4520;letter-spacing:5px;text-transform:uppercase;margin-top:6px;}

.nav{display:flex;background:#05040A;border-bottom:1px solid #1C1508;}
.nav-btn{flex:1;padding:14px 4px 12px;font-size:9px;font-weight:600;letter-spacing:2px;text-transform:uppercase;border:none;background:transparent;color:#3A2A10;cursor:pointer;display:flex;flex-direction:column;align-items:center;gap:4px;position:relative;transition:color 0.2s;}
.nav-btn.on{color:#C9A227;}
.nav-btn.on::after{content:'';position:absolute;bottom:0;left:25%;right:25%;height:1px;background:#C9A227;}
.nav-icon{font-size:18px;}

.screen{flex:1;overflow-y:auto;padding:1.5rem;}

.valor-card{background:#0E0A04;border:1px solid #C9A22730;border-radius:8px;padding:1.25rem;margin-bottom:1.5rem;display:flex;justify-content:space-between;align-items:center;}
.valor-label{font-size:9px;letter-spacing:3px;text-transform:uppercase;color:#3A2A10;}
.valor-num{font-family:'Cormorant Garamond',serif;font-size:32px;color:#C9A227;line-height:1;}
.valor-sub{font-size:11px;color:#3A2A10;margin-top:2px;}

.shelf-label{font-size:9px;letter-spacing:3px;text-transform:uppercase;color:#3A2A10;margin-bottom:1rem;}
.shelf-surface{background:#0E0A04;border:1px solid #1C1508;border-radius:4px;padding:1rem;display:flex;flex-wrap:wrap;gap:10px;min-height:80px;align-items:flex-start;}
.shelf-empty{width:100%;text-align:center;font-size:13px;color:#3A2A10;padding:1.5rem 0;font-style:italic;}

.bottle{display:flex;flex-direction:column;align-items:center;gap:5px;cursor:pointer;width:calc(25% - 8px);position:relative;}
.bottle-img{width:52px;height:52px;border-radius:8px;object-fit:cover;border:1px solid #2A1A08;}
.bottle-emoji-box{width:52px;height:52px;border-radius:8px;background:#1A1205;border:1px solid #2A1A08;display:flex;align-items:center;justify-content:center;font-size:26px;}
.bottle.active .bottle-img{border-color:#C9A227;}
.bottle.active .bottle-emoji-box{border-color:#C9A227;}
.bottle-qty{position:absolute;top:-6px;right:2px;background:#C9A227;color:#05040A;font-size:10px;font-weight:700;border-radius:10px;padding:1px 6px;min-width:18px;text-align:center;}
.bottle-label{font-size:10px;color:#5A4520;text-align:center;line-height:1.3;max-width:60px;word-break:break-word;}
.bottle.active .bottle-label{color:#C9A227;}

.bottle-detail{background:#0E0A04;border:1px solid #C9A22740;border-radius:8px;padding:1.25rem;margin-top:12px;margin-bottom:1rem;}
.bd-top{display:flex;gap:12px;margin-bottom:12px;}
.bd-foto{width:64px;height:64px;border-radius:8px;object-fit:cover;border:1px solid #2A1A08;flex-shrink:0;}
.bd-foto-empty{width:64px;height:64px;border-radius:8px;background:#1A1205;border:1px dashed #2A1A08;display:flex;align-items:center;justify-content:center;font-size:28px;flex-shrink:0;cursor:pointer;}
.bd-info{flex:1;}
.bd-name{font-family:'Cormorant Garamond',serif;font-size:20px;color:#E8D08A;line-height:1.1;}
.bd-type{font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#5A4520;margin-top:3px;}
.bd-price{font-family:'Cormorant Garamond',serif;font-size:18px;color:#C9A227;margin-top:4px;}
.bd-close{background:none;border:none;color:#3A2A10;cursor:pointer;font-size:20px;padding:0;}

.qty-row{display:flex;align-items:center;gap:12px;margin-bottom:12px;padding:10px 0;border-top:1px solid #1C1508;border-bottom:1px solid #1C1508;}
.qty-label{font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#3A2A10;flex:1;}
.qty-btn{width:30px;height:30px;border-radius:6px;border:1px solid #2A1A08;background:#1A1205;color:#C9A227;font-size:18px;cursor:pointer;display:flex;align-items:center;justify-content:center;line-height:1;}
.qty-num{font-family:'Cormorant Garamond',serif;font-size:22px;color:#C9A227;min-width:30px;text-align:center;}

.bd-actions{display:flex;gap:8px;}
.btn{padding:11px 18px;border-radius:6px;font-size:12px;font-weight:600;letter-spacing:1px;text-transform:uppercase;cursor:pointer;border:1px solid #2A1A08;background:#0E0A04;color:#7A5A28;transition:all 0.15s;display:flex;align-items:center;justify-content:center;gap:8px;}
.btn:active{background:#1A1205;}
.btn.gold{background:#C9A227;color:#05040A;border-color:#C9A227;font-weight:700;}
.btn.gold:active{background:#A88520;}
.btn.full{width:100%;}
.btn.sm{padding:7px 14px;font-size:11px;}
.btn.danger{color:#8A3020;border-color:#3A1A10;}

.sep{height:1px;background:#1C1508;margin:1.5rem 0;}

.upload-zone{border:1px dashed #2A1A08;border-radius:8px;padding:1.5rem 1rem;text-align:center;cursor:pointer;margin-bottom:10px;background:#0E0A04;transition:border-color 0.2s;}
.upload-zone:active{border-color:#C9A22740;}
.upload-icon{font-size:32px;display:block;margin-bottom:8px;}
.upload-title{font-size:13px;color:#7A5A28;font-weight:500;}
.upload-sub{font-size:11px;color:#3A2A10;margin-top:3px;letter-spacing:0.5px;}

.carta-title{font-family:'Cormorant Garamond',serif;font-size:28px;color:#C9A227;text-align:center;margin-bottom:4px;}
.carta-sub{font-size:9px;letter-spacing:3px;text-transform:uppercase;color:#3A2A10;text-align:center;margin-bottom:1rem;}
.carta-divider{width:60px;height:1px;background:#2A1A08;margin:0 auto 1.5rem;}

.trago-card{background:#0E0A04;border:1px solid #1C1508;border-radius:8px;padding:1.25rem;margin-bottom:10px;cursor:pointer;}
.trago-top{display:flex;justify-content:space-between;align-items:flex-start;}
.trago-nombre{font-family:'Cormorant Garamond',serif;font-size:20px;color:#E8D08A;line-height:1.1;}
.trago-garnish{font-size:10px;padding:3px 10px;border-radius:20px;background:#1A1205;color:#6A4A20;border:1px solid #2A1A08;letter-spacing:0.5px;}
.trago-desc{font-size:13px;color:#4A3A20;margin-top:8px;line-height:1.6;font-style:italic;}
.trago-receta{margin-top:12px;padding-top:12px;border-top:1px solid #1C1508;font-size:13px;color:#8A6A40;line-height:1.9;}
.trago-receta-title{font-size:9px;letter-spacing:2px;text-transform:uppercase;color:#3A2A10;margin-bottom:8px;}
.trago-toggle{font-size:10px;color:#3A2A10;text-align:right;margin-top:8px;letter-spacing:1px;}

.noche-form{background:#0E0A04;border:1px solid #1C1508;border-radius:8px;padding:1.25rem;margin-bottom:1rem;}
.noche-label{font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#3A2A10;margin-bottom:8px;display:block;}
.noche-btns{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:14px;}
.noche-chip{padding:6px 14px;border-radius:20px;border:1px solid #2A1A08;background:#05040A;color:#5A4520;font-size:12px;cursor:pointer;font-family:'Inter',sans-serif;}
.noche-chip.on{border-color:#C9A227;color:#C9A227;background:#1A1205;}

.chat-wrap{display:flex;flex-direction:column;height:calc(100vh - 200px);}
.chat-msgs{flex:1;overflow-y:auto;display:flex;flex-direction:column;gap:10px;padding-bottom:12px;}
.msg{padding:12px 16px;border-radius:10px;font-size:14px;line-height:1.7;max-width:88%;white-space:pre-wrap;}
.msg.bot{background:#0E0A04;color:#C8A870;align-self:flex-start;border:1px solid #1C1508;border-bottom-left-radius:3px;font-style:italic;}
.msg.user{background:#C9A227;color:#05040A;align-self:flex-end;font-weight:600;border-bottom-right-radius:3px;font-style:normal;}
.chat-suggestions{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:10px;}
.chat-sug{font-size:11px;padding:5px 12px;border-radius:20px;border:1px solid #2A1A08;background:#05040A;color:#5A4520;cursor:pointer;}
.chat-sug:active{border-color:#C9A227;color:#C9A227;}
.chat-row{display:flex;gap:8px;}
.chat-input{flex:1;padding:12px 16px;border-radius:8px;border:1px solid #2A1A08;background:#0E0A04;color:#E8D08A;font-size:14px;outline:none;font-family:'Inter',sans-serif;}
.chat-input::placeholder{color:#2A1A08;}
.chat-send{padding:12px 18px;background:#C9A227;color:#05040A;border:none;border-radius:8px;cursor:pointer;font-size:16px;font-weight:700;}

.loading{text-align:center;padding:2rem;color:#2A1A08;font-size:12px;letter-spacing:2px;text-transform:uppercase;}
.spin{display:inline-block;animation:spin 2s linear infinite;}
@keyframes spin{to{transform:rotate(360deg);}}
.empty{text-align:center;padding:3rem 1rem;color:#2A1A08;font-size:13px;line-height:2;font-style:italic;}
`

const EMOJIS = {
  'whisky':'🥃','whiskey':'🥃','bourbon':'🥃','scotch':'🥃','johnnie':'🥃','jack':'🥃','chivas':'🥃','glenlivet':'🥃','ballantine':'🥃','crown':'🥃','hennessy':'🥃','cognac':'🥃','brandy':'🥃',
  'gin':'🫙','beefeater':'🫙','bombay':'🫙','bulldog':'🫙','tanqueray':'🫙',
  'vodka':'🫗','absolut':'🫗','grey goose':'🫗','ciroc':'🫗','pravda':'🫗',
  'ron':'🍾','rum':'🍾','bacardi':'🍾','havana':'🍾',
  'tequila':'🌵','mezcal':'🌵','patron':'🌵','don julio':'🌵',
  'champagne':'🥂','moet':'🥂','armand':'🥂','veuve':'🥂',
  'campari':'🍷','aperol':'🍊','vermouth':'🍸',
}

function getEmoji(nombre) {
  const n = nombre.toLowerCase()
  for (const [k, v] of Object.entries(EMOJIS)) if (n.includes(k)) return v
  return '🍾'
}

async function api(system, user, imgB64, imgType) {
  const content = []
  if (imgB64) content.push({ type: 'image', source: { type: 'base64', media_type: imgType, data: imgB64 } })
  content.push({ type: 'text', text: user })
  const res = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: MODEL, max_tokens: 1000, system, messages: [{ role: 'user', content }] })
  })
  const data = await res.json()
  return data.content?.find(c => c.type === 'text')?.text || ''
}

function comprimirFoto(file) {
  return new Promise(resolve => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      const canvas = document.createElement('canvas')
      const max = 200
      let w = img.width, h = img.height
      if (w > h) { h = Math.round(h * max / w); w = max } else { w = Math.round(w * max / h); h = max }
      canvas.width = w; canvas.height = h
      canvas.getContext('2d').drawImage(img, 0, 0, w, h)
      resolve(canvas.toDataURL('image/jpeg', 0.7))
      URL.revokeObjectURL(url)
    }
    img.src = url
  })
}

export default function App() {
  const [tab, setTab] = useState('barra')
  // botellas: [{nombre, tipo, precio, cantidad, foto}]
  const [botellas, setBotellas] = useState(() => {
    try { return JSON.parse(localStorage.getItem('kb_v3') || '[]') } catch { return [] }
  })
  const [selIdx, setSelIdx] = useState(null)
  const [tragos, setTragos] = useState([])
  const [tragoOpen, setTragoOpen] = useState(null)
  const [msgs, setMsgs] = useState([{ role: 'bot', text: 'Buenas noches.\n\nSoy tu bartender personal. Conozco tu barra y puedo inventarte algo a medida.\n\n¿Qué estamos preparando esta noche?' }])
  const [chatInput, setChatInput] = useState('')
  const [loadBarra, setLoadBarra] = useState(false)
  const [loadTragos, setLoadTragos] = useState(false)
  const [loadChat, setLoadChat] = useState(false)
  const [nocheModo, setNocheModo] = useState(false)
  const [nochePrefs, setNochePrefs] = useState([])
  const msgsEnd = useRef(null)
  const fotoRef = useRef(null)

  useEffect(() => { localStorage.setItem('kb_v3', JSON.stringify(botellas)) }, [botellas])
  useEffect(() => { msgsEnd.current?.scrollIntoView({ behavior: 'smooth' }) }, [msgs])

  const setBotellasPersist = b => setBotellas(b)

  const agregarOSumar = (nueva) => {
    setBotellas(prev => {
      const idx = prev.findIndex(b => b.nombre.toLowerCase() === nueva.nombre.toLowerCase())
      if (idx >= 0) {
        const copia = [...prev]
        copia[idx] = { ...copia[idx], cantidad: (copia[idx].cantidad || 1) + (nueva.cantidad || 1) }
        return copia
      }
      return [...prev, { ...nueva, cantidad: nueva.cantidad || 1 }]
    })
  }

  const cambiarCantidad = (idx, delta) => {
    setBotellas(prev => {
      const copia = [...prev]
      const nueva = (copia[idx].cantidad || 1) + delta
      if (nueva <= 0) {
        if (!window.confirm('¿Eliminás esta botella de la barra?')) return prev
        setSelIdx(null)
        return copia.filter((_, i) => i !== idx)
      }
      copia[idx] = { ...copia[idx], cantidad: nueva }
      return copia
    })
  }

  const subirFotoBotella = async (file, idx) => {
    const b64 = await comprimirFoto(file)
    setBotellas(prev => {
      const copia = [...prev]
      copia[idx] = { ...copia[idx], foto: b64 }
      return copia
    })
  }

  const analizarFotoGrupal = file => {
    setLoadBarra(true)
    const r = new FileReader()
    r.onload = async e => {
      const b64 = e.target.result.split(',')[1]
      try {
        const txt = await api(
          'Experto en bebidas premium. Analizá la foto y devolvé SOLO JSON array sin markdown ni texto extra. Cada objeto: {"nombre":"nombre completo incluyendo variedad","tipo":"categoría","precio_ars":número}. IMPORTANTE: el nombre debe incluir SIEMPRE la variedad completa. Ejemplos correctos: "Johnnie Walker Red Label", "Johnnie Walker Blue Label", "Absolut Vodka Original", "Absolut Vanilla", "Moët & Chandon Brut", "Armand de Brignac Brut Gold". NUNCA pongas solo la marca sin la variedad. precio_ars = precio estimado en pesos argentinos mayo 2025 (Johnnie Walker Red ~45000, Black ~80000, Blue ~350000, Absolut ~35000, Grey Goose ~90000, Bombay Sapphire ~70000, Hennessy VS ~120000, Moët Brut ~180000).',
          'Identificá todas las botellas visibles en la foto.',
          b64, file.type
        )
        const items = JSON.parse(txt.replace(/```json|```/g, '').trim())
        items.forEach(it => agregarOSumar({ nombre: it.nombre, tipo: it.tipo, precio: it.precio_ars || 0 }))
      } catch { alert('No pude analizar la imagen. Probá de nuevo.') }
      setLoadBarra(false)
    }
    r.readAsDataURL(file)
  }

  const agregarManual = async () => {
    const nombre = window.prompt('Nombre de la botella:')
    if (!nombre) return
    const tipo = window.prompt('Tipo (ej: Whisky, Gin, Vodka...):') || 'Bebida'
    const cantStr = window.prompt('¿Cuántas unidades?', '1')
    const cantidad = parseInt(cantStr) || 1
    setLoadBarra(true)
    try {
      const txt = await api(
        'Devolvé SOLO un número entero en pesos argentinos mayo 2025, sin texto ni símbolos. Usá precios reales de mercado argentino.',
        `Precio promedio actual en Argentina de: ${nombre}`
      )
      agregarOSumar({ nombre, tipo, precio: parseInt(txt.replace(/\D/g, '')) || 0, cantidad })
    } catch { agregarOSumar({ nombre, tipo, precio: 0, cantidad }) }
    setLoadBarra(false)
  }

  const sugerirTragos = async () => {
    if (!botellas.length) { alert('Primero agregá botellas a tu barra.'); return }
    setLoadTragos(true); setTragos([])
    try {
      const lista = botellas.map(b => b.nombre).join(', ')
      const txt = await api(
        'Bartender sofisticado. Devolvé SOLO JSON array sin markdown. Nombres de tragos elegantes y poéticos. Cada objeto: {"nombre":"...","descripcion_corta":"...","receta":"...","guarnicion":"..."}.',
        `Con estas bebidas: ${lista}. Sugerí 4 tragos posibles.`
      )
      setTragos(JSON.parse(txt.replace(/```json|```/g, '').trim()))
    } catch { }
    setLoadTragos(false)
  }

  const armarNoche = async () => {
    const prefs = nochePrefs.length ? nochePrefs.join(', ') : 'lo que quieras'
    const lista = botellas.map(b => b.nombre).join(', ')
    setLoadTragos(true); setTragos([]); setNocheModo(false)
    try {
      const txt = await api(
        'Bartender sofisticado. Devolvé SOLO JSON array sin markdown. Nombres elegantes y poéticos. Cada objeto: {"nombre":"...","descripcion_corta":"...","receta":"...","guarnicion":"..."}.',
        `Mi barra: ${lista}. Esta noche quiero: ${prefs}. Armame una carta de 4 tragos especiales.`
      )
      setTragos(JSON.parse(txt.replace(/```json|```/g, '').trim()))
    } catch { }
    setLoadTragos(false)
  }

  const enviarChat = async texto => {
    const txt = texto || chatInput.trim()
    if (!txt) return
    setChatInput('')
    setMsgs(p => [...p, { role: 'user', text: txt }])
    setLoadChat(true)
    const inv = botellas.length ? ' Mi barra: ' + botellas.map(b => `${b.nombre}${b.cantidad > 1 ? ` (×${b.cantidad})` : ''}`).join(', ') + '.' : ''
    try {
      const reply = await api(
        `Sos un bartender sofisticado y elegante. Hablás en español rioplatense, con clase y brevedad.${inv}`,
        txt
      )
      setMsgs(p => [...p, { role: 'bot', text: reply }])
    } catch {
      setMsgs(p => [...p, { role: 'bot', text: 'Error de conexión. Probá de nuevo.' }])
    }
    setLoadChat(false)
  }

  const total = botellas.reduce((a, b) => a + (b.precio || 0) * (b.cantidad || 1), 0)
  const totalBotellas = botellas.reduce((a, b) => a + (b.cantidad || 1), 0)
  const botSel = selIdx !== null ? botellas[selIdx] : null

  return (
    <>
      <style>{css}</style>
      <div className="app">

        <div className="header">
          <div className="header-line" />
          <div className="logo">KIKI BATTENDERS</div>
          <div className="logo-sub">Barra personal · IA</div>
        </div>

        <div className="nav">
          {[['barra','🍾','La Barra'],['carta','🍸','La Carta'],['chat','✦','Bartender']].map(([id,icon,label]) => (
            <button key={id} className={`nav-btn${tab===id?' on':''}`} onClick={() => setTab(id)}>
              <span className="nav-icon">{icon}</span>{label}
            </button>
          ))}
        </div>

        <div className="screen">

          {tab === 'barra' && <>

            {botellas.length > 0 && (
              <div className="valor-card">
                <div>
                  <div className="valor-label">Valor de la cava</div>
                  <div className="valor-num">${total.toLocaleString('es-AR')}</div>
                  <div className="valor-sub">{totalBotellas} botellas · {botellas.length} etiquetas</div>
                </div>
                <span style={{fontSize:40}}>🥃</span>
              </div>
            )}

            <div className="shelf-label">Mi barra</div>
            <div className="shelf-surface">
              {botellas.length === 0 && <div className="shelf-empty">Tu barra está vacía — fotografiala para empezar</div>}
              {botellas.map((b, i) => (
                <div key={i} className={`bottle${selIdx===i?' active':''}`} onClick={() => setSelIdx(selIdx===i?null:i)}>
                  {(b.cantidad || 1) > 1 && <div className="bottle-qty">×{b.cantidad}</div>}
                  {b.foto
                    ? <img src={b.foto} className="bottle-img" alt={b.nombre} />
                    : <div className="bottle-emoji-box">{getEmoji(b.nombre)}</div>
                  }
                  <span className="bottle-label">{b.nombre.split(' ').slice(0,2).join(' ')}</span>
                </div>
              ))}
            </div>

            {botSel && (
              <div className="bottle-detail">
                <div className="bd-top">
                  <label style={{cursor:'pointer'}}>
                    {botSel.foto
                      ? <img src={botSel.foto} className="bd-foto" alt={botSel.nombre} />
                      : <div className="bd-foto-empty" title="Tocá para agregar foto">{getEmoji(botSel.nombre)}</div>
                    }
                    <input type="file" accept="image/*" capture="environment" style={{display:'none'}} onChange={e => e.target.files[0] && subirFotoBotella(e.target.files[0], selIdx)} />
                  </label>
                  <div className="bd-info">
                    <div className="bd-name">{botSel.nombre}</div>
                    <div className="bd-type">{botSel.tipo}</div>
                    <div className="bd-price">{botSel.precio ? '$'+botSel.precio.toLocaleString('es-AR') : '—'} <span style={{fontSize:11,color:'#3A2A10'}}>c/u</span></div>
                  </div>
                  <button className="bd-close" onClick={() => setSelIdx(null)}>✕</button>
                </div>

                <div className="qty-row">
                  <span className="qty-label">Cantidad</span>
                  <button className="qty-btn" onClick={() => cambiarCantidad(selIdx, -1)}>−</button>
                  <span className="qty-num">{botSel.cantidad || 1}</span>
                  <button className="qty-btn" onClick={() => cambiarCantidad(selIdx, +1)}>+</button>
                </div>

                <div className="bd-actions">
                  <button className="btn sm gold" style={{flex:1}} onClick={() => { enviarChat(`¿Qué tragos puedo hacer con ${botSel.nombre}?`); setTab('chat') }}>¿Qué hago con esta?</button>
                </div>

                {!botSel.foto && (
                  <div style={{marginTop:10,fontSize:11,color:'#3A2A10',textAlign:'center',fontStyle:'italic'}}>
                    Tocá la imagen para agregar foto de la botella
                  </div>
                )}
              </div>
            )}

            <div className="sep" />

            <label className="upload-zone">
              <span className="upload-icon">📸</span>
              <div className="upload-title">Fotografiá tu barra</div>
              <div className="upload-sub">La IA identifica las botellas · Las repetidas suman cantidad</div>
              <input type="file" accept="image/*" capture="environment" style={{display:'none'}} onChange={e => e.target.files[0] && analizarFotoGrupal(e.target.files[0])} />
            </label>

            <button className="btn full" onClick={agregarManual} style={{marginBottom:8}}>+ Agregar botella manualmente</button>

            {loadBarra && <div className="loading"><span className="spin">◌</span> &nbsp;Analizando...</div>}

          </>}

          {tab === 'carta' && <>
            <div>
              <div className="carta-title">La Carta</div>
              <div className="carta-sub">Tragos de tu barra · Esta noche</div>
              <div className="carta-divider" />
            </div>

            {!nocheModo ? (
              <>
                <button className="btn full gold" onClick={sugerirTragos} style={{marginBottom:10}}>✦ &nbsp;Ver qué puedo preparar</button>
                <button className="btn full" onClick={() => setNocheModo(true)} style={{marginBottom:16}}>✦ &nbsp;Modo "esta noche"</button>
              </>
            ) : (
              <div className="noche-form">
                <span className="noche-label">¿Cómo querés que sea esta noche?</span>
                <div className="noche-btns">
                  {['Algo fuerte','Algo suave','Con hielo','Sin hielo','Clásico','Creativo','Corto','Largo','Para compartir'].map(v => (
                    <button key={v} className={`noche-chip${nochePrefs.includes(v)?' on':''}`} onClick={() => setNochePrefs(p => p.includes(v)?p.filter(x=>x!==v):[...p,v])}>{v}</button>
                  ))}
                </div>
                <div style={{display:'flex',gap:8}}>
                  <button className="btn gold" style={{flex:1}} onClick={armarNoche}>Armar la carta</button>
                  <button className="btn" onClick={() => setNocheModo(false)}>Cancelar</button>
                </div>
              </div>
            )}

            {loadTragos && <div className="loading"><span className="spin">◌</span> &nbsp;Preparando la carta...</div>}

            {tragos.map((t, i) => (
              <div key={i} className="trago-card" onClick={() => setTragoOpen(tragoOpen===i?null:i)}>
                <div className="trago-top">
                  <div className="trago-nombre">{t.nombre}</div>
                  <div className="trago-garnish">{t.guarnicion||'—'}</div>
                </div>
                <div className="trago-desc">{t.descripcion_corta}</div>
                {tragoOpen === i && (
                  <div className="trago-receta">
                    <div className="trago-receta-title">Preparación</div>
                    {t.receta}
                  </div>
                )}
                <div className="trago-toggle">{tragoOpen===i ? '▲ cerrar' : '▼ ver preparación'}</div>
              </div>
            ))}

            {!tragos.length && !loadTragos && (
              <div className="empty">Elegí una opción arriba para ver<br/>qué se puede preparar esta noche.</div>
            )}
          </>}

          {tab === 'chat' && (
            <div className="chat-wrap">
              <div className="chat-msgs">
                {msgs.map((m, i) => <div key={i} className={`msg ${m.role}`}>{m.text}</div>)}
                {loadChat && <div className="msg bot"><span className="spin">◌</span></div>}
                <div ref={msgsEnd} />
              </div>
              <div className="chat-suggestions">
                {['Old Fashioned','Negroni','Con whisky','Martini seco','Inventame algo'].map(q => (
                  <button key={q} className="chat-sug" onClick={() => enviarChat(q)}>{q}</button>
                ))}
              </div>
              <div className="chat-row">
                <input className="chat-input" value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyDown={e => e.key==='Enter'&&enviarChat()} placeholder="Preguntá algo..." />
                <button className="chat-send" onClick={() => enviarChat()}>↑</button>
              </div>
            </div>
          )}

        </div>
      </div>
    </>
  )
}
