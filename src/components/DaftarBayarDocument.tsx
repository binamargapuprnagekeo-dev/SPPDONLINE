import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { DaftarBayarData } from '../types';
import NagekeoLogo from './NagekeoLogo';

interface DaftarBayarDocumentProps {
  data: DaftarBayarData;
  onClose?: () => void;
}

export default function DaftarBayarDocument({ data, onClose }: DaftarBayarDocumentProps) {
  const [isDigital, setIsDigital] = useState(true);

  // Generate deterministic unique verification url/token
  const verifyToken = btoa(JSON.stringify({ type: 'PAYMENT', id: data.id, total: data.rows.reduce((sum, r) => sum + r.terima, 0) }));
  const verifyUrl = `${window.location.origin}/verify?data=${encodeURIComponent(verifyToken)}`;

  const printDigital = () => {
    setIsDigital(true);
    setTimeout(() => {
      window.print();
    }, 150);
  };

  const printManual = () => {
    setIsDigital(false);
    setTimeout(() => {
      window.print();
    }, 150);
  };

  // Helper to format currency
  const formatRupiah = (num: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(num).replace('IDR', 'Rp');
  };

  // Totals
  const totalJumlah = data.rows.reduce((sum, r) => sum + r.jumlah, 0);
  const totalPotongan = data.rows.reduce((sum, r) => sum + r.potongan, 0);
  const totalTerima = data.rows.reduce((sum, r) => sum + r.terima, 0);

  return (
    <div className="bg-white p-2 sm:p-8 max-w-5xl mx-auto rounded-2xl shadow-md border border-gray-150 print:border-none print:shadow-none print:p-0" id="daftar-bayar-document-root">
      
      {/* Print Control panel (Hidden on print) */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 pb-4 border-b border-gray-100 print:hidden bg-slate-50 p-4 rounded-xl border border-slate-150">
        <div>
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide">Opsi Cetak Daftar Pembayaran</h3>
          <p className="text-3xs sm:text-2xs text-slate-500 mt-0.5">Pilih cetak ttd digital dengan verifikasi QRCode otomatis atau cetak manual basah.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {onClose && (
            <button
              onClick={onClose}
              className="px-3.5 py-2 border border-gray-300 rounded-lg text-xs font-semibold text-gray-700 bg-white hover:bg-gray-50 transition"
              id="btn-close-payment"
            >
              Kembali
            </button>
          )}
          <button
            onClick={printManual}
            className="px-3.5 py-2 bg-slate-600 text-white rounded-lg text-xs font-bold hover:bg-slate-700 transition flex items-center gap-1.5"
            id="btn-print-payment-manual"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
            Cetak Manual (Basah)
          </button>
          <button
            onClick={printDigital}
            className="px-3.5 py-2 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700 transition flex items-center gap-1.5 shadow-sm shadow-emerald-200"
            id="btn-print-payment-digital"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1.003 1.003 0 001-1V5a1.003 1.003 0 00-1-1H5a1.003 1.003 0 00-1 1v2a1.003 1.003 0 001 1zm12 0h2a1.003 1.003 0 001-1V5a1.003 1.003 0 00-1-1h-2a1.003 1.003 0 00-1 1v2a1.003 1.003 0 001 1zM5 20h2a1.003 1.003 0 001-1v-2a1.003 1.003 0 00-1-1H5a1.003 1.003 0 00-1 1v2a1.003 1.003 0 001 1z" />
            </svg>
            Cetak dengan TTD Digital
          </button>
        </div>
      </div>

      {/* Main Printable Area */}
      <div className="print:p-0 font-sans text-xs text-black" id="printable-payment-document">
        
        {/* Kop Surat (Header) */}
        <div className="flex items-center justify-between border-b-4 border-double border-black pb-2 mb-4">
          <div className="w-[12%] flex justify-start">
            <NagekeoLogo size={74} />
          </div>
          <div className="w-[88%] text-center pr-8">
            <h1 className="text-sm font-bold tracking-wider leading-tight">PEMERINTAH KABUPATEN NAGEKEO</h1>
            <h2 className="text-lg font-black tracking-wider leading-tight">DINAS PEKERJAAN UMUM DAN PENATAAN RUANG</h2>
            <p className="text-[10px] italic font-serif">Kompleks Bendung Sutami - No. ......... Telp. .........</p>
            <p className="text-xs font-bold tracking-widest uppercase mt-0.5">M B A Y</p>
          </div>
        </div>

        {/* Title */}
        <div className="text-center my-4">
          <h2 className="text-sm font-black uppercase tracking-wider border-b-2 border-black inline-block px-4 pb-1">
            DAFTAR PEMBAYARAN
          </h2>
        </div>

        {/* Metadata Details */}
        <div className="mb-4 space-y-1.5 leading-relaxed text-[11px] font-sans">
          <div className="flex">
            <span className="font-bold w-[300px] uppercase">{data.perjalananDinasType} :</span>
            <span className="flex-1">{data.maksudPerjalanan}</span>
          </div>
          <div className="flex">
            <span className="w-[300px] font-semibold">Tanggal Perjalanan:</span>
            <span className="flex-1 font-bold">{data.tanggalPerjalanan} sesuai SPT SPD terlampir</span>
          </div>
          <div className="flex text-[10px] text-gray-800">
            <span className="w-[300px]">Sumber Pembiayaan:</span>
            <span className="flex-1">
              {data.sumberDana} • Kode Rekening <span className="font-mono font-semibold">{data.kodeRekening}</span> • Kode RUP <span className="font-mono font-semibold">{data.kodeRup}</span>
            </span>
          </div>
        </div>

        {/* Main Table */}
        <div className="overflow-x-auto my-5">
          <table className="w-full border-collapse border border-black text-[10px]">
            <thead>
              <tr className="bg-slate-50 text-center font-bold">
                <th className="border border-black p-2 w-7">NO</th>
                <th className="border border-black p-2 w-28">TANGGAL</th>
                <th className="border border-black p-2">NAMA</th>
                <th className="border border-black p-2 w-24">JUMLAH</th>
                <th className="border border-black p-2 w-20">POTONGAN</th>
                <th className="border border-black p-2 w-24">TERIMA</th>
                <th className="border border-black p-2 w-32">NO. REKENING</th>
                <th className="border border-black p-2 w-28">BANK</th>
                <th className="border border-black p-2 w-24">STATUS TRANSAKSI</th>
                <th className="border border-black p-2 w-24">TANDA TERIMA</th>
              </tr>
            </thead>
            <tbody>
              {data.rows.map((row, idx) => (
                <tr key={idx} className="hover:bg-gray-50/50">
                  <td className="border border-black p-2 text-center font-semibold">{idx + 1}.</td>
                  <td className="border border-black p-2 text-center font-medium">{row.tanggal || '-'}</td>
                  <td className="border border-black p-2">
                    <div className="font-bold">{row.nama}</div>
                    {row.nip && <div className="text-[9px] text-gray-500 font-mono">NIP: {row.nip}</div>}
                  </td>
                  <td className="border border-black p-2 text-right font-mono font-semibold">{formatRupiah(row.jumlah)}</td>
                  <td className="border border-black p-2 text-right font-mono">{row.potongan > 0 ? formatRupiah(row.potongan) : '-'}</td>
                  <td className="border border-black p-2 text-right font-mono font-bold">{formatRupiah(row.terima)}</td>
                  <td className="border border-black p-2 font-mono text-center text-[9px]">{row.noRekening || '-'}</td>
                  <td className="border border-black p-2 text-center text-[9px] font-semibold">{row.bank}</td>
                  <td className="border border-black p-2 text-center">
                    <span className="px-1 py-0.5 rounded text-[8px] font-bold bg-slate-100 uppercase">{row.statusTransaksi}</span>
                  </td>
                  <td className="border border-black p-2 text-center font-mono text-[9px]">
                    {row.tandaTerima || 'Selesai'}
                  </td>
                </tr>
              ))}

              {/* TOTALS ROW */}
              <tr className="bg-slate-50 font-bold text-slate-900 border-t-2 border-black">
                <td className="border border-black p-2.5 text-center" colSpan={3}>
                  TOTAL
                </td>
                <td className="border border-black p-2.5 text-right font-mono font-bold text-black">{formatRupiah(totalJumlah)}</td>
                <td className="border border-black p-2.5 text-right font-mono text-black">{totalPotongan > 0 ? formatRupiah(totalPotongan) : '-'}</td>
                <td className="border border-black p-2.5 text-right font-mono font-black text-black">{formatRupiah(totalTerima)}</td>
                <td className="border border-black p-2.5" colSpan={4}></td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Disbursal & Signature Panel */}
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-6 leading-relaxed">
          
          {/* Left Column: Pengguna Anggaran */}
          <div className="space-y-1 text-center sm:text-left pl-4">
            <p className="text-[10px] italic text-gray-500">Tanggal di Keluarkan Uang</p>
            <div className="font-bold text-[11px] mt-2">
              <p>Mengetahui :</p>
              <p className="uppercase text-black">Pengguna Anggaran /</p>
              <p className="uppercase text-black">Kepala Dinas PUPR Kab. Nagekeo</p>
            </div>

            {/* If Digital, show QR Code on the left side */}
            {isDigital ? (
              <div className="my-4 flex items-center gap-3 justify-center sm:justify-start" id="payment-qr-container">
                <div className="border border-gray-300 p-1 bg-white inline-block">
                  <QRCodeSVG
                    value={verifyUrl}
                    size={64}
                    level="H"
                    includeMargin={true}
                    id="payment-qr-code"
                  />
                </div>
                <div className="text-4xs text-gray-500 font-mono leading-tight max-w-[150px] text-left">
                  <p className="text-emerald-700 font-bold">● TTD DIGITAL VALID</p>
                  <p className="mt-0.5 truncate">ID: {data.id}</p>
                  <p className="text-gray-400 mt-1">Scan untuk verifikasi keaslian bayar</p>
                </div>
              </div>
            ) : (
              <div className="my-10 h-14 border-b border-dashed border-gray-200 max-w-[200px] mx-auto sm:mx-0" id="payment-manual-sig-space-pa">
                <p className="text-4xs text-gray-300 select-none italic pt-10 text-center">Tanda tangan / Stempel Basah</p>
              </div>
            )}

            <div className="mt-4 font-bold leading-tight">
              <p className="underline uppercase tracking-wide text-black font-semibold text-[11px]">{data.penggunaAnggaranNama}</p>
              <p className="text-[10px] font-mono text-gray-800">NIP. {data.penggunaAnggaranNip}</p>
            </div>
          </div>

          {/* Right Column: Bendahara Pengeluaran */}
          <div className="space-y-1 text-center sm:text-right pr-4">
            <p className="text-[11px] text-black">Mbay, &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; {data.tanggalDikeluarkan}</p>
            <div className="font-bold text-[11px] mt-2">
              <p>&nbsp;</p>
              <p className="uppercase text-black">Bendahara Pengeluaran,</p>
            </div>

            {/* Manual signature space on right */}
            {isDigital ? (
              <div className="my-4 h-16 flex items-center justify-center sm:justify-end">
                <div className="text-center bg-green-50 border border-green-200 px-3 py-2 rounded-lg inline-block">
                  <span className="text-[9px] font-bold text-green-700 block uppercase">SUDAH DIBAYARKAN</span>
                  <span className="text-4xs font-mono text-green-600 block">Sistem Kas Bendahara PUPR</span>
                </div>
              </div>
            ) : (
              <div className="my-10 h-14 border-b border-dashed border-gray-200 max-w-[200px] mx-auto sm:ml-auto sm:mr-0" id="payment-manual-sig-space-bendahara">
                <p className="text-4xs text-gray-300 select-none italic pt-10 text-center">Tanda tangan / Stempel Basah</p>
              </div>
            )}

            <div className="mt-4 font-bold leading-tight">
              <p className="underline uppercase tracking-wide text-black font-semibold text-[11px]">{data.bendaharaNama}</p>
              <p className="text-[10px] font-mono text-gray-800">NIP. {data.bendaharaNip}</p>
            </div>
          </div>

        </div>

        {/* Footer info note */}
        {isDigital ? (
          <div className="mt-12 text-[9px] text-gray-400 font-mono text-center border-t border-dashed border-gray-300 pt-2 print:mt-8">
            Dokumen ini ditandatangani secara digital oleh Dinas Pekerjaan Umum dan Penataan Ruang Kabupaten Nagekeo.
            Kebenaran isi dokumen rincian pembayaran ini dapat divalidasi dengan memindai kode QR di atas.
          </div>
        ) : (
          <div className="mt-12 text-[9px] text-gray-400 font-mono text-center border-t border-dashed border-gray-300 pt-2 print:mt-8">
            Dokumen rincian pembayaran fisik Dinas Pekerjaan Umum dan Penataan Ruang Kabupaten Nagekeo. (Tanda Tangan Manual)
          </div>
        )}
      </div>
    </div>
  );
}
