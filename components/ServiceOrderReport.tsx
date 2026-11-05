"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useSessionState } from "@/lib/store";

type Phase = "inicio" | "durante" | "encerramento";

interface ReportDraft {
  ordem: string;
  fase: Phase;
  dataHora: string;
  local: string;
  relato: string;
  observacoes: string;
}

const INITIAL_DRAFT: ReportDraft = {
  ordem: "",
  fase: "inicio",
  dataHora: "",
  local: "",
  relato: "",
  observacoes: "",
};

const PHASES: { id: Phase; label: string; reportLabel: string }[] = [
  { id: "inicio", label: "Início", reportLabel: "INÍCIO DA EXECUÇÃO" },
  { id: "durante", label: "Durante", reportLabel: "ANDAMENTO DA EXECUÇÃO" },
  { id: "encerramento", label: "Encerramento", reportLabel: "ENCERRAMENTO" },
];

const MAX_PHOTO_BYTES = 10 * 1024 * 1024;

export default function ServiceOrderReport() {
  const [draft, setDraft] = useSessionState<ReportDraft>("service-order-report", INITIAL_DRAFT);
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoUrl, setPhotoUrl] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const update = (key: keyof ReportDraft, value: string) =>
    setDraft((current) => ({ ...current, [key]: value }) as ReportDraft);
  const phase = PHASES.find((item) => item.id === draft.fase) ?? PHASES[0];

  const report = [
    "INFORME DE CUMPRIMENTO DE ORDEM DE SERVIÇO",
    draft.ordem.trim() ? `ORDEM DE SERVIÇO: ${draft.ordem.trim()}` : "",
    `ETAPA: ${phase.reportLabel}`,
    draft.dataHora ? `DATA/HORA: ${new Date(draft.dataHora).toLocaleString("pt-BR")}` : "",
    draft.local.trim() ? `LOCAL: ${draft.local.trim()}` : "",
    draft.relato.trim() ? `RELATO: ${draft.relato.trim()}` : "",
    draft.observacoes.trim() ? `OBSERVAÇÕES: ${draft.observacoes.trim()}` : "",
    photo ? "ANEXO: FOTO DO SERVIÇO" : "",
  ]
    .filter(Boolean)
    .join("\n");

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
    if (!draft.ordem.trim() || !draft.relato.trim()) {
      setError("Preencha a identificação da ordem e o relato antes de compartilhar.");
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
    if (photo && navigator.share && navigator.canShare) {
      try {
        canShareFiles = navigator.canShare({ files: [photo] });
      } catch {
        canShareFiles = false;
      }
    }

    if (navigator.share && canShareFiles) {
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
          <span>Identificação da ordem de serviço</span>
          <input
            value={draft.ordem}
            maxLength={160}
            onChange={(event) => update("ordem", event.target.value)}
            placeholder="Número ou identificação da OS"
          />
        </label>
        <fieldset className="order-phase">
          <legend>Etapa do informe</legend>
          <div className="seg">
            {PHASES.map((item) => (
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
          <span>Relato do cumprimento</span>
          <textarea
            rows={5}
            maxLength={1500}
            value={draft.relato}
            onChange={(event) => update("relato", event.target.value)}
            placeholder="Descreva o que foi realizado nesta etapa. O informe não presume conclusão da OS."
          />
        </label>
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
          <button
            className="primary"
            disabled={!draft.ordem.trim() || !draft.relato.trim() || !photo}
            onClick={shareReport}
          >
            Compartilhar no WhatsApp
          </button>
          <button className="act" disabled={!draft.ordem.trim() || !draft.relato.trim()} onClick={copyReport}>
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
        <p className="order-sheet-phase">{phase.reportLabel}</p>
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
