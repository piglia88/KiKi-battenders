import { useState, useEffect, useRef, useCallback } from 'react'
import { initializeApp } from 'firebase/app'
import { getFirestore, doc, setDoc, onSnapshot } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: "AIzaSyCRavwYMi1g0HHYh1lNzizUKAUaHd4yu50",
  authDomain: "app-bartenders.firebaseapp.com",
  projectId: "app-bartenders",
  storageBucket: "app-bartenders.firebasestorage.app",
  messagingSenderId: "837598192203",
  appId: "1:837598192203:web:33fe76614cb882fc83e3ce"
}

const firebaseApp = initializeApp(firebaseConfig)
const db = getFirestore(firebaseApp)
const MODEL = 'claude-sonnet-4-5'

const CATEGORIAS = ['Whisky','Vodka','Gin','Tequila','Ron','Champagne','Cognac','Licor','Vino','Cerveza','Otro']
const CAT_EMOJI = {
  'Whisky':'🥃','Vodka':'🫗','Gin':'🫙','Tequila':'🌵','Ron':'🍾',
  'Champagne':'🥂','Cognac':'🥃','Licor':'🍶','Vino':'🍷','Cerveza':'🍺','Otro':'🍾'
}

// Personalidades del bartender
const PERSONALIDADES = {
  pibe: {
    id: 'pibe',
    nombre: 'El Pibe',
    emoji: '🧉',
    desc: 'Directo, copado, rioplatense',
    system: 'Sos El Pibe, un bartender porteño de barrio, copado y directo. Hablás con modismos argentinos, sos canchero pero sabés mucho. Usás "boludo", "re", "flashero", "capo". Corto y al punto. Nunca pedante.',
    chat: 'Buenas! Soy El Pibe, tu bartender de confianza. ¿Qué se viene esta noche, bo?'
  },
  elegante: {
    id: 'elegante',
    nombre: 'El Elegante',
    emoji: '🎩',
    desc: 'Sofisticado, clásico, preciso',
    system: 'Sos El Elegante, maître bartender de un hotel cinco estrellas. Sofisticado, preciso, culto. Describís los tragos con vocabulario de sommelier. Nunca usás jerga. Siempre formal pero cálido.',
    chat: 'Buenas noches. Soy El Elegante, a su disposición. ¿En qué puedo deleitarle esta velada?'
  },
  alquimista: {
    id: 'alquimista',
    nombre: 'El Alquimista',
    emoji: '🔮',
    desc: 'Creativo, experimental, místico',
    system: 'Sos El Alquimista, un bartender experimental y creativo. Hablás con metáforas, inventás combinaciones insólitas, ves la coctelería como arte y ciencia. Usás palabras como "transformación", "fusión", "destilado del alma". Poético pero concreto.',
    chat: 'Bienvenido al laboratorio. Soy El Alquimista. Esta noche transformaremos tus botellas en algo memorable. ¿Por dónde empezamos?'
  }
}

// Complementos del Cajón de Alquimia
const COMPLEMENTOS_DEFAULT = [
  { nombre: 'Limón', emoji: '🍋', tipo: 'cítrico' },
  { nombre: 'Naranja', emoji: '🍊', tipo: 'cítrico' },
  { nombre: 'Menta', emoji: '🌿', tipo: 'hierba' },
  { nombre: 'Jengibre', emoji: '🫚', tipo: 'spice' },
  { nombre: 'Azúcar', emoji: '🍬', tipo: 'dulce' },
  { nombre: 'Sal', emoji: '🧂', tipo: 'salado' },
  { nombre: 'Hielo', emoji: '🧊', tipo: 'base' },
  { nombre: 'Soda', emoji: '💧', tipo: 'base' },
  { nombre: 'Jugo naranja', emoji: '🥤', tipo: 'jugo' },
  { nombre: 'Jugo limón', emoji: '🍹', tipo: 'jugo' },
  { nombre: 'Granadina', emoji: '❤️', tipo: 'licor' },
  { nombre: 'Angostura', emoji: '🫙', tipo: 'bitter' },
  { nombre: 'Canela', emoji: '🪵', tipo: 'spice' },
  { nombre: 'Miel', emoji: '🍯', tipo: 'dulce' },
  { nombre: 'Albahaca', emoji: '🌱', tipo: 'hierba' },
  { nombre: 'Pepino', emoji: '🥒', tipo: 'vegetal' },
]

function detectarCategoria(nombre, tipo) {
  const n = (nombre + ' ' + tipo).toLowerCase()
  if (/whisky|whiskey|bourbon|scotch|johnnie|jack daniel|chivas|glenlivet|ballantine|crown|jameson|glenfiddich/.test(n)) return 'Whisky'
  if (/vodka|absolut|grey goose|ciroc|pravda|ketel|belvedere/.test(n)) return 'Vodka'
  if (/gin|beefeater|bombay|bulldog|tanqueray|hendricks/.test(n)) return 'Gin'
  if (/tequila|mezcal|patron|don julio|olmeca|jose cuervo/.test(n)) return 'Tequila'
  if (/ron|rum|bacardi|havana|zacapa|diplomatico/.test(n)) return 'Ron'
  if (/champagne|champán|moet|armand|veuve|perrier|chandon|espumante/.test(n)) return 'Champagne'
  if (/cognac|hennessy|remy|martell|courvoisier/.test(n)) return 'Cognac'
  if (/licor|baileys|amaretto|cointreau|kahlua|aperol|campari|vermouth/.test(n)) return 'Licor'
  if (/vino|wine|malbec|cabernet|chardonnay/.test(n)) return 'Vino'
  if (/cerveza|beer|stella|corona|heineken/.test(n)) return 'Cerveza'
  return 'Otro'
}

function parsearPasos(receta) {
  if (!receta) return []
  return receta
    .split('\n')
    .map(l => l.replace(/^\d+[\.\-\)]\s*/, '').trim())
    .filter(l => l.length > 0)
}

