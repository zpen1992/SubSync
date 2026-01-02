
import { SubtitleEntry } from '../types';

export function timeToMs(timeStr: string): number {
  const parts = timeStr.trim().split(/[:|,.]/);
  if (parts.length < 4) return 0;
  
  const h = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10);
  const s = parseInt(parts[2], 10);
  const ms = parseInt(parts[3], 10);
  
  return h * 3600000 + m * 60000 + s * 1000 + ms;
}

export function parseSRT(content: string): SubtitleEntry[] {
  const blocks = content.replace(/\r\n/g, '\n').split(/\n\s*\n/);
  const entries: SubtitleEntry[] = [];

  blocks.forEach((block) => {
    const lines = block.trim().split('\n');
    if (lines.length < 3) return;

    const index = parseInt(lines[0], 10);
    const timeMatch = lines[1].match(/(\d{2}:\d{2}:\d{2}[,.]\d{3})\s*-->\s*(\d{2}:\d{2}:\d{2}[,.]\d{3})/);
    
    if (timeMatch) {
      const startTime = timeMatch[1];
      const endTime = timeMatch[2];
      const text = lines.slice(2).join('\n');

      entries.push({
        index: isNaN(index) ? entries.length + 1 : index,
        startTime,
        endTime,
        startTimeMs: timeToMs(startTime),
        endTimeMs: timeToMs(endTime),
        text
      });
    }
  });

  return entries;
}

export function stringifySRT(entries: SubtitleEntry[]): string {
  return entries
    .map((e, i) => `${i + 1}\n${e.startTime} --> ${e.endTime}\n${e.text}`)
    .join('\n\n');
}
