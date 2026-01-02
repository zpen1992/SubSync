
export interface SubtitleEntry {
  index: number;
  startTime: string;
  endTime: string;
  startTimeMs: number;
  endTimeMs: number;
  text: string;
}

export interface ComparisonResult {
  original: SubtitleEntry;
  translated?: SubtitleEntry;
  isMatch: boolean;
  timeDiffStart: number;
  timeDiffEnd: number;
  errorType?: 'MISSING' | 'TIME_MISMATCH' | 'NONE';
}

export type SortOrder = 'index' | 'timeDiff';
