export async function api(path, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...options.headers }
  const res = await fetch(path, { ...options, headers })
  return res
}
