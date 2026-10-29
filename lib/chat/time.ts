/** Chat times in India time, the same on server and phone */
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const ist = (d: string | Date) => new Date(new Date(d).getTime() + 330 * 60_000);
const dayKey = (d: string | Date) => ist(d).toISOString().slice(0, 10);

/** "4:07 pm" */
export function clock(d: string | Date) {
  const t = ist(d);
  const h = t.getUTCHours();
  return `${h % 12 || 12}:${String(t.getUTCMinutes()).padStart(2, "0")} ${h < 12 ? "am" : "pm"}`;
}

/** "Today" / "Yesterday" / "28 Oct" */
export function dayLabel(d: string | Date, now = new Date()) {
  const k = dayKey(d);
  if (k === dayKey(now)) return "Today";
  if (k === dayKey(new Date(now.getTime() - 86_400_000))) return "Yesterday";
  const t = ist(d);
  return `${t.getUTCDate()} ${MONTHS[t.getUTCMonth()]}${t.getUTCFullYear() !== ist(now).getUTCFullYear() ? ` ${t.getUTCFullYear()}` : ""}`;
}

export const sameDay = (a: string | Date, b: string | Date) => dayKey(a) === dayKey(b);

/** For the chat list: "4:07 pm" today, else "Yesterday" / "28 Oct" */
export function listTime(d: string | Date, now = new Date()) {
  return dayKey(d) === dayKey(now) ? clock(d) : dayLabel(d, now);
}
