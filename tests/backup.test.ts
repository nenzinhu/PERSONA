import test from "node:test";
import assert from "node:assert/strict";
import { anonymizeBackup, buildBackup, parseBackup, replaceInText, BACKUP_KEYS } from "../lib/backup.ts";

const wrapped = (value: unknown) => JSON.stringify({ version: 1, value });

test("backup: só entram chaves conhecidas e valores válidos", () => {
  const backup = buildBackup(
    {
      perfil: wrapped({ nome: "Ana", exemplos: [] }),
      history: wrapped([{ id: "1" }]),
      "communication-journal": "não é json",
      "chave-desconhecida": wrapped({ segredo: true }),
      theme: null,
    },
    "2026-11-12T10:00:00.000Z",
  );
  assert.deepEqual(Object.keys(backup.data).sort(), ["history", "perfil"]);
  assert.equal(backup.exportedAt, "2026-11-12T10:00:00.000Z");
  assert.equal(backup.version, 1);
});

test("backup: ida e volta preserva os dados", () => {
  const backup = buildBackup(
    { perfil: wrapped({ nome: "Ana" }), "decision-pending": wrapped([{ id: "x" }]) },
    "2026-11-12T10:00:00.000Z",
  );
  const parsed = parseBackup(JSON.stringify(backup));
  assert.equal(parsed.ok, true);
  if (parsed.ok) assert.deepEqual(parsed.backup.data, backup.data);
});

test("backup: rejeita arquivos que não são do Persona", () => {
  assert.equal(parseBackup("não é json").ok, false);
  assert.equal(parseBackup(JSON.stringify({ app: "outro", version: 1, data: {} })).ok, false);
  assert.equal(parseBackup(JSON.stringify({ app: "persona", version: 99, data: {} })).ok, false);
  assert.equal(parseBackup(JSON.stringify({ app: "persona", version: 1, data: {} })).ok, false);
  assert.equal(parseBackup(JSON.stringify({ app: "persona", version: 1, data: { foo: {} } })).ok, false);
});

test("backup: a troca de termos respeita limites de palavra e o formato JSON", () => {
  assert.equal(
    replaceInText("Cabo Almeida confirma com Almeidinha", [{ original: "Almeida", alias: "Responsável" }]),
    "Cabo Responsável confirma com Almeidinha",
  );
  assert.equal(replaceInText("operacao BECO 9", [{ original: "BECO 9", alias: "Local A" }]), "operacao Local A");
});

test("backup: anonimizar troca termos dentro de qualquer campo", () => {
  const backup = buildBackup(
    { perfil: wrapped({ nome: "Cabo Almeida", exemplos: [{ resposta: "Oi, Cabo Almeida aqui" }] }) },
    "2026-11-12T10:00:00.000Z",
  );
  const anon = anonymizeBackup(backup, [{ original: "Cabo Almeida", alias: "Pessoa A" }]);
  const perfil = (anon.data.perfil as { value: { nome: string; exemplos: { resposta: string }[] } }).value;
  assert.equal(perfil.nome, "Pessoa A");
  assert.equal(perfil.exemplos[0].resposta, "Oi, Pessoa A aqui");
  assert.deepEqual(parseBackup(JSON.stringify(anon)).ok, true);
});

test("backup: as chaves atuais do app estão cobertas", () => {
  for (const key of ["settings", "perfil", "decision-pending", "communication-journal", "communication-agreements"]) {
    assert.ok((BACKUP_KEYS as readonly string[]).includes(key), key);
  }
});
