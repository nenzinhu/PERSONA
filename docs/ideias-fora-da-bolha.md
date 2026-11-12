# Fora da bolha: cinco ferramentas locais

Implementadas na área **Fora da bolha** (`components/BeyondBubble.tsx`), com a lógica pura em `lib/` e testes em
`tests/`. Nenhuma delas usa IA: tudo roda no navegador, e o que a pessoa escreve fica apenas na sessão do navegador
(ou no `localStorage`, quando indicado). Nada é enviado a um provedor nem compartilhado automaticamente.

## Modo pouca energia

`lib/energy.ts` · `components/LowEnergyMode.tsx`

Quando escrever parece uma tarefa grande, escolher apenas a disponibilidade real: “consigo resolver agora”, “preciso de
tempo” ou “não consigo assumir”. O app monta a frase com o assunto, o prazo de retorno e o limite informado, sem criar
justificativas nem inferir o estado emocional da pessoa. O texto pode ser copiado; nada é enviado.

## Passagem de bastão

`lib/handoff.ts` · `components/HandoffCard.tsx`

A conversa colada é dividida em linhas e cada linha se torna um item revisável: fato confirmado, dúvida em aberto ou
próxima ação. Cada item guarda o trecho de origem, pode ser reescrito e precisa da confirmação de quem escreve antes de
virar cartão. O cartão final informa responsável, próxima ação e o lembrete de conferir com a conversa original. Nenhum
item é classificado automaticamente como fato.

## Leitura sem contexto

`lib/plain-read.ts` · `components/PlainReading.tsx`

Mostra o rascunho isolado, como quem só recebeu aquele texto, e responde a quatro perguntas fixas sobre o próprio texto:
existe pedido ou ação explícita, existe prazo, existem referências que só fazem sentido com o histórico e existe algo
declarado em aberto. As perguntas são sobre o texto, não sobre a reação do destinatário; as listas de expressões
encontradas podem ser copiadas para revisão.

## Dicionário de acordos

`lib/agreements.ts` · `components/AgreementsDictionary.tsx`

Um dicionário local de expressões ambíguas (“mais tarde”, “quando der”, “está resolvido”…) e do significado
explicitamente combinado. Ao conferir um texto, as expressões são destacadas com a contagem de ocorrências; quando não
há acordo registrado, o app apenas oferece uma pergunta de precisão e não sugere sentido. Os acordos ficam no
`localStorage` deste navegador.

## Cartão de bolso

`lib/pocket.ts` · `components/PocketCard.tsx`

Uma folha com três listas curtas — o que preciso dizer, o que preciso perguntar e o meu limite — para imprimir
(`@media print` mostra apenas o cartão) ou copiar antes de um encontro presencial. O cartão não acrescenta nomes nem
detalhes: usa exatamente o que foi escrito e desaparece quando a aba é fechada.
