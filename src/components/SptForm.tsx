import React, { useState, useEffect } from 'react';
import { SptData, TugaskanKepada } from '../types';
import { encryptSignature, calculateDocumentHash } from '../lib/crypto';

interface SptFormProps {
  onSave: (data: SptData) => void;
  onCancel: () => void;
  initialData?: SptData;
}

export default function SptForm({ onSave, onCancel, initialData }: SptFormProps) {
  const [nomor, setNomor] = useState(initialData?.nomor || '');
  const [dasar, setDasar] = useState(initialData?.dasar || 'Undangan Verifikasi dan Validasi Usulan Penanganan Jalan Daerah melalui Skema Inpres Nomor 11 Tahun 2025');
  const [keperluan, setKeperluan] = useState(initialData?.keperluan || '');
  const [tempatTujuan, setTempatTujuan] = useState(initialData?.tempatTujuan || '');
  const [tanggalBerangkat, setTanggalBerangkat] = useState(initialData?.tanggalBerangkat || '');
  const [tanggalKembali, setTanggalKembali] = useState(initialData?.tanggalKembali || '');
  const [alatAngkut, setAlatAngkut] = useState(initialData?.alatAngkut || 'Pesawat Terbang, PP');
  const [pembebananAnggaran, setPembebananAnggaran] = useState(initialData?.pembebananAnggaran || 'DPA Dinas Pekerjaan Umum dan Penataan Ruang Kab. Nagekeo T.A. 2026');

  const [ditetapkanDi, setDitetapkanDi] = useState(initialData?.ditetapkanDi || 'Mbay');
  const [tanggalDitetapkan, setTanggalDitetapkan] = useState(initialData?.tanggalDitetapkan || new Date().toISOString().split('T')[0]);

  // Penandatangan
  const [penandatanganNama, setPenandatanganNama] = useState(initialData?.penandatanganNama || 'Syarifudin Ibrahim, ST');
  const [penandatanganPangkat, setPenandatanganPangkat] = useState(initialData?.penandatanganPangkat || 'Pembina Utama Muda');
  const [penandatanganNip, setPenandatanganNip] = useState(initialData?.penandatanganNip || '19681102 199703 1 008');

  // Assigned employees list (Tugaskan Kepada)
  const [tugaskanKepada, setTugaskanKepada] = useState<TugaskanKepada[]>(
    initialData?.tugaskanKepada || [{ nama: '', nip: '', pangkatGol: '', jabatan: '' }]
  );

  // Auto nomor generation if empty
  useEffect(() => {
    if (!nomor) {
      const year = new Date().getFullYear();
      const rand = Math.floor(1000 + Math.random() * 9000);
      setNomor(`000.1.2.3/BU-NGK/${rand}/06/${year}`);
    }
  }, [nomor]);

  const handleAddPegawai = () => {
    setTugaskanKepada([...tugaskanKepada, { nama: '', nip: '', pangkatGol: '', jabatan: '' }]);
  };

  const handleRemovePegawai = (index: number) => {
    if (tugaskanKepada.length <= 1) {
      alert('Minimal harus ada 1 pegawai yang ditugaskan!');
      return;
    }
    setTugaskanKepada(tugaskanKepada.filter((_, idx) => idx !== index));
  };

  const handlePegawaiChange = (index: number, key: keyof TugaskanKepada, val: string) => {
    const updated = [...tugaskanKepada];
    updated[index] = { ...updated[index], [key]: val };
    setTugaskanKepada(updated);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validations
    const hasEmptyField = tugaskanKepada.some((p) => !p.nama);
    if (hasEmptyField || !keperluan || !tempatTujuan || !tanggalBerangkat || !tanggalKembali) {
      alert('Mohon isi semua field penting!');
      return;
    }

    const id = initialData?.id || `SPT-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const preliminaryData: Omit<SptData, 'encryptedSignature'> = {
      id,
      nomor,
      dasar,
      tugaskanKepada,
      keperluan,
      tempatTujuan,
      tanggalBerangkat,
      tanggalKembali,
      alatAngkut,
      pembebananAnggaran,
      ditetapkanDi,
      tanggalDitetapkan,
      penandatanganNama,
      penandatanganPangkat,
      penandatanganNip,
      createdAt: initialData?.createdAt || new Date().toISOString(),
      syncStatus: initialData?.syncStatus || 'pending',
    };

    // Calculate document hash
    const hash = calculateDocumentHash(preliminaryData);

    // Create encrypted signature
    const encryptedSignature = encryptSignature({
      type: 'SPT',
      docId: id,
      nomor,
      signedBy: penandatanganNama,
      signedDate: tanggalDitetapkan,
      details: {
        namaPegawai: tugaskanKepada[0]?.nama,
        keperluan,
        tempatTujuan,
        tanggalBerangkat,
        tanggalKembali,
      },
      hash,
    });

    const finalData: SptData = {
      ...preliminaryData,
      encryptedSignature,
    };

    onSave(finalData);
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-4 sm:p-8 rounded-xl shadow-md border border-gray-100 max-w-3xl mx-auto space-y-6" id="spt-creation-form">
      <div className="border-b border-gray-100 pb-4">
        <h3 className="text-xl font-bold text-gray-900">Buat / Edit Surat Perintah Tugas (SPT)</h3>
        <p className="text-sm text-gray-500 mt-1">Isi formulir dengan lengkap untuk mendaftarkan digital signature SPT secara terenkripsi.</p>
      </div>

      <div className="space-y-4">
        {/* Nomor Surat & Dasar Hukum */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">Nomor Surat (SPT)</label>
            <input
              type="text"
              value={nomor}
              onChange={(e) => setNomor(e.target.value)}
              className="w-full px-3.5 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-gray-50"
              placeholder="Auto-generated if empty"
              id="input-spt-nomor"
            />
          </div>
          <div>
            {/* Empty space or additional settings */}
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">Dasar Surat / Dasar Hukum</label>
          <textarea
            value={dasar}
            onChange={(e) => setDasar(e.target.value)}
            className="w-full px-3.5 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            rows={2}
            placeholder="Undangan / Peraturan dasar..."
            required
            id="input-spt-dasar"
          />
        </div>
      </div>

      {/* Bagian Pegawai yang Ditugaskan */}
      <div className="border border-indigo-100 bg-indigo-50/20 p-4 rounded-xl space-y-4">
        <div className="flex justify-between items-center border-b border-indigo-100 pb-2">
          <h4 className="text-sm font-bold text-indigo-900 uppercase tracking-wider">Daftar Pegawai yang Ditugaskan</h4>
          <button
            type="button"
            onClick={handleAddPegawai}
            className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-lg text-xs font-bold hover:bg-indigo-200 transition flex items-center gap-1"
            id="btn-add-pegawai-tugas"
          >
            + Tambah Pegawai
          </button>
        </div>

        <div className="space-y-4">
          {tugaskanKepada.map((p, index) => (
            <div key={index} className="p-3 bg-white border border-gray-200 rounded-lg space-y-3 relative shadow-2xs">
              <div className="absolute top-2 right-2 flex items-center gap-1.5">
                <span className="text-xs font-mono text-gray-400">Pegawai #{index + 1}</span>
                <button
                  type="button"
                  onClick={() => handleRemovePegawai(index)}
                  className="p-1 text-red-500 hover:bg-red-50 rounded transition"
                  title="Hapus Pegawai"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-3xs font-semibold text-gray-500 uppercase mb-0.5">Nama Pegawai</label>
                  <input
                    type="text"
                    value={p.nama}
                    onChange={(e) => handlePegawaiChange(index, 'nama', e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-indigo-500"
                    placeholder="Syarifudin Ibrahim, ST"
                    required
                  />
                </div>
                <div>
                  <label className="block text-3xs font-semibold text-gray-500 uppercase mb-0.5">NIP</label>
                  <input
                    type="text"
                    value={p.nip}
                    onChange={(e) => handlePegawaiChange(index, 'nip', e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-indigo-500"
                    placeholder="19681102 199703 1 008"
                  />
                </div>
                <div>
                  <label className="block text-3xs font-semibold text-gray-500 uppercase mb-0.5">Pangkat / Golongan</label>
                  <input
                    type="text"
                    value={p.pangkatGol}
                    onChange={(e) => handlePegawaiChange(index, 'pangkatGol', e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-indigo-500"
                    placeholder="Pembina Utama Muda - IV/c"
                  />
                </div>
                <div>
                  <label className="block text-3xs font-semibold text-gray-500 uppercase mb-0.5">Jabatan</label>
                  <input
                    type="text"
                    value={p.jabatan}
                    onChange={(e) => handlePegawaiChange(index, 'jabatan', e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-indigo-500"
                    placeholder="Kepala Dinas"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bagian Keperluan & Detail Perjalanan */}
      <div className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">Keperluan Tugas</label>
          <textarea
            value={keperluan}
            onChange={(e) => setKeperluan(e.target.value)}
            className="w-full px-3.5 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
            rows={3}
            placeholder="Dalam rangka mengikuti desk pembahasan..."
            required
            id="input-spt-keperluan"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Tempat Tujuan</label>
            <input
              type="text"
              value={tempatTujuan}
              onChange={(e) => setTempatTujuan(e.target.value)}
              className="w-full px-3.5 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
              placeholder="Kupang"
              required
              id="input-spt-tujuan"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Alat Angkut yang digunakan</label>
            <input
              type="text"
              value={alatAngkut}
              onChange={(e) => setAlatAngkut(e.target.value)}
              className="w-full px-3.5 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
              placeholder="Pesawat Terbang, PP"
              id="input-spt-angkut"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Tanggal Berangkat</label>
            <input
              type="date"
              value={tanggalBerangkat}
              onChange={(e) => setTanggalBerangkat(e.target.value)}
              className="w-full px-3.5 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
              required
              id="input-spt-tgl-berangkat"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Tanggal Harus Kembali</label>
            <input
              type="date"
              value={tanggalKembali}
              onChange={(e) => setTanggalKembali(e.target.value)}
              className="w-full px-3.5 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
              required
              id="input-spt-tgl-kembali"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">Pembebanan Anggaran</label>
          <input
            type="text"
            value={pembebananAnggaran}
            onChange={(e) => setPembebananAnggaran(e.target.value)}
            className="w-full px-3.5 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
            placeholder="DPA Dinas Pekerjaan Umum dan Penataan Ruang Kab. Nagekeo T.A. 2026"
            required
            id="input-spt-anggaran"
          />
        </div>
      </div>

      {/* Penetapan & Penandatangan */}
      <div className="bg-indigo-50/25 p-4 rounded-xl border border-indigo-100/50 space-y-4">
        <h4 className="text-sm font-bold text-gray-800 uppercase tracking-wider">Pengesahan / Penandatangan SPT</h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Ditetapkan Di</label>
            <input
              type="text"
              value={ditetapkanDi}
              onChange={(e) => setDitetapkanDi(e.target.value)}
              className="w-full px-3.5 py-2 border border-gray-300 rounded-lg text-sm bg-white"
              required
              id="input-spt-tetap-di"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Pada Tanggal</label>
            <input
              type="date"
              value={tanggalDitetapkan}
              onChange={(e) => setTanggalDitetapkan(e.target.value)}
              className="w-full px-3.5 py-2 border border-gray-300 rounded-lg text-sm bg-white"
              required
              id="input-spt-tetap-tgl"
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
              id="input-spt-pejabat-nama"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Pangkat Pejabat</label>
            <input
              type="text"
              value={penandatanganPangkat}
              onChange={(e) => setPenandatanganPangkat(e.target.value)}
              className="w-full px-3 py-1.5 border border-gray-300 rounded text-xs bg-white"
              id="input-spt-pejabat-pangkat"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">NIP Pejabat</label>
            <input
              type="text"
              value={penandatanganNip}
              onChange={(e) => setPenandatanganNip(e.target.value)}
              className="w-full px-3 py-1.5 border border-gray-300 rounded text-xs bg-white"
              id="input-spt-pejabat-nip"
            />
          </div>
        </div>
      </div>

      {/* Buttons */}
      <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
        <button
          type="button"
          onClick={onCancel}
          className="px-5 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
          id="btn-cancel-form-spt"
        >
          Batal
        </button>
        <button
          type="submit"
          className="px-5 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition flex items-center gap-1.5"
          id="btn-save-form-spt"
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
