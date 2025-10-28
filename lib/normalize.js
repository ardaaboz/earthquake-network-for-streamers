export function normalizeAlert(input) {
  const safe = (s) => (typeof s === 'string' ? s.trim() : '');
  const titleRaw = safe(input.title);
  const msgRaw = safe(input.message);
  const locRaw = safe(input.location);

  const haystack = `${titleRaw} ${msgRaw}`.toLowerCase();
  const has = (needle) => haystack.includes(needle);

  let severity = 'info';
  if (has('erken uyar') || has('erken uyari')) severity = 'early';
  else if (has('ön uyar') || has('on uyar')) severity = 'pre';

  const accent = severity === 'early' ? '#ff3b3b' : severity === 'pre' ? '#ffb02e' : '#2ea8ff';

  let displayTitle = titleRaw || (severity === 'early' ? 'Deprem Erken Uyarı' : severity === 'pre' ? 'Deprem Ön Uyarı' : 'Deprem Bilgilendirme');
  // Remove app name noise
  displayTitle = displayTitle.replace(/\bDeprem\s*A[gğ]ı\b/i, '').trim();
  if (!displayTitle) displayTitle = severity === 'early' ? 'Deprem Erken Uyarı' : severity === 'pre' ? 'Deprem Ön Uyarı' : 'Deprem Bilgilendirme';

  // Try to extract location if not given
  let location = locRaw;
  if (!location) {
    const cityRe = /(istanbul|ankara|izmir|bursa|antalya|adana|konya|gaziantep|kocaeli|eskişehir|eskisehir|diyarbakır|diyarbakir|mersin|kayseri|samsun|trabzon|malatya|erzurum|sakarya|tekirdağ|tekirdag|manisa|balıkesir|balikesir|şanlıurfa|sanliurfa|aydın|aydin|denizli|hatay|muğla|mugla|van|sivas|zonguldak|çanakkale|canakkale|kahramanmaraş|kahramanmaras|kütahya|kutahya|afyonkarahisar|yalova|kırklareli|kirklareli|edirne|uşak|usak|aksaray|karabük|karabuk|bolu|bilecik|isparta|osmaniye|çorum|corum|ordu|rize|giresun|tokat|amasya|yozgat|kırşehir|kirsehir|niğde|nigde|nevşehir|nevsehir|kırıkkale|kirikkale|kastamonu|sinop|bartın|bartin|artvin|ardahan|iğdır|igdir|kars|ağrı|agri|bitlis|muş|mus|bingöl|bingol|tunceli|elazığ|elazig|adıyaman|adiyaman|batman|şırnak|sirnak|hakkari|mardin|kilis|düzce|duzce)/i;
    const mCity = msgRaw.match(cityRe);
    if (mCity) location = capitalizeTurkish(mCity[0]);
  }

  // ETA seconds like "10 sn" or "10 saniye"
  let etaSeconds = null;
  const mEta = msgRaw.match(/(\d{1,2})\s*(sn|saniye)/i);
  if (mEta) etaSeconds = parseInt(mEta[1], 10);

  // Magnitude like 4.7 Mw/Ml/M
  let magnitude = null;
  const mMag = msgRaw.match(/(\d+(?:[\.,]\d+)?)\s*(mw|ml|m)\b/i);
  if (mMag) magnitude = parseFloat(mMag[1].replace(',', '.'));

  // Build concise meta line
  const parts = [];
  if (msgRaw) parts.push(msgRaw);
  if (location) parts.push(location);
  const displayMeta = parts.filter(Boolean).join(' • ');

  return {
    severity,
    accent,
    displayTitle,
    displayMeta,
    location,
    etaSeconds,
    magnitude,
  };
}

function capitalizeTurkish(s) {
  if (!s) return s;
  const lower = s.toLowerCase('tr-TR');
  return lower.replace(/(^|\s)([a-zçğıöşü])/g, (m, a, b) => a + turkishUpper(b));
}

function turkishUpper(ch) {
  const map = { 'i': 'İ', 'ş': 'Ş', 'ç': 'Ç', 'ğ': 'Ğ', 'ü': 'Ü', 'ö': 'Ö', 'ı': 'I' };
  return (map[ch] || ch.toUpperCase());
}

