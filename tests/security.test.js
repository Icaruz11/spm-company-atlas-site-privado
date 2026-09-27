const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const root = path.resolve(__dirname, "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");

test("production headers enforce a restrictive browser security policy", () => {
  const config = JSON.parse(read("vercel.json"));
  const headers = Object.fromEntries(
    config.headers[0].headers.map(({ key, value }) => [key.toLowerCase(), value]),
  );

  assert.equal(headers["x-content-type-options"], "nosniff");
  assert.equal(headers["x-frame-options"], "DENY");
  assert.equal(headers["cross-origin-opener-policy"], "same-origin-allow-popups");
  assert.equal(headers["cross-origin-resource-policy"], "same-site");
  assert.equal(headers["x-permitted-cross-domain-policies"], "none");
  assert.match(headers["permissions-policy"], /payment=\(\)/);
  assert.match(headers["content-security-policy"], /default-src 'none'/);
  assert.match(headers["content-security-policy"], /style-src 'self'/);
  assert.doesNotMatch(headers["content-security-policy"], /'unsafe-inline'|'unsafe-eval'/);
});

test("lead form constrains all user-controlled text fields", () => {
  const html = read("index.html");
  const expectedLimits = {
    nome: "100",
    whatsapp: "20",
    email: "254",
    empresa: "120",
    instagram: "64",
  };

  for (const [id, limit] of Object.entries(expectedLimits)) {
    const input = html.match(new RegExp(`<input[^>]+id="${id}"[^>]*>`))?.[0];
    assert.ok(input, `missing input #${id}`);
    assert.match(input, new RegExp(`maxlength="${limit}"`), `#${id} needs maxlength=${limit}`);
  }
});

test("browser code does not persist lead PII", () => {
  const formScript = read("assets/js/form.js");
  const configScript = read("assets/js/config.js");

  assert.doesNotMatch(formScript, /collectDraft|restoreDraft|persistDraft/);
  assert.doesNotMatch(formScript, /config\.leadKey|config\.formDraftKey/);
  assert.doesNotMatch(configScript, /leadKey|formDraftKey/);
});

test("Apps Script validates leads, neutralizes spreadsheet formulas, and hides internal errors", () => {
  const script = read("apps-script/Code.gs");

  assert.match(script, /function validateLead_\(/);
  assert.match(script, /function sanitizeSheetCell_\(/);
  assert.match(script, /PropertiesService\.getScriptProperties\(\)\.getProperty\('META_ACCESS_TOKEN'\)/);
  assert.doesNotMatch(script, /const META_ACCESS_TOKEN\s*=/);
  assert.doesNotMatch(script, /message:\s*error\.message/);
  assert.match(script, /Não foi possível processar a solicitação\./);
});

test("GitHub runs the security checks for pushes and pull requests", () => {
  const workflow = read(".github/workflows/security.yml");

  assert.match(workflow, /pull_request:/);
  assert.match(workflow, /push:/);
  assert.match(workflow, /npm test/);
});

test("every page requests the hardened stylesheet revision", () => {
  const pages = [
    "index.html",
    "404.html",
    "obrigado/index.html",
    "obrigado1/index.html",
    "politica-de-privacidade/index.html",
    "termos-de-uso/index.html",
  ];

  for (const page of pages) {
    assert.match(
      read(page),
      /\/assets\/css\/styles\.css\?v=atlas-security-1/,
      `${page} must bust the immutable CSS cache`,
    );
  }
});
