import { SppdData, SptData } from '../types';
import { calculateDocumentHash } from './crypto';

const SPREADSHEET_TITLE = 'Aplikasi SPPD & SPT Nagekeo (Dinas PUPR)';

export interface SheetSetupResult {
  spreadsheetId: string;
  spreadsheetUrl: string;
}

/**
 * Creates a new Google Spreadsheet with SPPD and SPT sheets.
 */
export async function createAndSetupSpreadsheet(accessToken: string): Promise<SheetSetupResult> {
  const response = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      properties: {
        title: SPREADSHEET_TITLE,
      },
      sheets: [
        {
          properties: {
            title: 'SPPD',
          },
        },
        {
          properties: {
            title: 'SPT',
          },
        },
      ],
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Failed to create spreadsheet: ${errText}`);
  }

  const spreadsheet = await response.json();
  const spreadsheetId = spreadsheet.spreadsheetId;
  const spreadsheetUrl = spreadsheet.spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;

  // Initialize columns
  await initializeSheetHeaders(accessToken, spreadsheetId);

  return { spreadsheetId, spreadsheetUrl };
}

/**
 * Adds headers to the SPPD and SPT sheets in the spreadsheet.
 */
async function initializeSheetHeaders(accessToken: string, spreadsheetId: string): Promise<void> {
  const sppdHeaders = [
    'ID',
    'Nomor Surat',
    'Tanggal Dibuat',
    'Pengguna Anggaran',
    'Nama Pegawai',
    'NIP',
    'Pangkat/Gol',
    'Jabatan',
    'Tingkat Perjalanan',
    'Maksud Perjalanan Dinas',
    'Alat Angkutan',
    'Tempat Berangkat',
    'Tempat Tujuan',
    'Lamanya Perjalanan',
    'Tanggal Berangkat',
    'Tanggal Kembali',
    'Pembebanan Instansi',
    'Pembebanan Akun',
    'Pembebanan Sumber Dana',
    'Keterangan Lain-lain',
    'Dikeluarkan Di',
    'Tanggal Dikeluarkan',
    'Penandatangan Nama',
    'Penandatangan Pangkat',
    'Penandatangan NIP',
    'Encrypted Signature',
    'Tamper Hash',
  ];

  const sptHeaders = [
    'ID',
    'Nomor Surat',
    'Tanggal Dibuat',
    'Dasar Hukum',
    'Daftar Pegawai (Nama / NIP / Gol / Jabatan)',
    'Keperluan',
    'Tempat Tujuan',
    'Tanggal Berangkat',
    'Tanggal Kembali',
    'Alat Angkut',
    'Pembebanan Anggaran',
    'Ditetapkan Di',
    'Tanggal Ditetapkan',
    'Penandatangan Nama',
    'Penandatangan Pangkat',
    'Penandatangan NIP',
    'Encrypted Signature',
    'Tamper Hash',
  ];

  const response = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchUpdate`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        valueInputOption: 'RAW',
        data: [
          {
            range: 'SPPD!A1:AA1',
            values: [sppdHeaders],
          },
          {
            range: 'SPT!A1:R1',
            values: [sptHeaders],
          },
        ],
      }),
    }
  );

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Failed to initialize headers: ${errText}`);
  }
}

/**
 * Appends an SPPD record to the SPPD sheet.
 */
export async function saveSppdToSheet(
  accessToken: string,
  spreadsheetId: string,
  data: SppdData
): Promise<void> {
  const hash = calculateDocumentHash(data);
  const row = [
    data.id,
    data.nomor,
    data.createdAt,
    data.penggunaAnggaran,
    data.namaPegawai,
    data.nip,
    data.pangkatGol,
    data.jabatan,
    data.tingkatPerjalanan,
    data.maksudPerjalanan,
    data.alatAngkutan,
    data.tempatBerangkat,
    data.tempatTujuan,
    data.lamanyaPerjalanan,
    data.tanggalBerangkat,
    data.tanggalKembali,
    data.pembebananAnggaran.instansi,
    data.pembebananAnggaran.akun,
    data.pembebananAnggaran.sumberDana,
    data.keteranganLain,
    data.dikeluarkanDi,
    data.tanggalDikeluarkan,
    data.penandatanganNama,
    data.penandatanganPangkat,
    data.penandatanganNip,
    data.encryptedSignature,
    hash,
  ];

  const response = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/SPPD!A:A:append?valueInputOption=USER_ENTERED`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        range: 'SPPD!A:A',
        majorDimension: 'ROWS',
        values: [row],
      }),
    }
  );

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Failed to append SPPD record: ${errText}`);
  }
}

/**
 * Appends an SPT record to the SPT sheet.
 */
export async function saveSptToSheet(
  accessToken: string,
  spreadsheetId: string,
  data: SptData
): Promise<void> {
  const hash = calculateDocumentHash(data);
  
  // Format the list of assigned employees into a clean string for the sheet
  const pegawaisFormatted = data.tugaskanKepada
    .map((p, idx) => `${idx + 1}. ${p.nama} (NIP: ${p.nip}, Gol: ${p.pangkatGol}, Jabatan: ${p.jabatan})`)
    .join('\n');

  const row = [
    data.id,
    data.nomor,
    data.createdAt,
    data.dasar,
    pegawaisFormatted,
    data.keperluan,
    data.tempatTujuan,
    data.tanggalBerangkat,
    data.tanggalKembali,
    data.alatAngkut,
    data.pembebananAnggaran,
    data.ditetapkanDi,
    data.tanggalDitetapkan,
    data.penandatanganNama,
    data.penandatanganPangkat,
    data.penandatanganNip,
    data.encryptedSignature,
    hash,
  ];

  const response = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/SPT!A:A:append?valueInputOption=USER_ENTERED`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        range: 'SPT!A:A',
        majorDimension: 'ROWS',
        values: [row],
      }),
    }
  );

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Failed to append SPT record: ${errText}`);
  }
}

/**
 * Fetches all files from the user's Google Drive to search for an existing spreadsheet.
 */
export async function findSpreadsheet(accessToken: string): Promise<string | null> {
  const query = encodeURIComponent(`name = '${SPREADSHEET_TITLE}' and mimeType = 'application/vnd.google-apps.spreadsheet' and trashed = false`);
  const response = await fetch(`https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name)`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    console.error('Failed to search Drive:', await response.text());
    return null;
  }

  const data = await response.json();
  if (data.files && data.files.length > 0) {
    return data.files[0].id;
  }
  return null;
}

/**
 * Fetches existing SPPD rows from Google Sheets to sync with local state.
 */
export async function loadSppdRecords(accessToken: string, spreadsheetId: string): Promise<SppdData[]> {
  const response = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/SPPD!A2:AA1000`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );

  if (!response.ok) {
    const text = await response.text();
    if (text.includes('Range not found')) return [];
    throw new Error(`Failed to fetch SPPD rows: ${text}`);
  }

  const data = await response.json();
  const rows = data.values || [];

  return rows.map((row: any) => {
    // Reconstruct SppdData from row arrays
    return {
      id: row[0] || '',
      nomor: row[1] || '',
      createdAt: row[2] || '',
      penggunaAnggaran: row[3] || '',
      namaPegawai: row[4] || '',
      nip: row[5] || '',
      pangkatGol: row[6] || '',
      jabatan: row[7] || '',
      tingkatPerjalanan: row[8] || '',
      maksudPerjalanan: row[9] || '',
      alatAngkutan: row[10] || '',
      tempatBerangkat: row[11] || '',
      tempatTujuan: row[12] || '',
      lamanyaPerjalanan: row[13] || '',
      tanggalBerangkat: row[14] || '',
      tanggalKembali: row[15] || '',
      pembebananAnggaran: {
        instansi: row[16] || '',
        akun: row[17] || '',
        sumberDana: row[18] || '',
      },
      keteranganLain: row[19] || '',
      dikeluarkanDi: row[20] || '',
      tanggalDikeluarkan: row[21] || '',
      penandatanganNama: row[22] || '',
      penandatanganPangkat: row[23] || '',
      penandatanganNip: row[24] || '',
      encryptedSignature: row[25] || '',
      syncStatus: 'synced',
    } as SppdData;
  });
}

