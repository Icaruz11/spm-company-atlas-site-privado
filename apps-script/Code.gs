const SPREADSHEET_ID = '1DbtqiHqQM7370al6XUQezRKZVivoyt0f--CChHDw1aQ';
const SHEET_NAME = 'Leads';

const META_PIXEL_ID = '1899907434017840';
const META_API_VERSION = 'v20.0';

const FIELD_LIMITS = {
  nome: 100,
  email: 254,
  whatsapp: 20,
  empresa: 120,
  segmento: 64,
  cidade_estado: 120,
  faturamento: 64,
  desafio: 500,
  trafego_pago: 32,
  como_conheceu: 120,
  observacao: 1000,
  consentimento: 16,
  utm_source: 120,
  utm_medium: 120,
  utm_campaign: 200,
  utm_content: 200,
  utm_term: 200,
  fbclid: 512,
  gclid: 512,
  page_url: 2048,
  referrer: 2048,
  user_agent: 512,
  event_id: 128,
  fbp: 256,
  fbc: 512,
};

const ALLOWED_SEGMENTS = [
  'Medicina',
  'Odontologia',
  'Estética',
  'Nutrição',
  'Fisioterapia',
  'Psicologia',
  'Clínica multidisciplinar',
  'Outro segmento da saúde',
];

const ALLOWED_REVENUE = [
  'Até R$ 30 mil',
  'R$ 30 mil a R$ 40 mil',
  'R$ 40 mil a R$ 80 mil',
  'R$ 80 mil a R$ 150 mil',
  'R$ 150 mil a R$ 300 mil',
  'Mais de R$ 300 mil',
];

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

function jsonResponse_(payload) {
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}

function normalizeText_(value, maxLength) {
  return String(value || '')
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
    .trim()
    .slice(0, maxLength);
}

function validateLead_(raw) {
  const data = {};
  Object.keys(FIELD_LIMITS).forEach(function (field) {
    data[field] = normalizeText_(raw[field], FIELD_LIMITS[field]);
  });

  if (data.nome.length < 2) {
    throw new Error('INVALID_NAME');
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    throw new Error('INVALID_EMAIL');
  }

  const phoneDigits = data.whatsapp.replace(/\D/g, '');
  if (phoneDigits.length < 10 || phoneDigits.length > 15) {
    throw new Error('INVALID_PHONE');
  }
  if (data.segmento && ALLOWED_SEGMENTS.indexOf(data.segmento) === -1) {
    throw new Error('INVALID_SEGMENT');
  }
  if (data.faturamento && ALLOWED_REVENUE.indexOf(data.faturamento) === -1) {
    throw new Error('INVALID_REVENUE');
  }

  return data;
}

function sanitizeSheetCell_(value) {
  const text = String(value || '');
  return /^\s*[=+\-@]/.test(text) ? "'" + text : text;
}

function enforceRateLimit_(data) {
  const fingerprint = sha256_(data.email + '|' + normalizePhone_(data.whatsapp)).slice(0, 40);
  const key = 'lead-' + fingerprint;
  const cache = CacheService.getScriptCache();
  if (cache.get(key)) {
    throw new Error('RATE_LIMITED');
  }
  cache.put(key, '1', 60);
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  const hasLock = lock.tryLock(10000);

  try {
    const raw = e && e.parameter ? e.parameter : {};
    if (raw.website) {
      return jsonResponse_({ status: 'spam' });
    }
    if (!hasLock) {
      throw new Error('LOCK_TIMEOUT');
    }

    const data = validateLead_(raw);
    enforceRateLimit_(data);

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

    sheet.appendRow(row.map(function (value) {
      return value instanceof Date ? value : sanitizeSheetCell_(value);
    }));

    try {
      sendMetaCAPI_(data, eventId, now);
    } catch (capiError) {
      console.error('CAPI error:', capiError && capiError.message);
    }

    return jsonResponse_({ status: 'success', leadId, eventId });
  } catch (error) {
    console.error('Lead processing error:', error && error.message);
    return jsonResponse_({
      status: 'error',
      message: 'Não foi possível processar a solicitação.',
    });
  } finally {
    if (hasLock) {
      lock.releaseLock();
    }
  }
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
  const accessToken = PropertiesService.getScriptProperties().getProperty('META_ACCESS_TOKEN');
  if (!accessToken) {
    console.warn('META_ACCESS_TOKEN not set; skipping CAPI');
    return;
  }
  const testEventCode = PropertiesService.getScriptProperties().getProperty('META_TEST_EVENT_CODE') || '';

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
