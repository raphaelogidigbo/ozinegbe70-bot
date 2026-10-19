import { config } from './config.js';

const esc = (s) => s.replace(/([,;\\])/g, '\\$1').replace(/\n/g, '\\n');

export function buildIcs() {
  const e = config.event;
  const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Ozinegbe70//Invite//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:ozinegbe70-${Date.now()}@invite`,
    `DTSTAMP:${stamp}`,
    `DTSTART:${e.startUtc}`,
    `DTEND:${e.endUtc}`,
    `SUMMARY:${esc(e.summary)}`,
    `DESCRIPTION:${esc(e.description)}`,
    `LOCATION:${esc(e.location)}`,
    'BEGIN:VALARM',
    'TRIGGER:-PT1H',
    'ACTION:DISPLAY',
    'DESCRIPTION:Event reminder',
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');
}
