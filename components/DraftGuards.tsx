"use client";

import { useState, type RefObject } from "react";
import { lockSelection, newCommitments, preservesLockedPhrases } from "@/lib/draft-guard";

export function DraftLocks({
  value,
  editor,
  phrases,
  onChange,
}: {
  value: string;
  editor: RefObject<HTMLTextAreaElement | null>;
  phrases: string[];
  onChange: (phrases: string[]) => void;
}) {
  const [notice, setNotice] = useState("");

  function lock() {
    const field = editor.current;
    if (!field) return;
    const next = lockSelection(value, field.selectionStart, field.selectionEnd, phrases);
    if (next === phrases || !preservesLockedPhrases(value, next)) {
      setNotice("Selecione no texto um trecho que ainda não esteja protegido.");
      return;
    }
    setNotice("");
    onChange(next);
  }

  return (
    <div className="field">
      <div>
        <button type="button" className="act" onClick={lock} disabled={!value.trim() || phrases.length >= 12}>
          Travar trecho selecionado
        </button>
      </div>
      {notice && (
        <small className="muted" role="status">
          {notice}
        </small>
      )}
      {phrases.length > 0 && (
        <ul className="small">
          {phrases.map((phrase) => (
            <li key={phrase}>
              <q>{phrase}</q>{" "}
              <button
                type="button"
                className="act"
                aria-label={`Destravar: ${phrase}`}
                onClick={() => {
                  setNotice("");
                  onChange(phrases.filter((item) => item !== phrase));
                }}
              >
                Destravar
              </button>
            </li>
          ))}
        </ul>
      )}
      {phrases.length > 0 && !preservesLockedPhrases(value, phrases) && (
        <small className="muted" role="status">
          Reponha ou destrave os trechos alterados antes de pedir uma revisão.
        </small>
      )}
    </div>
  );
}

export function CommitmentNotice({ text, before }: { text: string; before?: string }) {
  const phrases = newCommitments(text, before);
  if (!phrases.length) return null;
  return (
    <div className="send-preview small" aria-label="Possíveis compromissos">
      <strong>Isso pode soar como um compromisso</strong>
      <ul>
        {phrases.map((phrase, index) => (
          <li key={index}>
            <q>{phrase}</q>
          </li>
        ))}
      </ul>
    </div>
  );
}
