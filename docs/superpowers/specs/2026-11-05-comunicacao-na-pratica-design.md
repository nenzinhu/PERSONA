# Comunicação na prática

## Intenção

Ampliar o Persona para além de responder mensagens, com três experiências: ensaiar uma fala própria, refletir sobre uma conversa que já aconteceu e informar manualmente etapas do cumprimento de uma ordem de serviço no grupo do batalhão via WhatsApp.

## Abordagens

- **Três novas áreas na navegação principal:** acesso direto, mas aumenta a navegação de sete para dez itens.
- **Uma área agrupadora com três seções internas (escolha de implementação):** mantém juntas as ferramentas presenciais e de aprendizado sem aumentar demais a navegação.
- **Uma página única em sequência:** ocupa menos navegação, mas mistura atividades que podem ser usadas separadamente.

## Escopo

- **Ensaio de fala:** gravar até 60 segundos no navegador; manter o áudio apenas em memória; enviar ao Groq somente após ação explícita de transcrição; mostrar aviso de transmissão. O usuário pode ouvir e apagar o áudio local. A revisão opcional envia apenas a transcrição ao provedor/modelo configurado e avalia clareza do texto com base no objetivo e na autoavaliação. Não inferir ritmo, emoção, sotaque ou qualidade vocal.
- **Diário:** salvar no `localStorage` entradas escritas manualmente com situação, objetivo, o que ocorreu, o que funcionou e o que tentará em outra ocasião. Sem IA e sem inferências sobre terceiros. Permitir editar e excluir.
- **Informe de ordem de serviço:** escolher início, durante ou encerramento; preencher identificação da OS, data/hora, local, relato e observações; exigir foto para compartilhar. Gerar prévia de texto para WhatsApp, sem inferir que uma tarefa foi concluída nem presumir protocolo militar.
- Texto do rascunho da OS fica em `sessionStorage`; foto fica apenas em memória e não é enviada a servidores do Persona.
- Compartilhar por Web Share API quando texto e foto forem aceitos; caso contrário, copiar o texto, baixar a imagem e abrir WhatsApp Web para anexação manual. O usuário escolhe o grupo e confirma o envio.
- Uma única área “Comunicação na prática” na navegação, com seções internas para as três ferramentas.
- Toda a interface em PT-BR e alinhada ao `DESIGN.md`; formulários responsivos e acessíveis.

## Fora do escopo

- Sincronização remota, envio automático de mensagens, armazenamento de áudio ou foto, análise acústica, avaliação de desempenho vocal, gravação de reuniões, geração de atas, prescrição de normas/regulamentos militares ou preenchimento de dados não fornecidos pelo usuário.

## Restrições

- Reutilizar `/api/transcrever`; exige `GROQ_API_KEY`.
- Usar as rotas/provedores existentes para a revisão textual, com validação Zod e `runGeneration`.
- Preservar configurações, armazenamento e comportamento existentes.

## Decisões deixadas à implementação

- Compartilhamento nativo somente quando o navegador aceitar anexos; o fluxo de fallback precisa deixar claro que a foto deve ser anexada pelo usuário.
- A identificação da ordem, relato e foto são obrigatórios para compartilhar; data/hora, local e observações são opcionais.
- Entradas do diário identificadas por id local único e listadas da mais recente para a mais antiga.
- Falha de microfone, navegador sem `MediaRecorder`, ausência de Groq ou provedor de texto sem chave devem orientar recuperação sem apagar a transcrição.
