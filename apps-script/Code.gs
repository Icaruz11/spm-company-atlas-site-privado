const SPREADSHEET_ID = '1DbtqiHqQM7370al6XUQezRKZVivoyt0f--CChHDw1aQ';
const SHEET_NAME = 'Leads';

const META_PIXEL_ID = '1899907434017840';
const META_API_VERSION = 'v20.0';

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
  'Event ID (CAPI)',
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
    const eventId = data.event_id || leadId;

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
      eventId,
      'Novo',
      '',
      '',
      '',
      '',
      '',
    ];

    sheet.appendRow(row);

    try {
      sendMetaCAPI_(data, eventId, now);
    } catch (capiError) {
      console.error('CAPI error:', capiError && capiError.message);
    }

    return ContentService
      .createTextOutput(JSON.stringify({ status: 'success', leadId, eventId }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({ status: 'error', message: error.message }))
      .setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}

function setMetaCredentials(accessToken, testEventCode) {
  const props = PropertiesService.getScriptProperties();
  if (accessToken) props.setProperty('META_ACCESS_TOKEN', accessToken);
  if (testEventCode) props.setProperty('META_TEST_EVENT_CODE', testEventCode);
  return 'OK';
}

function clearMetaTestEventCode() {
  PropertiesService.getScriptProperties().deleteProperty('META_TEST_EVENT_CODE');
  return 'OK';
}

function sha256_(value) {
  if (!value) return '';
  const normalized = String(value).trim().toLowerCase();
  const bytes = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, normalized, Utilities.Charset.UTF_8);
  return bytes.map(function (b) {
    const v = (b < 0 ? b + 256 : b).toString(16);
    return v.length === 1 ? '0' + v : v;
  }).join('');
}

function normalizePhone_(raw) {
  if (!raw) return '';
  let digits = String(raw).replace(/\D/g, '');
  if (!digits) return '';
  if (digits.length <= 11 && digits[0] !== '5') {
    digits = '55' + digits;
  }
  return digits;
}

function splitCityState_(raw) {
  if (!raw) return { city: '', state: '' };
  const parts = String(raw).split(/[-\/,]/).map(function (s) { return s.trim(); });
  return { city: parts[0] || '', state: parts[1] || '' };
}

function sendMetaCAPI_(data, eventId, when) {
  const props = PropertiesService.getScriptProperties();
  const accessToken = props.getProperty('META_ACCESS_TOKEN');
  if (!accessToken) {
    console.warn('META_ACCESS_TOKEN not set; skipping CAPI');
    return;
  }
  const testEventCode = props.getProperty('META_TEST_EVENT_CODE') || '';

  const nameParts = String(data.nome || '').trim().split(/\s+/);
  const firstName = nameParts.shift() || '';
  const lastName = nameParts.join(' ');
  const cityState = splitCityState_(data.cidade_estado);

  const userData = {
    em: [sha256_(data.email)],
    ph: [sha256_(normalizePhone_(data.whatsapp))],
    fn: [sha256_(firstName)],
    ln: [sha256_(lastName)],
    ct: [sha256_(cityState.city)],
    st: [sha256_(cityState.state)],
    country: [sha256_('br')],
    external_id: [sha256_(eventId)],
    client_user_agent: data.user_agent || '',
    fbp: data.fbp || '',
    fbc: data.fbc || '',
  };

  Object.keys(userData).forEach(function (key) {
    const val = userData[key];
    if (Array.isArray(val) && (!val[0] || val[0] === '')) {
      delete userData[key];
    } else if (!Array.isArray(val) && !val) {
      delete userData[key];
    }
  });

  const customData = {
    content_name: 'Formulario Protocolo ATLAS',
    content_category: 'Diagnostico Comercial',
    currency: 'BRL',
    value: 100,
    utm_source: data.utm_source || '',
    utm_medium: data.utm_medium || '',
    utm_campaign: data.utm_campaign || '',
    utm_content: data.utm_content || '',
    utm_term: data.utm_term || '',
    faturamento: data.faturamento || '',
    segmento: data.segmento || '',
  };

  const eventTime = Math.floor((when instanceof Date ? when.getTime() : Date.now()) / 1000);

  const payload = {
    data: [{
      event_name: 'Lead',
      event_time: eventTime,
      event_id: eventId,
      event_source_url: data.page_url || '',
      action_source: 'website',
      user_data: userData,
      custom_data: customData,
    }],
  };

  if (testEventCode) {
    payload.test_event_code = testEventCode;
  }

  const url = 'https://graph.facebook.com/' + META_API_VERSION + '/' + META_PIXEL_ID + '/events?access_token=' + encodeURIComponent(accessToken);

  const response = UrlFetchApp.fetch(url, {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify(payload),
    muteHttpExceptions: true,
  });

  const code = response.getResponseCode();
  if (code < 200 || code >= 300) {
    console.error('Meta CAPI HTTP ' + code + ': ' + response.getContentText());
  } else {
    console.log('Meta CAPI ok: ' + response.getContentText());
  }
}
