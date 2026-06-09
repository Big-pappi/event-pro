'use client'

import useSWR, { mutate as globalMutate } from 'swr'

const fetcher = async (url: string) => {
  const res = await fetch(url)
  if (!res.ok) throw new Error('Request failed')
  return res.json()
}

export function useApi<T = any>(key: string | null) {
  return useSWR<T>(key, fetcher, { revalidateOnFocus: false })
}

export async function apiPost<T = any>(url: string, body: any): Promise<T> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error('Request failed')
  return res.json()
}

export async function apiPut<T = any>(url: string, body: any): Promise<T> {
  const res = await fetch(url, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error('Request failed')
  return res.json()
}

export async function apiDelete<T = any>(url: string): Promise<T> {
  const res = await fetch(url, { method: 'DELETE' })
  if (!res.ok) throw new Error('Request failed')
  return res.json()
}

export const refresh = globalMutate
