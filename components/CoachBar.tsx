"use client";

import { useEffect, useRef, useState } from "react";
import { errorText, requestCoach } from "@/lib/api";
import type { CoachReview } from "@/lib/coach";
import type { Settings } from "@/lib/types";

export interface CoachState {
  review: CoachReview;
  /** Textos exatos que a IA comentou, para avisar quando a resposta mudou depois. */
  textos: string[];
}

interface CoachRequest {
  texto: string;
  contexto: string;
  respostas: string[];
  settings: Settings;
  senha: string;
}

/** Estado dos comentários da IA; zera sempre que `resetKey` muda (um resultado novo). */
export function useCoach(resetKey: unknown) {
  const [coach, setCoach] = useState<CoachState | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => () => abortRef.current?.abort(), []);
  useEffect(() => {
    abortRef.current?.abort();
    setCoach(null);
    setError("");
  }, [resetKey]);

  async function comentar(request: CoachRequest) {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setLoading(true);
    setError("");
    try {
      const review = await requestCoach(request, controller.signal);
      setCoach({ review, textos: request.respostas });
    } catch (caught) {
      if (!controller.signal.aborted) setError(errorText(caught));
    } finally {
      if (abortRef.current === controller) {
        abortRef.current = null;
        setLoading(false);
      }
    }
  }

  return { coach, loading, error, comentar };
}

interface Props {
  coach: CoachState | null;
  loading: boolean;
  error: string;
  onAsk: () => void;
  /** Texto de "via provedor · modelo" que fica ao lado do botão. */
  children?: React.ReactNode;
}

/** Botão "Comentários da IA", erro e o veredito de qual versão ela mandaria (só com 2+ versões). */
export default function CoachBar({ coach, loading, error, onAsk, children }: Props) {
  const escolha = coach && coach.textos.length > 1 ? coach.review.escolha : null;
  return (
    <>
      <div className="results-head">
        {children}
        <button className="act coach-ask" disabled={loading} onClick={onAsk}>
          {loading ? "A IA está lendo…" : coach ? "Reavaliar respostas" : "Recomendar resposta"}
        </button>
      </div>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      {escolha && (
        <p className="coach-verdict" role="status">
          <span className="coach-tag">IA</span> Eu mandaria a <b>versão {escolha}</b>
          {coach?.review.motivo && <>: {coach.review.motivo}</>}
        </p>
      )}
    </>
  );
}
