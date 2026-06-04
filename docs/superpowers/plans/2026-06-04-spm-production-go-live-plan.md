# SPM Production Go-Live Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** transformar a landing page da SPM em um ativo de produção funcional, rastreável e pronto para publicação sem gaps operacionais.

**Architecture:** a execução será feita em três sprints encadeadas. A Sprint 1 remove falsos sinais de prontidão e fecha pendências estáticas de produção; a Sprint 2 liga a captura real de leads com Google Sheets + Apps Script; a Sprint 3 ativa medição, canais de contato e deploy final com validação ponta a ponta.

**Tech Stack:** HTML, CSS, JavaScript vanilla, Google Apps Script, Google Sheets, Meta Pixel, Vercel.

---

### Sprint 1: Higiene de Produção e Ajustes Não Dependentes de Credenciais

**Files:**
- Modify: `C:\Users\Icaruz\Documents\SITE SPM 2\index.html`
- Modify: `C:\Users\Icaruz\Documents\SITE SPM 2\404.html`
- Modify: `C:\Users\Icaruz\Documents\SITE SPM 2\assets\js\config.js`
- Create: `C:\Users\Icaruz\Documents\SITE SPM 2\og-image.jpg`
- Create: `C:\Users\Icaruz\Documents\SITE SPM 2\favicon.ico`
- Create: `C:\Users\Icaruz\Documents\SITE SPM 2\site.webmanifest`

- [ ] Corrigir a CTA da `404.html` para apontar para `/#diagnostico`.
- [ ] Gerar e conectar o `og-image.jpg` real para compartilhamento social.
- [ ] Adicionar favicon e `site.webmanifest` para experiência de aba/favoritos.
- [ ] Limpar inconsistências de configuração não críticas em `assets/js/config.js`.
- [ ] Revisar se todos os links internos e anchors públicos batem com as seções reais.
- [ ] Validar SEO técnico básico: `title`, `description`, `canonical`, `robots.txt`, `sitemap.xml`, `og:*`.

**Definition of Done:**
- Nenhum link interno importante aponta para âncora inexistente.
- O site tem `og:image` real e favicon funcional.
- A configuração pública fica coerente com o estado visual atual da página.

**Dependencies:**
- Nenhuma credencial externa.

### Sprint 2: Ativação Real da Captação de Leads

**Files:**
- Modify: `C:\Users\Icaruz\Documents\SITE SPM 2\apps-script\Code.gs`
- Modify: `C:\Users\Icaruz\Documents\SITE SPM 2\assets\js\config.js`
- Validate: `C:\Users\Icaruz\Documents\SITE SPM 2\assets\js\form.js`
- Validate: `C:\Users\Icaruz\Documents\SITE SPM 2\index.html`
- Validate: `C:\Users\Icaruz\Documents\SITE SPM 2\obrigado\index.html`

- [ ] Definir a planilha de produção e confirmar as colunas que receberão os leads.
- [ ] Configurar o `SPREADSHEET_ID` real em `apps-script/Code.gs`.
- [ ] Publicar o Apps Script como Web App com acesso correto para recebimento dos envios.
- [ ] Inserir a `appsScriptUrl` real em `assets/js/config.js`.
- [ ] Rodar teste completo de envio: site -> script -> planilha -> página de obrigado.
- [ ] Validar persistência de dados de origem, campanha e parâmetros UTM.
- [ ] Revisar mensagens de sucesso/erro para garantir que não exista “falso positivo” de envio.

**Definition of Done:**
- Um lead de teste enviado pelo site aparece corretamente na planilha.
- A página de obrigado só representa sucesso quando a submissão real estiver operacional.
- O formulário tem comportamento confiável em desktop e mobile.

**Dependencies:**
- Acesso à conta Google que hospedará a planilha e o Apps Script.
- URL final do Web App publicada.

### Sprint 3: Medição, Canais de Conversão e Publicação

**Files:**
- Modify: `C:\Users\Icaruz\Documents\SITE SPM 2\assets\js\config.js`
- Validate: `C:\Users\Icaruz\Documents\SITE SPM 2\assets\js\tracking.js`
- Validate: `C:\Users\Icaruz\Documents\SITE SPM 2\assets\js\main.js`
- Validate: `C:\Users\Icaruz\Documents\SITE SPM 2\vercel.json`
- Validate: `C:\Users\Icaruz\Documents\SITE SPM 2\robots.txt`
- Validate: `C:\Users\Icaruz\Documents\SITE SPM 2\sitemap.xml`

- [ ] Inserir `pixelId`, `whatsappUrl` e `instagramUrl` reais em `assets/js/config.js`.
- [ ] Validar consentimento de cookies e carregamento condicional do Pixel.
- [ ] Validar disparo de `PageView`, `ViewContent` e `CompleteRegistration`.
- [ ] Confirmar que todos os CTAs de WhatsApp abrem o canal correto sem fallback indevido.
- [ ] Revisar domínio final, SSL, sitemap e `robots.txt` no ambiente publicado.
- [ ] Publicar na Vercel e executar smoke test completo em produção.
- [ ] Validar jornada completa: visita -> scroll -> clique CTA -> envio -> obrigado -> evento de conversão.

**Definition of Done:**
- O site publicado responde em produção com domínio correto e HTTPS.
- O WhatsApp abre para o número real.
- O Pixel mede os eventos essenciais após consentimento.
- O fluxo de lead está funcional do primeiro clique até a conversão.

**Dependencies:**
- Pixel Meta real.
- Número/URL final do WhatsApp.
- Projeto Vercel vinculado e domínio pronto para apontamento.

### Ordem Recomendada de Execução

- [ ] Executar Sprint 1 inteira antes de qualquer integração externa.
- [ ] Só abrir Sprint 2 após a base estática estar limpa e coerente.
- [ ] Só publicar Sprint 3 depois de validar um lead real entrando na planilha.

### Gates de Aprovação

- [ ] Gate 1: revisão visual/técnica da Sprint 1 concluída.
- [ ] Gate 2: lead real salvo na planilha sem erro.
- [ ] Gate 3: eventos, CTAs e deploy confirmados em produção.
