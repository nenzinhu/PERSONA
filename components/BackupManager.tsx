"use client";

import { useRef, useState } from "react";
import { anonymizeBackup, buildBackup, parseBackup, BACKUP_KEYS, type BackupFile } from "@/lib/backup";

function collectEntries(): Record<string, string | null> {
  const entries: Record<string, string | null> = {};
  for (const key of BACKUP_KEYS) entries[key] = localStorage.getItem(key);
  return entries;
}

function parseAliases(raw: string) {
  return raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [original, alias] = line.split("=").map((part) => part.trim());
      return { original: original ?? "", alias: alias ?? "" };
    })
    .filter((entry) => entry.original && entry.alias);
}

function download(backup: BackupFile, suffix: string) {
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `persona-backup${suffix}-${backup.exportedAt.slice(0, 10)}.json`;
  anchor.click();
  URL.revokeObjectURL(url);
}

export default function BackupManager() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [aliases, setAliases] = useState("");
  const [pending, setPending] = useState<{ backup: BackupFile; name: string } | null>(null);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  function exportBackup(anonymize: boolean) {
    setError("");
    const backup = buildBackup(collectEntries(), new Date().toISOString());
    if (!Object.keys(backup.data).length) {
      setError("Não há dados locais para exportar neste navegador.");
      return;
    }
    if (anonymize) {
      const parsed = parseAliases(aliases);
      if (!parsed.length) {
        setError("Para a versão anonimizada, liste ao menos uma troca no formato: real = apelido");
        return;
      }
      download(anonymizeBackup(backup, parsed), "-anonimo");
      setNotice("Backup anonimizado baixado. Confira o arquivo antes de compartilhar.");
    } else {
      download(backup, "");
      setNotice("Backup baixado. Guarde o arquivo em um lugar seu: ele contém seus textos.");
    }
  }

  async function readFile(file: File) {
    setError("");
    setNotice("");
    const parsed = parseBackup(await file.text());
    if (!parsed.ok) {
      setError(parsed.error);
      return;
    }
    setPending({ backup: parsed.backup, name: file.name });
    if (fileRef.current) fileRef.current.value = "";
  }

  function applyImport() {
    if (!pending) return;
    for (const [key, value] of Object.entries(pending.backup.data)) {
      localStorage.setItem(key, JSON.stringify(value));
    }
    setNotice("Backup restaurado. Recarregando o Persona…");
    window.setTimeout(() => window.location.reload(), 600);
  }

  const count = Object.keys(pending?.backup.data ?? {}).length;

  return (
    <section className="backup-panel" aria-labelledby="backup-heading">
      <div className="panel-heading">
        <span aria-hidden="true">⤓</span>
        <h2 id="backup-heading">Backup do Persona</h2>
      </div>
      <p className="studio-intro">
        Seu perfil, exemplos, diário, acordos, pendências e histórico ficam só neste navegador. Exporte um arquivo para
        não perder nada ao trocar de aparelho — ou uma versão anonimizada para compartilhar.
      </p>

      <div className="backup-actions">
        <button type="button" className="primary" onClick={() => exportBackup(false)}>
          Exportar backup
        </button>
        <label className="act file">
          Importar backup
          <input
            ref={fileRef}
            type="file"
            accept=".json,application/json"
            hidden
            onChange={(e) => e.target.files?.[0] && void readFile(e.target.files[0])}
          />
        </label>
      </div>

      <details className="more">
        <summary>Exportar versão anonimizada</summary>
        <label className="field">
          <span>Trocas, uma por linha, no formato: real = apelido</span>
          <textarea
            rows={3}
            value={aliases}
            onChange={(event) => setAliases(event.target.value)}
            placeholder={"Cabo Almeida = Pessoa A\nBECO 9 = Local A"}
          />
        </label>
        <div className="backup-actions">
          <button type="button" className="act" onClick={() => exportBackup(true)}>
            Exportar anonimizado
          </button>
        </div>
        <p className="privacy-note">A troca usa os mesmos limites de palavra dos aliases e não altera o original.</p>
      </details>

      {pending && (
        <div className="provider-status" role="alertdialog" aria-label="Confirmar restauração">
          <p>
            <strong>{pending.name}</strong> tem {count} {count === 1 ? "bloco de dados" : "blocos de dados"}
            {pending.backup.exportedAt &&
              ` (exportado em ${new Date(pending.backup.exportedAt).toLocaleString("pt-BR")})`}
            . Importar substitui os dados atuais deste navegador.
          </p>
          <div className="actions">
            <button type="button" className="act danger-outline" onClick={applyImport}>
              Substituir meus dados
            </button>
            <button type="button" className="act" onClick={() => setPending(null)}>
              Cancelar
            </button>
          </div>
        </div>
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
