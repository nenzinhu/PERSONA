"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useLocalState, useSessionState } from "@/lib/store";
import { modelFields, postJson } from "@/lib/api";
import {
  buildServiceOrderReport,
  isVehicleNumber,
  openServiceOrders,
  SERVICE_ORDER_PHASES,
  serviceOrderNumbers,
  serviceOrderPhaseLabel,
  switchServiceOrderPhase,
  upsertServiceOrderRecord,
  type LinkedServiceOrder,
  type ServiceOrderDraft,
  type ServiceOrderRecord,
} from "@/lib/service-order";
import type { Settings } from "@/lib/types";
import { preservesLockedPhrases } from "@/lib/draft-guard";
import { CommitmentNotice, DraftLocks } from "./DraftGuards";
import SpeechRehearsal from "./SpeechRehearsal";

const INITIAL_DRAFT: LinkedServiceOrder = {
  ordem: "",
  fase: "inicio",
  dataHora: "",
  local: "",
  viatura: "",
  relato: "",
  observacoes: "",
};

const MAX_PHOTO_BYTES = 10 * 1024 * 1024;

export default function ServiceOrderReport({ settings, senha }: { settings: Settings; senha: string }) {
  const [draft, setDraft] = useSessionState("service-order-report", INITIAL_DRAFT);
  const [history, setHistory] = useLocalState<ServiceOrderRecord[]>("service-order-history", []);
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoUrl, setPhotoUrl] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [reviewing, setReviewing] = useState(false);
  const [suggestion, setSuggestion] = useState("");
  const reviewRequest = useRef<AbortController | null>(null);
  const reportRef = useRef<HTMLTextAreaElement>(null);
  const [lockedByPhase, setLockedByPhase] = useSessionState<Partial<Record<ServiceOrderDraft["fase"], string[]>>>(
    "service-order-locked-phrases",
    {},
  );
  const locked = lockedByPhase[draft.fase] ?? [];
  const [transcript, setTranscript] = useState("");
  const [checkedNumbers, setCheckedNumbers] = useState<number[]>([]);
  const [recordingVersion, setRecordingVersion] = useState(0);
  const numbers = serviceOrderNumbers(transcript);
  const withDictation = [draft.relato, transcript.trim()].filter(Boolean).join("\n");
  const update = <K extends keyof ServiceOrderDraft>(key: K, value: ServiceOrderDraft[K]) =>
    setDraft((current) => ({ ...current, [key]: value }));
  const report = buildServiceOrderReport(draft);
  const ready = Boolean(
    draft.ordem.trim() && draft.local.trim() && isVehicleNumber(draft.viatura) && draft.relato.trim(),
  );

  useEffect(() => () => reviewRequest.current?.abort(), []);

  function clearReview() {
    reviewRequest.current?.abort();
    reviewRequest.current = null;
    setReviewing(false);
    setSuggestion("");
    setError("");
  }

  function changeReportText(text: string) {
    clearReview();
    update("relato", text);
  }

  function changeTranscript(text: string) {
    setTranscript(text);
    setCheckedNumbers([]);
  }

  function clearPhaseTools() {
    clearReview();
    setNotice("");
    setPhoto(null);
    changeTranscript("");
    setRecordingVersion((version) => version + 1);
  }

  function selectPhase(fase: ServiceOrderDraft["fase"]) {
    if (fase === draft.fase) return;
    clearPhaseTools();
    setDraft((current) => switchServiceOrderPhase(current, fase));
  }

  function startNewOrder() {
    if (!window.confirm("Apagar os rascunhos das três etapas e começar outra ordem nesta sessão?")) return;
    clearPhaseTools();
    setLockedByPhase({});
    setDraft(INITIAL_DRAFT);
  }

  async function reviewReport(modo: "ortografia" | "clareza") {
    if (!draft.relato.trim() || reviewRequest.current) return;
    if (!preservesLockedPhrases(draft.relato, locked)) {
      setError("Reponha ou destrave os trechos alterados antes de revisar.");
      return;
    }
    const controller = new AbortController();
    reviewRequest.current = controller;
    setReviewing(true);
    setSuggestion("");
    setError("");
    try {
      const { texto } = await postJson<{ texto: string }>(
        "/api/revisar-ordem",
        { texto: draft.relato, modo, trechosProtegidos: locked, ...modelFields(settings) },
        senha,
        controller.signal,
      );
      if (!controller.signal.aborted) {
        if (!preservesLockedPhrases(texto, locked))
          throw new Error("A revisão alterou um trecho protegido. Seu relato foi mantido.");
        setSuggestion(texto);
      }
    } catch (caught) {
      if (!controller.signal.aborted) {
        setError(caught instanceof Error ? caught.message : "Não consegui revisar o relato.");
      }
    } finally {
      if (reviewRequest.current === controller) {
        reviewRequest.current = null;
        setReviewing(false);
      }
    }
  }

  useEffect(() => {
    if (!photo) {
      setPhotoUrl("");
      return;
    }
    const url = URL.createObjectURL(photo);
    setPhotoUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [photo]);

  function choosePhoto(file: File | undefined) {
    setError("");
    setNotice("");
    if (!file) return;
    setPhoto(null);
    if (!file.type.startsWith("image/")) {
      setError("Escolha um arquivo de imagem.");
      return;
    }
    if (file.size > MAX_PHOTO_BYTES) {
      setError("A foto deve ter no máximo 10 MB.");
      return;
    }
    setPhoto(file);
  }

  async function copyReport() {
    try {
      await navigator.clipboard.writeText(report);
      setNotice("Informe copiado. Você pode colá-lo no grupo do WhatsApp.");
    } catch {
      setNotice("Não consegui copiar automaticamente. Selecione o texto do informe e copie manualmente.");
    }
  }

  function downloadPhoto(file: File) {
    const url = URL.createObjectURL(file);
    const link = document.createElement("a");
    link.href = url;
    link.download = file.name || "foto-os";
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function saveToHistory() {
    try {
      setHistory(upsertServiceOrderRecord(history, draft, new Date().toISOString()));
      setNotice("OS guardada neste navegador. Você pode continuar de onde parou.");
      setError("");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Não consegui guardar a OS.");
    }
  }

  function continueOrder(record: ServiceOrderRecord) {
    setDraft({
      ordem: record.ordem,
      fase: record.fase,
      dataHora: record.dataHora,
      local: record.local,
      viatura: record.viatura,
      relato: record.relato,
      observacoes: record.observacoes,
    });
    setNotice(`OS ${record.ordem} carregada na etapa ${serviceOrderPhaseLabel(record.fase)}.`);
    setError("");
  }

  async function shareReport() {
    if (!ready) {
      setError("Preencha o nome da ordem, o local, a viatura e o relato antes de compartilhar.");
      return;
    }
    if (!photo) {
      setError("Anexe a foto do serviço para compartilhar pelo fluxo da ordem de serviço.");
      return;
    }
    setError("");
    setNotice("");
    const shareData: ShareData = {
      title: "Informe de ordem de serviço",
      text: report,
      ...(photo ? { files: [photo] } : {}),
    };
    let canShareFiles = !photo;
    if (typeof navigator.share === "function" && typeof navigator.canShare === "function") {
      try {
        canShareFiles = navigator.canShare({ files: [photo] });
      } catch {
        canShareFiles = false;
      }
    }

    if (typeof navigator.share === "function" && canShareFiles) {
      try {
        await navigator.share(shareData);
        setNotice(
          "Menu de compartilhamento concluído. Confirme no WhatsApp que o informe foi enviado ao grupo correto.",
        );
        return;
      } catch (caught) {
        if (caught instanceof DOMException && caught.name === "AbortError") {
          setNotice("Compartilhamento cancelado; nada foi enviado.");
          return;
        }
      }
    }

    window.open("https://web.whatsapp.com/", "_blank", "noopener,noreferrer");
    let copied = false;
    try {
      await navigator.clipboard.writeText(report);
      copied = true;
    } catch {
      // O informe continua visível para cópia manual abaixo.
    }
    if (photo) downloadPhoto(photo);
    setNotice(
      photo
        ? copied
          ? "WhatsApp Web aberto, informe copiado e foto baixada. Escolha o grupo, cole o texto e anexe a foto."
          : "WhatsApp Web aberto e foto baixada. Escolha o grupo, copie o informe abaixo e anexe a foto."
        : copied
          ? "WhatsApp Web aberto e informe copiado. Escolha o grupo e cole o texto."
          : "WhatsApp Web aberto. Escolha o grupo e copie o informe abaixo.",
    );
  }

  return (
    <div className="order-layout">
      <section className="composer order-editor" aria-labelledby="order-heading">
        <div className="panel-heading">
          <span aria-hidden="true">▤</span>
          <h2 id="order-heading">Informe de cumprimento</h2>
        </div>
        <p className="studio-intro">
          Monte uma atualização para o grupo do batalhão. Revise o conteúdo e escolha o grupo no WhatsApp antes de
          enviar.
        </p>
        <label className="field">
          <span>Nome da ordem de serviço</span>
          <input
            value={draft.ordem}
            maxLength={160}
            onChange={(event) => update("ordem", event.target.value)}
            placeholder="Ex.: Operação Bairro Seguro"
          />
        </label>
        <div className="row">
          <button type="button" className="act" onClick={startNewOrder}>
            Começar outra ordem
          </button>
        </div>
        <fieldset className="order-phase">
          <legend>Etapa do informe</legend>
          <div className="seg">
            {SERVICE_ORDER_PHASES.map((item) => (
              <button
                type="button"
                key={item.id}
                className={draft.fase === item.id ? "on" : ""}
                aria-pressed={draft.fase === item.id}
                onClick={() => selectPhase(item.id)}
              >
                {item.label}
                {item.id !== draft.fase && draft.etapas?.[item.id]?.relato.trim() ? " · com relato" : ""}
              </button>
            ))}
          </div>
        </fieldset>
        <p className="muted small">
          Nome, local e viatura valem para toda a ordem. Cada etapa tem data, relato e observações próprios. Anexe a
          foto da etapa ao compartilhar.
        </p>
        <div className="row">
          <label className="field">
            <span>Data e hora</span>
            <input
              type="datetime-local"
              value={draft.dataHora}
              onChange={(event) => update("dataHora", event.target.value)}
            />
          </label>
          <label className="field">
            <span>Local</span>
            <input value={draft.local} maxLength={160} onChange={(event) => update("local", event.target.value)} />
          </label>
        </div>
        <label className="field">
          <span>Viatura PM-</span>
          <input
            type="text"
            inputMode="numeric"
            maxLength={4}
            value={draft.viatura}
            onChange={(event) => update("viatura", event.target.value.replace(/[^0-9]/g, ""))}
            placeholder="0042"
            aria-describedby="order-vehicle-help"
            aria-invalid={Boolean(draft.viatura) && !isVehicleNumber(draft.viatura)}
          />
          <small id="order-vehicle-help" className="muted">
            Informe quatro dígitos, incluindo zeros à esquerda.
          </small>
        </label>
        <label className="field">
          <span>Relato do cumprimento</span>
          <textarea
            ref={reportRef}
            rows={5}
            maxLength={1500}
            value={draft.relato}
            onChange={(event) => changeReportText(event.target.value)}
            spellCheck
            placeholder="Descreva o que foi realizado nesta etapa. O informe não presume conclusão da OS."
          />
        </label>
        <DraftLocks
          key={draft.fase}
          value={draft.relato}
          editor={reportRef}
          phrases={locked}
          onChange={(phrases) => {
            clearReview();
            setLockedByPhase((current) => ({ ...current, [draft.fase]: phrases }));
          }}
        />
        <CommitmentNotice text={draft.relato} />
        <details className="more">
          <summary>Ditar relato e conferir números</summary>
          <SpeechRehearsal key={recordingVersion} settings={settings} senha={senha} onDictation={changeTranscript} />
          {transcript && (
            <div className="send-preview">
              <label className="field">
                <span>Transcrição para conferir</span>
                <textarea
                  rows={4}
                  maxLength={1500}
                  value={transcript}
                  onChange={(event) => changeTranscript(event.target.value)}
                />
              </label>
              {numbers.length > 0 ? (
                <fieldset className="field">
                  <legend>Confirme cada número com o áudio</legend>
                  {numbers.map(({ text, start }) => (
                    <label key={start} className="check-label">
                      <input
                        type="checkbox"
                        checked={checkedNumbers.includes(start)}
                        onChange={(event) => {
                          const checked = event.target.checked;
                          setCheckedNumbers((current) =>
                            checked ? [...current, start] : current.filter((item) => item !== start),
                          );
                        }}
                      />
                      {text} · {transcript.slice(Math.max(0, start - 24), start + text.length + 14)}
                    </label>
                  ))}
                </fieldset>
              ) : (
                <p className="small">
                  Nenhum número identificado. Confira se a transcrição incluiu todos os dados ditados.
                </p>
              )}
              {withDictation.length > 1500 && (
                <p className="small" role="status">
                  Encurte a transcrição ou o relato para que caibam em 1.500 caracteres.
                </p>
              )}
              <button
                type="button"
                className="act"
                disabled={!transcript.trim() || withDictation.length > 1500 || numbers.length !== checkedNumbers.length}
                onClick={() => {
                  changeReportText(withDictation);
                  changeTranscript("");
                }}
              >
                Acrescentar ao relato
              </button>
            </div>
          )}
        </details>
        <div className="row">
          <button
            type="button"
            className="act"
            disabled={reviewing || !draft.relato.trim()}
            onClick={() => void reviewReport("ortografia")}
          >
            Corrigir ortografia
          </button>
          <button
            type="button"
            className="act"
            disabled={reviewing || !draft.relato.trim()}
            onClick={() => void reviewReport("clareza")}
          >
            Melhorar redação
          </button>
        </div>
        <p className="muted small">Ao pedir uma revisão, apenas o relato é enviado ao provedor de IA configurado.</p>
        {reviewing && (
          <p className="muted small" role="status">
            Revisando o relato…
          </p>
        )}
        {suggestion && (
          <div className="send-preview" role="region" aria-label="Sugestão de revisão">
            <p className="small">Confira se a sugestão preserva os fatos antes de aplicar.</p>
            <p>{suggestion}</p>
            <CommitmentNotice text={suggestion} before={draft.relato} />
            <div className="row">
              <button type="button" className="primary" onClick={() => changeReportText(suggestion)}>
                Aplicar sugestão
              </button>
              <button type="button" className="act" onClick={() => setSuggestion("")}>
                Descartar
              </button>
            </div>
          </div>
        )}
        <label className="field">
          <span>Observações (opcional)</span>
          <textarea
            rows={3}
            maxLength={800}
            value={draft.observacoes}
            onChange={(event) => update("observacoes", event.target.value)}
          />
        </label>
        <label className="field">
          <span>Foto do serviço (obrigatória para compartilhar, até 10 MB)</span>
          <input
            type="file"
            accept="image/*"
            aria-label="Anexar foto do serviço"
            onChange={(event) => {
              choosePhoto(event.target.files?.[0]);
              event.target.value = "";
            }}
          />
          <small className="muted">
            Anexe uma foto para habilitar o compartilhamento. Copiar o texto não exige foto.
          </small>
        </label>
        {photo && (
          <div className="order-photo">
            {photoUrl && (
              <Image
                src={photoUrl}
                alt="Prévia da foto selecionada para o informe"
                width={110}
                height={86}
                unoptimized
              />
            )}
            <span>{photo.name}</span>
            <button className="act" onClick={() => setPhoto(null)}>
              Remover foto
            </button>
          </div>
        )}
        <div className="actions order-actions">
          <button className="primary" disabled={!ready || !photo} onClick={shareReport}>
            Compartilhar no WhatsApp
          </button>
          <button className="act" disabled={!ready} onClick={copyReport}>
            Copiar informe
          </button>
          <button className="act" disabled={!draft.ordem.trim()} onClick={saveToHistory}>
            Guardar OS
          </button>
        </div>
        <p className="privacy-note">
          O rascunho de texto fica nesta sessão do navegador. A foto fica apenas na memória até você sair desta seção.
          Nada é enviado automaticamente; revise o grupo e o conteúdo antes de confirmar no WhatsApp.
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

      <section className="order-sheet" aria-labelledby="order-preview-heading">
        <div className="order-sheet-kicker">PERSONA · INFORME DE SERVIÇO</div>
        <h2 id="order-preview-heading">Prévia para WhatsApp</h2>
        <label className="field order-preview-field">
          <span>Prévia do informe para compartilhar</span>
          <textarea aria-label="Texto do informe" rows={12} value={report} readOnly />
        </label>
        <p className="order-sheet-foot">
          O texto reúne apenas as informações preenchidas acima. Confira se corresponde ao que ocorreu.
        </p>
      </section>

      <section className="order-history" aria-labelledby="order-history-heading">
        <div className="panel-heading">
          <span aria-hidden="true">◷</span>
          <h2 id="order-history-heading">Minhas ordens de serviço</h2>
          <span className="panel-caption">{openServiceOrders(history).length} em aberto</span>
        </div>
        <p className="muted small">
          Guarde a OS para continuar a próxima etapa depois. Fica no armazenamento local deste navegador.
        </p>
        {history.length ? (
          <ul className="order-history-list">
            {history.map((record) => (
              <li key={record.ordem}>
                <div>
                  <strong>OS {record.ordem}</strong>
                  <p className="muted small">
                    {serviceOrderPhaseLabel(record.fase)}
                    {record.local && ` · ${record.local}`}
                    {record.viatura && ` · PM-${record.viatura}`}
                  </p>
                </div>
                <div className="row">
                  <button className="act" onClick={() => continueOrder(record)}>
                    Continuar
                  </button>
                  <button
                    className="act ghost"
                    onClick={() => setHistory(history.filter((item) => item.ordem !== record.ordem))}
                  >
                    Remover
                  </button>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="muted small">Nenhuma OS guardada ainda.</p>
        )}
      </section>
    </div>
  );
}
