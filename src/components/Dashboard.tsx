import React, { useState, useEffect } from 'react';
import { SppdData, SptData, SyncLog, DaftarBayarData } from '../types';
import {
  findSpreadsheet,
  createAndSetupSpreadsheet,
  saveSppdToSheet,
  saveSptToSheet,
  loadSppdRecords,
  loadSptRecords,
} from '../lib/sheets';
import SppdForm from './SppdForm';
import SptForm from './SptForm';
import SppdDocument from './SppdDocument';
import SptDocument from './SptDocument';
import DaftarBayarForm from './DaftarBayarForm';
import DaftarBayarDocument from './DaftarBayarDocument';
import InformasiStandar from './InformasiStandar';
import NagekeoLogo from './NagekeoLogo';

interface DashboardProps {
  user: any;
  accessToken: string | null;
  onLogin: () => void;
  onLogout: () => void;
}

export default function Dashboard({ user, accessToken, onLogin, onLogout }: DashboardProps) {
  // Navigation / Tabs
  const [activeTab, setActiveTab] = useState<'sppd' | 'spt' | 'pembayaran' | 'standar' | 'logs'>('sppd');

  // Document states (backed up in localStorage)
  const [sppdList, setSppdList] = useState<SppdData[]>([]);
  const [sptList, setSptList] = useState<SptData[]>([]);
  const [daftarBayarList, setDaftarBayarList] = useState<DaftarBayarData[]>([]);
  const [syncLogs, setSyncLogs] = useState<SyncLog[]>([]);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');

  // Active form / preview states
  const [editingSppd, setEditingSppd] = useState<SppdData | null>(null);
  const [editingSpt, setEditingSpt] = useState<SptData | null>(null);
  const [editingDaftarBayar, setEditingDaftarBayar] = useState<DaftarBayarData | null>(null);
  const [previewingSppd, setPreviewingSppd] = useState<SppdData | null>(null);
  const [previewingSpt, setPreviewingSpt] = useState<SptData | null>(null);
  const [previewingDaftarBayar, setPreviewingDaftarBayar] = useState<DaftarBayarData | null>(null);
  const [isCreatingSppd, setIsCreatingSppd] = useState(false);
  const [isCreatingSpt, setIsCreatingSpt] = useState(false);
  const [isCreatingDaftarBayar, setIsCreatingDaftarBayar] = useState(false);

  // Google Sheets state
  const [spreadsheetId, setSpreadsheetId] = useState<string | null>(null);
  const [spreadsheetUrl, setSpreadsheetUrl] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [sheetsError, setSheetsError] = useState<string | null>(null);

  // Prerequisite warning modal state
  const [showPrerequisiteModal, setShowPrerequisiteModal] = useState(false);

  // Load local state from localStorage on mount
  useEffect(() => {
    const savedSppd = localStorage.getItem('sppd_records');
    const savedSpt = localStorage.getItem('spt_records');
    const savedDaftarBayar = localStorage.getItem('daftar_bayar_records');
    const savedLogs = localStorage.getItem('sppd_sync_logs');
    const savedSheetId = localStorage.getItem('sppd_spreadsheet_id');
    const savedSheetUrl = localStorage.getItem('sppd_spreadsheet_url');

    if (savedSppd) setSppdList(JSON.parse(savedSppd));
    if (savedSpt) setSptList(JSON.parse(savedSpt));
    if (savedDaftarBayar) setDaftarBayarList(JSON.parse(savedDaftarBayar));
    if (savedLogs) setSyncLogs(JSON.parse(savedLogs));
    if (savedSheetId) setSpreadsheetId(savedSheetId);
    if (savedSheetUrl) setSpreadsheetUrl(savedSheetUrl);
  }, []);

  // Save documents to localStorage when modified
  const saveSppdListToStorage = (list: SppdData[]) => {
    setSppdList(list);
    localStorage.setItem('sppd_records', JSON.stringify(list));
  };

  const saveSptListToStorage = (list: SptData[]) => {
    setSptList(list);
    localStorage.setItem('spt_records', JSON.stringify(list));
  };

  const saveDaftarBayarListToStorage = (list: DaftarBayarData[]) => {
    setDaftarBayarList(list);
    localStorage.setItem('daftar_bayar_records', JSON.stringify(list));
  };

  const addSyncLog = (type: 'sppd' | 'spt' | 'pembayaran', docId: string, nomor: string, status: 'success' | 'failed', message: string) => {
    const newLog: SyncLog = {
      id: `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      type,
      docId,
      nomor,
      timestamp: new Date().toLocaleString('id-ID'),
      status,
      message,
    };
    const updated = [newLog, ...syncLogs].slice(0, 50); // Keep last 50 logs
    setSyncLogs(updated);
    localStorage.setItem('sppd_sync_logs', JSON.stringify(updated));
  };

  // Google Sheet auto setup on login / token retrieval
  useEffect(() => {
    if (accessToken) {
      autoSetupGoogleSheets();
    }
  }, [accessToken]);

  const autoSetupGoogleSheets = async () => {
    if (!accessToken) return;
    setIsSyncing(true);
    setSheetsError(null);

    try {
      // 1. Try to find if spreadsheet already exists on user's Drive
      let sheetId = spreadsheetId || localStorage.getItem('sppd_spreadsheet_id');
      let sheetUrl = spreadsheetUrl || localStorage.getItem('sppd_spreadsheet_url');

      if (!sheetId) {
        // Search Drive
        sheetId = await findSpreadsheet(accessToken);
      }

      if (sheetId) {
        // Found! Update URL and save
        sheetUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/edit`;
        setSpreadsheetId(sheetId);
        setSpreadsheetUrl(sheetUrl);
        localStorage.setItem('sppd_spreadsheet_id', sheetId);
        localStorage.setItem('sppd_spreadsheet_url', sheetUrl);

        // Load existing rows from sheets to populate/merge local lists!
        try {
          const sheetSppd = await loadSppdRecords(accessToken, sheetId);
          const sheetSpt = await loadSptRecords(accessToken, sheetId);
          
          if (sheetSppd.length > 0) {
            // Merge with local records, prioritizing local ones if they aren't synced yet
            setSppdList((prev) => {
              const merged = [...prev];
              sheetSppd.forEach((item) => {
                if (!merged.some((p) => p.id === item.id)) {
                  merged.push(item);
                }
              });
              localStorage.setItem('sppd_records', JSON.stringify(merged));
              return merged;
            });
          }

          if (sheetSpt.length > 0) {
            setSptList((prev) => {
              const merged = [...prev];
              sheetSpt.forEach((item) => {
                if (!merged.some((p) => p.id === item.id)) {
                  merged.push(item);
                }
              });
              localStorage.setItem('spt_records', JSON.stringify(merged));
              return merged;
            });
          }
        } catch (loadErr) {
          console.warn('Failed to load past rows from sheet:', loadErr);
        }
      } else {
        // 2. Not found, create new Spreadsheet
        const result = await createAndSetupSpreadsheet(accessToken);
        setSpreadsheetId(result.spreadsheetId);
        setSpreadsheetUrl(result.spreadsheetUrl);
        localStorage.setItem('sppd_spreadsheet_id', result.spreadsheetId);
        localStorage.setItem('sppd_spreadsheet_url', result.spreadsheetUrl);
        addSyncLog('sppd', 'setup', 'INFO', 'success', 'Berhasil membuat Spreadsheet baru di Google Drive.');
      }
    } catch (err: any) {
      console.error(err);
      setSheetsError('Gagal menghubungkan ke Google Sheets. Pastikan Anda memberikan izin akses Spreadsheet.');
    } finally {
      setIsSyncing(false);
    }
  };

  // Create or Update SPPD Record
  const handleSaveSppd = async (data: SppdData) => {
    let updatedList;
    const isEdit = sppdList.some((p) => p.id === data.id);

    if (isEdit) {
      updatedList = sppdList.map((p) => (p.id === data.id ? data : p));
    } else {
      updatedList = [data, ...sppdList];
    }

    saveSppdListToStorage(updatedList);
    setIsCreatingSppd(false);
    setEditingSppd(null);

    // Trigger automatic sync with Google Sheet
    if (accessToken && spreadsheetId) {
      try {
        await saveSppdToSheet(accessToken, spreadsheetId, data);
        // Mark as synced
        const syncedList = updatedList.map((p) => (p.id === data.id ? { ...p, syncStatus: 'synced' as const } : p));
        saveSppdListToStorage(syncedList);
        addSyncLog('sppd', data.id, data.nomor, 'success', 'Data SPD berhasil disinkronkan ke Google Sheet.');
      } catch (err: any) {
        console.error(err);
        const failedList = updatedList.map((p) => (p.id === data.id ? { ...p, syncStatus: 'failed' as const } : p));
        saveSppdListToStorage(failedList);
        addSyncLog('sppd', data.id, data.nomor, 'failed', `Gagal Sinkronisasi: ${err.message || err}`);
      }
    } else {
      addSyncLog('sppd', data.id, data.nomor, 'failed', 'Gagal Sinkronisasi: Google Sheets belum terhubung.');
    }
  };

  // Create or Update SPT Record
  const handleSaveSpt = async (data: SptData) => {
    let updatedList;
    const isEdit = sptList.some((p) => p.id === data.id);

    if (isEdit) {
      updatedList = sptList.map((p) => (p.id === data.id ? data : p));
    } else {
      updatedList = [data, ...sptList];
    }

    saveSptListToStorage(updatedList);
    setIsCreatingSpt(false);
    setEditingSpt(null);

    // Trigger automatic sync with Google Sheet
    if (accessToken && spreadsheetId) {
      try {
        await saveSptToSheet(accessToken, spreadsheetId, data);
        // Mark as synced
        const syncedList = updatedList.map((p) => (p.id === data.id ? { ...p, syncStatus: 'synced' as const } : p));
        saveSptListToStorage(syncedList);
        addSyncLog('spt', data.id, data.nomor, 'success', 'Data SPT berhasil disinkronkan ke Google Sheet.');
      } catch (err: any) {
        console.error(err);
        const failedList = updatedList.map((p) => (p.id === data.id ? { ...p, syncStatus: 'failed' as const } : p));
        saveSptListToStorage(failedList);
        addSyncLog('spt', data.id, data.nomor, 'failed', `Gagal Sinkronisasi: ${err.message || err}`);
      }
    } else {
      addSyncLog('spt', data.id, data.nomor, 'failed', 'Gagal Sinkronisasi: Google Sheets belum terhubung.');
    }
  };

  // Delete SPPD
  const handleDeleteSppd = (id: string) => {
    const confirmed = window.confirm('Apakah Anda yakin ingin menghapus data SPD ini dari daftar lokal?');
    if (confirmed) {
      const updated = sppdList.filter((p) => p.id !== id);
      saveSppdListToStorage(updated);
    }
  };

  // Delete SPT
  const handleDeleteSpt = (id: string) => {
    const confirmed = window.confirm('Apakah Anda yakin ingin menghapus data SPT ini dari daftar lokal?');
    if (confirmed) {
      const updated = sptList.filter((p) => p.id !== id);
      saveSptListToStorage(updated);
    }
  };

  // Manual Sync helper for individual failed records
  const handleManualSyncSppd = async (data: SppdData) => {
    if (!accessToken || !spreadsheetId) {
      alert('Hubungkan Google Sheets terlebih dahulu!');
      return;
    }
    setIsSyncing(true);
    try {
      await saveSppdToSheet(accessToken, spreadsheetId, data);
      const syncedList = sppdList.map((p) => (p.id === data.id ? { ...p, syncStatus: 'synced' as const } : p));
      saveSppdListToStorage(syncedList);
      addSyncLog('sppd', data.id, data.nomor, 'success', 'Sinkronisasi manual SPD berhasil.');
      alert('SPD Berhasil disinkronkan ke Google Sheet!');
    } catch (err: any) {
      console.error(err);
      addSyncLog('sppd', data.id, data.nomor, 'failed', `Gagal Sinkronisasi Manual: ${err.message || err}`);
      alert(`Gagal sinkronisasi: ${err.message || err}`);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleManualSyncSpt = async (data: SptData) => {
    if (!accessToken || !spreadsheetId) {
      alert('Hubungkan Google Sheets terlebih dahulu!');
      return;
    }
    setIsSyncing(true);
    try {
      await saveSptToSheet(accessToken, spreadsheetId, data);
      const syncedList = sptList.map((p) => (p.id === data.id ? { ...p, syncStatus: 'synced' as const } : p));
      saveSptListToStorage(syncedList);
      addSyncLog('spt', data.id, data.nomor, 'success', 'Sinkronisasi manual SPT berhasil.');
      alert('SPT Berhasil disinkronkan ke Google Sheet!');
    } catch (err: any) {
      console.error(err);
      addSyncLog('spt', data.id, data.nomor, 'failed', `Gagal Sinkronisasi Manual: ${err.message || err}`);
      alert(`Gagal sinkronisasi: ${err.message || err}`);
    } finally {
      setIsSyncing(false);
    }
  };

  // Filtering documents based on search queries
  const filteredSppd = sppdList.filter((p) => {
    const query = searchQuery.toLowerCase();
    return (
      p.nomor.toLowerCase().includes(query) ||
      p.namaPegawai.toLowerCase().includes(query) ||
      p.tempatTujuan.toLowerCase().includes(query) ||
      p.maksudPerjalanan.toLowerCase().includes(query)
    );
  });

  const filteredSpt = sptList.filter((p) => {
    const query = searchQuery.toLowerCase();
    return (
      p.nomor.toLowerCase().includes(query) ||
      p.keperluan.toLowerCase().includes(query) ||
      p.tempatTujuan.toLowerCase().includes(query) ||
      p.tugaskanKepada.some((emp) => emp.nama.toLowerCase().includes(query))
    );
  });

  const filteredDaftarBayar = daftarBayarList.filter((p) => {
    const query = searchQuery.toLowerCase();
    return (
      p.nomorSppd.toLowerCase().includes(query) ||
      p.maksudPerjalanan.toLowerCase().includes(query) ||
      p.rows.some((r) => r.nama.toLowerCase().includes(query))
    );
  });

  const handleSaveDaftarBayar = (data: DaftarBayarData) => {
    let updatedList;
    const isEdit = daftarBayarList.some((p) => p.id === data.id);

    if (isEdit) {
      updatedList = daftarBayarList.map((p) => (p.id === data.id ? data : p));
    } else {
      updatedList = [data, ...daftarBayarList];
    }

    saveDaftarBayarListToStorage(updatedList);
    setIsCreatingDaftarBayar(false);
    setEditingDaftarBayar(null);
    addSyncLog('pembayaran', data.id, `BAYAR-${data.nomorSppd}`, 'success', 'Daftar pembayaran lokal berhasil disimpan.');
  };

  const handleDeleteDaftarBayar = (id: string) => {
    const confirmed = window.confirm('Apakah Anda yakin ingin menghapus data rincian pembayaran ini?');
    if (confirmed) {
      const updated = daftarBayarList.filter((p) => p.id !== id);
      saveDaftarBayarListToStorage(updated);
    }
  };

  // Modal Render Selectors
  if (previewingSppd) {
    return <SppdDocument data={previewingSppd} onClose={() => setPreviewingSppd(null)} />;
  }

  if (previewingSpt) {
    return <SptDocument data={previewingSpt} onClose={() => setPreviewingSpt(null)} />;
  }

  if (previewingDaftarBayar) {
    return <DaftarBayarDocument data={previewingDaftarBayar} onClose={() => setPreviewingDaftarBayar(null)} />;
  }

  if (isCreatingSppd || editingSppd) {
    return (
      <div className="bg-slate-50 min-h-screen py-10 px-4">
        <SppdForm
          onSave={handleSaveSppd}
          onCancel={() => {
            setIsCreatingSppd(false);
            setEditingSppd(null);
          }}
          initialData={editingSppd || undefined}
        />
      </div>
    );
  }

  if (isCreatingSpt || editingSpt) {
    return (
      <div className="bg-slate-50 min-h-screen py-10 px-4">
        <SptForm
          onSave={handleSaveSpt}
          onCancel={() => {
            setIsCreatingSpt(false);
            setEditingSpt(null);
          }}
          initialData={editingSpt || undefined}
        />
      </div>
    );
  }

  if (isCreatingDaftarBayar || editingDaftarBayar) {
    return (
      <div className="bg-slate-50 min-h-screen py-10 px-4">
        <DaftarBayarForm
          sppdList={sppdList}
          onSave={handleSaveDaftarBayar}
          onCancel={() => {
            setIsCreatingDaftarBayar(false);
            setEditingDaftarBayar(null);
          }}
          initialData={editingDaftarBayar}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col justify-between" id="dashboard-view">
      
      {/* Top Navigation Panel */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-xs px-4 py-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          
          <div className="flex items-center gap-3">
            <NagekeoLogo size={52} />
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-black text-gray-900 uppercase tracking-tight">Dinas Pekerjaan Umum dan Penataan Ruang</h1>
                <span className="hidden sm:inline-block px-2 py-0.5 bg-indigo-50 text-indigo-700 text-3xs font-semibold rounded-full border border-indigo-100">
                  NAGEKEO
                </span>
              </div>
              <p className="text-xs text-gray-500 font-medium">Sistem Informasi Surat Perjalanan Dinas (SPPD) & Surat Perintah Tugas (SPT)</p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 self-end md:self-auto">
            <a
              href="/verify"
              className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 hover:text-emerald-800 rounded-lg text-xs font-semibold transition flex items-center gap-1"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1.003 1.003 0 001-1V5a1.003 1.003 0 00-1-1H5a1.003 1.003 0 00-1 1v2a1.003 1.003 0 001 1zm12 0h2a1.003 1.003 0 001-1V5a1.003 1.003 0 00-1-1h-2a1.003 1.003 0 00-1 1v2a1.003 1.003 0 001 1zM5 20h2a1.003 1.003 0 001-1v-2a1.003 1.003 0 00-1-1H5a1.003 1.003 0 00-1 1v2a1.003 1.003 0 001 1z" />
              </svg>
              Portal Verifikasi QR
            </a>

            {user ? (
              <div className="flex items-center gap-2">
                <div className="text-right hidden sm:block">
                  <p className="text-xs font-bold text-gray-900">{user.email}</p>
                  <p className="text-3xs text-gray-400 font-mono">AUTHORIZED OPERATOR</p>
                </div>
                <button
                  onClick={onLogout}
                  className="p-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition"
                  title="Logout / Keluar"
                  id="btn-logout"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                </button>
              </div>
            ) : (
              <button
                onClick={onLogin}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold transition"
                id="btn-login-header"
              >
                Sign In Operator
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Connection status notification */}
      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 mt-4">
        {accessToken ? (
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shadow-2xs">
            <div className="flex items-center gap-3">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
              <div>
                <p className="text-xs font-bold text-emerald-900">Terhubung ke Google Sheets & Drive</p>
                {spreadsheetUrl ? (
                  <p className="text-3xs text-emerald-700 font-mono">
                    File: <a href={spreadsheetUrl} target="_blank" rel="noreferrer" className="underline font-bold hover:text-emerald-800">Aplikasi SPPD & SPT Nagekeo (Dinas PUPR) ↗</a>
                  </p>
                ) : (
                  <p className="text-3xs text-emerald-600">Menyiapkan Spreadsheet...</p>
                )}
              </div>
            </div>
            {spreadsheetUrl && (
              <a
                href={spreadsheetUrl}
                target="_blank"
                rel="noreferrer"
                className="px-3 py-1 bg-white border border-emerald-200 hover:bg-emerald-100 text-emerald-800 text-2xs font-semibold rounded-lg transition text-center sm:self-auto self-start"
              >
                Buka Google Sheet ↗
              </a>
            )}
          </div>
        ) : (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shadow-2xs">
            <div className="flex items-start gap-2.5">
              <span className="text-lg">⚠️</span>
              <div>
                <p className="text-xs font-bold text-amber-900">Google Sheets Tidak Terhubung</p>
                <p className="text-3xs sm:text-2xs text-amber-700">
                  Data yang Anda buat hanya akan disimpan secara lokal di browser ini. Hubungkan akun Google Anda untuk sinkronisasi otomatis ke Google Sheets.
                </p>
              </div>
            </div>
            <button
              onClick={onLogin}
              className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-2xs font-bold rounded-lg transition self-start sm:self-auto whitespace-nowrap"
              id="btn-connect-sheets"
            >
              Hubungkan Google Sheets
            </button>
          </div>
        )}

        {sheetsError && (
          <div className="mt-2 p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs font-semibold">
            ⚠️ {sheetsError}
          </div>
        )}
      </div>

      {/* Main Dashboard Layout */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Left column / Actions & Navigation Panel */}
        <div className="lg:col-span-1 space-y-4">
          
          {/* Quick Actions Card */}
          <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-2xs space-y-3">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100 pb-1.5">Aksi Cepat</h3>
            <div className="space-y-2">
              <button
                onClick={() => setIsCreatingSppd(true)}
                className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition flex items-center justify-center gap-1.5 shadow-xs"
                id="btn-create-sppd-dashboard"
              >
                <span>+ Buat SPD Baru</span>
              </button>
              <button
                onClick={() => setIsCreatingSpt(true)}
                className="w-full py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-xl text-xs transition flex items-center justify-center gap-1.5 border border-indigo-100"
                id="btn-create-spt-dashboard"
              >
                <span>+ Buat SPT Baru</span>
              </button>
              <button
                onClick={() => {
                  if (sppdList.length === 0 || sptList.length === 0) {
                    setShowPrerequisiteModal(true);
                    return;
                  }
                  setIsCreatingDaftarBayar(true);
                }}
                className={`w-full py-2 font-bold rounded-xl text-xs transition flex items-center justify-center gap-1.5 ${
                  (sppdList.length === 0 || sptList.length === 0)
                    ? 'bg-slate-200 text-slate-500 border border-slate-300 cursor-not-allowed opacity-75 hover:bg-slate-200'
                    : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
                }`}
                id="btn-create-pembayaran-dashboard"
              >
                <span>{(sppdList.length === 0 || sptList.length === 0) ? '🔒 Buat Daftar Bayar' : '+ Buat Daftar Bayar'}</span>
              </button>
            </div>
          </div>

          {/* Navigation Card */}
          <div className="bg-white border border-gray-200 rounded-2xl p-2 shadow-2xs space-y-0.5">
            <button
              onClick={() => setActiveTab('sppd')}
              className={`w-full text-left px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition flex items-center justify-between ${
                activeTab === 'sppd' ? 'bg-indigo-50 text-indigo-700' : 'text-gray-600 hover:bg-gray-50'
              }`}
              id="tab-sppd"
            >
              <span>Surat Perjalanan Dinas (SPD)</span>
              <span className="bg-gray-200/50 text-gray-700 font-bold font-mono px-1.5 py-0.5 rounded text-3xs">
                {sppdList.length}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('spt')}
              className={`w-full text-left px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition flex items-center justify-between ${
                activeTab === 'spt' ? 'bg-indigo-50 text-indigo-700' : 'text-gray-600 hover:bg-gray-50'
              }`}
              id="tab-spt"
            >
              <span>Surat Perintah Tugas (SPT)</span>
              <span className="bg-gray-200/50 text-gray-700 font-bold font-mono px-1.5 py-0.5 rounded text-3xs">
                {sptList.length}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('pembayaran')}
              className={`w-full text-left px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition flex items-center justify-between ${
                activeTab === 'pembayaran' ? 'bg-indigo-50 text-indigo-700' : 'text-gray-600 hover:bg-gray-50'
              }`}
              id="tab-pembayaran"
            >
              <span>Daftar Pembayaran (SPPD)</span>
              <span className="bg-emerald-100 text-emerald-800 font-bold font-mono px-1.5 py-0.5 rounded text-3xs">
                {daftarBayarList.length}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('standar')}
              className={`w-full text-left px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition flex items-center justify-between ${
                activeTab === 'standar' ? 'bg-indigo-50 text-indigo-700' : 'text-gray-600 hover:bg-gray-50'
              }`}
              id="tab-standar"
            >
              <span>Standar Biaya (Perbup)</span>
              <span className="bg-indigo-100 text-indigo-800 font-bold px-1.5 py-0.5 rounded text-3xs">
                INFO
              </span>
            </button>
            <button
              onClick={() => setActiveTab('logs')}
              className={`w-full text-left px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition flex items-center justify-between ${
                activeTab === 'logs' ? 'bg-indigo-50 text-indigo-700' : 'text-gray-600 hover:bg-gray-50'
              }`}
              id="tab-logs"
            >
              <span>Log Sinkronisasi Sheets</span>
              <span className={`font-bold font-mono px-1.5 py-0.5 rounded text-3xs ${
                syncLogs.some(l => l.status === 'failed') ? 'bg-red-100 text-red-700 animate-pulse' : 'bg-gray-200/50 text-gray-700'
              }`}>
                {syncLogs.length}
              </span>
            </button>
          </div>

          {/* Quick instructions */}
          <div className="bg-indigo-950 text-indigo-100/90 rounded-2xl p-4 space-y-3 shadow-xs">
            <h4 className="text-3xs font-black tracking-widest uppercase text-indigo-300">Penjelasan TTD Digital</h4>
            <div className="text-3xs space-y-2 leading-relaxed font-sans">
              <p>
                <strong>Tanda Tangan Digital Terenkripsi:</strong> Setiap dokumen yang dibuat secara otomatis menghasilkan string kriptografi AES yang unik.
              </p>
              <p>
                Hanya admin dengan PIN <code className="bg-indigo-900 px-1 py-0.5 rounded text-white font-mono font-bold">sppd2026</code> yang dapat mendekripsi details di portal verifikasi.
              </p>
              <p>
                Ini menjamin bahwa SPD dan SPT tidak dapat dipalsukan, diedit secara ilegal, atau diduplikasi oleh pihak tidak bertanggung jawab.
              </p>
            </div>
          </div>
        </div>

        {/* Right columns / Data tables list */}
        <div className="lg:col-span-3 space-y-4">
          
          {/* Search bar & statistics */}
          {activeTab !== 'logs' && activeTab !== 'standar' && (
            <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-2xs flex flex-col sm:flex-row gap-3 items-center justify-between">
              <div className="w-full sm:max-w-md relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </span>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-1.5 border border-gray-300 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-indigo-500 bg-gray-50/50"
                  placeholder="Cari berdasarkan nomor surat, nama pegawai, tujuan, atau keperluan..."
                  id="input-search-records"
                />
              </div>

              <div className="flex items-center gap-1.5 text-2xs sm:text-xs text-gray-500 font-medium">
                <span>Menampilkan</span>
                <span className="bg-indigo-100 text-indigo-800 font-bold px-1.5 py-0.5 rounded font-mono">
                  {activeTab === 'sppd' ? filteredSppd.length : activeTab === 'spt' ? filteredSpt.length : filteredDaftarBayar.length}
                </span>
                <span>Dokumen</span>
              </div>
            </div>
          )}

          {/* SPPD Tab Content */}
          {activeTab === 'sppd' && (
            <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-2xs" id="sppd-history-table">
              {filteredSppd.length === 0 ? (
                <div className="text-center py-16 px-4 space-y-3">
                  <span className="text-3xl">📂</span>
                  <p className="text-sm font-semibold text-gray-500">Belum ada Surat Perjalanan Dinas (SPD) terdaftar.</p>
                  <button
                    onClick={() => setIsCreatingSppd(true)}
                    className="px-4 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-lg transition border border-indigo-100"
                  >
                    + Buat SPD Pertama Anda
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-left text-xs sm:text-sm">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200 text-gray-400 font-bold uppercase tracking-wider text-[10px]">
                        <th className="p-3 w-8 text-center">No</th>
                        <th className="p-3">Nomor Surat / Tanggal</th>
                        <th className="p-3">Nama Pegawai yang Pergi</th>
                        <th className="p-3">Tempat Tujuan & Lamanya</th>
                        <th className="p-3 text-center">Status Sheets</th>
                        <th className="p-3 text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {filteredSppd.map((item, idx) => (
                        <tr key={item.id} className="hover:bg-gray-50/50 transition">
                          <td className="p-3 text-center font-semibold text-gray-400">{idx + 1}</td>
                          <td className="p-3">
                            <span className="font-bold text-gray-900 block truncate max-w-[200px]">{item.nomor}</span>
                            <span className="text-3xs text-gray-400 font-mono block">{new Date(item.createdAt).toLocaleString('id-ID')}</span>
                          </td>
                          <td className="p-3">
                            <span className="font-semibold text-gray-900 block">{item.namaPegawai}</span>
                            <span className="text-3xs text-gray-400 font-mono block">NIP. {item.nip}</span>
                          </td>
                          <td className="p-3">
                            <span className="font-semibold text-gray-800 block">{item.tempatTujuan}</span>
                            <span className="text-3xs text-gray-500 block">Lamanya: {item.lamanyaPerjalanan}</span>
                          </td>
                          <td className="p-3 text-center">
                            {item.syncStatus === 'synced' ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-3xs font-bold bg-green-50 text-green-700 border border-green-100">
                                <span className="h-1.5 w-1.5 rounded-full bg-green-500" /> Synced
                              </span>
                            ) : (
                              <button
                                onClick={() => handleManualSyncSppd(item)}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-3xs font-bold bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-100 transition"
                                title="Klik untuk sinkronisasi ulang"
                              >
                                <span className="h-1.5 w-1.5 rounded-full bg-amber-500" /> Pending ↻
                              </button>
                            )}
                          </td>
                          <td className="p-3 text-right">
                            <div className="flex gap-1.5 justify-end">
                              <button
                                onClick={() => setPreviewingSppd(item)}
                                className="p-1 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded transition"
                                title="Cetak / Preview SPD"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                                </svg>
                              </button>
                              <button
                                onClick={() => setEditingSppd(item)}
                                className="p-1 bg-yellow-50 text-yellow-600 hover:bg-yellow-100 rounded transition"
                                title="Edit Dokumen"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                              </button>
                              <button
                                onClick={() => handleDeleteSppd(item.id)}
                                className="p-1 bg-red-50 text-red-600 hover:bg-red-100 rounded transition"
                                title="Hapus Dokumen"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* SPT Tab Content */}
          {activeTab === 'spt' && (
            <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-2xs" id="spt-history-table">
              {filteredSpt.length === 0 ? (
                <div className="text-center py-16 px-4 space-y-3">
                  <span className="text-3xl">📋</span>
                  <p className="text-sm font-semibold text-gray-500">Belum ada Surat Perintah Tugas (SPT) terdaftar.</p>
                  <button
                    onClick={() => setIsCreatingSpt(true)}
                    className="px-4 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-lg transition border border-indigo-100"
                  >
                    + Buat SPT Pertama Anda
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-left text-xs sm:text-sm">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200 text-gray-400 font-bold uppercase tracking-wider text-[10px]">
                        <th className="p-3 w-8 text-center">No</th>
                        <th className="p-3">Nomor Surat / Tanggal</th>
                        <th className="p-3">Pegawai Ditugaskan</th>
                        <th className="p-3">Keperluan Tugas & Tujuan</th>
                        <th className="p-3 text-center">Status Sheets</th>
                        <th className="p-3 text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {filteredSpt.map((item, idx) => (
                        <tr key={item.id} className="hover:bg-gray-50/50 transition">
                          <td className="p-3 text-center font-semibold text-gray-400">{idx + 1}</td>
                          <td className="p-3">
                            <span className="font-bold text-gray-900 block truncate max-w-[200px]">{item.nomor}</span>
                            <span className="text-3xs text-gray-400 font-mono block">{new Date(item.createdAt).toLocaleString('id-ID')}</span>
                          </td>
                          <td className="p-3">
                            <span className="font-semibold text-gray-900 block">
                              {item.tugaskanKepada[0]?.nama || '-'}
                            </span>
                            {item.tugaskanKepada.length > 1 && (
                              <span className="px-1.5 py-0.5 bg-indigo-50 text-indigo-600 border border-indigo-100 font-bold rounded text-3xs font-mono">
                                + {item.tugaskanKepada.length - 1} Pegawai Lain
                              </span>
                            )}
                          </td>
                          <td className="p-3">
                            <span className="font-semibold text-gray-800 block truncate max-w-[220px]" title={item.keperluan}>
                              {item.keperluan}
                            </span>
                            <span className="text-3xs text-gray-500 block">Tujuan: {item.tempatTujuan}</span>
                          </td>
                          <td className="p-3 text-center">
                            {item.syncStatus === 'synced' ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-3xs font-bold bg-green-50 text-green-700 border border-green-100">
                                <span className="h-1.5 w-1.5 rounded-full bg-green-500" /> Synced
                              </span>
                            ) : (
                              <button
                                onClick={() => handleManualSyncSpt(item)}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-3xs font-bold bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-100 transition"
                                title="Klik untuk sinkronisasi ulang"
                              >
                                <span className="h-1.5 w-1.5 rounded-full bg-amber-500" /> Pending ↻
                              </button>
                            )}
                          </td>
                          <td className="p-3 text-right">
                            <div className="flex gap-1.5 justify-end">
                              <button
                                onClick={() => setPreviewingSpt(item)}
                                className="p-1 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded transition"
                                title="Cetak / Preview SPT"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                                </svg>
                              </button>
                              <button
                                onClick={() => setEditingSpt(item)}
                                className="p-1 bg-yellow-50 text-yellow-600 hover:bg-yellow-100 rounded transition"
                                title="Edit Dokumen"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                              </button>
                              <button
                                onClick={() => handleDeleteSpt(item.id)}
                                className="p-1 bg-red-50 text-red-600 hover:bg-red-100 rounded transition"
                                title="Hapus Dokumen"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Daftar Pembayaran Tab Content */}
          {activeTab === 'pembayaran' && (
            <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-2xs" id="pembayaran-history-table">
              {filteredDaftarBayar.length === 0 ? (
                <div className="text-center py-16 px-4 space-y-3">
                  <span className="text-3xl">💵</span>
                  <p className="text-sm font-semibold text-gray-500">Belum ada Daftar Rincian Pembayaran terdaftar.</p>
                  <button
                    onClick={() => {
                      if (sppdList.length === 0 || sptList.length === 0) {
                        setShowPrerequisiteModal(true);
                        return;
                      }
                      setIsCreatingDaftarBayar(true);
                    }}
                    className={`px-4 py-1.5 text-xs font-bold rounded-lg transition border ${
                      (sppdList.length === 0 || sptList.length === 0)
                        ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                        : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-indigo-100'
                    }`}
                  >
                    {(sppdList.length === 0 || sptList.length === 0) ? '🔒 Buat Rincian Pembayaran' : '+ Buat Rincian Pembayaran Pertama Anda'}
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-left text-xs sm:text-sm">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200 text-gray-400 font-bold uppercase tracking-wider text-[10px]">
                        <th className="p-3 w-8 text-center">No</th>
                        <th className="p-3">Surat SPD Terhubung</th>
                        <th className="p-3">Maksud Perjalanan Dinas</th>
                        <th className="p-3">Penerima & Total Bersih</th>
                        <th className="p-3 text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {filteredDaftarBayar.map((item, idx) => {
                        const totalNetto = item.rows.reduce((sum, r) => sum + r.terima, 0);
                        return (
                          <tr key={item.id} className="hover:bg-gray-50/50 transition">
                            <td className="p-3 text-center font-semibold text-gray-400">{idx + 1}</td>
                            <td className="p-3">
                              <span className="font-bold text-gray-900 block truncate max-w-[180px]">{item.nomorSppd}</span>
                              <span className="text-3xs text-gray-400 font-mono block">SPD Ref ID: {item.sppdId.substring(0, 8)}...</span>
                            </td>
                            <td className="p-3">
                              <span className="font-semibold text-gray-800 block truncate max-w-[240px]" title={item.maksudPerjalanan}>
                                {item.maksudPerjalanan}
                              </span>
                              <span className="text-3xs text-gray-500 block">Tanggal: {item.tanggalPerjalanan}</span>
                            </td>
                            <td className="p-3">
                              <span className="font-bold text-slate-900 block">
                                {item.rows[0]?.nama || '-'}
                                {item.rows.length > 1 && (
                                  <span className="ml-1 text-3xs font-medium text-indigo-600 font-sans">
                                    (+{item.rows.length - 1} pengikut)
                                  </span>
                                )}
                              </span>
                              <span className="text-3xs text-emerald-700 font-mono font-bold block">
                                {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(totalNetto).replace('IDR', 'Rp')}
                              </span>
                            </td>
                            <td className="p-3 text-right">
                              <div className="flex gap-1.5 justify-end">
                                <button
                                  onClick={() => setPreviewingDaftarBayar(item)}
                                  className="p-1 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded transition"
                                  title="Cetak Rincian Pembayaran"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                                  </svg>
                                </button>
                                <button
                                  onClick={() => setEditingDaftarBayar(item)}
                                  className="p-1 bg-yellow-50 text-yellow-600 hover:bg-yellow-100 rounded transition"
                                  title="Edit Rincian"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                  </svg>
                                </button>
                                <button
                                  onClick={() => handleDeleteDaftarBayar(item.id)}
                                  className="p-1 bg-red-50 text-red-600 hover:bg-red-100 rounded transition"
                                  title="Hapus Rincian"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Standar Biaya Perbup Tab Content */}
          {activeTab === 'standar' && (
            <InformasiStandar />
          )}

          {/* Sync & Log History Tab Content */}
          {activeTab === 'logs' && (
            <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-2xs p-4 sm:p-6" id="logs-history-tab">
              <div className="border-b border-gray-100 pb-3 mb-4">
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide">Log Aktivitas Sinkronisasi Google Sheets</h3>
                <p className="text-3xs sm:text-2xs text-gray-400">Daftar rekaman sinkronisasi berkas tanda tangan digital secara real-time.</p>
              </div>

              {syncLogs.length === 0 ? (
                <p className="text-xs text-gray-400 italic text-center py-10">Belum ada aktivitas sinkronisasi terekam.</p>
              ) : (
                <div className="space-y-2.5 max-h-[450px] overflow-y-auto">
                  {syncLogs.map((log) => (
                    <div
                      key={log.id}
                      className={`p-3 rounded-xl border flex items-start gap-3 text-xs ${
                        log.status === 'success'
                          ? 'bg-green-50/50 border-green-100 text-green-800'
                          : 'bg-red-50/50 border-red-100 text-red-800'
                      }`}
                    >
                      <span className="text-sm mt-0.5">{log.status === 'success' ? '✅' : '❌'}</span>
                      <div className="flex-1">
                        <div className="flex justify-between items-start gap-2">
                          <span className="font-bold uppercase text-3xs font-mono tracking-wider">
                            {log.type} // {log.docId}
                          </span>
                          <span className="text-3xs text-gray-400 font-mono">{log.timestamp}</span>
                        </div>
                        <p className="font-semibold mt-0.5 text-gray-900">{log.nomor}</p>
                        <p className="text-3xs text-gray-500 mt-1 font-sans">{log.message}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* App Footer */}
      <footer className="border-t border-gray-200 bg-white py-6 mt-12 text-center text-xs text-gray-500 font-sans px-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <NagekeoLogo size={28} />
            <span className="font-bold text-gray-800 text-3xs uppercase tracking-wider">E-SPPD Kabupaten Nagekeo &copy; 2026</span>
          </div>
          <p className="text-3xs text-gray-400 font-mono">
            Dinas Pekerjaan Umum dan Penataan Ruang • Kab. Nagekeo, Nusa Tenggara Timur • MBAY
          </p>
        </div>
      </footer>

      {/* Prerequisite warning modal */}
      {showPrerequisiteModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in" id="prerequisite-modal">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-100 space-y-4">
            <div className="flex items-center gap-3 text-amber-600">
              <span className="text-3xl">⚠️</span>
              <div>
                <h3 className="font-bold text-slate-900 text-sm sm:text-base uppercase tracking-wide">Data Belum Lengkap</h3>
                <p className="text-xs text-slate-500">Prasyarat Dokumen Tidak Terpenuhi</p>
              </div>
            </div>
            
            <div className="text-xs text-slate-600 leading-relaxed space-y-2.5 bg-slate-50 p-4 rounded-xl border border-slate-200">
              <p className="font-medium text-slate-800">Untuk membuat rincian **Daftar Pembayaran (SPPD)**, Anda harus melengkapi data berikut terlebih dahulu:</p>
              
              <ul className="space-y-1.5 list-none pl-1">
                <li className="flex items-center gap-2">
                  <span className={sppdList.length > 0 ? "text-emerald-500 font-bold" : "text-red-500 font-bold"}>
                    {sppdList.length > 0 ? "✓" : "✗"}
                  </span>
                  <span>
                    Surat Perjalanan Dinas (SPD) 
                    <span className="text-3xs block text-gray-500">({sppdList.length} data saat ini - Butuh minimal 1)</span>
                  </span>
                </li>
                <li className="flex items-center gap-2">
                  <span className={sptList.length > 0 ? "text-emerald-500 font-bold" : "text-red-500 font-bold"}>
                    {sptList.length > 0 ? "✓" : "✗"}
                  </span>
                  <span>
                    Surat Perintah Tugas (SPT) 
                    <span className="text-3xs block text-gray-500">({sptList.length} data saat ini - Butuh minimal 1)</span>
                  </span>
                </li>
              </ul>
            </div>
            
            <div className="text-3xs text-gray-500 leading-relaxed">
              Silakan tutup jendela ini dan gunakan menu <strong>Aksi Cepat</strong> untuk membuat Surat Perjalanan Dinas (SPD) dan Surat Perintah Tugas (SPT) terlebih dahulu sebelum melanjutkan ke rincian pembayaran.
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowPrerequisiteModal(false);
                }}
                className="w-full sm:w-auto px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition shadow-xs text-center uppercase tracking-wider"
                id="btn-close-prerequisite-modal"
              >
                Saya Mengerti
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
