# SPM ATLAS Landing Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the SPM landing page into a dark, high-conversion sales page for health professionals, while keeping the original blue/gray brand palette and adding a method video modal with an Atlas symbol focal point.

**Architecture:** Keep the current static site structure, but recompose the homepage around a strong hero, a premium proof/method narrative, and a single conversion path. Use CSS variables to preserve the brand palette, introduce darker surfaces and glow accents, and centralize the method video modal in the shared JS layer so the trigger, fallback, and future video asset all behave consistently.

**Tech Stack:** HTML, CSS, vanilla JavaScript, static asset pipeline, browser verification with Playwright.

---

### Task 1: Reframe the visual system and page hierarchy

**Files:**
- Modify: `assets/css/styles.css`
- Modify: `assets/js/config.js`

- [ ] **Step 1: Define the new dark-first brand tokens**

```css
:root {
  --blue-950: #051b34;
  --blue-900: #003b73;
  --blue-800: #0a4f93;
  --blue-700: #1f69b1;
  --blue-100: #dfeaf5;
  --bg: #050b14;
  --bg-alt: #091423;
  --surface: rgba(8, 15, 28, 0.78);
  --surface-strong: rgba(10, 18, 33, 0.94);
}
```

- [ ] **Step 2: Add modal and hero-specific config values**

```js
window.SPM_CONFIG = window.SPM_CONFIG || {
  methodVideoPath: "",
  methodVideoPosterPath: "assets/img/atlas_logo_clean2.png",
  methodVideoTitle: "Protocolo ATLAS em destaque",
};
```

- [ ] **Step 3: Verify the config file still parses**

Run: `node --check assets/js/config.js`
Expected: exit code `0`.

### Task 2: Rebuild the homepage into a sales-page layout

**Files:**
- Modify: `index.html`

- [ ] **Step 1: Replace the current hero with a sales-led split layout**

```html
<section class="hero hero-split" id="protocolo">
  <div class="hero-copy-shell">
    <span class="eyebrow">PROTOCOLO ATLAS · FOCO TOTAL NA SAÚDE</span>
    <h1 class="hero-title">Marketing para saúde que parece premium e converte de verdade.</h1>
    <p class="hero-copy">...</p>
    <div class="button-row">
      <a class="button button-primary" href="#diagnostico">Quero entrar para o ATLAS</a>
      <button class="button button-secondary" type="button" data-method-modal-open>Saber mais sobre o método</button>
    </div>
  </div>
</section>
```

- [ ] **Step 2: Keep the scroll path in the same order, but adjust the section framing**

```html
<section class="section section-dark" id="prova">...</section>
<section class="section section-dark" id="metodo">...</section>
<section class="section section-dark" id="servicos">...</section>
<section class="section section-dark" id="diagnostico">...</section>
```

- [ ] **Step 3: Add the modal markup near the end of `body`**

```html
<div class="method-modal" data-method-modal hidden>
  <div class="method-modal__backdrop" data-method-modal-close></div>
  <div class="method-modal__dialog" role="dialog" aria-modal="true" aria-labelledby="method-modal-title">
    <button class="method-modal__close" type="button" aria-label="Fechar" data-method-modal-close>×</button>
    <video class="method-modal__video" data-method-video playsinline muted loop preload="none"></video>
    <div class="method-modal__fallback">
      <img src="assets/img/atlas_logo_clean2.png" alt="Logo do Protocolo ATLAS" />
    </div>
  </div>
</div>
```

- [ ] **Step 4: Keep the legal pages and thank-you page in the same shell style**

Update the shared header/footer structure in:
- `obrigado/index.html`
- `politica-de-privacidade/index.html`
- `termos-de-uso/index.html`

### Task 3: Rebuild the CSS for the cinematic dark aesthetic

**Files:**
- Modify: `assets/css/styles.css`

- [ ] **Step 1: Convert the page background to a dark blue/black canvas with blue glow accents**

```css
body {
  background:
    radial-gradient(circle at 15% 0%, rgba(0, 59, 115, 0.42), transparent 30%),
    radial-gradient(circle at 85% 8%, rgba(31, 105, 177, 0.22), transparent 28%),
    linear-gradient(180deg, #050b14 0%, #07111f 42%, #08111d 100%);
}
```

- [ ] **Step 2: Rebuild the hero, cards, and CTAs for a sales-page feel**

```css
.hero-split {
  display: grid;
  grid-template-columns: minmax(0, 1.05fr) minmax(320px, 0.95fr);
  gap: 28px;
}

.hero-copy-shell,
.hero-visual-shell {
  border-radius: 32px;
  background: var(--surface);
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: 0 30px 100px rgba(0, 0, 0, 0.4);
}
```

- [ ] **Step 3: Style the modal so the Atlas mark sits in the middle of the video**

```css
.method-modal__dialog {
  position: relative;
  overflow: hidden;
  background: #02050b;
}

.method-modal__dialog::after {
  content: "";
  position: absolute;
  inset: auto auto 50% 50%;
  width: 180px;
  height: 180px;
  transform: translate(-50%, 50%);
  border-radius: 50%;
  background: radial-gradient(circle, rgba(0, 59, 115, 0.85), rgba(0, 59, 115, 0) 68%);
}
```

- [ ] **Step 4: Add responsive handling for mobile hero, cards, and modal**

Run: `node --check assets/js/main.js`
Expected: exit code `0` after CSS/JS adjustments.

### Task 4: Implement the method modal behavior and tracking

**Files:**
- Modify: `assets/js/main.js`
- Modify: `assets/js/tracking.js`

- [ ] **Step 1: Wire open/close behavior for the method modal**

```js
const methodModal = document.querySelector("[data-method-modal]");
const methodOpeners = document.querySelectorAll("[data-method-modal-open]");
const methodClosers = document.querySelectorAll("[data-method-modal-close]");
```

- [ ] **Step 2: Load the configured video only when the modal opens**

```js
const video = methodModal?.querySelector("[data-method-video]");
if (video && config.methodVideoPath) {
  video.src = config.methodVideoPath;
  video.poster = config.methodVideoPosterPath || "";
}
```

- [ ] **Step 3: Track the modal open event as a method-intent signal**

```js
window.SPMTracker.track("ViewContent", {
  content_name: "Metodo ATLAS",
  content_category: "Modal de metodo",
});
```

- [ ] **Step 4: Verify the JS files still parse**

Run: `node --check assets/js/main.js && node --check assets/js/tracking.js`
Expected: exit code `0`.

### Task 5: Validate the rebuilt page end-to-end

**Files:**
- None

- [ ] **Step 1: Launch the local server and render desktop + mobile screenshots**

Run: open the local site in the browser and capture the top fold, hero, modal state, and form area.

- [ ] **Step 2: Confirm the modal opens and closes cleanly**

Expected: clicking `Saber mais sobre o método` opens the overlay and closes on backdrop, close button, and `Esc`.

- [ ] **Step 3: Confirm the lead form still submits and the thank-you page still loads**

Expected: preview submission still stores `spm_last_lead` and redirects to `/obrigado/`.

---

**Coverage check**
- Hero and above-the-fold conversion: Task 2, Task 3
- Dark sales-page visual system: Task 1, Task 3
- Method video modal: Task 2, Task 4
- Responsive and mobile polish: Task 3, Task 5
- Tracking and lead capture integrity: Task 4, Task 5
- Shared shell pages: Task 2
