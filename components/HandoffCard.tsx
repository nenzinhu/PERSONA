"use client";

import { useState } from "react";
import { useSessionState } from "@/lib/store";
import {
  buildHandoffCard,
  conversationLines,
  handoffIsReady,
  handoffItem,
  HANDOFF_KINDS,
  MAX_HANDOFF_ITEMS,
  type HandoffItem,
  type HandoffKind,
} from "@/lib/handoff";

interface Draft {
  raw: string;
  items: HandoffItem[];
  responsavel: string;
  proximaAcao: string;
}

const INITIAL: Draft = { raw: "", items: [], responsavel: "", proximaAcao: "" };

export default function HandoffCard() {
  const [draft, setDraft] = useSessionState<Draft>("beyond-handoff", INITIAL);
  const [notice, setNotice] = useState("");

  const card = buildHandoffCard(draft);
  const ready = handoffIsReady(draft);
  const lines = conversationLines(draft.raw);

  function update(patch: Partial<Draft>) {
    setNotice("");
    setDraft((current) => ({ ...current, ...patch }));
  }

  function loadLines() {
    update({ items: lines.map((line, index) => handoffItem(line, index)).slice(0, MAX_HANDOFF_ITEMS) });
  }

  function changeItem(id: string, patch: Partial<HandoffItem>) {
    update({ items: draft.items.map((item) => (item.id === id ? { ...item, ...patch } : item)) });
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(card);
      setNotice("Cartão copiado. Nada foi enviado.");
    } catch {
      setNotice("Não consegui copiar. Selecione o texto do cartão e copie manualmente.");
    }
  }

  return (
    <div className="studio-grid">
      <section className="composer" aria-labelledby="handoff-heading">
        <div className="panel-heading">
          <span aria-hidden="true">⇄</span>
          <h2 id="handoff-heading">Passar uma conversa adiante</h2>
        </div>
        <p className="studio-intro">
          Cole a conversa, escolha o que é fato, dúvida e próxima ação. Cada item guarda o trecho de origem e precisa da
          sua confirmação antes de sair daqui.
        </p>

        <label className="field">
          <span>Conversa ou anotações</span>
          <textarea
            rows={6}
            maxLength={8000}
            value={draft.raw}
            onChange={(event) => update({ raw: event.target.value })}
            placeholder={"Cole aqui a conversa.\nCada linha vira um item para revisar."}
          />
        </label>
        <div className="actions">
          <button type="button" className="act" onClick={loadLines} disabled={!lines.length}>
            Carregar linhas para revisar
          </button>
          <span className="muted small">
            {lines.length} linha{lines.length === 1 ? "" : "s"} · até {MAX_HANDOFF_ITEMS} itens
          </span>
        </div>

        {draft.items.length > 0 && (
          <div className="handoff-list">
            {draft.items.map((item, index) => (
              <article className="handoff-item" key={item.id}>
                <div className="handoff-item-top">
                  <label className="field">
                    <span>Item {index + 1}</span>
                    <select
                      value={item.kind}
                      onChange={(event) => changeItem(item.id, { kind: event.target.value as HandoffKind })}
                    >
                      {HANDOFF_KINDS.map((kind) => (
                        <option key={kind.id} value={kind.id}>
                          {kind.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <button
                    type="button"
                    className="act"
                    onClick={() => update({ items: draft.items.filter((entry) => entry.id !== item.id) })}
                  >
                    Remover
                  </button>
                </div>
                <input
                  aria-label={`Texto do item ${index + 1}`}
                  value={item.text}
                  maxLength={300}
                  onChange={(event) => changeItem(item.id, { text: event.target.value })}
                />
                <p className="muted small">Origem: “{item.source}”</p>
              </article>
            ))}
          </div>
        )}

        <label className="field">
          <span>Quem continua responsável? (opcional)</span>
          <input
            value={draft.responsavel}
            maxLength={80}
            onChange={(event) => update({ responsavel: event.target.value })}
            placeholder="Cabo Almeida"
          />
        </label>
        <label className="field">
          <span>Próxima ação (opcional)</span>
          <input
            value={draft.proximaAcao}
            maxLength={160}
            onChange={(event) => update({ proximaAcao: event.target.value })}
            placeholder="Enviar o relatório até 18h"
          />
        </label>
        <p className="privacy-note">
          O texto e os itens ficam só nesta sessão do navegador. Nenhuma linha é enviada à IA e nada é encaminhado
          automaticamente.
        </p>
      </section>

      <section className="studio-side" aria-labelledby="handoff-preview-heading">
        <div className="panel-heading">
          <span aria-hidden="true">✎</span>
          <h2 id="handoff-preview-heading">Cartão de continuidade</h2>
        </div>
        {ready ? (
          <>
            <pre className="handoff-preview">{card}</pre>
            <div className="actions handoff-actions">
              <button type="button" className="primary" onClick={copy}>
                Copiar cartão
              </button>
            </div>
          </>
        ) : (
          <div className="empty">
            <p>O cartão aparece aqui.</p>
            <p className="muted small">Carregue as linhas da conversa e escolha o tipo de cada item.</p>
          </div>
        )}
        {notice && (
          <p className="provider-status" role="status">
            {notice}
          </p>
        )}
      </section>
    </div>
  );
}
