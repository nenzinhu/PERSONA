"use client";

import { useEffect, useState } from "react";
import Generator from "@/components/Generator";
import StyleTrainer from "@/components/StyleTrainer";
import ModelGuide from "@/components/ModelGuide";
import Conversation from "@/components/Conversation";
import Simulator from "@/components/Simulator";
import { useLocalState, useSessionState } from "@/lib/store";
import { DEFAULT_PROFILE, DEFAULT_SETTINGS, type ProviderStatus } from "@/lib/types";

type Tab = "pergunta" | "afirmacao" | "conversa" | "treino" | "estilo" | "modelos";
type Theme = "system" | "light" | "dark";

const TABS: { id: Tab; label: string }[] = [
  { id: "pergunta", label: "Pergunta" },
  { id: "afirmacao", label: "Afirmação" },
  { id: "conversa", label: "Conversa" },
  { id: "treino", label: "Treino" },
  { id: "estilo", label: "Meu estilo" },
  { id: "modelos", label: "Modelos" },
];

const THEMES: { id: Theme; label: string }[] = [
  { id: "system", label: "Sistema" },
  { id: "light", label: "Claro" },
  { id: "dark", label: "Escuro" },
];

export default function Home() {
  const [tab, setTab] = useLocalState<{ v: Tab }>("tab", { v: "pergunta" });
  const [settings, setSettings] = useLocalState("settings", DEFAULT_SETTINGS);
  const [perfil, setPerfil] = useLocalState("perfil", DEFAULT_PROFILE);
  const [senha, setSenha] = useSessionState("senha", { v: "" });
  const [theme, setTheme] = useLocalState<Theme>("theme", "system");
  const [providers, setProviders] = useState<ProviderStatus[]>([]);
  const [needsPassword, setNeedsPassword] = useState(false);
  const [providersLoading, setProvidersLoading] = useState(true);
  const [providersError, setProvidersError] = useState(false);
  const [providersAttempt, setProvidersAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setProvidersLoading(true);
    setProvidersError(false);
    fetch("/api/providers", { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error("Não consegui carregar os provedores.");
        return response.json();
      })
      .then((data) => {
        setProviders(data.providers ?? []);
        setNeedsPassword(Boolean(data.needsPassword));
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setProviders([]);
        setNeedsPassword(false);
        setProvidersError(true);
      })
      .finally(() => {
        if (!controller.signal.aborted) setProvidersLoading(false);
      });
    return () => controller.abort();
  }, [providersAttempt]);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "system") root.removeAttribute("data-theme");
    else root.setAttribute("data-theme", theme);
  }, [theme]);

  return (
    <main className="shell">
      <header className="top">
        <div>
          <h1>Gerador de Respostas</h1>
          <p className="sub">Responde do seu jeito: abreviações, erros de digitação e a sua personalidade.</p>
        </div>
        <div className="top-actions">
          <span className="pill">{perfil.exemplos.length} exemplos seus</span>
          <div className="theme-switcher" role="group" aria-label="Tema">
            {THEMES.map((item) => (
              <button
                key={item.id}
                className={theme === item.id ? "on" : ""}
                aria-pressed={theme === item.id}
                onClick={() => setTheme(item.id)}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      <nav className="tabs" role="tablist">
        {TABS.map((item) => (
          <button
            key={item.id}
            role="tab"
            aria-selected={tab.v === item.id}
            className={tab.v === item.id ? "tab active" : "tab"}
            onClick={() => setTab({ v: item.id })}
          >
            {item.label}
          </button>
        ))}
      </nav>

      {providersLoading && (
        <p className="muted small" role="status">
          Carregando provedores…
        </p>
      )}
      {providersError && (
        <div className="provider-status error" role="alert">
          Não consegui carregar os provedores.{" "}
          <button className="link-button" onClick={() => setProvidersAttempt((current) => current + 1)}>
            Tentar novamente
          </button>
        </div>
      )}

      {needsPassword && (
        <label className="field inline-pass">
          <span>Senha do app</span>
          <input
            type="password"
            value={senha.v}
            onChange={(event) => setSenha({ v: event.target.value })}
            placeholder="definida em APP_PASSWORD"
          />
        </label>
      )}

      {(tab.v === "pergunta" || tab.v === "afirmacao") && (
        <Generator
          key={tab.v}
          mode={tab.v}
          settings={settings}
          setSettings={setSettings}
          perfil={perfil}
          setPerfil={setPerfil}
          providers={providers}
          senha={senha.v}
        />
      )}
      {tab.v === "conversa" && (
        <Conversation settings={settings} perfil={perfil} setPerfil={setPerfil} senha={senha.v} />
      )}
      {tab.v === "treino" && <Simulator settings={settings} perfil={perfil} senha={senha.v} />}
      {tab.v === "estilo" && <StyleTrainer perfil={perfil} setPerfil={setPerfil} />}
      {tab.v === "modelos" && (
        <ModelGuide
          providers={providers}
          settings={settings}
          setSettings={setSettings}
          goTo={() => setTab({ v: "pergunta" })}
        />
      )}

      <footer className="foot">
        Seu perfil e exemplos ficam só neste navegador. As chaves de API ficam no servidor.
      </footer>
    </main>
  );
}