// Busca URL real de imagen para un trago usando web search de Claude
async function getTragoImageUrl(nombre, ingredientes, esClasico) {
  try {
    const prompt = esClasico
      ? `Buscá en la web una foto real del cóctel clásico "${nombre}". Devolvé SOLO la URL directa de la imagen (debe terminar en .jpg, .jpeg, .png o .webp). Sin texto extra, sin markdown.`
      : `Buscá en la web una foto de un cóctel que tenga estos ingredientes: ${ingredientes}. Se llama "${nombre}". Devolvé SOLO la URL directa de la imagen más atractiva que encuentres (debe terminar en .jpg, .jpeg, .png o .webp). Sin texto extra.`
    const url = await api(
      'Buscás imágenes de cócteles en la web. Devolvés SOLO la URL directa de la imagen, sin texto ni markdown.',
      prompt, null, null, true
    )
    const match = url.match(/https?:\/\/[^\s"'<>]+\.(jpg|jpeg|png|webp)/i)
    return match ? match[0] : null
  } catch { return null }
}

// Busca URL real de imagen para una botella de bebida
async function getBotellaImageUrl(nombre) {
  try {
    const url = await api(
      'Buscás imágenes de botellas de bebidas alcohólicas. Devolvés SOLO la URL directa de la imagen PNG o JPG del packaging oficial, sin texto ni markdown.',
      `Buscá en la web una foto del packaging oficial de la botella: "${nombre}". Devolvé SOLO la URL directa de la imagen (termina en .jpg, .jpeg, .png o .webp). Sin texto extra.`,
      null, null, true
    )
    const match = url.match(/https?:\/\/[^\s"'<>]+\.(jpg|jpeg|png|webp)/i)
    return match ? match[0] : null
  } catch { return null }
}

// Calcular ADN de la barra
function calcularADN(botellas) {
  const categoriasTipo = {
    fuertes: ['Whisky', 'Vodka', 'Gin', 'Tequila', 'Ron', 'Cognac'],
    frescos: ['Champagne', 'Cerveza', 'Vino'],
    dulces: ['Licor']
  }
  let fuertes = 0, frescos = 0, dulces = 0, otros = 0
  botellas.forEach(b => {
    const cat = b.categoria || detectarCategoria(b.nombre, b.tipo || '')
    const qty = b.cantidad || 1
    if (categoriasTipo.fuertes.includes(cat)) fuertes += qty
    else if (categoriasTipo.frescos.includes(cat)) frescos += qty
    else if (categoriasTipo.dulces.includes(cat)) dulces += qty
    else otros += qty
  })
  const total = fuertes + frescos + dulces + otros || 1
  return {
    fuertes: Math.round((fuertes / total) * 100),
    frescos: Math.round((frescos / total) * 100),
    dulces: Math.round((dulces / total) * 100),
    otros: Math.round((otros / total) * 100)
  }
}

// Web Audio API - sonido coctelera
function usarSonidoCoctelera() {
  const playShake = useCallback(() => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)()
      const duration = 1.8
      const bufferSize = ctx.sampleRate * duration
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
      const data = buffer.getChannelData(0)
      for (let i = 0; i < bufferSize; i++) {
        // Ruido de hielo + sacudida
        const envelope = i < bufferSize * 0.1
          ? i / (bufferSize * 0.1)
          : i > bufferSize * 0.7
          ? (bufferSize - i) / (bufferSize * 0.3)
          : 1
        data[i] = (Math.random() * 2 - 1) * envelope * 0.4
        // Añadir clics periódicos (hielo)
        if (i % Math.floor(ctx.sampleRate * 0.08) < 3) {
          data[i] += (Math.random() * 2 - 1) * 0.8 * envelope
        }
      }
      const source = ctx.createBufferSource()
      source.buffer = buffer
      const gainNode = ctx.createGain()
      gainNode.gain.value = 0.6
      source.connect(gainNode)
      gainNode.connect(ctx.destination)
      source.start()
      source.stop(ctx.currentTime + duration)
    } catch (e) {}
  }, [])
  return playShake
}

// Web Speech API - voz bartender
function usarVoz() {
  const speak = useCallback((text, personalidadId = 'elegante') => {
    if (!window.speechSynthesis) return
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = 'es-AR'
    utterance.rate = personalidadId === 'pibe' ? 1.1 : personalidadId === 'alquimista' ? 0.85 : 0.9
    utterance.pitch = personalidadId === 'pibe' ? 1.1 : personalidadId === 'alquimista' ? 0.8 : 1.0
    utterance.volume = 0.9
    // Intentar voz en español
    const voices = window.speechSynthesis.getVoices()
    const spanishVoice = voices.find(v => v.lang.startsWith('es')) || voices[0]
    if (spanishVoice) utterance.voice = spanishVoice
    window.speechSynthesis.speak(utterance)
  }, [])
  const stop = useCallback(() => {
    if (window.speechSynthesis) window.speechSynthesis.cancel()
  }, [])
  return { speak, stop }
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

async function api(system, user, imgB64, imgType, useWebSearch = false) {
  const content = []
  if (imgB64) content.push({ type: 'image', source: { type: 'base64', media_type: imgType, data: imgB64 } })
  content.push({ type: 'text', text: user })
  const body = { model: MODEL, max_tokens: 1000, system, messages: [{ role: 'user', content }] }
  if (useWebSearch) body.useWebSearch = true
  const res = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  })
  const data = await res.json()
  return data.textOnly || data.content?.find(c => c.type === 'text')?.text || ''
}



// Componente Pasos Animados
function PasosAnimados({ pasos, className = '', autoPlay = true }) {
  const [pasoActivo, setPasoActivo] = useState(autoPlay ? 0 : -1)
  const intervalRef = useRef(null)

  useEffect(() => {
    setPasoActivo(autoPlay ? 0 : -1)
    if (!pasos.length || !autoPlay) return
    intervalRef.current = setInterval(() => {
      setPasoActivo(p => {
        if (p >= pasos.length - 1) { clearInterval(intervalRef.current); return p }
        return p + 1
      })
    }, 1500)
    return () => clearInterval(intervalRef.current)
  }, [pasos, autoPlay])

  const replay = () => {
    clearInterval(intervalRef.current)
    setPasoActivo(0)
    intervalRef.current = setInterval(() => {
      setPasoActivo(p => {
        if (p >= pasos.length - 1) { clearInterval(intervalRef.current); return p }
        return p + 1
      })
    }, 1500)
  }

  const isPres = className.includes('pres')

  return (
    <>
      {pasos.map((paso, i) => {
        const estado = autoPlay
          ? (i < pasoActivo ? 'done' : i === pasoActivo ? 'active' : 'pending')
          : 'active'
        return (
          <div key={i} className={`${isPres ? 'pres-paso' : 'paso'} ${estado}`}>
            <div className={isPres ? 'pres-paso-num' : 'paso-num'}>{i + 1}</div>
            <div className={isPres ? 'pres-paso-txt' : 'paso-txt'}>{paso}</div>
          </div>
        )
      })}
      {autoPlay && pasoActivo >= pasos.length - 1 && pasos.length > 0 && (
        <div className="pres-replay">
          <button className="btn sm" onClick={replay}>↺ &nbsp;Repetir pasos</button>
        </div>
      )}
    </>
  )
}

// Componente ADN de la barra
function ADNBarra({ botellas }) {
  const adn = calcularADN(botellas)
  const items = [
    { label: 'Fuertes', valor: adn.fuertes, color: '#C9A227', emoji: '🔥' },
    { label: 'Frescos', valor: adn.frescos, color: '#4A8A6A', emoji: '🌊' },
    { label: 'Dulces', valor: adn.dulces, color: '#9A5A8A', emoji: '🍬' },
    { label: 'Otros', valor: adn.otros, color: '#5A6A8A', emoji: '✦' },
  ].filter(i => i.valor > 0)

  return (
    <div className="adn-wrap">
      <div className="adn-title">ADN de tu barra</div>
      {items.map(item => (
        <div key={item.label} className="adn-row">
          <div className="adn-label">{item.emoji} {item.label}</div>
          <div className="adn-bar-wrap">
            <div className="adn-bar" style={{ width: `${item.valor}%`, background: item.color }} />
          </div>
          <div className="adn-pct" style={{ color: item.color }}>{item.valor}%</div>
        </div>
      ))}
    </div>
  )
}

