"use client";

import { useState, type FormEvent } from "react";
import { useLocalState } from "@/lib/store";

interface JournalEntry {
  id: string;
  date: string;
  situation: string;
  goal: string;
  outcome: string;
  worked: string;
  nextTime: string;
  updatedAt: string;
}

function newEntry(): JournalEntry {
  const today = new Date();
  const localDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  return {
    id: "",
    date: localDate,
    situation: "",
    goal: "",
    outcome: "",
    worked: "",
    nextTime: "",
    updatedAt: "",
  };
}

export default function ConversationJournal() {
  const [entries, setEntries] = useLocalState<JournalEntry[]>("communication-journal", []);
  const [draft, setDraft] = useState<JournalEntry>(newEntry);
  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState("");
  const [notice, setNotice] = useState("");

  function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const saved = {
      ...draft,
      id: draft.id || `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      updatedAt: new Date().toISOString(),
    };
    setEntries((previous) =>
      [saved, ...previous.filter((entry) => entry.id !== saved.id)].sort((a, b) =>
        b.updatedAt.localeCompare(a.updatedAt),
      ),
    );
    setDraft(newEntry());
    setEditing(false);
    setNotice("Reflexão salva neste navegador.");
  }

  function edit(entry: JournalEntry) {
    setDraft(entry);
    setEditing(true);
    setNotice("");
  }

  function cancelEdit() {
    setDraft(newEntry());
    setEditing(false);
  }

  function remove(id: string) {
    setEntries((previous) => previous.filter((entry) => entry.id !== id));
    setConfirmDelete("");
    setNotice("Reflexão excluída deste navegador.");
  }

  const update = (key: keyof JournalEntry, value: string) => setDraft((current) => ({ ...current, [key]: value }));

  return (
    <div className="studio-grid">
      <section className="composer" aria-labelledby="journal-heading">
        <div className="panel-heading">
          <span aria-hidden="true">✎</span>
          <h2 id="journal-heading">O que ficou dessa conversa?</h2>
        </div>
        <p className="studio-intro">
          Um registro seu sobre o que aconteceu. Sem interpretação automática e sem precisar guardar a conversa inteira.
        </p>
        <form onSubmit={save}>
          <div className="row">
            <label className="field">
              <span>Quando</span>
              <input type="date" value={draft.date} onChange={(event) => update("date", event.target.value)} required />
            </label>
            <label className="field">
              <span>Situação</span>
              <input
                value={draft.situation}
                maxLength={120}
                onChange={(event) => update("situation", event.target.value)}
                placeholder="Ex.: conversa com a equipe"
                required
              />
            </label>
          </div>
          <label className="field">
            <span>O que eu queria alcançar?</span>
            <textarea
              rows={2}
              maxLength={500}
              value={draft.goal}
              onChange={(event) => update("goal", event.target.value)}
            />
          </label>
          <label className="field">
            <span>Como a conversa aconteceu para mim?</span>
            <textarea
              rows={3}
              maxLength={1000}
              value={draft.outcome}
              onChange={(event) => update("outcome", event.target.value)}
              placeholder="Registre sua lembrança, com suas palavras."
            />
          </label>
          <label className="field">
            <span>O que funcionou?</span>
            <textarea
              rows={2}
              maxLength={500}
              value={draft.worked}
              onChange={(event) => update("worked", event.target.value)}
            />
          </label>
          <label className="field">
            <span>O que quero tentar da próxima vez?</span>
            <textarea
              rows={2}
              maxLength={500}
              value={draft.nextTime}
              onChange={(event) => update("nextTime", event.target.value)}
            />
          </label>
          <div className="actions">
            {editing && (
              <button type="button" className="act" onClick={cancelEdit}>
                Cancelar edição
              </button>
            )}
            <button type="submit" className="primary">
              {editing ? "Salvar alterações" : "Salvar reflexão"}
            </button>
          </div>
        </form>
        <p className="privacy-note">
          As reflexões ficam no armazenamento local deste navegador. Não são enviadas à IA.
        </p>
        {notice && (
          <p className="provider-status" role="status">
            {notice}
          </p>
        )}
      </section>

      <section className="studio-side" aria-labelledby="journal-history-heading">
        <div className="panel-heading">
          <span aria-hidden="true">◷</span>
          <h2 id="journal-history-heading">Reflexões anteriores</h2>
          <span className="panel-caption">{entries.length}</span>
        </div>
        {entries.length === 0 ? (
          <div className="empty">
            <p>Seu caderno começa com você.</p>
            <p className="muted small">
              Depois de salvar, suas reflexões aparecem aqui, da mais recente para a mais antiga.
            </p>
          </div>
        ) : (
          <div className="journal-list">
            {entries.map((entry) => (
              <article className="journal-entry" key={entry.id}>
                <div className="journal-entry-top">
                  <time dateTime={entry.date}>{new Date(`${entry.date}T12:00:00`).toLocaleDateString("pt-BR")}</time>
                  <strong>{entry.situation}</strong>
                </div>
                {entry.goal && (
                  <p>
                    <b>Objetivo:</b> {entry.goal}
                  </p>
                )}
                {entry.outcome && <p>{entry.outcome}</p>}
                {entry.worked && (
                  <p>
                    <b>Funcionou:</b> {entry.worked}
                  </p>
                )}
                {entry.nextTime && (
                  <p>
                    <b>Na próxima:</b> {entry.nextTime}
                  </p>
                )}
                <div className="actions journal-actions">
                  <button className="act" onClick={() => edit(entry)}>
                    Editar
                  </button>
                  {confirmDelete === entry.id ? (
                    <>
                      <span className="small">Excluir esta reflexão?</span>
                      <button className="act danger-outline" onClick={() => remove(entry.id)}>
                        Confirmar exclusão
                      </button>
                      <button className="act" onClick={() => setConfirmDelete("")}>
                        Cancelar
                      </button>
                    </>
                  ) : (
                    <button className="act" onClick={() => setConfirmDelete(entry.id)}>
                      Excluir
                    </button>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
