"use client";

import { useState, type FormEvent } from "react";
import { useLocalState } from "@/lib/store";
import { addSnippet, filterSnippets, removeSnippet, SNIPPET_TAGS, type Snippet, type SnippetTag } from "@/lib/snippets";

export default function ResponseLibrary() {
  const [snippets, setSnippets] = useLocalState<Snippet[]>("response-library", []);
  const [text, setText] = useState("");
  const [tag, setTag] = useState<SnippetTag>("cobrar");
  const [filter, setFilter] = useState<SnippetTag | "todas">("todas");
  const [query, setQuery] = useState("");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  const visible = filterSnippets(snippets, filter, query);

  function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    try {
      setSnippets(addSnippet(snippets, text, tag, crypto.randomUUID(), new Date().toISOString()));
      setText("");
      setNotice("Resposta guardada neste navegador.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Não consegui guardar.");
    }
  }

  async function copy(value: string) {
    try {
      await navigator.clipboard.writeText(value);
      setNotice("Resposta copiada. Nada foi enviado.");
    } catch {
      setError("Não consegui copiar. Selecione o texto e copie manualmente.");
    }
  }

  return (
    <section className="backup-panel" aria-labelledby="library-heading">
      <div className="panel-heading">
        <span aria-hidden="true">❏</span>
        <h2 id="library-heading">Minhas respostas</h2>
        <span className="panel-caption">{snippets.length}</span>
      </div>
      <p className="studio-intro">
        Guarde respostas que já funcionaram para reaproveitar em situações parecidas. Ficam neste navegador e não são
        enviadas à IA.
      </p>

      <form onSubmit={save}>
        <label className="field">
          <span>Resposta</span>
          <textarea
            rows={3}
            maxLength={2000}
            value={text}
            onChange={(event) => setText(event.target.value)}
            placeholder="Cole ou escreva a resposta que você quer guardar."
          />
        </label>
        <div className="row">
          <label className="field">
            <span>Para que serve</span>
            <select value={tag} onChange={(event) => setTag(event.target.value as SnippetTag)}>
              {SNIPPET_TAGS.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>
          <div className="actions library-actions">
            <button type="submit" className="primary" disabled={!text.trim()}>
              Guardar resposta
            </button>
          </div>
        </div>
      </form>

      <div className="library-filters">
        <label className="field">
          <span>Buscar</span>
          <input value={query} maxLength={80} onChange={(event) => setQuery(event.target.value)} placeholder="prazo" />
        </label>
        <div className="chips" role="group" aria-label="Filtrar por etiqueta">
          <button
            type="button"
            className={filter === "todas" ? "chip pos on" : "chip pos"}
            onClick={() => setFilter("todas")}
          >
            todas
          </button>
          {SNIPPET_TAGS.map((item) => (
            <button
              key={item}
              type="button"
              className={filter === item ? "chip pos on" : "chip pos"}
              onClick={() => setFilter(item)}
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      {visible.length ? (
        <ul className="library-list">
          {visible.map((snippet) => (
            <li key={snippet.id}>
              <p>{snippet.text}</p>
              <div className="library-item-actions">
                <span className="muted small">{snippet.tag}</span>
                <button type="button" className="act" onClick={() => void copy(snippet.text)}>
                  Copiar
                </button>
                <button
                  type="button"
                  className="act ghost"
                  onClick={() => setSnippets(removeSnippet(snippets, snippet.id))}
                >
                  Remover
                </button>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="muted small">
          {snippets.length
            ? "Nenhuma resposta com esse filtro."
            : "Sua biblioteca começa com a primeira resposta guardada."}
        </p>
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
