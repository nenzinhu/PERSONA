"use client";

import { useEffect, useRef, useState } from "react";

interface SpeechResultAlternative {
  transcript: string;
}
interface SpeechResult {
  isFinal: boolean;
  0: SpeechResultAlternative;
}
interface SpeechResultList {
  length: number;
  [index: number]: SpeechResult;
}
interface SpeechEvent {
  resultIndex: number;
  results: SpeechResultList;
}
interface SpeechErrorEvent {
  error: string;
}
interface Recognition {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start(): void;
  stop(): void;
  onresult: ((event: SpeechEvent) => void) | null;
  onerror: ((event: SpeechErrorEvent) => void) | null;
  onend: (() => void) | null;
}
type RecognitionCtor = new () => Recognition;

function speechCtor(): RecognitionCtor | undefined {
  const scope = window as unknown as { SpeechRecognition?: RecognitionCtor; webkitSpeechRecognition?: RecognitionCtor };
  return scope.SpeechRecognition ?? scope.webkitSpeechRecognition;
}

/** Ditado pelo reconhecimento de fala do próprio navegador (pt-BR, sem chave e sem IA do Persona). */
export default function DictateButton({ onText, label = "Ditar" }: { onText: (text: string) => void; label?: string }) {
  const [supported, setSupported] = useState(false);
  const [listening, setListening] = useState(false);
  const [error, setError] = useState("");
  const recognition = useRef<Recognition | null>(null);

  useEffect(() => {
    setSupported(Boolean(speechCtor()));
    return () => recognition.current?.stop();
  }, []);

  if (!supported) return null;

  function toggle() {
    if (listening) {
      recognition.current?.stop();
      return;
    }
    const Ctor = speechCtor();
    if (!Ctor) return;
    const instance = new Ctor();
    instance.lang = "pt-BR";
    instance.continuous = true;
    instance.interimResults = false;
    instance.onresult = (event) => {
      let text = "";
      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        if (event.results[index].isFinal) text += event.results[index][0].transcript;
      }
      if (text.trim()) onText(text.trim());
    };
    instance.onerror = (event) => {
      setError(
        event.error === "not-allowed" || event.error === "service-not-allowed"
          ? "O navegador não liberou o microfone. Permita o acesso e tente de novo."
          : "Não consegui ouvir agora. Tente novamente ou escreva.",
      );
      setListening(false);
    };
    instance.onend = () => setListening(false);
    recognition.current = instance;
    setError("");
    try {
      instance.start();
      setListening(true);
    } catch {
      setError("Não consegui iniciar o microfone. Tente novamente.");
    }
  }

  return (
    <div className="dictate">
      <button
        type="button"
        className={listening ? "act tone on" : "act tone"}
        aria-pressed={listening}
        onClick={toggle}
      >
        <span aria-hidden="true">{listening ? "⏹" : "🎙"}</span> {listening ? "Parar ditado" : label}
      </button>
      <span className="muted small">
        {error || (listening ? "Ouvindo… fale normalmente." : "Ditado do navegador, em português.")}
      </span>
    </div>
  );
}
