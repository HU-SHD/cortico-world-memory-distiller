export interface Config {
  rawDir: string;
  archiveDir: string;
  distilledDir: string;
  intervalDays: number;
  ragThreshold: number;
}

export const DEFAULT_CONFIG: Config = {
  rawDir: './data/memory/raw/',
  archiveDir: './data/memory/archive/',
  distilledDir: './data/memory/distilled/',
  intervalDays: 3,
  ragThreshold: 0.6,
};