// Quick-pick glyph for a category, derived from its name. If the name starts
// with an emoji, that emoji is the glyph; otherwise the first letter, upper.
// Used only in the add-transaction category strip, where the full name doesn't
// fit. Grapheme-aware so ZWJ/flag/variation-selector emoji stay intact.

export function avatarGlyph(name: string): string {
  const first = firstGrapheme(name.trim());
  if (!first) return "?";
  return isEmoji(first) ? first : first.toUpperCase();
}

// The name without its leading emoji (and the space after it). Used where the
// emoji is already shown separately, so repeating it would be redundant.
// "🍔 Food" → "Food"; "Food" → "Food".
export function displayName(name: string): string {
  const trimmed = name.trim();
  const first = firstGrapheme(trimmed);
  if (first && isEmoji(first)) return trimmed.slice(first.length).trim();
  return trimmed;
}

function firstGrapheme(s: string): string {
  const seg = new Intl.Segmenter(undefined, { granularity: "grapheme" });
  for (const { segment } of seg.segment(s)) return segment;
  return "";
}

function isEmoji(g: string): boolean {
  return /\p{Extended_Pictographic}/u.test(g);
}
