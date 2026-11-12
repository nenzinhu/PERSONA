"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { TONE_LABELS, TONES, type Tone } from "@/lib/adjust";
import type { CoachNote } from "@/lib/coach";
import { humanize, type HumanizeOptions } from "@/lib/humanize";
import { styleScore, type Fingerprint } from "@/lib/stylometry";
import { isValidWhatsAppPhone } from "@/lib/whatsapp";
import { useLocalState } from "@/lib/store";
import { applyCorrections, type Correction } from "@/lib/corrections";
import { analyzeDraftDistortions } from "@/lib/cognitive/cognitiveDistortions";
import { FranklPauseModal } from "./cognitive/FranklPauseModal";

interface Props {
  raw: string;
  opts: HumanizeOptions;
  baseSeed: number;
  telefone: string;
  onSave: (text: string) => void;
  /** Seu fingerprint; sem ele (poucos exemplos) não há nota. */
  meuJeito: Fingerprint | null;
  onShown: (text: string) => void;
  preferState: "hidden" | "open" | "chosen" | "lost";
  onPrefer: (clean: string) => void;
  /** Reescreve o texto (sem erros de digitação) num tom; sem ela, os botões de tom não aparecem. */
  onTone?: (tom: Tone, texto: string) => Promise<string>;
  /** Número da versão, para a IA se referir a ela. */
  versao?: number;
  /** Comentário da IA sobre esta versão. */
  coach?: CoachNote;
  /** Texto que a IA comentou; se a resposta mudou depois, o comentário fica marcado como antigo. */
  coachFor?: string;
  /** A IA mandaria esta. */
  recommended?: boolean;
}

function scoreClass(score: number) {
  return score >= 70 ? "score good" : score >= 40 ? "score mid" : "score bad";
}

