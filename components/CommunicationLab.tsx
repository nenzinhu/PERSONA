"use client";

import { useEffect, useState } from "react";
import { useSessionState } from "@/lib/store";
import { buildRealityCheck, buildRepair, capsuleReady, compressionStats } from "@/lib/laboratory";

const TOOLS = [
  { id: "fatos", name: "Câmera e legenda", hint: "Separe o que aconteceu da história que você contou." },
  { id: "hipoteses", name: "Três mundos possíveis", hint: "Encontre explicações que disputam sua primeira impressão." },
  { id: "essencial", name: "Mensagem de bolso", hint: "Dê à sua mensagem um orçamento de palavras." },
  { id: "capsula", name: "Cápsula de perspectiva", hint: "Compare uma previsão com o que realmente aconteceu." },
  { id: "reparo", name: "Oficina de reparação", hint: "Transforme um pedido de desculpas em uma ação concreta." },
] as const;
type Tool = (typeof TOOLS)[number]["id"];
const EMPTY = {
  fact: "",
  story: "",
  alternative: "",
  question: "",
  hypothesis: "",
  generous: "",
  mundane: "",
  evidence: "",
  experiment: "",
  original: "",
  short: "",
  anchor: "",
  action: "",
  impact: "",
  next: "",
  prediction: "",
  outcome: "",
  learning: "",
};
type Capsule = { prediction: string; createdAt: string; revealAt: string };

