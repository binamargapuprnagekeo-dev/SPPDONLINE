import React, { useState, useEffect } from 'react';
import { SppdData, Pengikut, PejabatStaff } from '../types';
import { encryptSignature, calculateDocumentHash, ADMIN_PIN } from '../lib/crypto';

interface SppdFormProps {
  onSave: (data: SppdData) => void;
  onCancel: () => void;
  initialData?: SppdData;
  pejabatList?: PejabatStaff[];
}

export default function SppdForm({ onSave, onCancel, initialData, pejabatList = [] }: SppdFormProps) {
  const [nomor, setNomor] = useState(initialData?.nomor || '');
  const [penggunaAnggaran, setPenggunaAnggaran] = useState(initialData?.penggunaAnggaran || 'Kepala Dinas Pekerjaan Umum dan Penataan Ruang');
  const [namaPegawai, setNamaPegawai] = useState(initialData?.namaPegawai || '');
  const [nip, setNip] = useState(initialData?.nip || '');
  const [pangkatGol, setPangkatGol] = useState(initialData?.pangkatGol || 'Pembina Utama Muda - IV/c');
  const [jabatan, setJabatan] = useState(initialData?.jabatan || 'Kepala Dinas Pekerjaan Umum dan Penataan Ruang');
  const [tingkatPerjalanan, setTingkatPerjalanan] = useState(initialData?.tingkatPerjalanan || 'C');
  const [maksudPerjalanan, setMaksudPerjalanan] = useState(initialData?.maksudPerjalanan || '');
  const [alatAngkutan, setAlatAngkutan] = useState(initialData?.alatAngkutan || 'Pesawat Terbang, PP');
  const [tempatBerangkat, setTempatBerangkat] = useState(initialData?.tempatBerangkat || 'Mbay');
  const [tempatTujuan, setTempatTujuan] = useState(initialData?.tempatTujuan || '');
  const [tanggalBerangkat, setTanggalBerangkat] = useState(initialData?.tanggalBerangkat || '');
  const [tanggalKembali, setTanggalKembali] = useState(initialData?.tanggalKembali || '');
  const [lamanyaPerjalanan, setLamanyaPerjalanan] = useState(initialData?.lamanyaPerjalanan || '');
  
  // Pembebanan Anggaran
  const [pembebananInstansi, setPembebananInstansi] = useState(initialData?.pembebananAnggaran.instansi || 'Dinas Pekerjaan Umum dan Penataan Ruang');
  const [pembebananAkun, setPembebananAkun] = useState(initialData?.pembebananAnggaran.akun || '1.03.10.2.01.5.1.02.04.001.00003');
  const [pembebananSumberDana, setPembebananSumberDana] = useState(initialData?.pembebananAnggaran.sumberDana || 'DAU / DAK');

  const [keteranganLain, setKeteranganLain] = useState(initialData?.keteranganLain || '');
  const [dikeluarkanDi, setDikeluarkanDi] = useState(initialData?.dikeluarkanDi || 'Mbay');
  const [tanggalDikeluarkan, setTanggalDikeluarkan] = useState(initialData?.tanggalDikeluarkan || new Date().toISOString().split('T')[0]);
  
  // Penandatangan
  const [penandatanganNama, setPenandatanganNama] = useState(initialData?.penandatanganNama || 'Syarifudin Ibrahim, ST');
  const [penandatanganPangkat, setPenandatanganPangkat] = useState(initialData?.penandatanganPangkat || 'Pembina Utama Muda');
  const [penandatanganNip, setPenandatanganNip] = useState(initialData?.penandatanganNip || 'NIP. 19681102 199703 1 008');

  // Secure signature PIN states
  const [selectedPejabatId, setSelectedPejabatId] = useState('');
  const [signaturePin, setSignaturePin] = useState('');
  const [pinError, setPinError] = useState('');

  // Auto-fill penandatangan fields from registered list
  useEffect(() => {
    if (selectedPejabatId) {
      if (selectedPejabatId === 'manual') {
        // Keep current or allow typing
      } else {
        const found = pejabatList.find((p) => p.id === selectedPejabatId);
        if (found) {
          setPenandatanganNama(found.nama);
          setPenandatanganPangkat(found.pangkatGol || 'Pembina Utama Muda');
          setPenandatanganNip(found.nip.startsWith('NIP.') ? found.nip : `NIP. ${found.nip}`);
          setPinError('');
        }
      }
    }
  }, [selectedPejabatId, pejabatList]);

  // Pengikut
  const [pengikut, setPengikut] = useState<Pengikut[]>(initialData?.pengikut || []);

  // Handle auto nomor generation if empty
  useEffect(() => {
    if (!nomor) {
      const year = new Date().getFullYear();
      const rand = Math.floor(100 + Math.random() * 900);
      setNomor(`000.1.2.3/DPUPR-NGK/${rand}/06/${year}`);
    }
  }, [nomor]);

  // Auto-calculate travel duration in days
  useEffect(() => {
    if (tanggalBerangkat && tanggalKembali) {
      const start = new Date(tanggalBerangkat);
      const end = new Date(tanggalKembali);
      const diffTime = Math.abs(end.getTime() - start.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // inclusive
      if (!isNaN(diffDays) && diffDays > 0) {
        setLamanyaPerjalanan(`${diffDays} Hari`);
      }
    }
  }, [tanggalBerangkat, tanggalKembali]);

  const handleAddPengikut = () => {
    setPengikut([...pengikut, { nama: '', tanggalLahir: '', keterangan: '' }]);
  };

  const handleRemovePengikut = (index: number) => {
    setPengikut(pengikut.filter((_, idx) => idx !== index));
  };

  const handlePengikutChange = (index: number, key: keyof Pengikut, val: string) => {
    const updated = [...pengikut];
    updated[index] = { ...updated[index], [key]: val };
    setPengikut(updated);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!namaPegawai || !tempatTujuan || !tanggalBerangkat || !tanggalKembali || !maksudPerjalanan) {
      alert('Mohon isi semua field penting!');
      return;
    }

    const id = initialData?.id || `SPPD-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

    // Find if the penandatangan is a registered official
    let targetPin = ADMIN_PIN; // fallback is sppd2026
    let isRegistered = false;

    if (selectedPejabatId && selectedPejabatId !== 'manual') {
      const found = pejabatList.find((p) => p.id === selectedPejabatId);
      if (found) {
        targetPin = found.pin;
        isRegistered = true;
      }
    } else {
      // Look up by name to be safe
      const foundByName = pejabatList.find((p) => p.nama.toLowerCase().trim() === penandatanganNama.toLowerCase().trim());
      if (foundByName) {
        targetPin = foundByName.pin;
        isRegistered = true;
      }
    }

    // Verify PIN
    if (!signaturePin) {
      setPinError('Mohon masukkan PIN Otorisasi Tanda Tangan untuk mengesahkan dokumen!');
      return;
    }

    if (signaturePin !== targetPin) {
      setPinError(`PIN Otorisasi Tanda Tangan Salah! Dokumen GAGAL ditandatangani digital.`);
      return;
    }

    setPinError('');

    const preliminaryData: Omit<SppdData, 'encryptedSignature'> = {
      id,
      nomor,
      penggunaAnggaran,
      namaPegawai,
      nip,
      pangkatGol,
      jabatan,
      tingkatPerjalanan,
      maksudPerjalanan,
      alatAngkutan,
      tempatBerangkat,
      tempatTujuan,
      lamanyaPerjalanan,
      tanggalBerangkat,
      tanggalKembali,
      pengikut,
      pembebananAnggaran: {
        instansi: pembebananInstansi,
        akun: pembebananAkun,
        sumberDana: pembebananSumberDana,
      },
      keteranganLain,
      dikeluarkanDi,
      tanggalDikeluarkan,
      penandatanganNama,
      penandatanganPangkat,
      penandatanganNip,
      createdAt: initialData?.createdAt || new Date().toISOString(),
      syncStatus: initialData?.syncStatus || 'pending',
    };

    // Calculate document integrity hash
    const hash = calculateDocumentHash(preliminaryData);

    // Create encrypted digital signature payload using the unique official's PIN
    const encryptedSignature = encryptSignature({
      type: 'SPPD',
      docId: id,
      nomor,
      signedBy: penandatanganNama,
      signedDate: tanggalDikeluarkan,
      details: {
        namaPegawai,
        keperluan: maksudPerjalanan,
        tempatTujuan,
        tanggalBerangkat,
        tanggalKembali,
      },
      hash,
    }, signaturePin);

    const finalData: SppdData = {
      ...preliminaryData,
      encryptedSignature,
    };

    onSave(finalData);
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-4 sm:p-8 rounded-xl shadow-md border border-gray-100 max-w-3xl mx-auto space-y-6" id="sppd-creation-form">
      <div className="border-b border-gray-100 pb-4">
        <h3 className="text-xl font-bold text-gray-900">Buat / Edit Surat Perjalanan Dinas (SPD)</h3>
        <p className="text-sm text-gray-500 mt-1">Isi formulir dengan lengkap untuk mendaftarkan digital signature SPPD secara terenkripsi.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Nomor Surat */}
        <div>
          <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">Nomor Surat (SPD)</label>
          <input
            type="text"
            value={nomor}
            onChange={(e) => setNomor(e.target.value)}
            className="w-full px-3.5 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-gray-50"
            placeholder="Auto-generated if empty"
            id="input-sppd-nomor"
          />
        </div>

        {/* Pengguna Anggaran */}
        <div>
          <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">Pengguna Anggaran</label>
          <input
            type="text"
            value={penggunaAnggaran}
            onChange={(e) => setPenggunaAnggaran(e.target.value)}
            className="w-full px-3.5 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            required
            id="input-sppd-pa"
          />
        </div>
      </div>

      {/* Bagian Pegawai yang Diperintah */}
      <div className="bg-indigo-50/50 p-4 rounded-xl space-y-4 border border-indigo-100/60">
        <h4 className="text-sm font-bold text-indigo-900 uppercase tracking-wider">Pegawai yang Diperintah</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Nama Pegawai</label>
            <input
              type="text"
              value={namaPegawai}
              onChange={(e) => setNamaPegawai(e.target.value)}
              className="w-full px-3.5 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
              placeholder="Syarifudin Ibrahim, ST"
              required
              id="input-sppd-nama"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">NIP Pegawai</label>
            <input
              type="text"
              value={nip}
              onChange={(e) => setNip(e.target.value)}
              className="w-full px-3.5 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
              placeholder="19681102 199703 1 008"
              id="input-sppd-nip"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-gray-700 mb-1">Pangkat / Golongan</label>
            <input
              type="text"
              value={pangkatGol}
              onChange={(e) => setPangkatGol(e.target.value)}
              className="w-full px-3.5 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
              placeholder="Pembina Utama Muda - IV/c"
              id="input-sppd-pangkat"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Tingkat Perjalanan</label>
            <input
              type="text"
              value={tingkatPerjalanan}
              onChange={(e) => setTingkatPerjalanan(e.target.value)}
              className="w-full px-3.5 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
              placeholder="C"
              id="input-sppd-tingkat"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">Jabatan Pegawai</label>
          <input
            type="text"
            value={jabatan}
            onChange={(e) => setJabatan(e.target.value)}
            className="w-full px-3.5 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
            placeholder="Kepala Dinas Pekerjaan Umum dan Penataan Ruang"
            id="input-sppd-jabatan"
          />
        </div>
      </div>

      {/* Bagian Perjalanan & Alat Angkut */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">Maksud Perjalanan Dinas</label>
          <textarea
            value={maksudPerjalanan}
            onChange={(e) => setMaksudPerjalanan(e.target.value)}
            className="w-full px-3.5 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            rows={3}
            placeholder="Contoh: Mengikuti Desk Pembahasan Bersama Pemda dan BPJN NTT..."
            required
            id="input-sppd-maksud"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">Alat Angkutan</label>
          <input
            type="text"
            value={alatAngkutan}
            onChange={(e) => setAlatAngkutan(e.target.value)}
            className="w-full px-3.5 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="Pesawat Terbang, PP"
            id="input-sppd-angkut"
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Berangkat Dr</label>
            <input
              type="text"
              value={tempatBerangkat}
              onChange={(e) => setTempatBerangkat(e.target.value)}
              className="w-full px-2.5 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Mbay"
              id="input-sppd-darimana"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Tujuan</label>
            <input
              type="text"
              value={tempatTujuan}
              onChange={(e) => setTempatTujuan(e.target.value)}
              className="w-full px-2.5 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Kupang"
              required
              id="input-sppd-tujuan"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">Tanggal Berangkat</label>
          <input
            type="date"
            value={tanggalBerangkat}
            onChange={(e) => setTanggalBerangkat(e.target.value)}
            className="w-full px-3.5 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            required
            id="input-sppd-tgl-berangkat"
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Tanggal Kembali</label>
            <input
              type="date"
              value={tanggalKembali}
              onChange={(e) => setTanggalKembali(e.target.value)}
              className="w-full px-2 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              required
              id="input-sppd-tgl-kembali"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Lama (Hari)</label>
            <input
              type="text"
              value={lamanyaPerjalanan}
              onChange={(e) => setLamanyaPerjalanan(e.target.value)}
              className="w-full px-2 py-2 border border-gray-300 rounded-lg text-sm bg-gray-50 text-gray-500 font-semibold text-center focus:outline-none"
              placeholder="Auto"
              readOnly
              id="input-sppd-lama"
            />
          </div>
        </div>
      </div>

      {/* Daftar Pengikut */}
      <div className="border border-gray-200 rounded-xl p-4 space-y-4">
        <div className="flex justify-between items-center border-b border-gray-100 pb-2">
          <h4 className="text-sm font-bold text-gray-800 uppercase tracking-wider">Anggota Pengikut Perjalanan</h4>
          <button
            type="button"
            onClick={handleAddPengikut}
            className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-xs font-semibold hover:bg-indigo-100 transition flex items-center gap-1"
            id="btn-add-pengikut"
          >
            + Tambah Pengikut
          </button>
        </div>

        {pengikut.length === 0 ? (
          <p className="text-xs text-gray-400 italic text-center py-2">Tidak ada pengikut yang ditambahkan.</p>
        ) : (
          <div className="space-y-3">
            {pengikut.map((p, index) => (
              <div key={index} className="grid grid-cols-1 md:grid-cols-3 gap-2 items-end border-b border-gray-50 pb-3 last:border-0 last:pb-0">
                <div>
                  <label className="block text-3xs font-semibold text-gray-500 uppercase tracking-wider mb-0.5">Nama Pengikut</label>
                  <input
                    type="text"
                    value={p.nama}
                    onChange={(e) => handlePengikutChange(index, 'nama', e.target.value)}
                    className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Nama Pengikut"
                    required
                  />
                </div>
                <div>
                  <label className="block text-3xs font-semibold text-gray-500 uppercase tracking-wider mb-0.5">Tgl Lahir</label>
                  <input
                    type="date"
                    value={p.tanggalLahir}
                    onChange={(e) => handlePengikutChange(index, 'tanggalLahir', e.target.value)}
                    className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                <div className="flex gap-2 items-center">
                  <div className="flex-1">
                    <label className="block text-3xs font-semibold text-gray-500 uppercase tracking-wider mb-0.5">Keterangan</label>
                    <input
                      type="text"
                      value={p.keterangan}
                      onChange={(e) => handlePengikutChange(index, 'keterangan', e.target.value)}
                      className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="Hubungan / Ket"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemovePengikut(index)}
                    className="p-1.5 bg-red-50 text-red-600 rounded hover:bg-red-100 transition mt-4"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pembebanan Anggaran */}
      <div className="bg-gray-50 p-4 rounded-xl border border-gray-200/60 space-y-3">
        <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider">Pembebanan Anggaran</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="block text-3xs font-semibold text-gray-600 uppercase tracking-wider mb-1">Instansi</label>
            <input
              type="text"
              value={pembebananInstansi}
              onChange={(e) => setPembebananInstansi(e.target.value)}
              className="w-full px-3 py-1.5 border border-gray-300 rounded text-xs bg-white focus:ring-1 focus:ring-indigo-500"
              required
              id="input-sppd-instansi"
            />
          </div>
          <div>
            <label className="block text-3xs font-semibold text-gray-600 uppercase tracking-wider mb-1">Akun Anggaran</label>
            <input
              type="text"
              value={pembebananAkun}
              onChange={(e) => setPembebananAkun(e.target.value)}
              className="w-full px-3 py-1.5 border border-gray-300 rounded text-xs bg-white focus:ring-1 focus:ring-indigo-500"
              placeholder="1.03.10.2.01..."
              required
              id="input-sppd-akun"
            />
          </div>
          <div>
            <label className="block text-3xs font-semibold text-gray-600 uppercase tracking-wider mb-1">Sumber Dana</label>
            <input
              type="text"
              value={pembebananSumberDana}
              onChange={(e) => setPembebananSumberDana(e.target.value)}
              className="w-full px-3 py-1.5 border border-gray-300 rounded text-xs bg-white focus:ring-1 focus:ring-indigo-500"
              placeholder="DAU / DAK / APBD"
              id="input-sppd-dana"
            />
          </div>
        </div>
      </div>

      {/* Keterangan Lain-lain */}
      <div>
        <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">Keterangan Lain-lain</label>
        <input
          type="text"
          value={keteranganLain}
          onChange={(e) => setKeteranganLain(e.target.value)}
          className="w-full px-3.5 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          placeholder="Catatan tambahan..."
          id="input-sppd-ket-lain"
        />
      </div>

      {/* Bagian Pengeluaran & Penandatangan */}
      <div className="bg-indigo-50/25 p-4 rounded-xl border border-indigo-100/50 space-y-4">
        <h4 className="text-sm font-bold text-gray-800 uppercase tracking-wider">Pengesahan / Penandatangan Surat</h4>
        
        {pejabatList && pejabatList.length > 0 && (
          <div className="space-y-1 bg-indigo-50/50 p-3 rounded-xl border border-indigo-100/30">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Pilih Pejabat Terdaftar (dari Google Sheet)
            </label>
            <select
              value={selectedPejabatId}
              onChange={(e) => setSelectedPejabatId(e.target.value)}
              className="w-full px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-xs"
            >
              <option value="">-- Pilih Pejabat atau Input Manual --</option>
              {pejabatList.map((p) => (
                <option key={p.id} value={p.id} disabled={p.status !== 'Aktif'}>
                  {p.nama} - {p.jabatan} {p.status !== 'Aktif' ? '(Nonaktif)' : ''}
                </option>
              ))}
              <option value="manual">Input Manual (Gunakan PIN Admin/Default)</option>
            </select>
            <p className="text-[10px] text-gray-500 italic mt-0.5">
              Memilih pejabat terdaftar otomatis mengisi nama, pangkat, dan NIP.
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Dikeluarkan Di</label>
            <input
              type="text"
              value={dikeluarkanDi}
              onChange={(e) => setDikeluarkanDi(e.target.value)}
              className="w-full px-3.5 py-2 border border-gray-300 rounded-lg text-sm bg-white"
              required
              id="input-sppd-keluar-di"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Tanggal Dikeluarkan</label>
            <input
              type="date"
              value={tanggalDikeluarkan}
              onChange={(e) => setTanggalDikeluarkan(e.target.value)}
              className="w-full px-3.5 py-2 border border-gray-300 rounded-lg text-sm bg-white"
              required
              id="input-sppd-keluar-tgl"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-gray-100 pt-3">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Nama Pejabat Penandatangan</label>
            <input
              type="text"
              value={penandatanganNama}
              onChange={(e) => setPenandatanganNama(e.target.value)}
              className="w-full px-3 py-1.5 border border-gray-300 rounded text-xs bg-white"
              required
              id="input-sppd-pejabat-nama"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Pangkat Pejabat</label>
            <input
              type="text"
              value={penandatanganPangkat}
              onChange={(e) => setPenandatanganPangkat(e.target.value)}
              className="w-full px-3 py-1.5 border border-gray-300 rounded text-xs bg-white"
              id="input-sppd-pejabat-pangkat"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">NIP Pejabat</label>
            <input
              type="text"
              value={penandatanganNip}
              onChange={(e) => setPenandatanganNip(e.target.value)}
              className="w-full px-3 py-1.5 border border-gray-300 rounded text-xs bg-white"
              id="input-sppd-pejabat-nip"
            />
          </div>
        </div>

        {/* Dynamic Digital PIN authentication field */}
        <div className="bg-slate-50 border border-slate-200/60 p-3 rounded-xl space-y-1.5 mt-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <label className="block text-xs font-bold text-indigo-950 uppercase tracking-wider">
              Masukkan PIN Otorisasi Tanda Tangan Digital *
            </label>
            <span className="text-[10px] text-slate-500 font-mono italic">
              (Gunakan PIN {selectedPejabatId && selectedPejabatId !== 'manual' ? 'Pejabat' : 'Admin / PIN Default'})
            </span>
          </div>
          <input
            type="password"
            maxLength={6}
            value={signaturePin}
            onChange={(e) => {
              setSignaturePin(e.target.value.replace(/\D/g, ''));
              setPinError('');
            }}
            placeholder="Ketik 6 digit PIN tanda tangan pejabat..."
            className="w-full px-3 py-2 border border-indigo-300 rounded-xl bg-white font-mono font-bold text-center tracking-widest text-sm focus:ring-2 focus:ring-indigo-500 text-indigo-800"
            required
          />
          {pinError && (
            <div className="text-[11px] font-bold text-red-600 bg-red-50 border border-red-100 p-2 rounded-lg flex items-center gap-1">
              ⚠️ {pinError}
            </div>
          )}
        </div>
      </div>

      {/* Buttons */}
      <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
        <button
          type="button"
          onClick={onCancel}
          className="px-5 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
          id="btn-cancel-form-sppd"
        >
          Batal
        </button>
        <button
          type="submit"
          className="px-5 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition flex items-center gap-1.5"
          id="btn-save-form-sppd"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          Simpan & Registrasi Digital Signature
        </button>
      </div>
    </form>
  );
}