export default function ResultCard({
  raw,
  opts,
  baseSeed,
  telefone,
  onSave,
  meuJeito,
  onShown,
  preferState,
  onPrefer,
  onTone,
  versao,
  coach,
  coachFor,
  recommended = false,
}: Props) {
  const [seed, setSeed] = useState(baseSeed * 7919);
  const [edited, setEdited] = useState<string | null>(null);
  // Texto da IA atual: começa no `raw` e é trocado quando você pede outro tom.
  const [current, setCurrent] = useState(raw);
  const [toneLoading, setToneLoading] = useState<Tone | null>(null);
  const [showRaw, setShowRaw] = useState(false);
  const [flash, setFlash] = useState("");
  const [canShare, setCanShare] = useState(false);
  const [corrections] = useLocalState<Correction[]>("style-corrections", []);
  const [applyCorrectionsOnCopy] = useLocalState("apply-corrections", true);
  const [pause, setPause] = useState<{ text: string; reason: string } | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => setCanShare(typeof navigator !== "undefined" && "share" in navigator), []);
  useEffect(
    () => () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    },
    [],
  );

  const text = edited ?? humanize(current, { ...opts, seed });
  const nota = useMemo(() => (meuJeito ? styleScore(text, meuJeito) : null), [text, meuJeito]);
  // Versão sem erros de digitação: é a que vira exemplo, para o modelo não aprender typo falso.
  const clean = () => edited ?? humanize(current, { ...opts, typoRate: 0, seed });

  async function mudarTom(tom: Tone) {
    if (!onTone || toneLoading) return;
    setToneLoading(tom);
    try {
      setCurrent(await onTone(tom, clean()));
      setEdited(null);
    } catch (caught) {
      notify(caught instanceof Error ? caught.message : "Não consegui mudar o tom.");
    } finally {
      setToneLoading(null);
    }
  }

  useEffect(() => onShown(text), [text, onShown]);

  const suggestedTone = coach?.tom ?? null;

  function notify(message: string) {
    setFlash(message);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setFlash(""), 1600);
  }

  function finalText() {
    if (!applyCorrectionsOnCopy || !corrections.length) return { text, applied: 0 };
    const result = applyCorrections(text, corrections);
    return { text: result.text, applied: result.applied.reduce((sum, item) => sum + item.vezes, 0) };
  }

  async function writeClipboard(value: string) {
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = value;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      textarea.remove();
    }
  }

  async function copiar() {
    const final = finalText();
    const distortions = analyzeDraftDistortions(final.text);
    if (distortions.length) {
      setPause({
        text: final.text,
        reason: `O texto tem marcas de ${distortions.map((item) => item.name.toLowerCase()).join(", ")}.`,
      });
      return;
    }
    await writeClipboard(final.text);
    notify(final.applied ? `Copiado com ${final.applied} troca(s)` : "Copiado");
  }

  async function copiarDepoisDaPausa() {
    if (!pause) return;
    await writeClipboard(pause.text);
    setPause(null);
    notify("Copiado");
  }

  function whatsapp() {
    if (!isValidWhatsAppPhone(telefone)) {
      notify("Informe um número de WhatsApp válido.");
      return;
    }
    const url = `https://wa.me/${telefone.replace(/\D/g, "")}?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank", "noopener");
  }

  async function compartilhar() {
    try {
      await navigator.share({ text });
    } catch {
      // cancelamento do usuário não precisa de aviso
    }
  }

  return (
    <article className={preferState === "chosen" ? "bubble-card chosen" : "bubble-card"}>
      {pause && (
        <FranklPauseModal
          reason={pause.reason}
          confirmLabel="Copiar mesmo assim"
          onConfirm={() => void copiarDepoisDaPausa()}
          onCancel={() => setPause(null)}
        />
      )}
      <div className="card-meta">
        {versao !== undefined && <span className="muted">v{versao}</span>}
        {recommended && <span className="coach-pick">a IA mandaria esta</span>}
        {nota ? (
          <span className={scoreClass(nota.score)} title={nota.hints.join(" · ") || "Bem no seu jeito"}>
            parece você: <b>{nota.score}</b>
          </span>
        ) : (
          <span className="score none">nota: adicione exemplos</span>
        )}
        {nota && nota.score < 70 && nota.hints.length > 0 && (
          <span className="muted small">{nota.hints.join(" · ")}</span>
        )}
      </div>
      <textarea
        className="bubble"
        value={text}
        rows={Math.min(8, Math.max(2, Math.ceil(text.length / 38)))}
        onChange={(event) => setEdited(event.target.value)}
        aria-label="Resposta gerada"
      />
      {showRaw && <p className="raw">{current}</p>}
      {coach && (coach.soa || coach.dica) && (
        <aside className="coach" aria-label={`Comentário da IA sobre a versão ${versao ?? ""}`.trim()}>
          <span className="coach-tag">IA</span>
          <div className="coach-body">
            {coach.soa && (
              <p>
                <span className="coach-label">soa</span> {coach.soa}
              </p>
            )}
            {coach.dica && <p className="coach-tip">{coach.dica}</p>}
            {coachFor !== undefined && coachFor !== text && (
              <p className="muted small">Comentário sobre o texto anterior.</p>
            )}
            {suggestedTone && onTone && (
              <button className="act tone" disabled={toneLoading !== null} onClick={() => mudarTom(suggestedTone)}>
                {toneLoading === suggestedTone
                  ? "Reescrevendo…"
                  : `Aplicar: ${TONE_LABELS[suggestedTone].toLowerCase()}`}
              </button>
            )}
          </div>
        </aside>
      )}
      {onTone && (
        <div className="tones" role="group" aria-label="Mudar o tom">
          {TONES.map((tom) => (
            <button key={tom} className="act tone" disabled={toneLoading !== null} onClick={() => mudarTom(tom)}>
              {toneLoading === tom ? "Reescrevendo…" : TONE_LABELS[tom]}
            </button>
          ))}
        </div>
      )}
      <div className="actions">
        {preferState !== "hidden" && (
          <button
            className={preferState === "chosen" ? "act prefer on" : "act prefer"}
            disabled={preferState !== "open"}
            aria-pressed={preferState === "chosen"}
            title="Guarda sua escolha para o modelo aprender o seu gosto"
            onClick={() => {
              onPrefer(clean());
              notify("Escolha salva");
            }}
          >
            {preferState === "chosen" ? "👍 Preferida" : "👍 Prefiro esta"}
          </button>
        )}
        <button className="act wa" onClick={whatsapp}>
          WhatsApp
        </button>
        <button className="act" onClick={copiar}>
          Copiar
        </button>
        {canShare && (
          <button className="act" onClick={compartilhar}>
            Compartilhar
          </button>
        )}
        <button
          className="act"
          title="Sorteia outros erros e abreviações"
          onClick={() => {
            setEdited(null);
            setSeed((current) => current + 1);
          }}
        >
          Embaralhar
        </button>
        <button className="act ghost" onClick={() => setShowRaw((current) => !current)}>
          {showRaw ? "Ocultar original" : "Ver original"}
        </button>
        <button
          className="act ghost"
          onClick={() => {
            onSave(clean());
            notify("Salvo nos seus exemplos");
          }}
        >
          Salvar como meu exemplo
        </button>
        {flash && (
          <span className="flash" role="status">
            {flash}
          </span>
        )}
      </div>
    </article>
  );
}
