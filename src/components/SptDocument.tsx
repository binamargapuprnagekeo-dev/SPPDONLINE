import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { SptData } from '../types';
import NagekeoLogo from './NagekeoLogo';

interface SptDocumentProps {
  data: SptData;
  onClose?: () => void;
}

export default function SptDocument({ data, onClose }: SptDocumentProps) {
  const [isDigital, setIsDigital] = useState(true);
  const verifyUrl = `${window.location.origin}/verify?data=${encodeURIComponent(data.encryptedSignature)}`;

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

  return (
    <div className="bg-white p-2 sm:p-6 max-w-4xl mx-auto shadow-lg border border-gray-200 rounded-lg print:shadow-none print:border-none print:p-0" id="spt-print-view">
      {/* Control Actions (Hidden on Print) */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 pb-4 border-b border-gray-100 print:hidden bg-slate-50 p-4 rounded-xl border border-slate-150">
        <div>
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide">Opsi Cetak Surat Perintah Tugas (SPT)</h3>
          <p className="text-3xs sm:text-2xs text-slate-500 mt-0.5">Pilih cetak digital dengan QRCode atau cetak manual konvensional untuk tanda tangan basah.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {onClose && (
            <button
              onClick={onClose}
              className="px-3.5 py-2 border border-gray-300 rounded-lg text-xs font-semibold text-gray-700 bg-white hover:bg-gray-50 transition"
              id="btn-close-spt"
            >
              Kembali
            </button>
          )}
          <button
            onClick={printManual}
            className="px-3.5 py-2 bg-slate-600 text-white rounded-lg text-xs font-bold hover:bg-slate-700 transition flex items-center gap-1.5"
            id="btn-print-spt-manual"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
            Cetak Manual (Basah)
          </button>
          <button
            onClick={printDigital}
            className="px-3.5 py-2 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700 transition flex items-center gap-1.5 shadow-sm shadow-emerald-200"
            id="btn-print-spt-digital"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1.003 1.003 0 001-1V5a1.003 1.003 0 00-1-1H5a1.003 1.003 0 00-1 1v2a1.003 1.003 0 001 1zm12 0h2a1.003 1.003 0 001-1V5a1.003 1.003 0 00-1-1h-2a1.003 1.003 0 00-1 1v2a1.003 1.003 0 001 1zM5 20h2a1.003 1.003 0 001-1v-2a1.003 1.003 0 00-1-1H5a1.003 1.003 0 00-1 1v2a1.003 1.003 0 001 1z" />
            </svg>
            Cetak dengan TTD Digital
          </button>
        </div>
      </div>

      {/* Document Area */}
      <div className="bg-white text-black p-4 sm:p-8 font-sans leading-relaxed text-xs sm:text-sm print:p-0">
        
        {/* Header Section */}
        <div className="flex items-center border-b-[3px] border-black pb-3 mb-4">
          <div className="w-16 h-16 flex-shrink-0 flex items-center justify-center">
            <NagekeoLogo size={60} />
          </div>
          <div className="flex-1 text-center font-bold px-4">
            <h1 className="text-sm sm:text-base tracking-wide text-black uppercase">Pemerintah Kabupaten Nagekeo</h1>
            <h2 className="text-base sm:text-lg text-black uppercase leading-tight font-extrabold">Sekretariat Daerah</h2>
            <p className="text-2xs sm:text-xs font-normal italic text-gray-700">Kompleks Civic Center - No......... Telp. ......</p>
            <p className="text-xs sm:text-sm text-black tracking-widest uppercase">MBAY</p>
          </div>
          <div className="w-16"></div> {/* Spacer to keep center balanced */}
        </div>

        {/* Title Block */}
        <div className="text-center mb-6">
          <h2 className="text-sm sm:text-base font-bold uppercase tracking-wider underline decoration-1" id="spt-title">
            SURAT PERINTAH TUGAS
          </h2>
          <p className="text-xs sm:text-sm font-medium mt-1">
            Nomor : {data.nomor || '000.1.2.3/BU-NGK/1551/06/2026'}
          </p>
        </div>

        {/* Introduction / Dasar */}
        <div className="mb-4 flex items-start">
          <span className="font-semibold w-20 flex-shrink-0">Dasar :</span>
          <span className="flex-1 text-justify italic">{data.dasar || 'Undangan Verifikasi dan Validasi Usulan Penanganan Jalan Daerah melalui Skema Inpres Nomor 11 Tahun 2025'}</span>
        </div>

        <div className="mb-3">
          <p className="font-semibold">Dengan ini ditugaskan kepada :</p>
        </div>

        {/* Personnel Table */}
        <div className="border border-black mb-6">
          <table className="w-full border-collapse text-xs sm:text-sm text-left">
            <thead>
              <tr className="border-b border-black bg-gray-50 text-center font-bold">
                <th className="p-2 border-r border-black w-10">No.</th>
                <th className="p-2 border-r border-black w-2/5">Nama / NIP</th>
                <th className="p-2 border-r border-black w-1/4">Pangkat/Gol</th>
                <th className="p-2">Jabatan</th>
              </tr>
            </thead>
            <tbody>
              {data.tugaskanKepada && data.tugaskanKepada.length > 0 ? (
                data.tugaskanKepada.map((p, idx) => (
                  <tr key={idx} className={idx < data.tugaskanKepada.length - 1 ? "border-b border-black" : ""}>
                    <td className="p-2 border-r border-black text-center font-medium">{idx + 1}</td>
                    <td className="p-2 border-r border-black font-semibold">
                      {p.nama}
                      <span className="block font-normal text-gray-700 mt-0.5">NIP. {p.nip || '-'}</span>
                    </td>
                    <td className="p-2 border-r border-black">{p.pangkatGol || '-'}</td>
                    <td className="p-2">{p.jabatan || '-'}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="p-2 border-r border-black text-center">-</td>
                  <td className="p-2 border-r border-black">-</td>
                  <td className="p-2 border-r border-black">-</td>
                  <td className="p-2">-</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Details Table */}
        <div className="border border-black overflow-hidden mb-6">
          <table className="w-full border-collapse text-xs sm:text-sm text-left">
            <tbody>
              <tr className="border-b border-black">
                <td className="p-3 w-1/3 border-r border-black font-semibold">Keperluan</td>
                <td className="p-3 italic text-justify">{data.keperluan}</td>
              </tr>
              <tr className="border-b border-black">
                <td className="p-3 border-r border-black font-semibold">Tempat Tujuan</td>
                <td className="p-3 font-medium">{data.tempatTujuan}</td>
              </tr>
              <tr className="border-b border-black">
                <td className="p-3 border-r border-black font-semibold">Tanggal berangkat</td>
                <td className="p-3">{data.tanggalBerangkat}</td>
              </tr>
              <tr className="border-b border-black">
                <td className="p-3 border-r border-black font-semibold">Tanggal harus kembali</td>
                <td className="p-3">{data.tanggalKembali}</td>
              </tr>
              <tr className="border-b border-black">
                <td className="p-3 border-r border-black font-semibold">Alat Angkut yang digunakan</td>
                <td className="p-3">{data.alatAngkut}</td>
              </tr>
              <tr>
                <td className="p-3 border-r border-black font-semibold">Pembebanan Anggaran</td>
                <td className="p-3 text-gray-700">{data.pembebananAnggaran}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Closing Paragraph */}
        <div className="mb-8 text-justify leading-relaxed text-xs sm:text-sm">
          Demikian Surat Perintah Tugas ini dibuat, untuk dilaksanakan dan dipergunakan sebagaimana mestinya, dan setelah selesai menjalankan Surat Perintah Tugas ini diharuskan menyampaikan hasil laporan kepada yang memberikan tugas.
        </div>

        {/* Footer Signature Block */}
        <div className="mt-8 flex justify-between items-start">
          <div className="w-1/2">
            {/* Left side space */}
          </div>
          <div className="w-1/2 text-left pl-10 text-xs sm:text-sm">
            <p>Ditetapkan di : {data.ditetapkanDi}</p>
            <p>Pada Tanggal : {data.tanggalDitetapkan}</p>
            
            <div className="mt-4 font-bold leading-snug">
              <p>Kepala Dinas Pekerjaan Umum</p>
              <p>dan Penataan Ruang Kab. Nagekeo</p>
            </div>

            {/* Conditional Signature View */}
            {isDigital ? (
              <div className="my-3 flex items-center gap-3" id="spt-qr-container">
                <div className="border border-gray-300 p-1 bg-white inline-block">
                  <QRCodeSVG
                    value={verifyUrl}
                    size={76}
                    level="H"
                    includeMargin={true}
                    id="spt-qr-code"
                  />
                </div>
                <div className="text-3xs sm:text-2xs text-gray-500 font-mono leading-tight max-w-[160px]">
                  <p className="text-green-700 font-bold">● TANDA TANGAN DIGITAL</p>
                  <p className="mt-0.5">ID: {data.id}</p>
                  <p className="truncate">Enc: {data.encryptedSignature.substring(0, 16)}...</p>
                  <p className="text-gray-400 mt-1">Scan untuk verifikasi dokumen asli</p>
                </div>
              </div>
            ) : (
              <div className="my-8 h-16 border-b border-dashed border-gray-200 max-w-[200px]" id="spt-manual-sig-space">
                {/* Physical wet signature space */}
                <p className="text-4xs text-gray-300 select-none italic pt-12 text-center">Tanda tangan / Stempel Basah</p>
              </div>
            )}

            <div className="mt-4 font-bold leading-tight">
              <p className="underline uppercase tracking-wide text-black">{data.penandatanganNama}</p>
              <p className="font-normal text-gray-800 text-xs">{data.penandatanganPangkat}</p>
              <p className="font-normal text-gray-800 text-xs">{data.penandatanganNip}</p>
            </div>
          </div>
        </div>

        {/* Document Footer Note */}
        {isDigital ? (
          <div className="mt-12 text-[9px] text-gray-400 font-mono text-center border-t border-dashed border-gray-300 pt-2 print:mt-8" id="spt-footer-note">
            Dokumen ini ditandatangani secara digital oleh Dinas Pekerjaan Umum dan Penataan Ruang Kabupaten Nagekeo.
            Kebenaran isi dokumen dapat divalidasi dengan memindai kode QR di atas.
          </div>
        ) : (
          <div className="mt-12 text-[9px] text-gray-400 font-mono text-center border-t border-dashed border-gray-300 pt-2 print:mt-8" id="spt-footer-note-manual">
            Dokumen fisik Dinas Pekerjaan Umum dan Penataan Ruang Kabupaten Nagekeo. (Tanda Tangan Manual)
          </div>
        )}
      </div>
    </div>
  );
}
