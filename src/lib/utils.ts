import { clsx } from "clsx"
import type { ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
]

export function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  const month = MONTHS[d.getMonth()]
  const day = d.getDate()
  const year = d.getFullYear()
  return `${month} ${day}, ${year}`
}

export function formatTime(dateStr: string): string {
  const d = new Date(dateStr)
  let hours = d.getHours()
  const minutes = d.getMinutes().toString().padStart(2, "0")
  const ampm = hours >= 12 ? "PM" : "AM"
  hours = hours % 12 || 12
  return `${hours}:${minutes} ${ampm}`
}

export function formatDateTime(dateStr: string): string {
  return `${formatDate(dateStr)} at ${formatTime(dateStr)}`
}

export function getProp<T extends object, TKey extends keyof T>(
  obj: T,
  key: TKey
): T[TKey] {
  return Reflect.get(obj, key)
}

export function setProp<T extends object>(
  obj: T,
  key: string,
  value: unknown
): T {
  const result = { ...obj }
  Reflect.set(result, key, value)
  return result
}
