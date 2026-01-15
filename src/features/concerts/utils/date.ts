export function parseWhen(when: string) {
    // safer than "YYYY-MM-DD HH:mm:ss"
    const d = new Date(String(when ?? '').replace(' ', 'T'))
    return Number.isNaN(d.getTime()) ? null : d
  }
  