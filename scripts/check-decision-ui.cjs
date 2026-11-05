const { chromium } = require("playwright");
const assert = require("node:assert/strict");
(async () => {
  const b = await chromium.launch({
    headless: true,
    ...(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {}),
  });
  let failed = 0;
  async function setup() {
    const p = await b.newPage();
    await p.route("**/api/providers", (r) =>
      r.fulfill({ json: { providers: [{ id: "openrouter", label: "OpenRouter", configured: true, models: [] }] } }),
    );
    await p.route("**/api/sinais", (r) =>
      r.fulfill({
        json: {
          scores: [{ id: "compromisso_adicional", label: "Compromisso adicional sem base", probabilidade: 0.9 }],
          model: "respan/span-01-lite:free",
        },
      }),
    );
    await p.route("**/api/decisoes", (r) => {
      const d = r.request().postDataJSON();
      return r.fulfill({
        json:
          d.acao === "resposta"
            ? { acao: "resposta", texto: "Vou verificar e confirmar depois." }
            : d.acao === "conferir"
              ? { acao: "conferir", resumo: "Conferência de teste", observacoes: [] }
              : {
                  acao: "pendencias",
                  itens: [
                    {
                      tipo: "pedido",
                      descricao: "Verificar equipe",
                      responsavel: "Eu",
                      prazo: "sexta",
                      condicao: "se houver viatura",
                      fonte: d.fonteA,
                    },
                  ],
                },
      });
    });
    await p.goto(process.env.PERSONA_TEST_URL || "http://127.0.0.1:3000", { waitUntil: "networkidle" });
    await p.getByLabel(/^Assunto ou contato/).fill("Plantão");
    await p.getByLabel("Mensagem recebida", { exact: true }).fill("Verifique equipe até sexta se houver viatura.");
    await p.getByLabel("Rascunho para editar ou conferir", { exact: true }).fill("Equipe confirmada para sexta.");
    return p;
  }
  async function act(p, label) {
    await p.getByRole("button", { name: label, exact: true }).click();
    await p.getByRole("button", { name: "Confirmar envio à IA", exact: true }).click();
    await p.getByText("Analisando…", { exact: false }).waitFor({ state: "hidden" });
  }
  try {
    const p = await setup();
    await p.locator("summary").filter({ hasText: "Avaliação adicional" }).click();
    await act(p, "Avaliar com Span-01 Lite");
    await p.getByRole("region", { name: "Sinais do Span-01 Lite", exact: true }).waitFor();
    await act(p, "Preparar resposta");
    assert.equal(
      await p.getByRole("region", { name: "Sinais do Span-01 Lite", exact: true }).count(),
      0,
      "new draft must invalidate old Span scores",
    );
    console.log("PASS draft invalidation");
    await p.close();
  } catch (e) {
    failed++;
    console.log("FAIL", e.message);
  }
  try {
    const p = await setup();
    await act(p, "Conferir rascunho");
    await p.getByRole("region", { name: "Conferência do rascunho", exact: true }).waitFor();
    await act(p, "Encontrar pendências");
    await p.getByLabel("Conferi o trecho e confirmo este registro.", { exact: true }).check();
    await p.getByRole("button", { name: "Confirmar e salvar", exact: true }).click();
    assert.equal(
      await p.getByRole("region", { name: "Conferência do rascunho", exact: true }).count(),
      0,
      "saving memory must invalidate old review",
    );
    console.log("PASS memory invalidation");
    await p.close();
  } catch (e) {
    failed++;
    console.log("FAIL", e.message);
  }
  await b.close();
  process.exitCode = failed ? 1 : 0;
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
