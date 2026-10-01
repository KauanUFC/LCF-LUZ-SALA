export const topics = {
  state:        (room: string, dev: string, light: string) => `state/${room}/${dev}/${light}`,
  command:      (room: string, dev: string, light: string) => `command/${room}/${dev}/${light}`,
  ack:          (room: string, dev: string, light: string) => `ack/${room}/${dev}/${light}`,
  health:       (room: string, dev: string)                => `health/${room}/${dev}`,
  availability: (room: string, dev: string)                => `availability/${room}/${dev}`,
}

export function parseTopic(topic: string): {
  type: 'state' | 'health' | 'availability' | 'ack' | 'unknown'
  room: string
  device: string
  light?: string
} {
  const parts = topic.split('/')
  if (parts.length === 4 && parts[0] === 'state') {
    return { type: 'state', room: parts[1], device: parts[2], light: parts[3] }
  }
  if (parts.length === 3 && parts[0] === 'health') {
    return { type: 'health', room: parts[1], device: parts[2] }
  }
  if (parts.length === 3 && parts[0] === 'availability') {
    return { type: 'availability', room: parts[1], device: parts[2] }
  }
  if (parts.length === 4 && parts[0] === 'ack') {
    return { type: 'ack', room: parts[1], device: parts[2], light: parts[3] }
  }
  return { type: 'unknown', room: '', device: '' }
}