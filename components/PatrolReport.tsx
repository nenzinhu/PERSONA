"use client";

import { useState } from "react";
import { useSessionState } from "@/lib/store";
import {
  buildPatrolText,
  findPlace,
  isPatrolVehicle,
  PATROL_GROUPS,
  PATROL_OPERATIONS,
  PATROL_PLACES,
  placeUsesKm,
  sanitizeKm,
  type PatrolDraft,
  type PatrolOperation,
} from "@/lib/patrol";

const INITIAL: PatrolDraft = { operacao: "P-115", viatura: "", destino: "sc-400", km: "" };

export default function PatrolReport() {
  const [draft, setDraft] = useSessionState<PatrolDraft>("patrol-report", INITIAL);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  const place = findPlace(draft.destino);
  const usesKm = placeUsesKm(place);
  const text = buildPatrolText(draft);
  const vehicleOk = isPatrolVehicle(draft.viatura);

  const update = (patch: Partial<PatrolDraft>) => {
    setNotice("");
    setError("");
    setDraft((current) => ({ ...current, ...patch }));
  };

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setNotice("Texto copiado. Nada foi enviado.");
    } catch {
      setError("Não consegui copiar. Selecione o texto e copie manualmente.");
    }
  }

  async function share() {
    if (typeof navigator.share !== "function") {
      await copy();
      return;
    }
    try {
      await navigator.share({ text });
      setNotice("Menu de compartilhamento aberto.");
    } catch {
      // cancelar o menu não é erro
    }
  }

  return (
    <div className="studio-grid">
      <section className="composer" aria-labelledby="patrol-heading">
        <div className="panel-heading">
          <span aria-hidden="true">⇄</span>
          <h2 id="patrol-heading">P-115 / P-18</h2>
        </div>
        <p className="studio-intro">
          Monte o texto do patrulhamento com a viatura, o km e a rodovia, o acesso ou a ponte. Sem data e sem hora: só o
          texto padrão.
        </p>

        <fieldset className="order-phase">
          <legend>Operação</legend>
          <div className="patrol-ops">
            {PATROL_OPERATIONS.map((operation) => (
              <button
                key={operation.id}
                type="button"
                className={draft.operacao === operation.id ? "chip pos on" : "chip pos"}
                aria-pressed={draft.operacao === operation.id}
                onClick={() => update({ operacao: operation.id as PatrolOperation })}
              >
                {operation.label}
              </button>
            ))}
          </div>
        </fieldset>

        <div className="row">
          <label className="field">
            <span>Número da viatura</span>
            <input
              value={draft.viatura}
              inputMode="numeric"
              maxLength={4}
              placeholder="0042"
              aria-invalid={Boolean(draft.viatura) && !vehicleOk}
              onChange={(event) => update({ viatura: event.target.value.replace(/\D/g, "").slice(0, 4) })}
            />
          </label>
          <label className="field">
            <span>Km</span>
            <input
              value={draft.km}
              inputMode="decimal"
              maxLength={6}
              placeholder="12"
              disabled={!usesKm}
              onChange={(event) => update({ km: sanitizeKm(event.target.value) })}
            />
          </label>
        </div>
        {!usesKm && <p className="muted small patrol-hint">Pontes não usam km no texto padrão.</p>}
        {draft.viatura && !vehicleOk && (
          <p className="muted small patrol-hint">A viatura precisa de quatro dígitos, como 0042.</p>
        )}

        <label className="field">
          <span>Rodovia, acesso ou ponte</span>
          <select value={draft.destino} onChange={(event) => update({ destino: event.target.value })}>
            {PATROL_GROUPS.map((group) => (
              <optgroup key={group} label={group}>
                {PATROL_PLACES.filter((item) => item.group === group).map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.label}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </label>

        <div className="actions">
          <button type="button" className="primary" onClick={copy} disabled={!text}>
            Copiar texto
          </button>
          <button type="button" className="act" onClick={share} disabled={!text}>
            Compartilhar
          </button>
          <button type="button" className="act" onClick={() => setDraft(INITIAL)}>
            Limpar
          </button>
        </div>
        <p className="privacy-note">
          O rascunho fica só nesta sessão do navegador. Nada é enviado à IA e nada é compartilhado sem você confirmar.
        </p>
        {error && (
          <p className="provider-status error" role="alert">
            {error}
          </p>
        )}
        {notice && (
          <p className="provider-status" role="status">
            {notice}
          </p>
        )}
      </section>

      <section className="studio-side" aria-labelledby="patrol-preview-heading">
        <div className="panel-heading">
          <span aria-hidden="true">✎</span>
          <h2 id="patrol-preview-heading">Texto do patrulhamento</h2>
        </div>
        {text ? (
          <p className="patrol-preview">{text}</p>
        ) : (
          <div className="empty">
            <p>O texto aparece aqui.</p>
            <p className="muted small">Informe o número da viatura para completar a frase.</p>
          </div>
        )}
      </section>
    </div>
  );
}
