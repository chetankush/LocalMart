# Vendor approval chime

Place an MP3 file at `public/sounds/new-order.mp3`. The vendor approvals
inbox plays this clip on each newly arrived order, gated by:
1. Browser autoplay policy — the user must tap "Enable" on the audio-unlock
   banner once per session before any chime can play.
2. Per-store mute (`Vendor.approvalSoundMuted` in Postgres, surfaced in
   `/vendor/settings`).
3. Session mute (the speaker-icon toggle in the vendor top bar).

## File requirements
- Format: MP3 (broad browser support, no codec gymnastics).
- Length: ≤ 1 second. Friendly, not alarming.
- Size: ≤ 20 KB. Preloaded on page mount.

If the file is missing, the rest of the inbox (badge, toast, tab-flash,
approve/reject) still works — only the chime is silent.
