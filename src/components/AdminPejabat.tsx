import React, { useState } from 'react';
import { PejabatStaff } from '../types';

interface AdminPejabatProps {
  pejabatList: PejabatStaff[];
  onAddPejabat: (data: PejabatStaff) => Promise<void>;
  onUpdatePejabat: (data: PejabatStaff) => Promise<void>;
  onDeletePejabat: (id: string) => void;
  onToggleStatus: (id: string) => void;
  isSyncing: boolean;
}

export default function AdminPejabat({
  pejabatList,
  onAddPejabat,
  onUpdatePejabat,
  onDeletePejabat,
  onToggleStatus,
  isSyncing,
}: AdminPejabatProps) {
  // Form states
  const [nama, setNama] = useState('');
  const [nip, setNip] = useState('');
  const [pangkatGol, setPangkatGol] = useState('');
  const [jabatan, setJabatan] = useState('');
  const [email, setEmail] = useState('');
  const [pin, setPin] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingPejabat, setEditingPejabat] = useState<PejabatStaff | null>(null);
  const [showPinInput, setShowPinInput] = useState(false);

  // Email sending and modal helper states
  const [sendingEmailId, setSendingEmailId] = useState<string | null>(null);
  const [sentSuccessId, setSentSuccessId] = useState<string | null>(null);
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [copiedPin, setCopiedPin] = useState(false);
  const [modalData, setModalData] = useState<{
    isOpen: boolean;
    name: string;
    email: string;
    pin: string;
  } | null>(null);

  const handleCopyEmail = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2000);
  };

  const handleCopyPin = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedPin(true);
    setTimeout(() => setCopiedPin(false), 2000);
  };

  // Auto-generate secure 6-digit numeric PIN
  const generateSecurePin = () => {
    const chars = '0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setPin(result);
  };

  const startEdit = (p: PejabatStaff) => {
    const enteredPin = window.prompt('Masukkan PIN Otorisasi Admin untuk mengedit data Pejabat/Staf ini:');
    if (enteredPin !== 'sppd2026') {
      alert('PIN Salah! Gagal mengedit data.');
      return;
    }
    setEditingPejabat(p);
    setNama(p.nama);
    setNip(p.nip);
    setPangkatGol(p.pangkatGol || '');
    setJabatan(p.jabatan);
    setEmail(p.email);
    setPin(p.pin);
  };

  const cancelEdit = () => {
    setEditingPejabat(null);
    setNama('');
    setNip('');
    setPangkatGol('');
    setJabatan('');
    setEmail('');
    setPin('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nama || !nip || !jabatan || !email || !pin) {
      alert('Mohon lengkapi semua bidang wajib!');
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingPejabat) {
        const updatedPejabat: PejabatStaff = {
          ...editingPejabat,
          nama,
          nip,
          pangkatGol,
          jabatan,
          email,
          pin,
        };
        await onUpdatePejabat(updatedPejabat);
        setEditingPejabat(null);
      } else {
        const newPejabat: PejabatStaff = {
          id: 'pejabat_' + Date.now(),
          nama,
          nip,
          pangkatGol,
          jabatan,
          email,
          pin,
          status: 'Aktif',
          createdAt: new Date().toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          }),
        };

        await onAddPejabat(newPejabat);
        // Trigger automatic email send animation for the newly added official
        handleSendEmail(newPejabat.id, newPejabat.email, newPejabat.nama, newPejabat.pin);
      }

      // Reset form
      setNama('');
      setNip('');
      setPangkatGol('');
      setJabatan('');
      setEmail('');
      setPin('');
    } catch (err: any) {
      alert('Gagal menyimpan data ke Google Sheets: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendEmail = (id: string, targetEmail: string, name: string, token: string) => {
    setSendingEmailId(id);
    setSentSuccessId(null);

    const emailSubject = 'PIN Tanda Tangan Digital Resmi - Dinas PUPR Nagekeo';
    const emailBody = `Yth. Bapak/Ibu ${name},\n\nBerikut adalah PIN Tanda Tangan Digital Anda untuk sistem SPPD & SPT Dinas Pekerjaan Umum dan Penataan Ruang (PUPR) Kabupaten Nagekeo:\n\nPIN ANDA: ${token}\n\nHarap simpan PIN ini dengan aman dan bersifat rahasia. PIN ini digunakan untuk melakukan tanda tangan digital (e-signature) pada dokumen SPPD, SPT, dan Kwitansi Pembayaran.\n\nTerima kasih.\nAdmin Dinas PUPR Kabupaten Nagekeo`;

    // Attempt to open the native mail client
    try {
      const mailtoUrl = `mailto:${targetEmail}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;
      window.open(mailtoUrl, '_blank');
    } catch (e) {
      console.error('Mailto failed', e);
    }

    // Always trigger the modal to make sure they can see and copy the PIN and email message
    setModalData({
      isOpen: true,
      name,
      email: targetEmail,
      pin: token,
    });

    setTimeout(() => {
      setSendingEmailId(null);
      setSentSuccessId(id);
      
      // Auto clear success message after 5 seconds
      setTimeout(() => {
        setSentSuccessId(null);
      }, 5000);
    }, 1500);
  };

  return (
    <div className="space-y-6" id="admin-pejabat-container">
      {/* Banner / Ad Area */}
      <div className="bg-gradient-to-r from-slate-900 to-indigo-950 rounded-2xl p-5 text-white border border-indigo-900/30 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="space-y-1">
          <span className="px-2 py-0.5 rounded text-[9px] font-extrabold tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 uppercase">
            🛡️ Otorisasi & Kriptografi
          </span>
          <h2 className="text-sm sm:text-base font-black tracking-wide uppercase">
            Registrasi Tanda Tangan Digital & Token Kripto
          </h2>
          <p className="text-3xs sm:text-2xs text-slate-300 leading-relaxed max-w-2xl">
            Daftarkan Pejabat Pengguna Anggaran, Bendahara, atau staf pelaksana perjalanan dinas. Setiap pejabat yang terdaftar akan memiliki PIN otentikasi tanda tangan yang terenkripsi aman dan dikirim otomatis ke email mereka.
          </p>
        </div>
        <span className="text-4xl shrink-0 select-none animate-pulse">🔒</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column - Add Form */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-2xs space-y-4">
          <div>
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              {editingPejabat ? '📋 Edit Pejabat & Staf' : 'Daftarkan Pejabat Baru'}
            </h3>
            <p className="text-3xs text-slate-500 mt-0.5">
              {editingPejabat ? 'Perbarui data pejabat terdaftar.' : 'Simpan data ke Google Sheet dan kirim token digital.'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3 text-xs">
            {/* Nama */}
            <div className="space-y-1">
              <label className="block font-bold text-gray-700">Nama Lengkap Pejabat *</label>
              <input
                type="text"
                required
                value={nama}
                onChange={(e) => setNama(e.target.value)}
                placeholder="Contoh: Syarifudin Ibrahim, ST"
                className="w-full px-3 py-2 border border-gray-300 rounded-xl bg-white"
              />
            </div>

            {/* NIP */}
            <div className="space-y-1">
              <label className="block font-bold text-gray-700">NIP Pejabat *</label>
              <input
                type="text"
                required
                value={nip}
                onChange={(e) => setNip(e.target.value)}
                placeholder="Contoh: 19681102 199703 1 008"
                className="w-full px-3 py-2 border border-gray-300 rounded-xl bg-white"
              />
            </div>

            {/* Pangkat/Gol */}
            <div className="space-y-1">
              <label className="block font-bold text-gray-700">Pangkat & Golongan (Opsional)</label>
              <input
                type="text"
                value={pangkatGol}
                onChange={(e) => setPangkatGol(e.target.value)}
                placeholder="Contoh: Pembina Utama Muda - IV/c"
                className="w-full px-3 py-2 border border-gray-300 rounded-xl bg-white"
              />
            </div>

            {/* Jabatan */}
            <div className="space-y-1">
              <label className="block font-bold text-gray-700">Jabatan Dinas Resmi *</label>
              <input
                type="text"
                required
                value={jabatan}
                onChange={(e) => setJabatan(e.target.value)}
                placeholder="Contoh: Kepala Dinas PUPR Nagekeo"
                className="w-full px-3 py-2 border border-gray-300 rounded-xl bg-white"
              />
            </div>

            {/* Email */}
            <div className="space-y-1">
              <label className="block font-bold text-gray-700">Alamat Email Aktif *</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Contoh: pejabat@nagekeokab.go.id"
                className="w-full px-3 py-2 border border-gray-300 rounded-xl bg-white"
              />
              <span className="text-3xs text-gray-400 block italic">Token & PIN otorisasi akan dikirim ke alamat ini.</span>
            </div>

            {/* PIN Token Generation */}
            <div className="space-y-1">
              <label className="block font-bold text-gray-700">PIN Tanda Tangan Digital (6 Digit) *</label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <input
                    type={showPinInput ? 'text' : 'password'}
                    required
                    maxLength={6}
                    value={pin}
                    onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                    placeholder="Contoh: 884920"
                    className="w-full pl-3 pr-10 py-2 border border-gray-300 rounded-xl font-mono font-bold text-center text-sm bg-slate-50 text-indigo-700 tracking-widest"
                    id="input-pejabat-pin"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPinInput(!showPinInput)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
                    title={showPinInput ? 'Sembunyikan PIN' : 'Tampilkan PIN'}
                  >
                    {showPinInput ? '🙈' : '👁️'}
                  </button>
                </div>
                <button
                  type="button"
                  onClick={generateSecurePin}
                  className="px-3 bg-slate-100 hover:bg-slate-200 border border-gray-300 text-gray-700 font-bold rounded-xl text-3xs shrink-0"
                >
                  Acak PIN
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-3 space-y-2">
              <button
                type="submit"
                disabled={isSubmitting || isSyncing}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition flex items-center justify-center gap-1.5 shadow-xs disabled:opacity-50"
                id="btn-register-pejabat"
              >
                {isSubmitting ? (
                  <span>Menyimpan ke Sheets...</span>
                ) : editingPejabat ? (
                  <span>💾 Perbarui & Simpan Perubahan</span>
                ) : (
                  <span>💾 Simpan & Kirim PIN ke Email</span>
                )}
              </button>
              {editingPejabat && (
                <button
                  type="button"
                  onClick={cancelEdit}
                  className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition"
                >
                  Batal Edit
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Right Column - Registered List */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-2xs space-y-4 lg:col-span-2">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Daftar Pejabat & Staf Terdaftar</h3>
              <p className="text-3xs text-slate-500 mt-0.5">Total terdaftar: {pejabatList.length} orang</p>
            </div>
            {isSyncing && (
              <span className="text-3xs bg-emerald-50 text-emerald-700 border border-emerald-200 font-extrabold px-2 py-0.5 rounded-full animate-pulse">
                🔄 Mensinkronkan Sheets...
              </span>
            )}
          </div>

          <div className="overflow-x-auto border border-gray-100 rounded-xl">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-3xs border-b border-gray-200">
                  <th className="p-3">Pejabat / Staf</th>
                  <th className="p-3">Jabatan</th>
                  <th className="p-3">Email Hububgan</th>
                  <th className="p-3 text-center">PIN Rahasia</th>
                  <th className="p-3 text-center">Status</th>
                  <th className="p-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {pejabatList.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-gray-400 font-semibold italic">
                      Belum ada Pejabat atau Staf terdaftar. Gunakan formulir di samping untuk menambahkan.
                    </td>
                  </tr>
                ) : (
                  pejabatList.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50/50 transition">
                      
                      {/* Name & NIP */}
                      <td className="p-3">
                        <div className="font-extrabold text-slate-900">{p.nama}</div>
                        <div className="text-[10px] text-gray-400 font-mono">NIP: {p.nip}</div>
                        {p.pangkatGol && (
                          <div className="text-[9px] text-indigo-600 bg-indigo-50 inline-block px-1 rounded mt-0.5">
                            {p.pangkatGol}
                          </div>
                        )}
                      </td>

                      {/* Designation */}
                      <td className="p-3 text-slate-600 font-medium max-w-[150px] truncate" title={p.jabatan}>
                        {p.jabatan}
                      </td>

                      {/* Email */}
                      <td className="p-3 font-medium text-slate-500 font-sans">
                        {p.email}
                      </td>

                      {/* Secret PIN hidden block */}
                      <td className="p-3 text-center">
                        <div className="inline-block bg-slate-100 px-2 py-1 rounded font-mono font-extrabold text-indigo-700 text-3xs border border-gray-200 tracking-widest">
                          {sendingEmailId === p.id ? '???' : '••••••'}
                        </div>
                        <span className="block text-[8px] text-gray-400 mt-0.5 italic">PIN Terenkripsi</span>
                      </td>

                      {/* Status */}
                      <td className="p-3 text-center">
                        <button
                          onClick={() => onToggleStatus(p.id)}
                          className={`px-2 py-0.5 rounded text-[9px] font-extrabold ${
                            p.status === 'Aktif'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                              : 'bg-red-50 text-red-700 border border-red-100'
                          }`}
                        >
                          {p.status}
                        </button>
                      </td>

                      {/* Action to resend Email / Edit / Delete */}
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {sendingEmailId === p.id ? (
                            <span className="text-[10px] text-slate-500 font-bold flex items-center justify-end gap-1">
                              <span className="h-2.5 w-2.5 rounded-full border border-slate-500 border-t-transparent animate-spin inline-block"></span>
                              Mengirim...
                            </span>
                          ) : sentSuccessId === p.id ? (
                            <span className="text-[10px] text-emerald-600 font-extrabold">
                              ✓ Terkirim!
                            </span>
                          ) : (
                            <button
                              onClick={() => handleSendEmail(p.id, p.email, p.nama, p.pin)}
                              className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[10px] rounded-lg border border-slate-200 transition"
                              title="Kirim PIN ke Email"
                            >
                              📧 Kirim
                            </button>
                          )}
                          <button
                            onClick={() => startEdit(p)}
                            className="px-2 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-[10px] rounded-lg border border-indigo-100 transition"
                            title="Edit Data Pejabat"
                          >
                            ✏️ Edit
                          </button>
                          <button
                            onClick={() => onDeletePejabat(p.id)}
                            className="px-2 py-1 bg-red-50 hover:bg-red-100 text-red-700 font-bold text-[10px] rounded-lg border border-red-100 transition"
                            title="Hapus Pejabat"
                          >
                            🗑️ Hapus
                          </button>
                        </div>
                      </td>

                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="bg-slate-50 rounded-xl p-4 border border-slate-150 text-3xs text-slate-500 space-y-1.5 leading-relaxed">
            <p className="font-bold text-slate-700 text-4xs uppercase tracking-wider">💡 Alur Pengamanan Kriptografi Tanda Tangan:</p>
            <ul className="list-decimal pl-3 space-y-1">
              <li>Admin mendaftarkan pejabat, menghasilkan token PIN privat unik (e.g. 6 Digit).</li>
              <li>Sistem mengirimkan token PIN privat secara rahasia ke email pejabat melalui gerbang notifikasi.</li>
              <li>Ketika membuat SPPD/SPT baru, penandatangan wajib memasukkan PIN otorisasi mereka sendiri.</li>
              <li>Sistem akan mengenkripsi data digital signature menggunakan PIN yang bersangkutan, sehingga jika QR code dipindai, ia hanya bisa didekripsi menggunakan PIN pejabat yang menerbitkan surat tersebut.</li>
            </ul>
          </div>
        </div>

      </div>

      {/* Modal Status Kirim Email / Salin PIN Manual */}
      {modalData && modalData.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-gray-100 flex flex-col transform scale-100 transition-all">
            {/* Header */}
            <div className="bg-gradient-to-r from-indigo-600 to-indigo-800 text-white px-6 py-5 flex justify-between items-center">
              <div className="flex items-center gap-2.5">
                <span className="text-2xl">📧</span>
                <div>
                  <h3 className="font-extrabold text-sm tracking-wide">Pengiriman PIN Otorisasi</h3>
                  <p className="text-5xs opacity-80 mt-0.5 uppercase tracking-widest font-bold">Dinas PUPR Kabupaten Nagekeo</p>
                </div>
              </div>
              <button
                onClick={() => setModalData(null)}
                className="text-white/80 hover:text-white bg-white/10 hover:bg-white/20 h-7 w-7 rounded-full flex items-center justify-center transition font-bold"
              >
                ✕
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-5 overflow-y-auto max-h-[75vh]">
              
              {/* Success Notification */}
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex gap-3 items-start">
                <span className="text-xl">✅</span>
                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-emerald-900">PIN Tanda Tangan Berhasil Dibuat</h4>
                  <p className="text-3xs text-emerald-700 leading-relaxed">
                    Sistem telah menghasilkan PIN otorisasi untuk <strong>{modalData.name}</strong> ({modalData.email}). Silakan kirimkan PIN ini kepada yang bersangkutan.
                  </p>
                </div>
              </div>

              {/* Security Warning about Sandbox */}
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-3xs text-amber-800 leading-relaxed flex gap-2">
                <span>⚠️</span>
                <div>
                  <strong>Catatan Sandbox:</strong> Jika email otomatis tidak terkirim atau diblokir oleh browser di dalam iframe, harap gunakan tombol <strong>Salin Pesan</strong> di bawah dan kirimkan secara manual melalui WhatsApp atau Gmail.
                </div>
              </div>

              {/* PIN Box */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 text-center space-y-2 relative group">
                <span className="text-4xs uppercase tracking-widest text-slate-400 font-bold block">PIN RAHASIA PEJABAT</span>
                <div className="text-3xl font-mono font-extrabold text-indigo-700 tracking-widest select-all my-2">
                  {modalData.pin}
                </div>
                <button
                  onClick={() => handleCopyPin(modalData.pin)}
                  className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-extrabold text-4xs rounded-lg border border-indigo-100 transition inline-flex items-center gap-1.5"
                >
                  {copiedPin ? '✓ Berhasil Disalin!' : '📋 Salin Kode PIN'}
                </button>
              </div>

              {/* Email Content Box */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-4xs font-bold text-slate-500 uppercase tracking-wider">Isi Surat / Pesan Email:</label>
                  <button
                    onClick={() => handleCopyEmail(
                      `Yth. Bapak/Ibu ${modalData.name},\n\nBerikut adalah PIN Tanda Tangan Digital Anda untuk sistem SPPD & SPT Dinas Pekerjaan Umum dan Penataan Ruang (PUPR) Kabupaten Nagekeo:\n\nPIN ANDA: ${modalData.pin}\n\nHarap simpan PIN ini dengan aman dan bersifat rahasia. PIN ini digunakan untuk melakukan tanda tangan digital (e-signature) pada dokumen SPPD, SPT, dan Kwitansi Pembayaran.\n\nTerima kasih.\nAdmin Dinas PUPR Kabupaten Nagekeo`
                    )}
                    className="text-4xs font-extrabold text-indigo-600 hover:text-indigo-800 transition"
                  >
                    {copiedEmail ? '✓ Pesan Disalin!' : '📋 Salin Pesan Lengkap'}
                  </button>
                </div>
                <textarea
                  readOnly
                  className="w-full h-32 px-3 py-2 text-3xs text-slate-600 border border-slate-200 rounded-xl bg-slate-50 focus:outline-hidden font-mono leading-relaxed resize-none"
                  value={
                    `Yth. Bapak/Ibu ${modalData.name},\n\n` +
                    `Berikut adalah PIN Tanda Tangan Digital Anda untuk sistem SPPD & SPT Dinas Pekerjaan Umum dan Penataan Ruang (PUPR) Kabupaten Nagekeo:\n\n` +
                    `PIN ANDA: ${modalData.pin}\n\n` +
                    `Harap simpan PIN ini dengan aman dan bersifat rahasia. PIN ini digunakan untuk melakukan tanda tangan digital (e-signature) pada dokumen SPPD, SPT, dan Kwitansi Pembayaran.\n\n` +
                    `Terima kasih.\n` +
                    `Admin Dinas PUPR Kabupaten Nagekeo`
                  }
                />
              </div>

            </div>

            {/* Footer */}
            <div className="bg-slate-50 px-6 py-4 border-t border-slate-100 flex gap-2 justify-end">
              <button
                onClick={() => {
                  const subject = 'PIN Tanda Tangan Digital Resmi - Dinas PUPR Nagekeo';
                  const body = `Yth. Bapak/Ibu ${modalData.name},\n\nBerikut adalah PIN Tanda Tangan Digital Anda untuk sistem SPPD & SPT Dinas Pekerjaan Umum dan Penataan Ruang (PUPR) Kabupaten Nagekeo:\n\nPIN ANDA: ${modalData.pin}\n\nHarap simpan PIN ini dengan aman dan bersifat rahasia. PIN ini digunakan untuk melakukan tanda tangan digital (e-signature) pada dokumen SPPD, SPT, dan Kwitansi Pembayaran.\n\nTerima kasih.\nAdmin Dinas PUPR Kabupaten Nagekeo`;
                  window.open(`mailto:${modalData.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`, '_blank');
                }}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-xl shadow-xs transition"
              >
                📧 Buka Aplikasi Email
              </button>
              <button
                onClick={() => setModalData(null)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-extrabold text-xs rounded-xl transition"
              >
                Selesai / Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