/**
 * Fetches existing SPT rows from Google Sheets to sync with local state.
 */
export async function loadSptRecords(accessToken: string, spreadsheetId: string): Promise<SptData[]> {
  const response = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/SPT!A2:R1000`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );

  if (!response.ok) {
    const text = await response.text();
    if (text.includes('Range not found')) return [];
    throw new Error(`Failed to fetch SPT rows: ${text}`);
  }

  const data = await response.json();
  const rows = data.values || [];

  return rows.map((row: any) => {
    // Parse pegawais list from row[4]
    const pegawaisRaw = row[4] || '';
    const tugaskanKepada: any[] = [];
    
    if (pegawaisRaw) {
      // Split by newline and extract info
      const lines = pegawaisRaw.split('\n');
      lines.forEach((line: string) => {
        // e.g., "1. Syarifudin Ibrahim, ST (NIP: 19681102 199703 1 008, Gol: Pembina Utama Muda - IV/c, Jabatan: Kepala Dinas...)"
        const match = line.match(/^\d+\.\s+(.*?)\s+\(NIP:\s*(.*?),\s*Gol:\s*(.*?),\s*Jabatan:\s*(.*?)\)$/);
        if (match) {
          tugaskanKepada.push({
            nama: match[1],
            nip: match[2],
            pangkatGol: match[3],
            jabatan: match[4],
          });
        } else {
          // Fallback if formatting differed
          tugaskanKepada.push({
            nama: line,
            nip: '',
            pangkatGol: '',
            jabatan: '',
          });
        }
      });
    }

    return {
      id: row[0] || '',
      nomor: row[1] || '',
      createdAt: row[2] || '',
      dasar: row[3] || '',
      tugaskanKepada: tugaskanKepada.length > 0 ? tugaskanKepada : [{ nama: pegawaisRaw, nip: '', pangkatGol: '', jabatan: '' }],
      keperluan: row[5] || '',
      tempatTujuan: row[6] || '',
      tanggalBerangkat: row[7] || '',
      tanggalKembali: row[8] || '',
      alatAngkut: row[9] || '',
      pembebananAnggaran: row[10] || '',
      ditetapkanDi: row[11] || '',
      tanggalDitetapkan: row[12] || '',
      penandatanganNama: row[13] || '',
      penandatanganPangkat: row[14] || '',
      penandatanganNip: row[15] || '',
      encryptedSignature: row[16] || '',
      syncStatus: 'synced',
    } as SptData;
  });
}
