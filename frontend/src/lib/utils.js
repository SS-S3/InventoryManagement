import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

export const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3000'

export async function apiFetch(path, options = {}) {
  const token = localStorage.getItem('token')
  const headers = Object.assign({'Content-Type': 'application/json'}, options.headers || {})
  if (token) headers['Authorization'] = `Bearer ${token}`
  const res = await fetch(`${API_BASE}${path}`, {...options, headers})
  if (!res.ok) {
    let body = null
    try { body = await res.json() } catch (e) {}
    const err = new Error(body?.message || `Request failed: ${res.status}`)
    err.status = res.status
    err.body = body
    throw err
  }
  try { return await res.json() } catch (e) { return null }
}