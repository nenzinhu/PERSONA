"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useSessionState } from "@/lib/store";
import { modelFields, postJson } from "@/lib/api";
import {
  buildServiceOrderReport,
  isVehicleNumber,
  SERVICE_ORDER_PHASES,
  type ServiceOrderDraft,
} from "@/lib/service-order";
import type { Settings } from "@/lib/types";

const INITIAL_DRAFT: ServiceOrderDraft = {
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
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoUrl, setPhotoUrl] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [reviewing, setReviewing] = useState(false);
  const [suggestion, setSuggestion] = useState("");
  const reviewRequest = useRef<AbortController | null>(null);
  const update = <K extends keyof ServiceOrderDraft>(key: K, value: ServiceOrderDraft[K]) =>
    setDraft((current) => ({ ...current, [key]: value }));
  const report = buildServiceOrderReport(draft);
  const ready = Boolean(
    draft.ordem.trim() && draft.local.trim() && isVehicleNumber(draft.viatura) && draft.relato.trim(),
  );

  useEffect(() => () => reviewRequest.current?.abort(), []);

  function changeReportText(text: string) {
    reviewRequest.current?.abort();
    reviewRequest.current = null;
    setReviewing(false);
    setSuggestion("");
    setError("");
    update("relato", text);
  }

  async function reviewReport(modo: "ortografia" | "clareza") {
    if (!draft.relato.trim() || reviewRequest.current) return;
    const controller = new AbortController();
    reviewRequest.current = controller;
    setReviewing(true);
    setSuggestion("");
    setError("");
    try {
      const { texto } = await postJson<{ texto: string }>(
        "/api/revisar-ordem",
        { texto: draft.relato, modo, ...modelFields(settings) },
        senha,
        controller.signal,
      );
      if (!controller.signal.aborted) setSuggestion(texto);
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
        <fieldset className="order-phase">
          <legend>Etapa do informe</legend>
          <div className="seg">
            {SERVICE_ORDER_PHASES.map((item) => (
              <button
                type="button"
                key={item.id}
                className={draft.fase === item.id ? "on" : ""}
                aria-pressed={draft.fase === item.id}
                onClick={() => update("fase", item.id)}
              >
                {item.label}
              </button>
            ))}
          </div>
        </fieldset>
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
            rows={5}
            maxLength={1500}
            value={draft.relato}
            onChange={(event) => changeReportText(event.target.value)}
            spellCheck
            placeholder="Descreva o que foi realizado nesta etapa. O informe não presume conclusão da OS."
          />
        </label>
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
    </div>
  );
}
