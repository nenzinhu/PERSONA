"use client";

import { useState } from "react";
import { useSessionState } from "@/lib/store";
import {
  buildEnergyMessage,
  energyIsReady,
  ENERGY_AVAILABILITY,
  MAX_ENERGY_FIELD,
  type EnergyAvailabilityId,
  type EnergyDraft,
} from "@/lib/energy";

const INITIAL: EnergyDraft = { disponibilidade: "depois", assunto: "", quando: "", limite: "" };

export default function LowEnergyMode() {
  const [draft, setDraft] = useSessionState<EnergyDraft>("beyond-energy", INITIAL);
  const [notice, setNotice] = useState("");

  const message = buildEnergyMessage(draft);
  const ready = energyIsReady(draft);
  const update = (key: keyof EnergyDraft, value: string) => {
    setNotice("");
    setDraft((current) => ({ ...current, [key]: value }));
  };

  async function copy() {
    try {
      await navigator.clipboard.writeText(message);
      setNotice("Mensagem copiada. Nada foi enviado.");
    } catch {
      setNotice("Não consegui copiar. Selecione o texto da mensagem e copie manualmente.");
    }
  }

  return (
    <div className="studio-grid">
      <section className="composer" aria-labelledby="energy-heading">
        <div className="panel-heading">
          <span aria-hidden="true">◐</span>
          <h2 id="energy-heading">Quanta energia você tem agora?</h2>
        </div>
        <p className="studio-intro">
          Escolha só a sua disponibilidade real. O Persona escreve a frase e não cria justificativas por você.
        </p>

        <fieldset className="energy-choice">
          <legend>Disponibilidade</legend>
          {ENERGY_AVAILABILITY.map((option) => (
            <label
              key={option.id}
              className={draft.disponibilidade === option.id ? "energy-option on" : "energy-option"}
            >
              <input
                type="radio"
                name="disponibilidade"
                value={option.id}
                checked={draft.disponibilidade === option.id}
                onChange={() => update("disponibilidade", option.id as EnergyAvailabilityId)}
              />
              <span>
                <strong>{option.label}</strong>
                <span className="muted small">{option.hint}</span>
              </span>
            </label>
          ))}
        </fieldset>

        <label className="field">
          <span>Sobre o que é? (comece com o artigo)</span>
          <input
            value={draft.assunto}
            maxLength={MAX_ENERGY_FIELD}
            onChange={(event) => update("assunto", event.target.value)}
            placeholder="o relatório do turno"
          />
        </label>

        {draft.disponibilidade === "depois" && (
          <label className="field">
            <span>Quando você retoma?</span>
            <input
              value={draft.quando}
              maxLength={MAX_ENERGY_FIELD}
              onChange={(event) => update("quando", event.target.value)}
              placeholder="na quinta de manhã"
            />
          </label>
        )}
        {draft.disponibilidade === "nao-assumo" && (
          <label className="field">
            <span>Se continuar em aberto até quando? (opcional)</span>
            <input
              value={draft.quando}
              maxLength={MAX_ENERGY_FIELD}
              onChange={(event) => update("quando", event.target.value)}
              placeholder="sexta"
            />
          </label>
        )}

        <label className="field">
          <span>Qual é o seu limite? (opcional)</span>
          <input
            value={draft.limite}
            maxLength={MAX_ENERGY_FIELD}
            onChange={(event) => update("limite", event.target.value)}
            placeholder="responder até as 14h"
          />
        </label>

        <div className="actions">
          <button type="button" className="primary" onClick={copy} disabled={!ready}>
            Copiar mensagem
          </button>
          <button type="button" className="act" onClick={() => setDraft(INITIAL)}>
            Limpar
          </button>
        </div>
        <p className="privacy-note">
          O texto fica só nesta sessão do navegador. Esta ferramenta não usa IA e não envia nada.
        </p>
        {notice && (
          <p className="provider-status" role="status">
            {notice}
          </p>
        )}
      </section>

      <section className="studio-side" aria-labelledby="energy-preview-heading">
        <div className="panel-heading">
          <span aria-hidden="true">✎</span>
          <h2 id="energy-preview-heading">Sua mensagem</h2>
        </div>
        {ready ? (
          <p className="energy-preview">{message}</p>
        ) : (
          <div className="empty">
            <p>A mensagem aparece aqui.</p>
            <p className="muted small">Informe o assunto ou o seu limite para o texto ficar completo.</p>
          </div>
        )}
      </section>
    </div>
  );
}