// Componente Cajón de Alquimia
function CajonAlquimia({ seleccionados, onToggle }) {
  return (
    <div className="cajon-wrap">
      <div className="cajon-title">🧪 Cajón de Alquimia</div>
      <div className="cajon-sub">Complementos disponibles en tu barra</div>
      <div className="cajon-grid">
        {COMPLEMENTOS_DEFAULT.map(c => {
          const on = seleccionados.includes(c.nombre)
          return (
            <button
              key={c.nombre}
              className={`cajon-chip${on ? ' on' : ''}`}
              onClick={() => onToggle(c.nombre)}
            >
              <span className="cajon-emoji">{c.emoji}</span>
              <span className="cajon-nombre">{c.nombre}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

// Componente Animación Coctelera
function AnimacionCoctelera({ activa, onDone }) {
  useEffect(() => {
    if (!activa) return
    const t = setTimeout(onDone, 2000)
    return () => clearTimeout(t)
  }, [activa, onDone])

  if (!activa) return null
  return (
    <div className="shaker-overlay">
      <div className="shaker-anim">
        <div className="shaker-icon">🍸</div>
        <div className="shaker-texto">Preparando...</div>
        <div className="shaker-dots">
          <span /><span /><span />
        </div>
      </div>
    </div>
  )
}

// Componente Pairing Sommelier
function PairingSommelier({ botella, personalidadId }) {
  const [pairing, setPairing] = useState(null)
  const [loading, setLoading] = useState(false)
  const { speak } = usarVoz()

  const obtenerPairing = async () => {
    setLoading(true)
    const pers = PERSONALIDADES[personalidadId]
    try {
      const txt = await api(
        pers.system + ' Respondé en máximo 3 líneas. Sin markdown.',
        `Dame un pairing gastronómico para ${botella.nombre}: qué comida marida mejor, qué hora del día y qué estado de ánimo potencia.`
      )
      setPairing(txt)
      speak(txt, personalidadId)
    } catch { setPairing('No pude obtener el pairing ahora.') }
    setLoading(false)
  }

  return (
    <div className="pairing-wrap">
      {!pairing && !loading && (
        <button className="btn sm" style={{ width: '100%', marginTop: 8 }} onClick={obtenerPairing}>
          🍽️ &nbsp;Pairing Sommelier
        </button>
      )}
      {loading && <div className="loading" style={{ padding: '8px 0' }}><span className="spin">◌</span> Analizando...</div>}
      {pairing && (
        <div className="pairing-result">
          <div className="pairing-label">Pairing</div>
          <div className="pairing-text">{pairing}</div>
          <button className="btn sm" style={{ marginTop: 6 }} onClick={() => { setPairing(null) }}>✕ Cerrar</button>
        </div>
      )}
    </div>
  )
}

// CSS completo
const css = `
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400&family=Inter:wght@300;400;500;600&display=swap');

*{box-sizing:border-box;margin:0;padding:0;}
html,body,#root{height:100%;background:#05040A;}
.app{width:100%;min-height:100vh;display:flex;flex-direction:column;background:#05040A;font-family:'Inter',sans-serif;color:#E8D9B8;}

.header{padding:2rem 1.5rem 1.5rem;text-align:center;border-bottom:1px solid #1C1508;}
.header-line{width:40px;height:1px;background:#8B6914;margin:0 auto 1rem;}
.logo{font-family:'Cormorant Garamond',serif;font-size:34px;font-weight:700;color:#C9A227;letter-spacing:4px;line-height:1;}
.sync-dot{display:inline-block;width:6px;height:6px;border-radius:50%;background:#3A2A10;margin-right:6px;vertical-align:middle;}
.sync-dot.ok{background:#4A7A30;}
.sync-status{font-size:10px;color:#3A2A10;letter-spacing:1px;margin-top:6px;}

/* Selector de personalidad */
.pers-bar{display:flex;gap:6px;padding:10px 12px;background:#05040A;border-bottom:1px solid #1C1508;overflow-x:auto;}
.pers-btn{flex-shrink:0;display:flex;align-items:center;gap:6px;padding:7px 14px;border-radius:20px;border:1px solid #2A1A08;background:#05040A;color:#5A4520;font-size:11px;cursor:pointer;font-family:'Inter',sans-serif;white-space:nowrap;transition:all 0.2s;}
.pers-btn.on{border-color:#C9A227;color:#C9A227;background:#1A1205;}
.pers-emoji{font-size:14px;}

.nav{display:flex;background:#05040A;border-bottom:1px solid #1C1508;}
.nav-btn{flex:1;padding:14px 4px 12px;font-size:9px;font-weight:600;letter-spacing:2px;text-transform:uppercase;border:none;background:transparent;color:#3A2A10;cursor:pointer;display:flex;flex-direction:column;align-items:center;gap:4px;position:relative;transition:color 0.2s;}
.nav-btn.on{color:#C9A227;}
.nav-btn.on::after{content:'';position:absolute;bottom:0;left:25%;right:25%;height:1px;background:#C9A227;}
.nav-icon{font-size:18px;}

.screen{flex:1;overflow-y:auto;padding:1.5rem;}

.valor-card{background:#0E0A04;border:1px solid #C9A22730;border-radius:8px;padding:1.25rem;margin-bottom:1rem;display:flex;justify-content:space-between;align-items:center;}
.valor-label{font-size:9px;letter-spacing:3px;text-transform:uppercase;color:#3A2A10;}
.valor-num{font-family:'Cormorant Garamond',serif;font-size:32px;color:#C9A227;line-height:1;}
.valor-sub{font-size:11px;color:#3A2A10;margin-top:2px;}

/* ADN */
.adn-wrap{background:#0E0A04;border:1px solid #1C1508;border-radius:8px;padding:1.25rem;margin-bottom:1rem;}
.adn-title{font-size:9px;letter-spacing:3px;text-transform:uppercase;color:#5A4520;margin-bottom:12px;}
.adn-row{display:flex;align-items:center;gap:10px;margin-bottom:8px;}
.adn-label{font-size:11px;color:#5A4520;width:72px;flex-shrink:0;}
.adn-bar-wrap{flex:1;height:6px;background:#1A1205;border-radius:4px;overflow:hidden;}
.adn-bar{height:100%;border-radius:4px;transition:width 1s ease;}
.adn-pct{font-size:11px;font-family:'Cormorant Garamond',serif;width:32px;text-align:right;flex-shrink:0;}

/* Cajón de Alquimia */
.cajon-wrap{background:#0E0A04;border:1px solid #1C1508;border-radius:8px;padding:1.25rem;margin-bottom:1rem;}
.cajon-title{font-size:13px;color:#C9A227;font-family:'Cormorant Garamond',serif;font-weight:600;margin-bottom:2px;}
.cajon-sub{font-size:10px;color:#3A2A10;letter-spacing:1px;margin-bottom:12px;}
.cajon-grid{display:flex;flex-wrap:wrap;gap:6px;}
.cajon-chip{display:flex;align-items:center;gap:5px;padding:5px 11px;border-radius:20px;border:1px solid #2A1A08;background:#05040A;color:#5A4520;font-size:11px;cursor:pointer;font-family:'Inter',sans-serif;transition:all 0.15s;}
.cajon-chip.on{border-color:#C9A227;color:#C9A227;background:#1A1205;}
.cajon-emoji{font-size:13px;}
.cajon-nombre{white-space:nowrap;}

.cat-section{margin-bottom:1.5rem;}
.cat-header{display:flex;align-items:center;gap:8px;margin-bottom:10px;padding-bottom:8px;border-bottom:1px solid #1C1508;}
.cat-icon{font-size:18px;}
.cat-name{font-size:10px;letter-spacing:3px;text-transform:uppercase;color:#5A4520;font-weight:600;}
.cat-count{font-size:10px;color:#3A2A10;margin-left:auto;}
.shelf-surface{background:#0E0A04;border:1px solid #1C1508;border-radius:4px;padding:1rem;display:flex;flex-wrap:wrap;gap:10px;align-items:flex-start;}
.shelf-empty{width:100%;text-align:center;font-size:13px;color:#3A2A10;padding:1.5rem 0;font-style:italic;}
.bottle{display:flex;flex-direction:column;align-items:center;gap:5px;cursor:pointer;width:calc(25% - 8px);position:relative;}
.bottle-img{width:52px;height:52px;border-radius:8px;object-fit:cover;border:1px solid #2A1A08;}
.bottle-emoji-box{width:52px;height:52px;border-radius:8px;background:#1A1205;border:1px solid #2A1A08;display:flex;align-items:center;justify-content:center;font-size:26px;}
.bottle.active .bottle-img,.bottle.active .bottle-emoji-box{border-color:#C9A227;}
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
.bd-close{background:none;border:none;color:#3A2A10;cursor:pointer;font-size:20px;padding:0;}
.qty-row{display:flex;align-items:center;gap:12px;margin-bottom:12px;padding:10px 0;border-top:1px solid #1C1508;border-bottom:1px solid #1C1508;}
.qty-label{font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#3A2A10;flex:1;}
.qty-btn{width:30px;height:30px;border-radius:6px;border:1px solid #2A1A08;background:#1A1205;color:#C9A227;font-size:18px;cursor:pointer;display:flex;align-items:center;justify-content:center;}
.qty-num{font-family:'Cormorant Garamond',serif;font-size:22px;color:#C9A227;min-width:30px;text-align:center;}
.price-row{display:flex;align-items:center;gap:8px;margin-bottom:12px;}
.price-input{flex:1;padding:8px 12px;border-radius:6px;border:1px solid #2A1A08;background:#1A1205;color:#C9A227;font-size:14px;font-family:'Cormorant Garamond',serif;outline:none;}
.bd-actions{display:flex;gap:8px;}

/* Pairing */
.pairing-wrap{margin-top:8px;}
.pairing-result{background:#1A1205;border:1px solid #2A1A08;border-radius:6px;padding:10px 12px;margin-top:8px;}
.pairing-label{font-size:9px;letter-spacing:2px;text-transform:uppercase;color:#5A4520;margin-bottom:4px;}
.pairing-text{font-size:13px;color:#C8A870;line-height:1.6;font-style:italic;}

.btn{padding:11px 18px;border-radius:6px;font-size:12px;font-weight:600;letter-spacing:1px;text-transform:uppercase;cursor:pointer;border:1px solid #2A1A08;background:#0E0A04;color:#7A5A28;transition:all 0.15s;display:flex;align-items:center;justify-content:center;gap:8px;}
.btn:active{background:#1A1205;}
.btn.gold{background:#C9A227;color:#05040A;border-color:#C9A227;font-weight:700;}
.btn.gold:active{background:#A88520;}
.btn.full{width:100%;}
.btn.sm{padding:7px 14px;font-size:11px;}

.sep{height:1px;background:#1C1508;margin:1.5rem 0;}
.upload-zone{border:1px dashed #2A1A08;border-radius:8px;padding:1.5rem 1rem;text-align:center;cursor:pointer;margin-bottom:10px;background:#0E0A04;display:block;}
.upload-icon{font-size:32px;display:block;margin-bottom:8px;}
.upload-title{font-size:13px;color:#7A5A28;font-weight:500;}
.upload-sub{font-size:11px;color:#3A2A10;margin-top:3px;}

.carta-title{font-family:'Cormorant Garamond',serif;font-size:28px;color:#C9A227;text-align:center;margin-bottom:4px;}
.carta-sub{font-size:9px;letter-spacing:3px;text-transform:uppercase;color:#3A2A10;text-align:center;margin-bottom:1rem;}
.carta-divider{width:60px;height:1px;background:#2A1A08;margin:0 auto 1.5rem;}

/* Trago card */
.trago-card{background:#0E0A04;border:1px solid #1C1508;border-radius:8px;overflow:hidden;margin-bottom:12px;}
.trago-foto-wrap{position:relative;width:100%;height:160px;overflow:hidden;cursor:pointer;}
.trago-foto{width:100%;height:100%;object-fit:cover;display:block;transition:transform 0.3s;}
.trago-foto:active{transform:scale(1.02);}
.trago-foto-placeholder{width:100%;height:100%;background:linear-gradient(135deg,#1A1205,#0E0A04);display:flex;align-items:center;justify-content:center;font-size:48px;}
.trago-foto-overlay{position:absolute;bottom:0;left:0;right:0;padding:12px 14px;background:linear-gradient(transparent,rgba(5,4,10,0.92));pointer-events:none;}
.trago-foto-hint{position:absolute;top:10px;right:10px;background:rgba(201,162,39,0.2);border:1px solid rgba(201,162,39,0.4);border-radius:20px;padding:4px 10px;font-size:10px;color:#C9A227;letter-spacing:1px;}
.trago-body{padding:1rem 1.25rem 1.25rem;}
.trago-top{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:6px;}
.trago-nombre{font-family:'Cormorant Garamond',serif;font-size:20px;color:#E8D08A;line-height:1.1;}
.trago-garnish{font-size:10px;padding:3px 10px;border-radius:20px;background:#1A1205;color:#6A4A20;border:1px solid #2A1A08;white-space:nowrap;}
.trago-desc{font-size:13px;color:#4A3A20;line-height:1.6;font-style:italic;}
.trago-actions{display:flex;gap:6px;margin-top:10px;}
.trago-voz-btn{padding:6px 12px;border-radius:20px;border:1px solid #2A1A08;background:#05040A;color:#5A4520;font-size:11px;cursor:pointer;display:flex;align-items:center;gap:5px;}
.trago-voz-btn.hablando{border-color:#C9A227;color:#C9A227;}

/* Pasos animados */
.pasos-wrap{margin-top:12px;padding-top:12px;border-top:1px solid #1C1508;}
.pasos-title{font-size:9px;letter-spacing:2px;text-transform:uppercase;color:#3A2A10;margin-bottom:10px;}
.paso{display:flex;gap:10px;align-items:flex-start;padding:7px 0;transition:all 0.4s ease;}
.paso-num{width:22px;height:22px;border-radius:50%;border:1px solid #2A1A08;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:600;flex-shrink:0;transition:all 0.4s ease;color:#3A2A10;background:#0E0A04;}
.paso-txt{font-size:13px;line-height:1.6;transition:all 0.4s ease;color:#3A2A10;}
.paso.done .paso-num{background:#2A1A08;border-color:#5A3A10;color:#8A6A40;}
.paso.done .paso-txt{color:#5A4020;}
.paso.active .paso-num{background:#C9A227;border-color:#C9A227;color:#05040A;box-shadow:0 0 12px rgba(201,162,39,0.5);}
.paso.active .paso-txt{color:#E8D08A;font-weight:500;}
.paso.pending .paso-num{color:#2A1A08;border-color:#1C1508;}
.paso.pending .paso-txt{color:#2A1A08;}
.trago-toggle{font-size:10px;color:#3A2A10;text-align:right;margin-top:10px;cursor:pointer;}

/* Modo presentación fullscreen */
.presentacion-overlay{position:fixed;inset:0;background:#05040A;z-index:1000;display:flex;flex-direction:column;overflow-y:auto;}
.pres-foto-wrap{position:relative;width:100%;height:45vh;flex-shrink:0;}
.pres-foto{width:100%;height:100%;object-fit:cover;}
.pres-foto-placeholder{width:100%;height:100%;background:linear-gradient(135deg,#1A1205,#0E0A04);display:flex;align-items:center;justify-content:center;font-size:80px;}
.pres-foto-gradient{position:absolute;bottom:0;left:0;right:0;height:60%;background:linear-gradient(transparent,#05040A);}
.pres-close{position:absolute;top:16px;right:16px;width:36px;height:36px;border-radius:50%;background:rgba(5,4,10,0.7);border:1px solid #2A1A08;color:#C9A227;font-size:18px;display:flex;align-items:center;justify-content:center;cursor:pointer;z-index:10;}
.pres-body{padding:1.5rem 1.5rem 3rem;flex:1;}
.pres-nombre{font-family:'Cormorant Garamond',serif;font-size:36px;color:#C9A227;line-height:1;margin-bottom:4px;}
.pres-garnish{font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#5A4520;margin-bottom:1rem;}
.pres-pers-bar{display:flex;gap:6px;margin-bottom:1.5rem;flex-wrap:wrap;}
.pres-pasos-title{font-size:9px;letter-spacing:3px;text-transform:uppercase;color:#3A2A10;margin-bottom:14px;}
.pres-paso{display:flex;gap:14px;align-items:flex-start;padding:10px 0;border-bottom:1px solid #0E0A04;transition:all 0.4s ease;}
.pres-paso-num{width:28px;height:28px;border-radius:50%;border:1px solid #2A1A08;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:600;flex-shrink:0;transition:all 0.4s ease;color:#3A2A10;background:#0E0A04;}
.pres-paso-txt{font-size:15px;line-height:1.7;transition:all 0.4s ease;color:#3A2A10;padding-top:4px;}
.pres-paso.done .pres-paso-num{background:#2A1A08;border-color:#5A3A10;color:#8A6A40;}
.pres-paso.done .pres-paso-txt{color:#5A4020;}
.pres-paso.active .pres-paso-num{background:#C9A227;border-color:#C9A227;color:#05040A;box-shadow:0 0 16px rgba(201,162,39,0.6);}
.pres-paso.active .pres-paso-txt{color:#E8D08A;font-weight:500;font-size:16px;}
.pres-paso.pending .pres-paso-num{color:#1C1508;border-color:#1C1508;}
.pres-paso.pending .pres-paso-txt{color:#1C1508;}
.pres-replay{display:flex;justify-content:center;margin-top:1.5rem;}
.pres-actions{display:flex;gap:8px;margin-bottom:1.5rem;flex-wrap:wrap;}

/* Shaker overlay */
.shaker-overlay{position:fixed;inset:0;background:rgba(5,4,10,0.92);z-index:2000;display:flex;align-items:center;justify-content:center;}
.shaker-anim{text-align:center;}
.shaker-icon{font-size:72px;animation:shakeit 0.15s infinite alternate;}
.shaker-texto{font-family:'Cormorant Garamond',serif;font-size:22px;color:#C9A227;margin-top:16px;letter-spacing:2px;}
.shaker-dots{display:flex;justify-content:center;gap:6px;margin-top:12px;}
.shaker-dots span{width:6px;height:6px;border-radius:50%;background:#C9A227;animation:dotpulse 0.6s infinite alternate;}
.shaker-dots span:nth-child(2){animation-delay:0.2s;}
.shaker-dots span:nth-child(3){animation-delay:0.4s;}
@keyframes shakeit{from{transform:rotate(-12deg) scale(1);}to{transform:rotate(12deg) scale(1.1);}}
@keyframes dotpulse{from{opacity:0.2;}to{opacity:1;}}

.noche-form{background:#0E0A04;border:1px solid #1C1508;border-radius:8px;padding:1.25rem;margin-bottom:1rem;}
.noche-label{font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#3A2A10;margin-bottom:8px;display:block;}
.noche-btns{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:14px;}
.noche-chip{padding:6px 14px;border-radius:20px;border:1px solid #2A1A08;background:#05040A;color:#5A4520;font-size:12px;cursor:pointer;font-family:'Inter',sans-serif;}
.noche-chip.on{border-color:#C9A227;color:#C9A227;background:#1A1205;}

/* Chat */
.chat-wrap{display:flex;flex-direction:column;height:calc(100vh - 200px);}
.chat-msgs{flex:1;overflow-y:auto;display:flex;flex-direction:column;gap:10px;padding-bottom:12px;}
.msg{padding:12px 16px;border-radius:10px;font-size:14px;line-height:1.7;max-width:88%;white-space:pre-wrap;}
.msg.bot{background:#0E0A04;color:#C8A870;align-self:flex-start;border:1px solid #1C1508;border-bottom-left-radius:3px;font-style:italic;}
.msg.user{background:#C9A227;color:#05040A;align-self:flex-end;font-weight:600;border-bottom-right-radius:3px;font-style:normal;}
.chat-pers{font-size:9px;letter-spacing:2px;text-transform:uppercase;color:#3A2A10;margin-bottom:10px;text-align:center;}
.chat-suggestions{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:10px;}
.chat-sug{font-size:11px;padding:5px 12px;border-radius:20px;border:1px solid #2A1A08;background:#05040A;color:#5A4520;cursor:pointer;}
.chat-row{display:flex;gap:8px;}
.chat-input{flex:1;padding:12px 16px;border-radius:8px;border:1px solid #2A1A08;background:#0E0A04;color:#E8D08A;font-size:14px;outline:none;font-family:'Inter',sans-serif;}
.chat-input::placeholder{color:#2A1A08;}
.chat-send{padding:12px 18px;background:#C9A227;color:#05040A;border:none;border-radius:8px;cursor:pointer;font-size:16px;font-weight:700;}

.loading{text-align:center;padding:2rem;color:#2A1A08;font-size:12px;letter-spacing:2px;text-transform:uppercase;}
.spin{display:inline-block;animation:spin 2s linear infinite;}
@keyframes spin{to{transform:rotate(360deg);}}
.empty{text-align:center;padding:3rem 1rem;color:#2A1A08;font-size:13px;line-height:2;font-style:italic;}
`

export default function App() {
  const [tab, setTab] = useState('barra')
  const [personalidadId, setPersonalidadId] = useState('elegante')
  const [botellas, setBotellas] = useState([])
  const [cargando, setCargando] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [selKey, setSelKey] = useState(null)
  const [editPrecio, setEditPrecio] = useState('')
  const [tragos, setTragos] = useState([])
  const [tragoOpen, setTragoOpen] = useState(null)
  const [tragoPres, setTragoPres] = useState(null)
  const [msgs, setMsgs] = useState(null) // Se inicializa con la personalidad seleccionada
  const [chatInput, setChatInput] = useState('')
  const [loadBarra, setLoadBarra] = useState(false)
  const [loadTragos, setLoadTragos] = useState(false)
  const [loadChat, setLoadChat] = useState(false)
  const [nocheModo, setNocheModo] = useState(false)
  const [nochePrefs, setNochePrefs] = useState([])
  const [complementos, setComplementos] = useState(['Limón', 'Naranja', 'Menta', 'Hielo', 'Soda'])
  const [shakerActivo, setShakerActivo] = useState(false)
  const [vozActiva, setVozActiva] = useState(null) // id del trago leyendo
  const msgsEnd = useRef(null)
  const playShake = usarSonidoCoctelera()
  const { speak, stop } = usarVoz()

  // Inicializar mensajes con la personalidad elegida
  useEffect(() => {
    const pers = PERSONALIDADES[personalidadId]
    setMsgs([{ role: 'bot', text: pers.chat }])
  }, [personalidadId])

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'barra', 'botellas'), snap => {
      if (snap.exists()) setBotellas(snap.data().items || [])
      setCargando(false)
    }, () => setCargando(false))
    return () => unsub()
  }, [])

  useEffect(() => { msgsEnd.current?.scrollIntoView({ behavior: 'smooth' }) }, [msgs])

  const guardarBotellas = async (nuevas) => {
    setBotellas(nuevas)
    setGuardando(true)
    try { await setDoc(doc(db, 'barra', 'botellas'), { items: nuevas }) } catch (e) { }
    setGuardando(false)
  }

  const agregarOSumar = (nueva, base) => {
    const arr = base || botellas
    const idx = arr.findIndex(b => b.nombre.toLowerCase() === nueva.nombre.toLowerCase())
    if (idx >= 0) {
      const copia = [...arr]
      copia[idx] = { ...copia[idx], cantidad: (copia[idx].cantidad || 1) + (nueva.cantidad || 1) }
      return copia
    }
    return [...arr, { ...nueva, cantidad: nueva.cantidad || 1, categoria: detectarCategoria(nueva.nombre, nueva.tipo || '') }]
  }

  const getBotellaPorKey = (key) => {
    if (!key) return null
    const [cat, idxStr] = key.split('-')
    const grupo = botellas.filter(b => (b.categoria || detectarCategoria(b.nombre, b.tipo||'')) === cat)
    return { botella: grupo[parseInt(idxStr)], cat, localIdx: parseInt(idxStr) }
  }

  const getGlobalIdx = (cat, localIdx) => {
    const grupo = botellas.filter(b => (b.categoria || detectarCategoria(b.nombre, b.tipo||'')) === cat)
    const botella = grupo[localIdx]
    return botellas.findIndex(b => b.nombre === botella.nombre)
  }

  const cambiarCantidad = (key, delta) => {
    const { cat, localIdx } = getBotellaPorKey(key)
    const gIdx = getGlobalIdx(cat, localIdx)
    const copia = [...botellas]
    const nueva = (copia[gIdx].cantidad || 1) + delta
    if (nueva <= 0) {
      if (!window.confirm('¿Eliminás esta botella?')) return
      setSelKey(null)
      guardarBotellas(copia.filter((_, i) => i !== gIdx))
      return
    }
    copia[gIdx] = { ...copia[gIdx], cantidad: nueva }
    guardarBotellas(copia)
  }

  const guardarPrecio = (key) => {
    const { cat, localIdx } = getBotellaPorKey(key)
    const gIdx = getGlobalIdx(cat, localIdx)
    const copia = [...botellas]
    copia[gIdx] = { ...copia[gIdx], precio: parseInt(editPrecio.replace(/\D/g, '')) || 0 }
    guardarBotellas(copia)
  }

  const subirFotoBotella = async (file, key) => {
    const { cat, localIdx } = getBotellaPorKey(key)
    const gIdx = getGlobalIdx(cat, localIdx)
    const b64 = await comprimirFoto(file)
    const copia = [...botellas]
    copia[gIdx] = { ...copia[gIdx], foto: b64 }
    guardarBotellas(copia)
  }

  const analizarFotoGrupal = file => {
    setLoadBarra(true)
    const r = new FileReader()
    r.onload = async e => {
      const b64 = e.target.result.split(',')[1]
      try {
        const txt = await api(
          'Experto en bebidas premium. Analizá la foto y devolvé SOLO JSON array sin markdown. Cada objeto: {"nombre":"nombre completo con variedad","tipo":"categoría","precio_ars":número}. SIEMPRE incluí la variedad. precio_ars estimado Argentina 2025.',
          'Identificá todas las botellas visibles.',
          b64, file.type
        )
        const items = JSON.parse(txt.replace(/```json|```/g, '').trim())
        let acc = [...botellas]
        // Buscar fotos en paralelo para botellas nuevas
        const itemsConFoto = await Promise.all(items.map(async it => {
          const yaExiste = acc.find(b => b.nombre.toLowerCase() === it.nombre.toLowerCase())
          const foto_web = (!yaExiste || !yaExiste.foto_web) ? await getBotellaImageUrl(it.nombre) : (yaExiste.foto_web || null)
          return { nombre: it.nombre, tipo: it.tipo, precio: it.precio_ars || 0, foto_web }
        }))
        itemsConFoto.forEach(it => { acc = agregarOSumar(it, acc) })
        guardarBotellas(acc)
      } catch { alert('No pude analizar la imagen.') }
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
        'Buscá el precio actual de esta bebida en Argentina. Devolvé SOLO un número entero en pesos argentinos, sin texto ni símbolos.',
        `Precio actual en Argentina de: ${nombre}`,
        null, null, true
      )
      const foto_web = await getBotellaImageUrl(nombre)
      guardarBotellas(agregarOSumar({ nombre, tipo, precio: parseInt(txt.replace(/\D/g, '')) || 0, cantidad, foto_web }))
    } catch {
      const foto_web = await getBotellaImageUrl(nombre)
      guardarBotellas(agregarOSumar({ nombre, tipo, precio: 0, cantidad, foto_web }))
    }
    setLoadBarra(false)
  }

  // Generar tragos con animación de coctelera
  const sugerirTragos = async () => {
    if (!botellas.length) { alert('Primero agregá botellas.'); return }
    setShakerActivo(true)
    playShake()
  }

  const generarTragos = async () => {
    setLoadTragos(true); setTragos([])
    const pers = PERSONALIDADES[personalidadId]
    const lista = botellas.map(b => b.nombre).join(', ')
    const compls = complementos.length ? ` Complementos disponibles: ${complementos.join(', ')}.` : ''
    try {
      const txt = await api(
        pers.system + ' SOLO JSON array sin markdown. Nombres elegantes. Cada objeto: {"nombre":"...","descripcion_corta":"...","receta":"paso 1 por línea numerada\\n2. paso 2\\n...","guarnicion":"...","clasico":true/false}.',
        `Con: ${lista}.${compls} Sugerí 4 tragos. Cada paso en línea separada numerada.`
      )
      const base = JSON.parse(txt.replace(/```json|```/g, '').trim())
      const conFotos = await Promise.all(base.map(async t => {
        const foto_url = await getTragoImageUrl(t.nombre, t.receta, t.clasico)
        return { ...t, foto_url }
      }))
      setTragos(conFotos)
    } catch { }
    setLoadTragos(false)
  }

  const armarNoche = async () => {
    const prefs = nochePrefs.length ? nochePrefs.join(', ') : 'lo que quieras'
    const lista = botellas.map(b => b.nombre).join(', ')
    const compls = complementos.length ? ` Complementos: ${complementos.join(', ')}.` : ''
    setShakerActivo(true)
    playShake()
    setNocheModo(false)
    // Se continúa en onShakerDone
    window._pendingNoche = { prefs, lista, compls }
  }

  const onShakerDone = useCallback(async () => {
    setShakerActivo(false)
    setLoadTragos(true); setTragos([])
    const pers = PERSONALIDADES[personalidadId]

    // ¿Era modo noche?
    const pendiente = window._pendingNoche
    window._pendingNoche = null

    const lista = pendiente ? pendiente.lista : botellas.map(b => b.nombre).join(', ')
    const compls = pendiente ? pendiente.compls : (complementos.length ? ` Complementos: ${complementos.join(', ')}.` : '')
    const modoTexto = pendiente ? `Esta noche: ${pendiente.prefs}.` : ''

    try {
      const txt = await api(
        pers.system + ' SOLO JSON array sin markdown. Nombres elegantes. Cada objeto: {"nombre":"...","descripcion_corta":"...","receta":"paso 1 por línea numerada\\n2. paso 2\\n...","guarnicion":"...","clasico":true/false}.',
        `Mi barra: ${lista}.${compls} ${modoTexto} Sugerí 4 tragos. Cada paso en línea separada numerada.`
      )
      const base = JSON.parse(txt.replace(/```json|```/g, '').trim())
      const conFotos = await Promise.all(base.map(async t => {
        const foto_url = await getTragoImageUrl(t.nombre, t.receta, t.clasico)
        return { ...t, foto_url }
      }))
      setTragos(conFotos)
    } catch { }
    setLoadTragos(false)
  }, [personalidadId, botellas, complementos])

  const leerTrago = (trago, idx) => {
    if (vozActiva === idx) {
      stop()
      setVozActiva(null)
      return
    }
    const pasos = parsearPasos(trago.receta)
    const texto = `${trago.nombre}. ${trago.descripcion_corta}. Preparación: ${pasos.join('. ')}`
    speak(texto, personalidadId)
    setVozActiva(idx)
    // Resetear cuando termina (estimado)
    setTimeout(() => setVozActiva(null), texto.length * 55)
  }

  const enviarChat = async texto => {
    const txt = texto || chatInput.trim()
    if (!txt) return
    setChatInput('')
    setMsgs(p => [...p, { role: 'user', text: txt }])
    setLoadChat(true)
    const pers = PERSONALIDADES[personalidadId]
    const inv = botellas.length ? ' Mi barra: ' + botellas.map(b => b.nombre).join(', ') + '.' : ''
    const compls = complementos.length ? ` Complementos: ${complementos.join(', ')}.` : ''
    try {
      const reply = await api(pers.system + inv + compls, txt)
      setMsgs(p => [...p, { role: 'bot', text: reply }])
      // Voz automática en respuesta del bartender
      speak(reply, personalidadId)
    } catch {
      setMsgs(p => [...p, { role: 'bot', text: 'Error de conexión.' }])
    }
    setLoadChat(false)
  }

  const grupos = {}
  botellas.forEach(b => {
    const cat = b.categoria || detectarCategoria(b.nombre, b.tipo || '')
    if (!grupos[cat]) grupos[cat] = []
    grupos[cat].push(b)
  })

  const total = botellas.reduce((a, b) => a + (b.precio || 0) * (b.cantidad || 1), 0)
  const totalBotellas = botellas.reduce((a, b) => a + (b.cantidad || 1), 0)
  const selData = getBotellaPorKey(selKey)
  const botSel = selData?.botella

  if (cargando) return (
    <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100vh',flexDirection:'column',gap:16,background:'#05040A'}}>
      <div style={{fontFamily:'Cormorant Garamond, serif',fontSize:28,color:'#C9A227',letterSpacing:4}}>KIKI BATTENDERS</div>
      <div style={{fontSize:12,color:'#3A2A10',letterSpacing:3}}>CARGANDO LA BARRA...</div>
    </div>
  )

  return (
    <>
      <style>{css}</style>
      <div className="app">

        {/* ANIMACIÓN COCTELERA */}
        <AnimacionCoctelera activa={shakerActivo} onDone={onShakerDone} />

        {/* MODO PRESENTACIÓN FULLSCREEN */}
        {tragoPres && (() => {
          const pasos = parsearPasos(tragoPres.receta)
          return (
            <div className="presentacion-overlay">
              <div className="pres-foto-wrap">
                <img
                  src={tragoPres.foto_url}
                  className="pres-foto"
                  alt={tragoPres.nombre}
                  onError={e => {
                    e.target.style.display='none'
                    e.target.nextElementSibling.style.display='flex'
                  }}
                />
                <div className="pres-foto-placeholder" style={{display:'none'}}>🍸</div>
                <div className="pres-foto-gradient" />
                <button className="pres-close" onClick={() => { setTragoPres(null); stop() }}>✕</button>
              </div>
              <div className="pres-body">
                <div className="pres-nombre">{tragoPres.nombre}</div>
                <div className="pres-garnish">{tragoPres.guarnicion}</div>

                <div className="pres-actions">
                  <button
                    className={`btn sm${vozActiva === 'pres' ? ' gold' : ''}`}
                    onClick={() => {
                      if (vozActiva === 'pres') { stop(); setVozActiva(null); return }
                      const txt = `${tragoPres.nombre}. ${tragoPres.descripcion_corta}. ${parsearPasos(tragoPres.receta).join('. ')}`
                      speak(txt, personalidadId)
                      setVozActiva('pres')
                    }}
                  >
                    {vozActiva === 'pres' ? '🔇 Silencio' : '🔊 Escuchar'}
                  </button>
                </div>

                <div className="pres-pasos-title">Preparación</div>
                <PasosAnimados pasos={pasos} className="pres" />
              </div>
            </div>
          )
        })()}

        <div className="header">
          <div className="header-line" />
          <div className="logo">KIKI BATTENDERS</div>
          <div className="sync-status">
            <span className={`sync-dot${!guardando?' ok':''}`}/>
            {guardando ? 'Guardando...' : 'Sincronizado'}
          </div>
        </div>

        {/* SELECTOR DE PERSONALIDAD */}
        <div className="pers-bar">
          {Object.values(PERSONALIDADES).map(p => (
            <button
              key={p.id}
              className={`pers-btn${personalidadId === p.id ? ' on' : ''}`}
              onClick={() => setPersonalidadId(p.id)}
            >
              <span className="pers-emoji">{p.emoji}</span>
              {p.nombre}
            </button>
          ))}
        </div>

        <div className="nav">
          {[['barra','🍾','La Barra'],['carta','🍸','La Carta'],['chat','✦','Bartender']].map(([id,icon,label]) => (
            <button key={id} className={`nav-btn${tab===id?' on':''}`} onClick={() => setTab(id)}>
              <span className="nav-icon">{icon}</span>{label}
            </button>
          ))}
        </div>

        <div className="screen">

          {/* === BARRA === */}
          {tab === 'barra' && <>
            {botellas.length > 0 && (
              <>
                <div className="valor-card">
                  <div>
                    <div className="valor-label">Valor de la cava</div>
                    <div className="valor-num">${total.toLocaleString('es-AR')}</div>
                    <div className="valor-sub">{totalBotellas} botellas · {botellas.length} etiquetas</div>
                  </div>
                  <span style={{fontSize:40}}>🥃</span>
                </div>
                <ADNBarra botellas={botellas} />
              </>
            )}

            {botellas.length === 0 && (
              <div className="empty">Tu barra está vacía<br/>Fotografiala para empezar</div>
            )}

            {CATEGORIAS.filter(cat => grupos[cat]?.length > 0).map(cat => (
              <div key={cat} className="cat-section">
                <div className="cat-header">
                  <span className="cat-icon">{CAT_EMOJI[cat]}</span>
                  <span className="cat-name">{cat}</span>
                  <span className="cat-count">{grupos[cat].reduce((a,b)=>a+(b.cantidad||1),0)} botellas</span>
                </div>
                <div className="shelf-surface">
                  {grupos[cat].map((b, i) => {
                    const key = `${cat}-${i}`
                    return (
                      <div key={i} className={`bottle${selKey===key?' active':''}`} onClick={() => { setSelKey(selKey===key?null:key); setEditPrecio(b.precio?.toString()||'') }}>
                        {(b.cantidad || 1) > 1 && <div className="bottle-qty">×{b.cantidad}</div>}
                        {(b.foto_web || b.foto)
                          ? <img src={b.foto_web || b.foto} className="bottle-img" alt={b.nombre}
                              onError={e => { e.target.style.display='none'; e.target.nextElementSibling.style.display='flex' }} />
                          : null
                        }
                        <div className="bottle-emoji-box" style={{display: (b.foto_web || b.foto) ? 'none' : 'flex'}}>{CAT_EMOJI[cat]}</div>
                        <span className="bottle-label">{b.nombre.split(' ').slice(0,2).join(' ')}</span>
                      </div>
                    )
                  })}
                </div>

                {selKey?.startsWith(cat+'-') && botSel && (
                  <div className="bottle-detail">
                    <div className="bd-top">
                      <label style={{cursor:'pointer'}}>
                        {(botSel.foto_web || botSel.foto)
                          ? <img src={botSel.foto_web || botSel.foto} className="bd-foto" alt={botSel.nombre}
                              onError={e => { e.target.style.display='none'; e.target.nextElementSibling.style.display='flex' }} />
                          : null
                        }
                        <div className="bd-foto-empty" style={{display: (botSel.foto_web || botSel.foto) ? 'none' : 'flex'}}>{CAT_EMOJI[cat]}</div>
                        <input type="file" accept="image/*" capture="environment" style={{display:'none'}} onChange={e => e.target.files[0] && subirFotoBotella(e.target.files[0], selKey)} />
                      </label>
                      <div className="bd-info">
                        <div className="bd-name">{botSel.nombre}</div>
                        <div className="bd-type">{botSel.tipo}</div>
                      </div>
                      <button className="bd-close" onClick={() => setSelKey(null)}>✕</button>
                    </div>

                    <div className="price-row">
                      <span style={{fontSize:10,color:'#3A2A10',letterSpacing:2,textTransform:'uppercase'}}>Precio</span>
                      <input className="price-input" value={editPrecio} onChange={e => setEditPrecio(e.target.value)} placeholder="0" />
                      <button className="btn sm gold" onClick={() => guardarPrecio(selKey)}>OK</button>
                    </div>

                    <div className="qty-row">
                      <span className="qty-label">Cantidad</span>
                      <button className="qty-btn" onClick={() => cambiarCantidad(selKey, -1)}>−</button>
                      <span className="qty-num">{botSel.cantidad || 1}</span>
                      <button className="qty-btn" onClick={() => cambiarCantidad(selKey, +1)}>+</button>
                    </div>

                    <div className="bd-actions">
                      <button className="btn sm gold" style={{flex:1}} onClick={() => { enviarChat(`¿Qué tragos puedo hacer con ${botSel.nombre}?`); setTab('chat') }}>¿Qué hago con esta?</button>
                      <button className="btn sm" onClick={async () => {
                        const { cat, localIdx } = getBotellaPorKey(selKey)
                        const gIdx = getGlobalIdx(cat, localIdx)
                        setLoadBarra(true)
                        const foto_web = await getBotellaImageUrl(botSel.nombre)
                        if (foto_web) {
                          const copia = [...botellas]
                          copia[gIdx] = { ...copia[gIdx], foto_web }
                          guardarBotellas(copia)
                        }
                        setLoadBarra(false)
                      }}>📷 Foto</button>
                    </div>

                    {/* Pairing Sommelier */}
                    <PairingSommelier botella={botSel} personalidadId={personalidadId} />
                  </div>
                )}
              </div>
            ))}

            <div className="sep" />
            <CajonAlquimia
              seleccionados={complementos}
              onToggle={nombre => setComplementos(p => p.includes(nombre) ? p.filter(x => x !== nombre) : [...p, nombre])}
            />
            <div className="sep" />
            <label className="upload-zone">
              <span className="upload-icon">📸</span>
              <div className="upload-title">Fotografiá tu barra</div>
              <div className="upload-sub">La IA identifica y agrupa las botellas automáticamente</div>
              <input type="file" accept="image/*" capture="environment" style={{display:'none'}} onChange={e => e.target.files[0] && analizarFotoGrupal(e.target.files[0])} />
            </label>
            <button className="btn full" onClick={agregarManual} style={{marginBottom:8}}>+ Agregar botella manualmente</button>
            {loadBarra && <div className="loading"><span className="spin">◌</span> &nbsp;Analizando...</div>}
          </>}

          {/* === CARTA === */}
          {tab === 'carta' && <>
            <div>
              <div className="carta-title">La Carta</div>
              <div className="carta-sub">{PERSONALIDADES[personalidadId].emoji} {PERSONALIDADES[personalidadId].nombre} · Esta noche</div>
              <div className="carta-divider" />
            </div>
            {!nocheModo ? (
              <>
                <button className="btn full gold" onClick={sugerirTragos} style={{marginBottom:10}}>🍸 &nbsp;Ver qué puedo preparar</button>
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

            {tragos.map((t, i) => {
              const pasos = parsearPasos(t.receta)
              const abierto = tragoOpen === i
              return (
                <div key={i} className="trago-card">
                  <div className="trago-foto-wrap" onClick={() => setTragoPres(t)}>
                    <img
                      src={t.foto_url}
                      className="trago-foto"
                      alt={t.nombre}
                      onError={e => {
                        e.target.style.display='none'
                        e.target.nextElementSibling.style.display='flex'
                      }}
                    />
                    <div className="trago-foto-placeholder" style={{display:'none'}}>🍸</div>
                    <div className="trago-foto-overlay">
                      <div style={{fontFamily:'Cormorant Garamond,serif',fontSize:22,color:'#E8D08A',lineHeight:1}}>{t.nombre}</div>
                    </div>
                    <div className="trago-foto-hint">⛶ pantalla completa</div>
                  </div>

                  <div className="trago-body">
                    <div className="trago-top">
                      <div className="trago-nombre">{t.nombre}</div>
                      <div className="trago-garnish">{t.guarnicion||'—'}</div>
                    </div>
                    <div className="trago-desc">{t.descripcion_corta}</div>

                    <div className="trago-actions">
                      <button
                        className={`trago-voz-btn${vozActiva === i ? ' hablando' : ''}`}
                        onClick={() => leerTrago(t, i)}
                      >
                        {vozActiva === i ? '🔇' : '🔊'} {vozActiva === i ? 'Silenciar' : 'Escuchar'}
                      </button>
                    </div>

                    {abierto && (
                      <div className="pasos-wrap">
                        <div className="pasos-title">Preparación</div>
                        <PasosAnimados pasos={pasos} />
                      </div>
                    )}

                    <div className="trago-toggle" onClick={() => setTragoOpen(abierto ? null : i)}>
                      {abierto ? '▲ cerrar' : '▼ ver preparación'}
                    </div>
                  </div>
                </div>
              )
            })}

            {!tragos.length && !loadTragos && <div className="empty">Elegí una opción arriba para ver<br/>qué se puede preparar esta noche.</div>}
          </>}

          {/* === CHAT === */}
          {tab === 'chat' && msgs && (
            <div className="chat-wrap">
              <div className="chat-pers">{PERSONALIDADES[personalidadId].emoji} {PERSONALIDADES[personalidadId].nombre} · {PERSONALIDADES[personalidadId].desc}</div>
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
