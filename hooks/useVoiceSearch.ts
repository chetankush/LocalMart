"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Voice search with the browser's built-in speech recognition (Chrome on
 * Android/desktop, Safari on iPhone 14.5+). Works in Hindi ("hi-IN") or
 * Indian English ("en-IN"); Hindi results come back in Devanagari and the
 * search backend understands them.
 */

export type VoiceLang = "hi-IN" | "en-IN";
export type VoiceError = "denied" | "no-speech" | "no-mic" | "network" | "failed";

const LANG_KEY = "lm_voice_lang";

type Recognition = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  maxAlternatives: number;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((e: any) => void) | null;
  onerror: ((e: any) => void) | null;
  onend: (() => void) | null;
};

function recognitionCtor(): (new () => Recognition) | null {
  if (typeof window === "undefined") return null;
  const w = window as any;
  return w.SpeechRecognition || w.webkitSpeechRecognition || null;
}

export const VOICE_ERROR_TEXT: Record<VoiceError, string> = {
  denied: "Microphone is blocked. Allow the mic for this site in your browser settings, then try again.",
  "no-speech": "Didn't catch that. Tap the mic and speak again.",
  "no-mic": "No microphone found on this device.",
  network: "Voice search needs internet. Check your connection.",
  failed: "Voice search stopped. Please try again.",
};

export function useVoiceSearch(onFinal: (text: string) => void) {
  const [supported, setSupported] = useState(false);
  const [listening, setListening] = useState(false);
  const [interim, setInterim] = useState("");
  const [error, setError] = useState<VoiceError | null>(null);
  const [lang, setLangState] = useState<VoiceLang>("hi-IN");
  const recRef = useRef<Recognition | null>(null);
  const onFinalRef = useRef(onFinal);
  onFinalRef.current = onFinal;

  useEffect(() => {
    setSupported(!!recognitionCtor());
    try {
      const saved = localStorage.getItem(LANG_KEY);
      if (saved === "hi-IN" || saved === "en-IN") setLangState(saved);
    } catch {
      // ignore
    }
    return () => recRef.current?.abort();
  }, []);

  const setLang = useCallback((l: VoiceLang) => {
    setLangState(l);
    try {
      localStorage.setItem(LANG_KEY, l);
    } catch {
      // ignore
    }
  }, []);

  const stop = useCallback(() => recRef.current?.stop(), []);

  const start = useCallback(
    (langOverride?: VoiceLang) => {
      const Ctor = recognitionCtor();
      if (!Ctor) {
        setError("failed");
        return;
      }
      recRef.current?.abort();
      const rec = new Ctor();
      rec.lang = langOverride ?? lang;
      rec.interimResults = true;
      rec.continuous = false;
      rec.maxAlternatives = 1;
      let heard = false;
      let failed = false;

      rec.onresult = (e: any) => {
        let finalText = "";
        let interimText = "";
        for (let i = e.resultIndex; i < e.results.length; i++) {
          const r = e.results[i];
          if (r.isFinal) finalText += r[0].transcript;
          else interimText += r[0].transcript;
        }
        if (interimText) setInterim(interimText);
        if (finalText.trim()) {
          heard = true;
          setInterim(finalText.trim());
          onFinalRef.current(finalText.trim());
        }
      };
      rec.onerror = (e: any) => {
        if (e.error === "aborted") return;
        failed = true;
        setError(
          e.error === "not-allowed" || e.error === "service-not-allowed"
            ? "denied"
            : e.error === "no-speech"
              ? "no-speech"
              : e.error === "audio-capture"
                ? "no-mic"
                : e.error === "network"
                  ? "network"
                  : "failed",
        );
      };
      rec.onend = () => {
        setListening(false);
        if (!heard && !failed) setError("no-speech");
      };

      setError(null);
      setInterim("");
      try {
        rec.start();
        recRef.current = rec;
        setListening(true);
      } catch {
        setError("failed");
      }
    },
    [lang],
  );

  const cancel = useCallback(() => {
    recRef.current?.abort();
    setListening(false);
    setInterim("");
    setError(null);
  }, []);

  return { supported, listening, interim, error, lang, setLang, start, stop, cancel };
}
