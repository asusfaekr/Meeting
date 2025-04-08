declare module 'date-fns' {
  export function format(date: Date, formatStr: string): string
  export function addMinutes(date: Date, amount: number): Date
  export function setHours(date: Date, hours: number): Date
  export function setMinutes(date: Date, minutes: number): Date
} 