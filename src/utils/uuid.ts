export function uuid(short = false) {
  const s =
    typeof crypto !== 'undefined' && crypto.getRandomValues
      ? Array.from(crypto.getRandomValues(new Uint8Array(8)))
          .map((b) => b.toString(16).padStart(2, '0'))
          .join('')
      : Math.random().toString(16).slice(2)
  return short ? s.slice(0, 8) : `${Date.now().toString(36)}-${s}`
}
export default uuid
