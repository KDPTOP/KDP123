// Common KDP paperback trim sizes in inches (data/facts/trim-sizes.md), as "W x H" labels.
export const TRIMS = ['5 x 8', '5.25 x 8', '5.5 x 8.5', '6 x 9', '6.14 x 9.21', '7 x 10', '8 x 10', '8.25 x 11', '8.5 x 8.5', '8.5 x 11'] as const;

export function parseTrim(label: string): [number, number] | undefined {
  const m = label.match(/^\s*(\d+(?:\.\d+)?)\s*x\s*(\d+(?:\.\d+)?)\s*$/);
  return m ? [Number(m[1]), Number(m[2])] : undefined;
}
