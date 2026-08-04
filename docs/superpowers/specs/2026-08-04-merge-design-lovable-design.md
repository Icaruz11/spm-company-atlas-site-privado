# Merge do design novo (Lovable) na arquitetura estática — mantendo tracking sempre ativo

**Data:** 2026-08-04
**Branch:** `feat/novo-design-lovable`

## Contexto

O usuário enviou `spm-company-atlas-site-completo.zip`: uma reescrita do site em
**TanStack Start (React SSR)** gerada pelo Lovable, com o design alterado em
algumas partes e o formulário modificado. O usuário quer subir esse **design
novo** no repositório sem perder o trackeamento (Meta Pixel), que deve ficar
**ativo a qualquer hora, sem gate de consentimento**.

Decisão do usuário: "pouco importa o código, se quiser trocar, pode trocar" — o
que vale é manter a estrutura de design.

## Abordagem escolhida

Descartar o app React. Portar **apenas o design** (que no zip é HTML puro em
`src/content/*.html`) para a **arquitetura estática atual**, que já deploya na
Vercel sem build. Zero React, zero SSR, zero reconfiguração de hospedagem.

### O que entra do zip (design novo)
- HTML de cada página (de `src/content/*.html`) como corpo das páginas estáticas.
- `assets/css/styles.css` novo (referencia imagens `.webp` e fontes `.woff2`).
- Imagens `.webp` novas + `brand_mark.png`/`brand_wordmark.png`.
- Fontes Metropolis em `.woff2` (5 pesos), removendo os `.otf` antigos.
- `assets/media/results/*.webp`.

### O que é mantido do repo atual (tracking comprovado)
- `pixel.js` — dispara **incondicionalmente** no load (PageView + eventos por
  `data-page`), ID `1899907434017840`. Sem gate.
- `config.js`, `main.js`, `carousel.js`, `form.js` — idênticos ao atual
  (carousel/main já iguais ao zip; form redireciona com trailing slash, correto
  para o `trailingSlash: true` da Vercel).
- `tracking.js` — **simplificado para never-disable**: remove o caminho que
  revogava o pixel no "recusar", garantindo pixel sempre ativo em qualquer página.
- `apps-script/Code.gs` — inalterado. O form novo não envia `consentimento`;
  a coluna "Consentimento LGPD" apenas fica vazia (sem risco de desalinhar a
  planilha existente).

### Páginas (6)
`index.html`, `obrigado/`, `obrigado1/`, `politica-de-privacidade/`,
`termos-de-uso/`, `404.html`. Cada uma: `<head>` atual (SEO/OG preservado,
caminhos de asset absolutos `/assets/...`, cache-bust do CSS) + corpo do design
novo + bloco de scripts + `<noscript>` do Pixel.

O Pixel passa a carregar em **todas** as páginas (antes as legais/404 não
carregavam), honrando "pixel ativo a qualquer hora".

### Comportamento preservado
- `obrigado1/` mantida: `form.js` roteia leads de faturamento não-qualificado
  para lá.

## SEO / infra
- `sitemap.xml`: só páginas indexáveis (`/`, `/politica-de-privacidade`,
  `/termos-de-uso`). `obrigado*` e `404` ficam fora (noindex).
- `robots.txt`: mantém referência ao sitemap.
- `CLAUDE.md`: atualizar a lista de campos do form (remover `consentimento`,
  registrar `instagram`).
- `vercel.json`: inalterado (CSP já cobre YouTube-nocookie e Facebook).

## Fora de escopo
Migração para React/Lovable; mudança de hospedagem; Conversions API server-side.
