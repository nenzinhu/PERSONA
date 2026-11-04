"use client";

import { useEffect, useRef, useState } from "react";
import Icon from "./Icon";
import type { Reading } from "@/lib/adjust";
import { errorText, requestReading } from "@/lib/api";
import type { Settings } from "@/lib/types";

interface Props {
  /** Mensagem a ser lida. */
  texto: string;
  /** Mensagens anteriores, para a IA entender o clima. */
  contexto?: string;
  settings: Settings;
  senha: string;
}

const ROWS: { key: keyof Reading; label: string }[] = [
  { key: "emocao", label: "Emoção" },
  { key: "intencao", label: "Intenção" },
  { key: "entrelinhas", label: "Entrelinhas" },
  { key: "cuidado", label: "Cuidado" },
];

/** Botão "Ler a mensagem" + cartão com emoção, intenção, entrelinhas e cuidado (ideias 4 e 5). */
export default function MessageReading({ texto, contexto = "", settings, senha }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [reading, setReading] = useState<Reading | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => () => abortRef.current?.abort(), []);
  // Outra mensagem, outra leitura.
  useEffect(() => {
    setReading(null);
    setError("");
  }, [texto]);

  async function ler() {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setLoading(true);
    setError("");
    try {
      setReading(await requestReading({ texto, contexto, settings, senha }, controller.signal));
    } catch (caught) {
      setError(errorText(caught));
    } finally {
      if (abortRef.current === controller) abortRef.current = null;
      setLoading(false);
    }
  }

  return (
    <div className="reading">
      <button className="act" disabled={loading || !texto.trim()} onClick={ler}>
        <Icon name="analyze" />
        {loading ? "Analisando…" : "Analisar mensagem"}
      </button>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      {reading && (
        <dl className="reading-card" aria-live="polite">
          {ROWS.filter((row) => reading[row.key]).map((row) => (
            <div key={row.key}>
              <dt>{row.label}</dt>
              <dd>{reading[row.key]}</dd>
            </div>
          ))}
        </dl>
      )}
    </div>
  );
}
