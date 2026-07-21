import React, { useState, useEffect } from 'react';
import { decryptSignature } from '../lib/crypto';
import { DecryptedSignaturePayload } from '../types';
import NagekeoLogo from './NagekeoLogo';
import jsQR from 'jsqr';

export default function SignatureVerifier() {
  const [encryptedData, setEncryptedData] = useState('');
  const [pin, setPin] = useState('');
  const [decryptedPayload, setDecryptedPayload] = useState<DecryptedSignaturePayload | null>(null);
  const [error, setError] = useState('');
  const [isVerified, setIsVerified] = useState(false);

  // QR Image reader states
  const [activeTab, setActiveTab] = useState<'qr-image' | 'manual-text'>('qr-image');
  const [qrLoading, setQrLoading] = useState(false);
  const [qrError, setQrError] = useState('');
  const [qrSuccessMessage, setQrSuccessMessage] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // Auto-load from URL query parameters if available
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const dataParam = params.get('data');
    if (dataParam) {
      setEncryptedData(dataParam);
      setActiveTab('manual-text');
    }
  }, []);

  // Add paste event support so users can literally copy an image and paste it directly!
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      if (activeTab !== 'qr-image' || isVerified) return;
      const items = e.clipboardData?.items;
      if (!items) return;
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const file = items[i].getAsFile();
          if (file) {
            handleImageFile(file);
            break;
          }
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => {
      window.removeEventListener('paste', handlePaste);
    };
  }, [activeTab, isVerified]);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleImageFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleImageFile(e.target.files[0]);
    }
  };

  const handleImageFile = (file: File) => {
    if (!file) return;
    setQrLoading(true);
    setQrError('');
    setQrSuccessMessage('');
    setEncryptedData('');

    // Create preview
    const previewReader = new FileReader();
    previewReader.onload = () => {
      setImagePreview(previewReader.result as string);
    };
    previewReader.readAsDataURL(file);

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            setQrError('Gagal menginisialisasi mesin pembaca QR Code.');
            setQrLoading(false);
            return;
          }
          canvas.width = img.width;
          canvas.height = img.height;
          ctx.drawImage(img, 0, 0, img.width, img.height);
          
          const imageData = ctx.getImageData(0, 0, img.width, img.height);
          const code = jsQR(imageData.data, imageData.width, imageData.height);
          
          if (code) {
            let qrData = code.data;
            // Support URL-based QR codes or raw text
            try {
              if (qrData.includes('?data=')) {
                const urlObj = new URL(qrData);
                const dataParam = urlObj.searchParams.get('data');
                if (dataParam) {
                  qrData = dataParam;
                }
              }
            } catch (_) {
              // Raw signature is fine
            }
            
            setEncryptedData(qrData);
            setQrSuccessMessage('QR Code berhasil dideteksi dan dibaca secara otomatis!');
            setQrLoading(false);
          } else {
            setQrError('Tidak dapat mendeteksi QR Code dari gambar ini. Pastikan gambar memiliki pencahayaan cukup dan QR Code tidak buram/terpotong.');
            setQrLoading(false);
          }
        } catch (err) {
          console.error(err);
          setQrError('Terjadi kesalahan saat memproses gambar QR.');
          setQrLoading(false);
        }
      };
      img.onerror = () => {
        setQrError('Gagal memuat file gambar.');
        setQrLoading(false);
      };
      img.src = e.target?.result as string;
    };
    reader.onerror = () => {
      setQrError('Gagal membaca file gambar.');
      setQrLoading(false);
    };
    reader.readAsDataURL(file);
  };

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setDecryptedPayload(null);
    setIsVerified(false);

    if (!encryptedData) {
      setError('Mohon masukkan kode tanda tangan digital terenkripsi atau pindai gambar QR Code terlebih dahulu.');
      return;
    }

    if (!pin) {
      setError('Mohon masukkan PIN Admin / PIN Pejabat.');
      return;
    }

    const decrypted = decryptSignature(encryptedData, pin);
    if (decrypted) {
      setDecryptedPayload(decrypted);
      setIsVerified(true);
    } else {
      setError('PIN Salah atau Data Tanda Tangan tidak valid / telah dirubah!');
    }
  };

  const handleClear = () => {
    setEncryptedData('');
    setPin('');
    setDecryptedPayload(null);
    setError('');
    setIsVerified(false);
    setImagePreview(null);
    setQrSuccessMessage('');
    setQrError('');
    // Clear URL parameters
    window.history.replaceState({}, document.title, window.location.pathname);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-between" id="verifier-page">
      {/* Navbar / Top Bar */}
      <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50 px-4 py-3 sm:px-6">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <NagekeoLogo size={42} />
            <div>
              <h1 className="text-sm font-bold tracking-wider uppercase text-white">E-SPPD Kabupaten Nagekeo</h1>
              <p className="text-3xs text-emerald-400 font-mono tracking-widest">PORTAL VERIFIKASI DIGITAL</p>
            </div>
          </div>
          <a
            href="/"
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg text-xs font-semibold transition"
          >
            Kembali ke Dashboard
          </a>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-2xl w-full mx-auto p-4 sm:p-6 flex flex-col justify-center">
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 sm:p-8 shadow-2xl space-y-6">
          <div className="text-center space-y-2 border-b border-slate-800 pb-5">
            <span className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-full text-3xs font-mono font-semibold tracking-wider uppercase">
              Tanda Tangan Digital PUPR Nagekeo
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-white">E-Signature Authenticator</h2>
            <p className="text-xs sm:text-sm text-slate-400">
              Validasi dokumen dinas asli dengan mendekripsi digital signature QR Code menggunakan PIN Pejabat atau PIN Admin resmi.
            </p>
          </div>
 
          {!isVerified ? (
            <div className="space-y-5">
              {/* Tabs header */}
              <div className="flex border-b border-slate-850">
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('qr-image');
                    setQrError('');
                  }}
                  className={`flex-1 pb-3 text-xs font-extrabold tracking-wider uppercase text-center border-b-2 transition cursor-pointer ${
                    activeTab === 'qr-image'
                      ? 'border-emerald-500 text-emerald-400 font-black'
                      : 'border-transparent text-slate-400 hover:text-slate-300'
                  }`}
                >
                  📸 Pindai Foto QR Code
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('manual-text');
                    setQrError('');
                  }}
                  className={`flex-1 pb-3 text-xs font-extrabold tracking-wider uppercase text-center border-b-2 transition cursor-pointer ${
                    activeTab === 'manual-text'
                      ? 'border-emerald-500 text-emerald-400 '
                      : 'border-transparent text-slate-400 hover:text-slate-300'
                  }`}
                >
                  📋 Tempel Kode Teks
                </button>
              </div>

              <form onSubmit={handleVerify} className="space-y-5" id="form-verify-signature">
                {/* QR Image tab */}
                {activeTab === 'qr-image' && (
                  <div className="space-y-4">
                    <div
                      onDragEnter={handleDrag}
                      onDragOver={handleDrag}
                      onDragLeave={handleDrag}
                      onDrop={handleDrop}
                      className={`border-2 border-dashed rounded-xl p-6 text-center transition relative overflow-hidden ${
                        dragActive
                          ? 'border-emerald-500 bg-emerald-500/5'
                          : imagePreview
                          ? 'border-emerald-600/30 bg-slate-900/40'
                          : 'border-slate-800 hover:border-slate-700 bg-slate-900/25'
                      }`}
                    >
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                        id="qr-file-input"
                      />

                      {imagePreview ? (
                        <div className="space-y-3 flex flex-col items-center">
                          <img
                            src={imagePreview}
                            alt="QR Code Preview"
                            className="max-h-32 object-contain rounded-lg border border-slate-800 shadow-md"
                          />
                          <div className="text-3xs text-slate-400 uppercase tracking-widest font-bold">
                            Foto Terpilih. Klik / Seret gambar lain untuk mengganti
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-2.5 py-4">
                          <div className="text-3xl text-emerald-500">📥</div>
                          <p className="text-xs font-bold text-slate-300">
                            Pilih Foto QR Code, atau Tarik & Lepas file ke sini
                          </p>
                          <p className="text-[11px] text-slate-500">
                            Tips: Anda juga bisa mengambil screenshot QR lalu menempelkannya (Ctrl+V) langsung di halaman ini!
                          </p>
                        </div>
                      )}
                    </div>

                    {/* QR Decoding status/errors */}
                    {qrLoading && (
                      <div className="flex items-center justify-center gap-2 p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-lg text-xs font-semibold text-indigo-300">
                        <div className="w-4.5 h-4.5 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin"></div>
                        Sedang memproses & membaca QR Code...
                      </div>
                    )}

                    {qrError && (
                      <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-xs font-medium text-center">
                        ⚠️ {qrError}
                      </div>
                    )}

                    {qrSuccessMessage && (
                      <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg text-xs font-medium text-center">
                        ✨ {qrSuccessMessage}
                      </div>
                    )}

                    {/* Read payload preview */}
                    {encryptedData && (
                      <div className="space-y-1.5">
                        <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">
                          Isi Enkripsi Digital Signature
                        </span>
                        <div className="p-3 bg-slate-900 border border-slate-850 text-slate-300 rounded-lg text-3xs font-mono break-all max-h-24 overflow-y-auto relative">
                          <span className="absolute top-1.5 right-1.5 bg-emerald-500/20 text-emerald-300 text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">
                            Terbaca
                          </span>
                          {encryptedData}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Manual Text tab */}
                {activeTab === 'manual-text' && (
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest">
                      Payload Digital Signature (Terenkripsi)
                    </label>
                    <textarea
                      value={encryptedData}
                      onChange={(e) => setEncryptedData(e.target.value)}
                      className="w-full p-3 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-200 font-mono focus:ring-1 focus:ring-emerald-500 focus:outline-none focus:border-emerald-500"
                      rows={5}
                      placeholder="Tempelkan block text enkripsi di sini..."
                    />
                    {encryptedData && (
                      <div className="text-[10px] text-emerald-400 font-mono text-right font-bold">
                        ✓ {encryptedData.length} Karakter Terpasang
                      </div>
                    )}
                  </div>
                )}

                {/* Enter PIN */}
                <div className="space-y-1.5 pt-1">
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest">
                  PIN Tanda Tangan / PIN Otorisasi
                </label>
                <input
                  type="password"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-lg text-sm text-center text-white font-mono tracking-widest focus:ring-1 focus:ring-emerald-500 focus:outline-none focus:border-emerald-500"
                  placeholder="••••••"
                  maxLength={12}
                  required
                  id="input-verify-pin"
                />
              </div>

              {/* Error Message */}
              {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-xs font-semibold text-center" id="verify-error-msg">
                  ⚠️ {error}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-2 pt-2">
                {encryptedData && (
                  <button
                    type="button"
                    onClick={handleClear}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-bold transition"
                  >
                    Reset Input
                  </button>
                )}
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-sm transition shadow-lg shadow-emerald-900/30 flex items-center justify-center gap-2"
                  id="btn-verify-submit"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M2.166 4.9L10 1.154l7.834 3.746A1 1 0 0118.5 5.8v4.2c0 5.545-4.42 8.767-8.166 9.873a1 1 0 01-.668 0C5.92 18.767 1.5 15.545 1.5 10V5.8a1 1 0 01.666-.9zM10 3.154L3.5 6.262v3.938c0 4.544 3.486 7.158 6.5 8.16 3.014-1.002 6.5-3.616 6.5-8.16V6.262L10 3.154zm1.293 6.139a1 1 0 010 1.414l-3 3a1 1 0 01-1.414 0l-1.5-1.5a1 1 0 111.414-1.414L8 11.586l2.293-2.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Buka Dekripsi & Validasi
                </button>
              </div>
            </form>
          </div>
          ) : (
            // Decrypted Verification Result
            <div className="space-y-5 animate-fade-in" id="decrypted-result">
              {/* Authentic Status */}
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-xl text-center space-y-1">
                <span className="text-2xl">✅</span>
                <h3 className="text-lg font-black text-white">TANDA TANGAN DIGITAL VALID & ASLI</h3>
                <p className="text-2xs sm:text-xs text-emerald-400/90 max-w-sm mx-auto">
                  Diverifikasi secara kriptografis oleh Dinas Pekerjaan Umum dan Penataan Ruang Kab. Nagekeo.
                </p>
              </div>

              {/* Document Metadata Details */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 sm:p-5 space-y-3.5 text-xs sm:text-sm">
                <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                  <span className="font-bold text-slate-400">Jenis Dokumen</span>
                  <span className="px-2.5 py-0.5 bg-indigo-500/20 text-indigo-300 rounded font-bold font-mono uppercase tracking-wider text-2xs">
                    {decryptedPayload?.type}
                  </span>
                </div>

                <div className="flex justify-between items-start border-b border-slate-800 pb-2 gap-2">
                  <span className="font-bold text-slate-400 whitespace-nowrap">ID Register</span>
                  <span className="font-mono text-slate-200 text-right break-all">{decryptedPayload?.docId}</span>
                </div>

                <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                  <span className="font-bold text-slate-400">Nomor Surat</span>
                  <span className="font-semibold text-slate-200 text-right">{decryptedPayload?.nomor}</span>
                </div>

                <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                  <span className="font-bold text-slate-400">Nama Pegawai</span>
                  <span className="font-semibold text-emerald-300 text-right">{decryptedPayload?.details?.namaPegawai}</span>
                </div>

                <div className="flex justify-between items-start border-b border-slate-800 pb-2 gap-2">
                  <span className="font-bold text-slate-400 whitespace-nowrap">Keperluan</span>
                  <span className="text-slate-300 text-right italic">{decryptedPayload?.details?.keperluan}</span>
                </div>

                <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                  <span className="font-bold text-slate-400">Tempat Tujuan</span>
                  <span className="font-semibold text-slate-200 text-right">{decryptedPayload?.details?.tempatTujuan}</span>
                </div>

                <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                  <span className="font-bold text-slate-400">Periode Tugas</span>
                  <span className="font-semibold text-slate-200 text-right">
                    {decryptedPayload?.details?.tanggalBerangkat} s/d {decryptedPayload?.details?.tanggalKembali}
                  </span>
                </div>

                <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                  <span className="font-bold text-slate-400">Penandatangan</span>
                  <span className="font-semibold text-slate-200 text-right">{decryptedPayload?.signedBy}</span>
                </div>

                <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                  <span className="font-bold text-slate-400">Tgl Penandatanganan</span>
                  <span className="font-semibold text-slate-200 text-right">{decryptedPayload?.signedDate}</span>
                </div>

                <div className="flex justify-between items-start pt-1 gap-2">
                  <span className="font-bold text-slate-400 whitespace-nowrap">Integritas Hash (SHA256)</span>
                  <span className="font-mono text-3xs text-slate-500 break-all text-right">{decryptedPayload?.hash}</span>
                </div>
              </div>

              {/* Return Button */}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleClear}
                  className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-lg text-xs transition"
                >
                  Selesai & Verifikasi Dokumen Lain
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Footer Area */}
      <footer className="border-t border-slate-800 bg-slate-950 px-4 py-4 text-center text-3xs text-slate-500 font-mono">
        &copy; 2026 Dinas Pekerjaan Umum dan Penataan Ruang Kab. Nagekeo. All Rights Reserved.
        <br />
        Dibuat untuk penjaminan keaslian administrasi dan efisiensi perjalanan dinas daerah.
      </footer>
    </div>
  );
}
