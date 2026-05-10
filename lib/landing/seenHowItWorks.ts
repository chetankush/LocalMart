const KEY = "localmart:seen-how-it-works";

export function hasSeenHowItWorks(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(KEY) === "1";
  } catch {
    return false;
  }
}

export function markHowItWorksSeen(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, "1");
  } catch {
    // ignore quota / privacy mode errors
  }
}
