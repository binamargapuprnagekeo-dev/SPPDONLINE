import React, { useState } from 'react';
import { SppdData, SptData, DaftarBayarData } from '../types';

interface BukuRegistrasiProps {
  sppdList: SppdData[];
  sptList: SptData[];
  daftarBayarList: DaftarBayarData[];
  onPreviewSppd: (data: SppdData) => void;
  onPreviewSpt: (data: SptData) => void;
  onPreviewDaftarBayar: (data: DaftarBayarData) => void;
}

type DocTypeFilter = 'all' | 'spt' | 'sppd' | 'pembayaran';

interface UnifiedRegistryItem {
  id: string;
  type: 'SPT' | 'SPD' | 'PEMBAYARAN';
  nomor: string;
  tanggalInput: string;
  tanggalSurat: string;
  namaPenerima: string;
  nipPenerima: string;
  maksudTujuan: string;
  totalNominal?: number;
  originalData: any;
}

export default function BukuRegistrasi({
  sppdList,
  sptList,
  daftarBayarList,
  onPreviewSppd,
  onPreviewSpt,
  onPreviewDaftarBayar,
}: BukuRegistrasiProps) {
  const [docType, setDocType] = useState<DocTypeFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState('');

  // Helper to format currency
  const formatRupiah = (num: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(num).replace('IDR', 'Rp');
  };

  // Convert all items into a unified ledger format
  const getUnifiedItems = (): UnifiedRegistryItem[] => {
    const items: UnifiedRegistryItem[] = [];

    // 1. Add SPT
    sptList.forEach((spt) => {
      const namaPegawai = spt.tugaskanKepada && spt.tugaskanKepada.length > 0
        ? spt.tugaskanKepada.map((t) => t.nama).join(', ')
        : '-';
      const nipPegawai = spt.tugaskanKepada && spt.tugaskanKepada.length > 0
        ? spt.tugaskanKepada.map((t) => t.nip || '-').join(', ')
        : '-';

      items.push({
        id: spt.id,
        type: 'SPT',
        nomor: spt.nomor,
        tanggalInput: spt.createdAt || new Date().toISOString(),
        tanggalSurat: spt.tanggalDitetapkan,
        namaPenerima: namaPegawai,
        nipPenerima: nipPegawai,
        maksudTujuan: spt.keperluan,
        originalData: spt,
      });
    });

    // 2. Add SPD
    sppdList.forEach((spd) => {
      items.push({
        id: spd.id,
        type: 'SPD',
        nomor: spd.nomor,
        tanggalInput: spd.createdAt || new Date().toISOString(),
        tanggalSurat: spd.tanggalDikeluarkan,
        namaPenerima: spd.namaPegawai,
        nipPenerima: spd.nip,
        maksudTujuan: `${spd.maksudPerjalanan} (Tujuan: ${spd.tempatTujuan})`,
        originalData: spd,
      });
    });

    // 3. Add Daftar Pembayaran
    daftarBayarList.forEach((pay) => {
      const totalAmount = pay.rows.reduce((sum, r) => sum + r.terima, 0);
      items.push({
        id: pay.id,
        type: 'PEMBAYARAN',
        nomor: `Bayar SPD - ${pay.nomorSppd}`,
        tanggalInput: pay.createdAt || new Date().toISOString(),
        tanggalSurat: pay.tanggalDikeluarkan,
        namaPenerima: pay.rows[0]?.nama || '-',
        nipPenerima: pay.rows[0]?.nip || '-',
        maksudTujuan: pay.maksudPerjalanan,
        totalNominal: totalAmount,
        originalData: pay,
      });
    });

    // Sort by input date descending
    return items.sort((a, b) => b.tanggalInput.localeCompare(a.tanggalInput));
  };

  const allItems = getUnifiedItems();

  // Filter items
  const filteredItems = allItems.filter((item) => {
    // Document Type Filter
    if (docType !== 'all' && item.type.toLowerCase() !== docType) {
      return false;
    }

    // Date Filter
    if (dateFilter && !item.tanggalInput.includes(dateFilter) && !item.tanggalSurat.includes(dateFilter)) {
      return false;
    }

    // Search Query Filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        item.nomor.toLowerCase().includes(query) ||
        item.namaPenerima.toLowerCase().includes(query) ||
        item.nipPenerima.toLowerCase().includes(query) ||
        item.maksudTujuan.toLowerCase().includes(query)
      );
    }

    return true;
  });

  // Calculate high-level statistics
  const totalSpt = sptList.length;
  const totalSpd = sppdList.length;
  const totalPembayaranCount = daftarBayarList.length;
  const grandTotalDisbursed = daftarBayarList.reduce(
    (sum, pay) => sum + pay.rows.reduce((rowSum, r) => rowSum + r.terima, 0),
    0
  );

  const handlePrintRegistry = () => {
    window.print();
  };

  const handlePreviewItem = (item: UnifiedRegistryItem) => {
    if (item.type === 'SPT') {
      onPreviewSpt(item.originalData);
    } else if (item.type === 'SPD') {
      onPreviewSppd(item.originalData);
    } else if (item.type === 'PEMBAYARAN') {
      onPreviewDaftarBayar(item.originalData);
    }
  };

  return (
    <div className="space-y-6" id="buku-registrasi-digital-container">
      {/* Upper Statistics (Hidden during printing) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 print:hidden">
        {/* Stat 1 */}
        <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-2xl p-4 text-white shadow-md shadow-indigo-100 flex items-center justify-between">
          <div>
            <span className="text-3xs uppercase tracking-wider font-bold text-indigo-100 block">Total SPT Terbit</span>
            <span className="text-2xl font-black mt-1 block">{totalSpt}</span>
            <span className="text-4xs text-indigo-200 mt-1 block">Surat Perintah Tugas</span>
          </div>
          <span className="text-3xl opacity-85 select-none">📋</span>
        </div>

        {/* Stat 2 */}
        <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl p-4 text-white shadow-md shadow-emerald-100 flex items-center justify-between">
          <div>
            <span className="text-3xs uppercase tracking-wider font-bold text-emerald-100 block">Total SPD Terbit</span>
            <span className="text-2xl font-black mt-1 block">{totalSpd}</span>
            <span className="text-4xs text-emerald-200 mt-1 block">Surat Perjalanan Dinas</span>
          </div>
          <span className="text-3xl opacity-85 select-none">✈️</span>
        </div>

        {/* Stat 3 */}
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-4 text-white shadow-md shadow-blue-100 flex items-center justify-between">
          <div>
            <span className="text-3xs uppercase tracking-wider font-bold text-blue-100 block">Total Daftar Bayar</span>
            <span className="text-2xl font-black mt-1 block">{totalPembayaranCount}</span>
            <span className="text-4xs text-blue-200 mt-1 block">Rincian Dokumen Bayar</span>
          </div>
          <span className="text-3xl opacity-85 select-none">💵</span>
        </div>

        {/* Stat 4 */}
        <div className="bg-gradient-to-br from-slate-700 to-slate-800 rounded-2xl p-4 text-white shadow-md shadow-slate-200 flex items-center justify-between">
          <div>
            <span className="text-3xs uppercase tracking-wider font-bold text-slate-300 block">Total Dana Diregistrasi</span>
            <span className="text-lg sm:text-xl font-black mt-1 block truncate max-w-[190px]">
              {formatRupiah(grandTotalDisbursed)}
            </span>
            <span className="text-4xs text-slate-400 mt-1 block">Total Realisasi SPD</span>
          </div>
          <span className="text-3xl opacity-85 select-none">🏦</span>
        </div>
      </div>

      {/* Main Registry Block */}
      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-2xs">
        
        {/* Kop & Header (Only visible on printed sheet) */}
        <div className="hidden print:block p-6 border-b-4 border-double border-black font-sans text-black mb-6">
          <div className="flex items-center justify-center gap-6">
            <div className="text-center">
              <h1 className="text-sm font-bold tracking-wider leading-tight">PEMERINTAH KABUPATEN NAGEKEO</h1>
              <h2 className="text-lg font-black tracking-wider leading-tight">DINAS PEKERJAAN UMUM DAN PENATAAN RUANG</h2>
              <p className="text-[10px] italic">Kompleks Bendung Sutami - Mbay, Kabupaten Nagekeo</p>
              <h3 className="text-xs font-bold uppercase tracking-widest mt-2 border-t border-black pt-1">
                BUKU REGISTRASI DIGITAL SURAT PERJALANAN DINAS & SPT
              </h3>
            </div>
          </div>
        </div>

        {/* Control and Filter Panels (Hidden during print) */}
        <div className="p-4 sm:p-5 border-b border-gray-150 bg-slate-50/50 space-y-4 print:hidden">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide">Buku Registrasi Dokumen</h3>
              <p className="text-3xs sm:text-2xs text-slate-500 mt-0.5">
                Buku register resmi yang mencatat semua nomor surat masuk, surat perintah tugas, dan pengeluaran secara terintegrasi.
              </p>
            </div>
            
            <button
              onClick={handlePrintRegistry}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl text-xs transition flex items-center gap-2 self-stretch sm:self-auto justify-center"
              id="btn-print-registry"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              <span>Cetak Buku Register (PDF)</span>
            </button>
          </div>

          {/* Filtering UI */}
          <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-3 pt-2">
            
            {/* Search Input */}
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari nomor, nama, atau tujuan..."
                className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-xl text-xs bg-white"
                id="registry-search"
              />
            </div>

            {/* Doc Type Selector Tabs inside drop-down or filters */}
            <div>
              <select
                value={docType}
                onChange={(e) => setDocType(e.target.value as DocTypeFilter)}
                className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs bg-white font-semibold text-gray-700"
                id="registry-type-filter"
              >
                <option value="all">Semua Jenis Surat</option>
                <option value="spt">Surat Perintah Tugas (SPT)</option>
                <option value="sppd">Surat Perjalanan Dinas (SPD)</option>
                <option value="pembayaran">Daftar Pembayaran (SPPD)</option>
              </select>
            </div>

            {/* Date helper filter */}
            <div className="sm:col-span-1">
              <input
                type="text"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                placeholder="Cari bulan/tahun (e.g. Juli 2026)..."
                className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs bg-white"
                id="registry-date-filter"
              />
            </div>

            {/* Live Counter Display */}
            <div className="flex items-center justify-end text-3xs font-bold text-slate-500 font-sans tracking-wide">
              <span>Hasil filter: <strong>{filteredItems.length}</strong> dari <strong>{allItems.length}</strong> total baris</span>
            </div>

          </div>
        </div>

        {/* Ledger Table */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs sm:text-sm" id="registry-ledger-table">
            <thead>
              <tr className="bg-slate-100 border-b border-gray-200 text-slate-500 font-bold uppercase tracking-wider text-[10px] print:bg-gray-50 print:text-black">
                <th className="p-3 w-8 text-center border-r border-gray-200">No</th>
                <th className="p-3 w-28 border-r border-gray-200">Jenis Dokumen</th>
                <th className="p-3 w-48 border-r border-gray-200">Nomor Registrasi Resmi</th>
                <th className="p-3 w-48 border-r border-gray-200">Tanggal Terbit / Keluar</th>
                <th className="p-3 w-52 border-r border-gray-200">Nama Penerima / Pejabat</th>
                <th className="p-3 border-r border-gray-200">Maksud & Tujuan Perjalanan Dinas</th>
                <th className="p-3 w-32 border-r border-gray-200 text-right">Nominal Realisasi</th>
                <th className="p-3 w-24 text-center print:hidden">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-[11px] sm:text-xs">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-12 text-center text-gray-400 font-semibold space-y-2">
                    <span className="text-2xl block">📁</span>
                    <span>Tidak ada dokumen yang sesuai dengan kriteria filter registrasi.</span>
                  </td>
                </tr>
              ) : (
                filteredItems.map((item, idx) => {
                  // Badges based on type
                  let typeBadge = '';
                  if (item.type === 'SPT') {
                    typeBadge = 'bg-blue-50 text-blue-800 border border-blue-100';
                  } else if (item.type === 'SPD') {
                    typeBadge = 'bg-emerald-50 text-emerald-800 border border-emerald-100';
                  } else if (item.type === 'PEMBAYARAN') {
                    typeBadge = 'bg-amber-50 text-amber-800 border border-amber-100';
                  }

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/50 transition">
                      {/* No */}
                      <td className="p-3 text-center font-bold text-gray-400 border-r border-gray-150">
                        {idx + 1}
                      </td>

                      {/* Type */}
                      <td className="p-3 border-r border-gray-150">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold uppercase ${typeBadge}`}>
                          {item.type}
                        </span>
                      </td>

                      {/* Doc No */}
                      <td className="p-3 font-bold text-slate-900 border-r border-gray-150">
                        {item.nomor || 'Dalam Proses'}
                      </td>

                      {/* Date */}
                      <td className="p-3 text-slate-600 font-medium border-r border-gray-150">
                        {item.tanggalSurat}
                      </td>

                      {/* Payee / Employee */}
                      <td className="p-3 border-r border-gray-150">
                        <div className="font-bold text-slate-800">{item.namaPenerima}</div>
                        {item.nipPenerima && item.nipPenerima !== '-' && (
                          <div className="text-[10px] font-mono text-gray-400">NIP: {item.nipPenerima}</div>
                        )}
                      </td>

                      {/* Purpose */}
                      <td className="p-3 text-slate-700 leading-relaxed max-w-sm border-r border-gray-150">
                        {item.maksudTujuan}
                      </td>

                      {/* Nominal */}
                      <td className="p-3 text-right font-mono font-bold text-slate-900 border-r border-gray-150">
                        {item.totalNominal ? (
                          <span className="text-emerald-700">{formatRupiah(item.totalNominal)}</span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>

                      {/* Action */}
                      <td className="p-3 text-center print:hidden">
                        <button
                          onClick={() => handlePreviewItem(item)}
                          className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-[10px] rounded-lg transition border border-indigo-150 flex items-center gap-1 mx-auto"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                          Lihat
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Unified Register Footer metadata (Only visible on print format) */}
        <div className="hidden print:block p-8 mt-12 text-[10px] font-mono text-gray-500 border-t border-dashed border-gray-300">
          <div className="flex justify-between">
            <div>
              <p>Mencakup data SPT: {totalSpt} Dokumen</p>
              <p>Mencakup data SPD: {totalSpd} Dokumen</p>
              <p>Mencakup data Pembayaran: {totalPembayaranCount} Dokumen</p>
            </div>
            <div className="text-right">
              <p>Buku Registrasi Digital Resmi</p>
              <p>Dinas Pekerjaan Umum dan Penataan Ruang</p>
              <p>Kabupaten Nagekeo, Nusa Tenggara Timur</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
