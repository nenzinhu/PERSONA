"use client";

import { useState, type FormEvent } from "react";
import { useLocalState } from "@/lib/store";
import { removeCorrection, upsertCorrection, type Correction } from "@/lib/corrections";

export default function CorrectionsPanel() {
  const [corrections, setCorrections] = useLocalState<Correction[]>("style-corrections", []);
  const [apply, setApply] = useLocalState("apply-corrections", true);
  const [de, setDe] = useState("");
  const [para, setPara] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    try {
      setCorrections(upsertCorrection(corrections, de, para));
      setDe("");
      setPara("");
      setNotice("Troca salva neste navegador.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Não consegui salvar.");
    }
  }

  return (
    <section className="backup-panel" aria-labelledby="corrections-heading">
      <div className="panel-heading">
        <span aria-hidden="true">✎</span>
        <h2 id="corrections-heading">Correções que eu sempre faço</h2>
        <span className="panel-caption">{corrections.length}</span>
      </div>
      <p className="studio-intro">
        Trocas aplicadas ao texto na hora de copiar — por exemplo, tirar uma gíria sua ou ajustar o tratamento. Só o que
        você cadastrar; nada é inferido.
      </p>

      <form onSubmit={save}>
        <div className="row">
          <label className="field">
            <span>Trocar</span>
            <input value={de} maxLength={60} onChange={(event) => setDe(event.target.value)} placeholder="mano" />
          </label>
          <label className="field">
            <span>Por</span>
            <input value={para} maxLength={60} onChange={(event) => setPara(event.target.value)} placeholder="senhor" />
          </label>
        </div>
        <div className="actions library-actions">
          <button type="submit" className="primary" disabled={!de.trim() || !para.trim()}>
            Salvar troca
          </button>
        </div>
      </form>

      <label className="check-label">
        <input type="checkbox" checked={apply} onChange={(event) => setApply(event.target.checked)} />
        Aplicar estas trocas ao copiar uma resposta.
      </label>

      {corrections.length ? (
        <ul className="correction-list">
          {corrections.map((item) => (
            <li key={item.id}>
              <span>
                <strong>{item.de}</strong> → {item.para}
              </span>
              <button
                type="button"
                className="act ghost"
                onClick={() => setCorrections(removeCorrection(corrections, item.id))}
              >
                Remover
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="muted small">Nenhuma troca cadastrada ainda.</p>
      )}

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
  );
}
