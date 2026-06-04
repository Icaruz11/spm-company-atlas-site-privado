const SPREADSHEET_ID = '1DbtqiHqQM7370al6XUQezRKZVivoyt0f--CChHDw1aQ';
const SHEET_NAME = 'Leads';

const HEADERS = [
  'ID',
  'Data de envio',
  'Nome',
  'Email',
  'WhatsApp',
  'Empresa',
  'Segmento',
  'Cidade e Estado',
  'Faturamento',
  'Principal desafio',
  'Já investe em tráfego pago?',
  'Como conheceu a SPM?',
  'Contexto adicional',
  'Consentimento LGPD',
  'UTM Source',
  'UTM Medium',
  'UTM Campaign',
  'UTM Content',
  'UTM Term',
  'FBCLID',
  'GCLID',
  'Página de origem',
  'Referrer',
  'User Agent',
  'Status comercial',
  'Responsável',
  'Observações',
  'Data do primeiro contato',
  'Data da reunião',
  'Resultado',
];

function ensureHeaders_(sheet) {
  if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
  }
}

function getSheet_() {
  const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sheet = spreadsheet.getSheetByName(SHEET_NAME);

  if (!sheet) {
    sheet = spreadsheet.insertSheet(SHEET_NAME);
  }

  ensureHeaders_(sheet);
  return sheet;
}

function doGet() {
  return ContentService
    .createTextOutput(JSON.stringify({ status: 'ok', message: 'SPM Apps Script running' }))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.tryLock(10000);

  try {
    const data = e && e.parameter ? e.parameter : {};
    if (data.website) {
      return ContentService
        .createTextOutput(JSON.stringify({ status: 'spam' }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    const sheet = getSheet_();

    const now = new Date();
    const leadId = Utilities.getUuid();

    const row = [
      leadId,
      now,
      data.nome || '',
      data.email || '',
      data.whatsapp || '',
      data.empresa || '',
      data.segmento || '',
      data.cidade_estado || '',
      data.faturamento || '',
      data.desafio || '',
      data.trafego_pago || '',
      data.como_conheceu || '',
      data.observacao || '',
      data.consentimento || '',
      data.utm_source || '',
      data.utm_medium || '',
      data.utm_campaign || '',
      data.utm_content || '',
      data.utm_term || '',
      data.fbclid || '',
      data.gclid || '',
      data.page_url || '',
      data.referrer || '',
      data.user_agent || '',
      'Novo',
      '',
      '',
      '',
      '',
      '',
    ];

    sheet.appendRow(row);

    return ContentService
      .createTextOutput(JSON.stringify({ status: 'success', leadId }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({ status: 'error', message: error.message }))
      .setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}
