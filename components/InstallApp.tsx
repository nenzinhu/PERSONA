"use client";

import { useEffect, useId, useRef, useState } from "react";

interface InstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function InstallApp() {
  const [installed, setInstalled] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [isIOS, setIsIOS] = useState(false);
  const prompt = useRef<InstallPromptEvent | null>(null);
  const button = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const panelId = useId();

  useEffect(() => {
    const display = window.matchMedia("(display-mode: standalone)");
    const checkInstalled = () =>
      setInstalled(display.matches || (navigator as Navigator & { standalone?: boolean }).standalone === true);
    checkInstalled();
    setIsIOS(
      /iPad|iPhone|iPod/.test(navigator.userAgent) ||
        (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1),
    );
    const capturePrompt = (event: Event) => {
      event.preventDefault();
      prompt.current = event as InstallPromptEvent;
    };
    const onInstalled = () => {
      prompt.current = null;
      setInstalled(true);
      setExpanded(false);
      setMessage("Persona instalado. Abra pelo ícone do app.");
    };
    window.addEventListener("beforeinstallprompt", capturePrompt);
    window.addEventListener("appinstalled", onInstalled);
    display.addEventListener("change", checkInstalled);

    if (
      "serviceWorker" in navigator &&
      (process.env.NODE_ENV === "production" || ["localhost", "127.0.0.1", "[::1]"].includes(window.location.hostname))
    ) {
      void navigator.serviceWorker.register("/sw.js", { scope: "/", updateViaCache: "none" }).catch(() => {
        // Installing remains optional; a registration failure must never interrupt the app.
      });
    }
    return () => {
      window.removeEventListener("beforeinstallprompt", capturePrompt);
      window.removeEventListener("appinstalled", onInstalled);
      display.removeEventListener("change", checkInstalled);
    };
  }, []);

  useEffect(() => {
    if (expanded) panel.current?.focus();
  }, [expanded]);

  async function install() {
    const pending = prompt.current;
    if (!pending) {
      setExpanded((value) => !value);
      return;
    }
    prompt.current = null;
    setBusy(true);
    setMessage("");
    try {
      await pending.prompt();
      const choice = await pending.userChoice;
      setMessage(
        choice.outcome === "accepted"
          ? "Instalação solicitada. Conclua no navegador."
          : "Instalação cancelada. Você pode tentar novamente pelo menu do navegador.",
      );
    } catch {
      setMessage("Não foi possível abrir a instalação. Use as instruções do navegador abaixo.");
      setExpanded(true);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="install-app">
      {!installed && (
        <button
          ref={button}
          type="button"
          className="install-app-button"
          aria-expanded={expanded}
          aria-controls={panelId}
          disabled={busy}
          onClick={() => void install()}
        >
          <svg
            viewBox="0 0 24 24"
            width="16"
            height="16"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
            aria-hidden="true"
          >
            <path d="M12 3v12m-4-4 4 4 4-4M5 15v5h14v-5" />
          </svg>
          {busy ? "Abrindo instalação…" : "Instalar app"}
        </button>
      )}
      {!installed && expanded && (
        <div
          ref={panel}
          id={panelId}
          className="install-app-panel"
          tabIndex={-1}
          role="region"
          aria-label="Como instalar o Persona"
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              setExpanded(false);
              button.current?.focus();
            }
          }}
        >
          <strong>Persona na sua tela inicial</strong>
          <p>
            {isIOS
              ? "No Safari, toque em Compartilhar e depois em Adicionar à Tela de Início. Confirme em Adicionar."
              : "No Chrome ou Edge, abra o menu do navegador e procure Instalar app ou Instalar Persona. No Android, a opção também pode aparecer como Adicionar à tela inicial."}
          </p>
          <p>
            A opção depende do navegador. Se ela não aparecer, abra este site no Chrome, Edge ou Safari do seu
            dispositivo.
          </p>
          <button
            type="button"
            className="install-app-close"
            onClick={() => {
              setExpanded(false);
              button.current?.focus();
            }}
          >
            Entendi
          </button>
        </div>
      )}
      <span className="install-app-status" role="status" aria-live="polite">
        {message}
      </span>
    </div>
  );
}