export default function CommunicationLab() {
  const [tool, setTool] = useState<Tool>("fatos");
  const [draft, setDraft] = useSessionState("persona-lab-draft", EMPTY);
  const [capsule, setCapsule] = useSessionState<{ value: Capsule | null }>("persona-lab-capsule", { value: null });
  const [budget, setBudget] = useState(30);
  const [delay, setDelay] = useState(10);
  const [now, setNow] = useState(0);
  const [notice, setNotice] = useState("");
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    setNow(Date.now());
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);
  const update = (key: keyof typeof EMPTY, value: string) => {
    setDraft((previous) => ({ ...previous, [key]: value }));
    setCopied(false);
    setNotice("");
  };
  const field = (key: keyof typeof EMPTY, label: string, placeholder: string, rows = 3) => (
    <label className="field">
      <span>{label}</span>
      <textarea
        rows={rows}
        maxLength={4000}
        value={draft[key]}
        onChange={(event) => update(key, event.target.value)}
        placeholder={placeholder}
      />
    </label>
  );
  const stats = compressionStats(draft.original, draft.short, budget);
  const ready = capsule.value && capsuleReady(capsule.value.revealAt, now);
  let result = "";
  if (tool === "fatos" && [draft.fact, draft.story, draft.alternative, draft.question].every((s) => s.trim())) {
    result = buildRealityCheck(draft.fact, draft.story, draft.alternative, draft.question);
  }
  if (
    tool === "hipoteses" &&
    [draft.hypothesis, draft.generous, draft.mundane, draft.evidence, draft.experiment].every((s) => s.trim())
  ) {
    result = `Hipóteses, não conclusões\n\nMinha primeira leitura: ${draft.hypothesis}\nLeitura generosa: ${draft.generous}\nExplicação cotidiana: ${draft.mundane}\nO que distinguiria essas versões: ${draft.evidence}\nComo vou conferir: ${draft.experiment}`;
  }
  if (tool === "essencial" && stats.ready && draft.anchor.trim()) result = draft.short.trim();
  if (tool === "reparo") result = buildRepair(draft.action, draft.impact, draft.next);
  if (tool === "capsula" && ready && draft.outcome.trim() && draft.learning.trim()) {
    result = `Eu previa: ${capsule.value?.prediction}\nAconteceu: ${draft.outcome}\nO que levo comigo: ${draft.learning}`;
  }
  async function copy() {
    try {
      await navigator.clipboard.writeText(result);
      setCopied(true);
      setNotice("Copiado. Revise antes de compartilhar.");
    } catch {
      setNotice("Não foi possível copiar. Selecione o texto do resultado e copie manualmente.");
    }
  }
  return (
    <section className="communication-lab" aria-label="Laboratório de comunicação">
      <div className="lab-intro">
        <p className="lab-kicker">Uma pausa para mudar de perspectiva</p>
        <p>Experimente pensar diferente antes de responder. Aqui, as palavras e as conclusões são suas.</p>
        <span className="muted small">Sem IA ou envio de dados. Rascunhos ficam apenas nesta sessão do navegador.</span>
      </div>
      <div className="lab-tools" role="group" aria-label="Escolher exercício">
        {TOOLS.map((item) => (
          <button
            key={item.id}
            aria-pressed={tool === item.id}
            className={tool === item.id ? "lab-tool on" : "lab-tool"}
            onClick={() => {
              setTool(item.id);
              setNotice("");
              setCopied(false);
            }}
          >
            <strong>{item.name}</strong>
            <span>{item.hint}</span>
          </button>
        ))}
      </div>
      <div className="studio-grid">
        <section className="composer" aria-labelledby="lab-heading">
          <div className="panel-heading">
            <h2 id="lab-heading">{TOOLS.find((item) => item.id === tool)?.name}</h2>
          </div>
          {tool === "fatos" && (
            <>
              <p className="studio-intro">
                Uma câmera registraria o fato. A legenda é o significado que você atribuiu a ele.
              </p>
              {field(
                "fact",
                "O que uma câmera registraria?",
                "Ex.: enviei uma pergunta ontem e ainda não recebi resposta.",
              )}
              {field("story", "Que legenda eu coloquei nisso?", "Ex.: achei que a pessoa estava me evitando.")}
              {field(
                "alternative",
                "Que outra legenda também caberia?",
                "Ex.: ela pode ter deixado para responder depois.",
              )}
              {field("question", "Como posso conferir sem acusar?", "Ex.: você conseguiu ver minha pergunta?")}
            </>
          )}
          {tool === "hipoteses" && (
            <>
              <p className="studio-intro">
                Escreva três explicações diferentes. Nenhuma delas comprova a intenção da outra pessoa.
              </p>
              {field("hypothesis", "Minha primeira leitura", "O que me veio à cabeça?")}
              {field("generous", "Uma leitura generosa", "Como isso pareceria se houvesse boa intenção?")}
              {field("mundane", "Uma explicação cotidiana", "Falta de tempo, contexto incompleto ou um desencontro?")}
              {field(
                "evidence",
                "Qual informação separaria as hipóteses?",
                "Que fato observável faria minha leitura mudar?",
              )}
              {field(
                "experiment",
                "Uma pergunta ou ação para conferir",
                "Escolha algo respeitoso e possível, sem testar ou manipular a pessoa.",
              )}
            </>
          )}
          {tool === "essencial" && (
            <>
              <p className="studio-intro">
                Encurte com suas palavras. Preserve o pedido, o limite ou a informação que não pode desaparecer.
              </p>
              {field("original", "Mensagem original", "Cole a mensagem que ficou longa.", 5)}
              {field("anchor", "O que precisa sobreviver ao corte?", "Ex.: preciso de uma confirmação até amanhã.", 2)}
              <div className="studio-tabs" role="group" aria-label="Orçamento de palavras">
                {[15, 30, 60].map((value) => (
                  <button
                    key={value}
                    className={budget === value ? "on" : ""}
                    aria-pressed={budget === value}
                    onClick={() => setBudget(value)}
                  >
                    {value} palavras
                  </button>
                ))}
              </div>
              {field("short", "Minha versão de bolso", "Reescreva mantendo o essencial.", 5)}
              <p className="lab-meter" role="status">
                {stats.after} / {budget} palavras ·{" "}
                {stats.before > 0
                  ? `${Math.abs(stats.reduction)}% ${stats.reduction >= 0 ? "mais curta" : "mais longa"}`
                  : "adicione a mensagem original"}
              </p>
              {stats.after > budget && (
                <p className="muted">Retire {stats.after - budget} palavras para caber no orçamento.</p>
              )}
            </>
          )}
          {tool === "capsula" && (
            <>
              <p className="studio-intro">
                Registre uma previsão antes da conversa. Depois, confronte-a com o ocorrido. A cápsula permanece apenas
                nesta aba; não há notificação em segundo plano.
              </p>
              {!capsule.value ? (
                <>
                  {field(
                    "prediction",
                    "O que imagino que vai acontecer?",
                    "Ex.: acho que meu pedido será recebido como uma cobrança.",
                  )}
                  <div className="studio-tabs" role="group" aria-label="Quando revisitar">
                    {[1, 10, 60].map((value) => (
                      <button
                        key={value}
                        className={delay === value ? "on" : ""}
                        aria-pressed={delay === value}
                        onClick={() => setDelay(value)}
                      >
                        {value} min
                      </button>
                    ))}
                  </div>
                  <button
                    className="primary"
                    disabled={!draft.prediction.trim()}
                    onClick={() => {
                      const time = Date.now();
                      setCapsule({
                        value: {
                          prediction: draft.prediction.trim(),
                          createdAt: new Date(time).toISOString(),
                          revealAt: new Date(time + delay * 60000).toISOString(),
                        },
                      });
                      setNotice("Previsão guardada nesta sessão.");
                    }}
                  >
                    Guardar previsão
                  </button>
                </>
              ) : (
                <>
                  <blockquote className="lab-quote">{capsule.value.prediction}</blockquote>
                  <p className="muted">
                    Comparação disponível em{" "}
                    {new Date(capsule.value.revealAt).toLocaleTimeString("pt-BR", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                    .
                  </p>
                  {ready ? (
                    <>
                      {field("outcome", "O que realmente aconteceu?", "Descreva o que observou.")}
                      {field(
                        "learning",
                        "O que minha previsão deixou de fora?",
                        "O que vale lembrar antes de uma próxima conversa?",
                      )}
                    </>
                  ) : (
                    <p>Enquanto espera, você pode usar os outros exercícios.</p>
                  )}
                </>
              )}
            </>
          )}
          {tool === "reparo" && (
            <>
              <p className="studio-intro">
                Reconheça uma ação específica, use o impacto relatado pela pessoa e proponha uma mudança possível.
              </p>
              {field("action", "O que eu fiz?", "Ex.: interrompi você durante a reunião")}
              {field("impact", "Que impacto a pessoa relatou?", "Ex.: você não conseguiu concluir sua ideia")}
              {field(
                "next",
                "Que reparação posso oferecer?",
                "Ex.: reservar um momento para ouvir sua proposta até o fim",
              )}
            </>
          )}
        </section>
        <section className="studio-side lab-result" aria-labelledby="lab-result-heading">
          <div className="panel-heading">
            <h2 id="lab-result-heading">O que você leva daqui</h2>
          </div>
          {result ? (
            <>
              <p className="lab-output">{result}</p>
              <button className="act" onClick={copy}>
                {copied ? "Copiado" : "Copiar resultado"}
              </button>
              <p className="muted small">Leia com calma e ajuste ao seu contexto antes de usar.</p>
            </>
          ) : (
            <div className="empty">
              <p>Um novo ângulo começa aqui.</p>
              <p className="muted small">
                Preencha os campos do exercício para montar seu resultado.
                {tool === "capsula" && capsule.value && !ready ? " A comparação abre ao fim do prazo." : ""}
              </p>
            </div>
          )}
          <p className="lab-notice" role="status">
            {notice}
          </p>
          {tool === "capsula" && capsule.value && (
            <button
              className="act"
              onClick={() => {
                setDraft((previous) => ({ ...previous, prediction: capsule.value?.prediction ?? previous.prediction }));
                setCapsule({ value: null });
                setNotice("Previsão devolvida ao rascunho. Suas anotações foram mantidas.");
              }}
            >
              Reabrir previsão para editar
            </button>
          )}
        </section>
      </div>
    </section>
  );
}
