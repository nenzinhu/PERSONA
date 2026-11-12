import { useEffect, useRef, useState } from "react";

interface FranklPauseProps {
  reason: string;
  onConfirm: () => void;
  onCancel: () => void;
  /** Rótulo do botão de confirmação; o padrão é o envio à IA. */
  confirmLabel?: string;
}

export function FranklPauseModal({
  reason,
  onConfirm,
  onCancel,
  confirmLabel = "Confirmar envio à IA",
}: FranklPauseProps) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    const element = dialog.current;
    element?.showModal();
    const deadline = Date.now() + 5000;
    const timer = window.setInterval(() => {
      const remaining = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
      setCountdown(remaining);
      if (remaining === 0) window.clearInterval(timer);
    }, 250);
    return () => {
      element?.close();
      window.clearInterval(timer);
    };
  }, []);

  return (
    <dialog
      ref={dialog}
      className="frankl-pause"
      aria-labelledby="frankl-title"
      aria-describedby="frankl-reason"
      onCancel={(event) => {
        event.preventDefault();
        onCancel();
      }}
    >
      <h3 id="frankl-title">Pausa Frankliana</h3>
      <p id="frankl-reason">{reason} Use este tempo para revisar sua intenção.</p>
      <div className="row">
        <button type="button" className="act" onClick={onCancel}>
          Revisar rascunho
        </button>
        <button type="button" className="primary" disabled={countdown > 0} onClick={onConfirm}>
          {countdown > 0 ? `Aguarde (${countdown}s)` : confirmLabel}
        </button>
      </div>
    </dialog>
  );
}
