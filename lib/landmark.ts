/** "Bus Stand" → "Near Bus Stand"; a landmark that already starts with "Near" stays as typed */
export function nearLandmark(landmark: string): string {
  const l = landmark.trim();
  return /^near\b/i.test(l) ? l : `Near ${l}`;
}
