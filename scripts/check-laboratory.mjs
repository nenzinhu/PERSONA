import assert from "node:assert/strict";
// Optional module URL lets CI use an isolated Playwright installation.
const { chromium } = await import(process.env.PERSONA_PLAYWRIGHT_PATH || "playwright");
const browser = await chromium.launch({ channel: "msedge", headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(process.env.PERSONA_TEST_URL || "http://localhost:3100");
  if (!(await page.getByRole("button", { name: "Laboratório", exact: true }).isVisible())) {
    await page.getByRole("button", { name: /Mais/ }).click();
  }
  await page.getByRole("button", { name: "Laboratório", exact: true }).click();
  await page.getByLabel("O que uma câmera registraria?").fill("A mensagem ficou sem resposta.");
  await page.getByLabel("Que legenda eu coloquei nisso?").fill("Ela está irritada.");
  await page.getByLabel("Que outra legenda também caberia?").fill("Ela está ocupada.");
  await page.getByLabel("Como posso conferir sem acusar?").fill("Podemos conversar depois?");
  assert.match(await page.locator(".lab-output").innerText(), /Interpretação \(não confirmada\)/);
  await page.getByRole("button", { name: "Copiar resultado", exact: true }).click();
  await page
    .locator(".lab-notice")
    .filter({ hasText: /Copiado|Não foi possível copiar/ })
    .waitFor();

  await page.getByRole("button", { name: /Três mundos possíveis/ }).click();
  for (const label of [
    "Minha primeira leitura",
    "Uma leitura generosa",
    "Uma explicação cotidiana",
    "Qual informação separaria as hipóteses?",
    "Uma pergunta ou ação para conferir",
  ]) {
    await page.getByLabel(label, { exact: true }).fill(`Minha resposta para ${label}`);
  }
  assert.match(await page.locator(".lab-output").innerText(), /Hipóteses, não conclusões/);

  await page.getByRole("button", { name: /Mensagem de bolso/ }).click();
  await page
    .getByLabel("Mensagem original", { exact: true })
    .fill("Preciso confirmar nossa reunião de amanhã e também saber qual será o local.");
  await page.getByLabel("O que precisa sobreviver ao corte?").fill("Confirmar horário e local.");
  await page.getByLabel("Minha versão de bolso").fill("Confirma horário e local de amanhã?");
  assert.match(await page.locator(".lab-output").innerText(), /Confirma horário/);
  await page.getByRole("button", { name: "15 palavras", exact: true }).click();
  await page.getByLabel("Minha versão de bolso").fill("palavra ".repeat(16));
  assert.equal(await page.locator(".lab-output").count(), 0);
  await page.getByLabel("Minha versão de bolso").fill("Confirma horário e local de amanhã?");

  await page.getByRole("button", { name: /Oficina de reparação/ }).click();
  await page.getByLabel("O que eu fiz?", { exact: true }).fill("interrompi sua fala");
  await page.getByLabel("Que impacto a pessoa relatou?").fill("você não concluiu a ideia");
  await page.getByLabel("Que reparação posso oferecer?").fill("ouvir sua ideia até o fim");
  assert.match(await page.locator(".lab-output").innerText(), /ouvir sua ideia até o fim/);

  await page.clock.install();
  await page.getByRole("button", { name: /Cápsula de perspectiva/ }).click();
  assert.equal(await page.getByRole("button", { name: "Guardar previsão" }).isDisabled(), true);
  await page.getByLabel("O que imagino que vai acontecer?").fill("A conversa será difícil.");
  await page.getByRole("button", { name: "1 min", exact: true }).click();
  await page.getByRole("button", { name: "Guardar previsão" }).click();
  assert.equal(await page.getByLabel("O que realmente aconteceu?").count(), 0);
  await page.clock.fastForward(61000);
  await page.getByLabel("O que realmente aconteceu?").fill("Conseguimos conversar com calma.");
  await page.getByLabel("O que minha previsão deixou de fora?").fill("Havia disposição para ouvir.");
  assert.match(await page.locator(".lab-output").innerText(), /Conseguimos conversar/);
  await page.reload();
  await page.getByRole("button", { name: /Cápsula de perspectiva/ }).click();
  assert.equal(await page.locator(".lab-quote").innerText(), "A conversa será difícil.");
  await page.getByRole("button", { name: "Reabrir previsão para editar" }).click();
  assert.equal(await page.getByLabel("O que imagino que vai acontecer?").inputValue(), "A conversa será difícil.");
  await page.getByRole("button", { name: /Câmera e legenda/ }).click();
  assert.equal(await page.getByLabel("O que uma câmera registraria?").inputValue(), "A mensagem ficou sem resposta.");

  await page.getByRole("button", { name: /Mais/ }).click();
  await page.getByRole("combobox", { name: /Aparência/ }).selectOption("dark");
  await page.keyboard.press("Escape");
  assert.equal(await page.locator("html").getAttribute("data-theme"), "dark");
  await page.setViewportSize({ width: 390, height: 844 });
  assert.equal(
    await page.evaluate(() => globalThis.document.documentElement.scrollWidth <= globalThis.innerWidth),
    true,
  );
  await page.getByLabel("O que uma câmera registraria?").focus();
  await page.keyboard.press("Tab");
  assert.equal(
    await page
      .getByLabel("Que legenda eu coloquei nisso?")
      .evaluate((element) => element === globalThis.document.activeElement),
    true,
  );
  await page.screenshot({ path: process.env.PERSONA_SCREENSHOT || "lab-mobile.png", fullPage: true });
  assert.deepEqual(errors, []);
  console.log(
    "PASS: five exercises, empty/limit states, capsule deadline and reload, draft recovery, copy feedback, dark/mobile layout and keyboard navigation.",
  );
} finally {
  await browser.close();
}
