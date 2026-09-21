const BASE_URL = '' // Proxy forwards /api, /uploads, etc.

export async function checkHealth() {
  const res = await fetch('/api/health')
  if (!res.ok) throw new Error(`Health check failed: ${res.statusText}`)
  return res.json()
}

export async function getMetrics() {
  const res = await fetch('/api/metrics')
  if (!res.ok) throw new Error(`Failed to load metrics: ${res.statusText}`)
  return res.json()
}

export async function getSamples() {
  const res = await fetch('/api/samples')
  if (!res.ok) throw new Error(`Failed to fetch samples: ${res.statusText}`)
  return res.json()
}

export async function predictSingle(file) {
  const formData = new FormData()
  formData.append('file', file)

  const res = await fetch('/api/predict', {
    method: 'POST',
    body: formData
  })

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}))
    throw new Error(errorData.detail || `Prediction failed (${res.status})`)
  }
  return res.json()
}

export async function predictBatch(fileList) {
  const formData = new FormData()
  for (const file of fileList) {
    formData.append('files', file)
  }

  const res = await fetch('/api/batch-predict', {
    method: 'POST',
    body: formData
  })

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}))
    throw new Error(errorData.detail || `Batch prediction failed (${res.status})`)
  }
  return res.json()
}

export async function getHistory(params = {}) {
  const query = new URLSearchParams()
  if (params.limit) query.append('limit', params.limit)
  if (params.offset) query.append('offset', params.offset)
  if (params.class_filter) query.append('class_filter', params.class_filter)
  if (params.defective_filter !== undefined && params.defective_filter !== null) {
    query.append('defective_filter', params.defective_filter)
  }

  const res = await fetch(`/api/history?${query.toString()}`)
  if (!res.ok) throw new Error('Failed to fetch inspection history')
  return res.json()
}

export async function getHistoryStats() {
  const res = await fetch('/api/history/stats')
  if (!res.ok) throw new Error('Failed to load history stats')
  return res.json()
}

export async function deleteHistoryItem(id) {
  const res = await fetch(`/api/history/${id}`, { method: 'DELETE' })
  if (!res.ok) throw new Error('Failed to delete history item')
  return res.json()
}

export async function clearAllHistory() {
  const res = await fetch('/api/history', { method: 'DELETE' })
  if (!res.ok) throw new Error('Failed to clear history')
  return res.json()
}
