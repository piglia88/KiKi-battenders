export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(200).end()

  const body = { ...req.body }

  // Si es búsqueda de precio, activamos web search
  if (body.useWebSearch) {
    delete body.useWebSearch
    body.tools = [{ type: 'web_search_20250305', name: 'web_search' }]
  }

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.VITE_ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
      'anthropic-beta': 'web-search-2025-03-05'
    },
    body: JSON.stringify(body)
  })

  const data = await response.json()

  // Extraer solo el texto final (ignorar tool calls)
  if (data.content) {
    const textos = data.content.filter(c => c.type === 'text').map(c => c.text)
    data.textOnly = textos.join(' ')
  }

  res.status(200).json(data)
}
