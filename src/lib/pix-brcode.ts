/**
 * Gerador de Payload Pix no padrão BRCode (EMV-Co) do Banco Central do Brasil.
 * Permite que restaurantes e comércios criem QR Code Pix estático oficial
 * sem pagar nenhuma taxa de intermediação bancária.
 */

function crc16(str: string): string {
  let crc = 0xffff;
  const polynomial = 0x1021;

  for (let i = 0; i < str.length; i++) {
    crc ^= str.charCodeAt(i) << 8;
    for (let bit = 0; bit < 8; bit++) {
      if ((crc & 0x8000) !== 0) {
        crc = ((crc << 1) ^ polynomial) & 0xffff;
      } else {
        crc = (crc << 1) & 0xffff;
      }
    }
  }

  return (crc & 0xffff).toString(16).toUpperCase().padStart(4, '0');
}

function formatField(id: string, value: string): string {
  const len = value.length.toString().padStart(2, '0');
  return `${id}${len}${value}`;
}

function sanitizeText(str: string, maxLength: number): string {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove acentos
    .replace(/[^a-zA-Z0-9\s]/g, '') // remove caracteres especiais
    .trim()
    .slice(0, maxLength);
}

export interface GeneratePixPayloadParams {
  key: string;
  name: string;
  city: string;
  amount?: number | string;
  txId?: string;
}

export function generatePixPayload({
  key,
  name,
  city,
  amount,
  txId = '***',
}: GeneratePixPayloadParams): string {
  const cleanKey = key.trim();
  const cleanName = sanitizeText(name || 'Recebedor', 25) || 'RECEBEDOR';
  const cleanCity = sanitizeText(city || 'BRASIL', 15) || 'BRASIL';
  const cleanTxId = (txId || '***').slice(0, 25);

  // Merchant Account Information (ID 26)
  const gui = formatField('00', 'BR.GOV.BCB.PIX');
  const merchantKey = formatField('01', cleanKey);
  const merchantInfo = formatField('26', `${gui}${merchantKey}`);

  // Base payload
  let payload = '';
  payload += formatField('00', '01'); // Payload Format Indicator
  payload += merchantInfo;
  payload += formatField('52', '0000'); // Merchant Category Code
  payload += formatField('53', '986'); // Currency (BRL)

  // Amount (optional)
  if (amount && Number(amount) > 0) {
    const formattedAmount = Number(amount).toFixed(2);
    payload += formatField('54', formattedAmount);
  }

  payload += formatField('58', 'BR'); // Country Code
  payload += formatField('59', cleanName); // Merchant Name
  payload += formatField('60', cleanCity); // Merchant City

  // Additional Data (txId)
  const refLabel = formatField('05', cleanTxId);
  payload += formatField('62', refLabel);

  // CRC16 Placeholder
  payload += '6304';
  const crc = crc16(payload);

  return `${payload}${crc}`;
}

