import { SppdData, SptData, PejabatStaff } from '../types';
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
        {
          properties: {
            title: 'PEJABAT_STAFF',
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

  const pejabatHeaders = [
    'ID',
    'Nama',
    'NIP',
    'Pangkat/Gol',
    'Jabatan',
    'Email',
    'PIN Signature',
    'Status',
    'Tanggal Terdaftar',
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
          {
            range: 'PEJABAT_STAFF!A1:I1',
            values: [pejabatHeaders],
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

/**
 * Appends a Pejabat/Staff record to the PEJABAT_STAFF sheet.
 */
export async function savePejabatToSheet(
  accessToken: string,
  spreadsheetId: string,
  data: PejabatStaff
): Promise<void> {
  const row = [
    data.id,
    data.nama,
    data.nip,
    data.pangkatGol,
    data.jabatan,
    data.email,
    data.pin,
    data.status,
    data.createdAt,
  ];

  // Try to append. If sheet PEJABAT_STAFF doesn't exist, we can create it first or catch the error.
  const response = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/PEJABAT_STAFF!A:A:append?valueInputOption=USER_ENTERED`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        range: 'PEJABAT_STAFF!A:A',
        majorDimension: 'ROWS',
        values: [row],
      }),
    }
  );

  if (!response.ok) {
    const errText = await response.text();
    // If the sheet doesn't exist, try creating it and try again
    if (errText.includes('Unable to parse range') || errText.includes('not found') || errText.includes('Range')) {
      await createPejabatSheet(accessToken, spreadsheetId);
      // retry once
      const retryResponse = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/PEJABAT_STAFF!A:A:append?valueInputOption=USER_ENTERED`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            range: 'PEJABAT_STAFF!A:A',
            majorDimension: 'ROWS',
            values: [row],
          }),
        }
      );
      if (!retryResponse.ok) {
        throw new Error(`Failed to append Pejabat record after creating sheet: ${await retryResponse.text()}`);
      }
    } else {
      throw new Error(`Failed to append Pejabat record: ${errText}`);
    }
  }
}

/**
 * Creates the PEJABAT_STAFF sheet and adds its headers.
 */
export async function createPejabatSheet(accessToken: string, spreadsheetId: string): Promise<void> {
  // First, add the sheet to the spreadsheet
  const addSheetResponse = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        requests: [
          {
            addSheet: {
              properties: {
                title: 'PEJABAT_STAFF',
              },
            },
          },
        ],
      }),
    }
  );

  if (!addSheetResponse.ok) {
    // It might already exist, so ignore failure or log it
    console.warn('Could not add PEJABAT_STAFF sheet, it might already exist.');
  }

  // Initialize headers
  const headers = [
    'ID',
    'Nama',
    'NIP',
    'Pangkat/Gol',
    'Jabatan',
    'Email',
    'PIN Signature',
    'Status',
    'Tanggal Terdaftar',
  ];

  await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/PEJABAT_STAFF!A1:I1?valueInputOption=RAW`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        range: 'PEJABAT_STAFF!A1:I1',
        values: [headers],
      }),
    }
  );
}

/**
 * Fetches existing Pejabat/Staff rows from Google Sheets to sync with local state.
 */
export async function loadPejabatRecords(accessToken: string, spreadsheetId: string): Promise<PejabatStaff[]> {
  const response = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/PEJABAT_STAFF!A2:I1000`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );

  if (!response.ok) {
    const text = await response.text();
    if (text.includes('Range not found') || text.includes('Unable to parse range') || text.includes('not found')) {
      return [];
    }
    throw new Error(`Failed to fetch Pejabat rows: ${text}`);
  }

  const data = await response.json();
  const rows = data.values || [];

  return rows.map((row: any) => {
    return {
      id: row[0] || '',
      nama: row[1] || '',
      nip: row[2] || '',
      pangkatGol: row[3] || '',
      jabatan: row[4] || '',
      email: row[5] || '',
      pin: row[6] || '',
      status: (row[7] as 'Aktif' | 'Nonaktif') || 'Aktif',
      createdAt: row[8] || '',
    } as PejabatStaff;
  });
}

/**
 * Overwrites the SPPD sheet with the current complete list to ensure sync on updates and deletions.
 */
export async function syncSppdListToSheet(
  accessToken: string,
  spreadsheetId: string,
  list: SppdData[]
): Promise<void> {
  const clearResponse = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/SPPD!A2:AA10000:clear`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!clearResponse.ok) {
    const errText = await clearResponse.text();
    throw new Error(`Failed to clear SPPD rows: ${errText}`);
  }

  if (list.length === 0) return;

  const rows = list.map((data) => {
    const hash = calculateDocumentHash(data);
    return [
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
  });

  const response = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/SPPD!A2?valueInputOption=USER_ENTERED`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        range: 'SPPD!A2',
        majorDimension: 'ROWS',
        values: rows,
      }),
    }
  );

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Failed to write SPPD rows: ${errText}`);
  }
}

/**
 * Overwrites the SPT sheet with the current complete list to ensure sync on updates and deletions.
 */
export async function syncSptListToSheet(
  accessToken: string,
  spreadsheetId: string,
  list: SptData[]
): Promise<void> {
  const clearResponse = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/SPT!A2:R10000:clear`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!clearResponse.ok) {
    const errText = await clearResponse.text();
    throw new Error(`Failed to clear SPT rows: ${errText}`);
  }

  if (list.length === 0) return;

  const rows = list.map((data) => {
    const hash = calculateDocumentHash(data);
    const pegawaisFormatted = data.tugaskanKepada
      .map((p, idx) => `${idx + 1}. ${p.nama} (NIP: ${p.nip}, Gol: ${p.pangkatGol}, Jabatan: ${p.jabatan})`)
      .join('\n');

    return [
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
  });

  const response = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/SPT!A2?valueInputOption=USER_ENTERED`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        range: 'SPT!A2',
        majorDimension: 'ROWS',
        values: rows,
      }),
    }
  );

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Failed to write SPT rows: ${errText}`);
  }
}

/**
 * Overwrites the PEJABAT_STAFF sheet with the current complete list to ensure sync on updates and deletions.
 */
export async function syncPejabatListToSheet(
  accessToken: string,
  spreadsheetId: string,
  list: PejabatStaff[]
): Promise<void> {
  const clearResponse = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/PEJABAT_STAFF!A2:I10000:clear`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!clearResponse.ok) {
    const errText = await clearResponse.text();
    if (errText.includes('Unable to parse range') || errText.includes('not found') || errText.includes('Range')) {
      await createPejabatSheet(accessToken, spreadsheetId);
    } else {
      throw new Error(`Failed to clear PEJABAT_STAFF rows: ${errText}`);
    }
  }

  if (list.length === 0) return;

  const rows = list.map((data) => [
    data.id,
    data.nama,
    data.nip,
    data.pangkatGol,
    data.jabatan,
    data.email,
    data.pin,
    data.status,
    data.createdAt,
  ]);

  const response = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/PEJABAT_STAFF!A2?valueInputOption=USER_ENTERED`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        range: 'PEJABAT_STAFF!A2',
        majorDimension: 'ROWS',
        values: rows,
      }),
    }
  );

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Failed to write PEJABAT_STAFF rows: ${errText}`);
  }
}
