import React, { useState, useEffect } from 'react';
import { SptData, TugaskanKepada, PejabatStaff } from '../types';
import { encryptSignature, calculateDocumentHash, ADMIN_PIN } from '../lib/crypto';

interface SptFormProps {
  onSave: (data: SptData) => void;
  onCancel: () => void;
  initialData?: SptData;
  pejabatList?: PejabatStaff[];
}

export default function SptForm({ onSave, onCancel, initialData, pejabatList = [] }: SptFormProps) {
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

  // Secure signature PIN states
  const [selectedPejabatId, setSelectedPejabatId] = useState('');
  const [signaturePin, setSignaturePin] = useState('');
  const [pinError, setPinError] = useState('');

  // Extra fields for Luar Daerah
  const [tipePerjalanan, setTipePerjalanan] = useState<'Luar Daerah' | 'Dalam Daerah'>(initialData?.tipePerjalanan || 'Luar Daerah');
  const [indeksBulan, setIndeksBulan] = useState(initialData?.indeksBulan || '06');
  const [indeksTahun, setIndeksTahun] = useState(initialData?.indeksTahun || '2026');
  const [nomorUrutPetugas, setNomorUrutPetugas] = useState(initialData?.nomorUrutPetugas || '1');
  const [kodeRup, setKodeRup] = useState(initialData?.kodeRup || '40186842');
  const [sumberPembiayaan, setSumberPembiayaan] = useState(initialData?.sumberPembiayaan || 'DAU');
  const [pejabatTtdSptType, setPejabatTtdSptType] = useState(initialData?.pejabatTtdSptType || '1');
  const [pejabatTtdSpdType, setPejabatTtdSpdType] = useState(initialData?.pejabatTtdSpdType || '1');
  const [pejabatTtdSpdPulangType, setPejabatTtdSpdPulangType] = useState(initialData?.pejabatTtdSpdPulangType || '1');

  // Auto-fill penandatangan fields from registered list or dynamic defaults
  useEffect(() => {
    if (selectedPejabatId) {
      if (selectedPejabatId === 'manual') {
        // Keep current or allow typing
      } else {
        const found = pejabatList.find((p) => p.id === selectedPejabatId);
        if (found) {
          setPenandatanganNama(found.nama);
          setPenandatanganPangkat(found.pangkatGol || 'Pembina Utama Muda');
          setPenandatanganNip(found.nip ? (found.nip.startsWith('NIP.') ? found.nip : `NIP. ${found.nip}`) : '');
          setPinError('');
          return;
        }
      }
    }

    // Dynamic fallback based on roles and titles
    let searchKeywords: string[] = [];
    let defaultVal = {
      nama: 'Syarifudin Ibrahim, ST',
      pangkat: 'Pembina Utama Muda - IV/c',
      nip: '19681102 199703 1 008'
    };

    if (tipePerjalanan === 'Dalam Daerah') {
      const type = pejabatTtdSptType || '2';
      if (type === '1') {
        searchKeywords = ['kepala dinas', 'kadis'];
        defaultVal = {
          nama: 'SYARIFUDIN IBRAHIM, ST',
          pangkat: 'Pembina Utama Muda - IV/c',
          nip: '19681102 199703 1 008'
        };
      } else {
        searchKeywords = ['sekretaris'];
        defaultVal = {
          nama: 'ANSELMUS MERE, SE',
          pangkat: 'Pembina Tk.I - IV/b',
          nip: '19740413 200901 1 001'
        };
      }
    } else {
      switch (pejabatTtdSptType) {
        case '1':
          searchKeywords = ['bupati'];
          defaultVal = { nama: 'SIMPLISIUS DONATUS', pangkat: '', nip: '' };
          break;
        case '2':
          searchKeywords = ['wakil bupati'];
          defaultVal = { nama: 'MARIANUS WAE', pangkat: '', nip: '' };
          break;
        case '3':
          searchKeywords = ['sekda', 'sekretaris daerah'];
          defaultVal = {
            nama: 'Drs. LUKAS GERA',
            pangkat: 'Pembina Utama Madya',
            nip: '19671205 199303 1 007'
          };
          break;
        case '4':
          searchKeywords = ['asisten i', 'asisten 1', 'asisten pemerintahan'];
          defaultVal = {
            nama: 'IMANUEL MBAPA, SH',
            pangkat: 'Pembina Utama Muda',
            nip: '19700502 199602 1 003'
          };
          break;
        case '5':
          searchKeywords = ['asisten ii', 'asisten 2', 'asisten perekonomian'];
          defaultVal = {
            nama: 'Drs. AGUSTINUS SEKOU',
            pangkat: 'Pembina Utama Muda',
            nip: '19690815 199503 1 002'
          };
          break;
        case '6':
          searchKeywords = ['asisten iii', 'asisten 3', 'asisten administrasi'];
          defaultVal = {
            nama: 'YULIUS SAGO, S.Sos',
            pangkat: 'Pembina Utama Muda',
            nip: '19710324 199803 1 004'
          };
          break;
        default:
          break;
      }
    }

    // Try to find an active registered official with a matching title
    const found = pejabatList.find(p => 
      p.status === 'Aktif' && 
      searchKeywords.some(kw => p.jabatan?.toLowerCase().includes(kw))
    );

    if (found) {
      setPenandatanganNama(found.nama);
      setPenandatanganPangkat(found.pangkatGol || '');
      setPenandatanganNip(found.nip ? (found.nip.startsWith('NIP.') ? found.nip : `NIP. ${found.nip}`) : '');
    } else {
      setPenandatanganNama(defaultVal.nama);
      setPenandatanganPangkat(defaultVal.pangkat);
      setPenandatanganNip(defaultVal.nip ? (defaultVal.nip.startsWith('NIP.') ? defaultVal.nip : `NIP. ${defaultVal.nip}`) : '');
    }
  }, [selectedPejabatId, pejabatTtdSptType, tipePerjalanan, pejabatList]);

  // Assigned employees list (Tugaskan Kepada)
  const [tugaskanKepada, setTugaskanKepada] = useState<TugaskanKepada[]>(
    initialData?.tugaskanKepada || [{ nama: '', nip: '', pangkatGol: '', jabatan: '' }]
  );

  // Auto nomor generation if empty
  useEffect(() => {
    if (!nomor) {
      const year = new Date().getFullYear();
      const rand = Math.floor(1000 + Math.random() * 9000);
      if (tipePerjalanan === 'Dalam Daerah') {
        setNomor(`000.1.2.3/DPUPR-NGK/${rand}/04/${year}`);
      } else {
        setNomor(`000.1.2.3/BU-NGK/${rand}/06/${year}`);
      }
    }
  }, [nomor, tipePerjalanan]);

  const isFirstRender = React.useRef(true);
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    const year = new Date().getFullYear();
    const rand = Math.floor(1000 + Math.random() * 9000);
    
    if (tipePerjalanan === 'Dalam Daerah') {
      setDasar('Permohonan masyarakat untuk melakukan survey dan identifikasi lokasi');
      setAlatAngkut('Kendaraan Roda Dua');
      setKeperluan('Dalam rangka mengantar Kepala Dinas Pekerjaan Umum dan Penataan Ruang Kabupaten Nagekeo mengikuti kegiatan Musrenbangcam di Kecamatan Keo Tengah, Kecamatan Mauponggo dan Kecamtan Boawae');
      setTempatTujuan('Kec.Keo Tengah, Kec. Mauponggo dan Kec. Boawae');
      setIndeksBulan('04');
      setIndeksTahun(year.toString());
      setNomorUrutPetugas('59 orang ke 1, 61 orang ke 2');
      setKodeRup('40186842');
      setSumberPembiayaan('Bagian Laba yang Dibagikan kepada Pemerintah Daerah (Dividen) atas Penyertaan Modal pada Perusahaan Milik Daerah/BUMD');
      setPejabatTtdSptType('2'); // Default to Sekretaris
      setPejabatTtdSpdType('2');
      setPejabatTtdSpdPulangType('2');
      setNomor(`000.1.2.3/DPUPR-NGK/${rand}/04/${year}`);
    } else {
      setDasar('Undangan Verifikasi dan Validasi Usulan Penanganan Jalan Daerah melalui Skema Inpres Nomor 11 Tahun 2025');
      setAlatAngkut('Pesawat Terbang, PP');
      setKeperluan('Undangan Verifikasi dan Validasi Usulan Penanganan Jalan Daerah melalui Skema Inpres Nomor 11 Tahun 2025');
      setTempatTujuan('Jakarta, PP');
      setIndeksBulan('06');
      setIndeksTahun(year.toString());
      setNomorUrutPetugas('1');
      setKodeRup('40186842');
      setSumberPembiayaan('DAU');
      setPejabatTtdSptType('1');
      setPejabatTtdSpdType('1');
      setPejabatTtdSpdPulangType('1');
      setNomor(`000.1.2.3/BU-NGK/${rand}/06/${year}`);
    }
  }, [tipePerjalanan]);

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

      // Save extra fields
      tipePerjalanan,
      indeksBulan,
      indeksTahun,
      nomorUrutPetugas,
      kodeRup,
      sumberPembiayaan,
      pejabatTtdSptType,
      pejabatTtdSpdType,
      pejabatTtdSpdPulangType,
    };

    // Calculate document hash
    const hash = calculateDocumentHash(preliminaryData);

    // Create encrypted signature using the unique official's PIN
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
    }, signaturePin);

    const finalData: SptData = {
      ...preliminaryData,
      encryptedSignature,
    };

    onSave(finalData);
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-4 sm:p-8 rounded-xl shadow-md border border-gray-100 max-w-3xl mx-auto space-y-6" id="spt-creation-form">
      <div className="border-b border-gray-100 pb-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h3 className="text-xl font-bold text-gray-900">Buat / Edit Surat Perintah Tugas (SPT)</h3>
          <p className="text-sm text-gray-500 mt-1">Isi formulir dengan lengkap untuk mendaftarkan digital signature SPT secara terenkripsi.</p>
        </div>

        {/* Tipe Perjalanan Switcher */}
        <div className="flex bg-slate-100 p-1.5 rounded-xl border border-slate-200 self-start md:self-auto">
          <button
            type="button"
            onClick={() => setTipePerjalanan('Luar Daerah')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
              tipePerjalanan === 'Luar Daerah'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            ✈️ Luar Daerah
          </button>
          <button
            type="button"
            onClick={() => setTipePerjalanan('Dalam Daerah')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
              tipePerjalanan === 'Dalam Daerah'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            🚗 Dalam Daerah
          </button>
        </div>
      </div>

      {/* Specific Form Section (Styled matching Page 2 "FORMAT ISIAN SPT SPD") */}
      <div className={`p-4 sm:p-6 rounded-2xl space-y-4 border ${
        tipePerjalanan === 'Dalam Daerah'
          ? 'bg-emerald-50/40 border-emerald-100'
          : 'bg-orange-50/40 border-orange-100'
      }`}>
        <div className={`flex items-center gap-2 border-b pb-2 ${
          tipePerjalanan === 'Dalam Daerah' ? 'border-emerald-100' : 'border-orange-100'
        }`}>
          <span className="text-lg">📋</span>
          <h4 className={`text-sm font-extrabold uppercase tracking-wider ${
            tipePerjalanan === 'Dalam Daerah' ? 'text-emerald-950' : 'text-orange-950'
          }`}>
            Format Isian SPT & SPD {tipePerjalanan}
          </h4>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Indeks Surat */}
          <div className="md:col-span-1">
            <label className={`block text-3xs font-extrabold uppercase tracking-wider mb-1 ${
              tipePerjalanan === 'Dalam Daerah' ? 'text-emerald-900' : 'text-orange-900'
            }`}>Indeks Bulan & Tahun</label>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                value={indeksBulan}
                onChange={(e) => setIndeksBulan(e.target.value)}
                placeholder="Bulan"
                className={`w-full px-3 py-1.5 border rounded-lg text-xs bg-white ${
                  tipePerjalanan === 'Dalam Daerah'
                    ? 'border-emerald-200 focus:ring-emerald-500 focus:border-emerald-500'
                    : 'border-orange-200 focus:ring-orange-500 focus:border-orange-500'
                }`}
                id="input-spt-indeks-bulan"
              />
              <input
                type="text"
                value={indeksTahun}
                onChange={(e) => setIndeksTahun(e.target.value)}
                placeholder="Tahun"
                className={`w-full px-3 py-1.5 border rounded-lg text-xs bg-white ${
                  tipePerjalanan === 'Dalam Daerah'
                    ? 'border-emerald-200 focus:ring-emerald-500 focus:border-emerald-500'
                    : 'border-orange-200 focus:ring-orange-500 focus:border-orange-500'
                }`}
                id="input-spt-indeks-tahun"
              />
            </div>
          </div>

          {/* Nomor Urut Petugas */}
          <div>
            <label className={`block text-3xs font-extrabold uppercase tracking-wider mb-1 ${
              tipePerjalanan === 'Dalam Daerah' ? 'text-emerald-900' : 'text-orange-900'
            }`}>Nomor Urut Petugas</label>
            <input
              type="text"
              value={nomorUrutPetugas}
              onChange={(e) => setNomorUrutPetugas(e.target.value)}
              placeholder="Contoh: 1 orang ke 1"
              className={`w-full px-3 py-1.5 border rounded-lg text-xs bg-white font-medium ${
                tipePerjalanan === 'Dalam Daerah'
                  ? 'border-emerald-200 focus:ring-emerald-500 focus:border-emerald-500'
                  : 'border-orange-200 focus:ring-orange-500 focus:border-orange-500'
              }`}
              id="input-spt-no-urut"
            />
          </div>

          {/* Kode RUP */}
          <div>
            <label className={`block text-3xs font-extrabold uppercase tracking-wider mb-1 ${
              tipePerjalanan === 'Dalam Daerah' ? 'text-emerald-900' : 'text-orange-900'
            }`}>Kode RUP</label>
            <input
              type="text"
              value={kodeRup}
              onChange={(e) => setKodeRup(e.target.value)}
              placeholder="Contoh: 40186842"
              className={`w-full px-3 py-1.5 border rounded-lg text-xs bg-white font-mono ${
                tipePerjalanan === 'Dalam Daerah'
                  ? 'border-emerald-200 focus:ring-emerald-500 focus:border-emerald-500'
                  : 'border-orange-200 focus:ring-orange-500 focus:border-orange-500'
              }`}
              id="input-spt-kode-rup"
            />
          </div>
        </div>

        <div className={`grid grid-cols-1 md:grid-cols-3 gap-4 border-t pt-3 ${
          tipePerjalanan === 'Dalam Daerah' ? 'border-emerald-100/50' : 'border-orange-100/50'
        }`}>
          {/* Pejabat Ttd SPT */}
          <div>
            <label className={`block text-3xs font-extrabold uppercase tracking-wider mb-1 ${
              tipePerjalanan === 'Dalam Daerah' ? 'text-emerald-900' : 'text-orange-900'
            }`}>Penandatangan SPT</label>
            <select
              value={pejabatTtdSptType}
              onChange={(e) => setPejabatTtdSptType(e.target.value)}
              className={`w-full px-3 py-1.5 border rounded-lg text-xs bg-white font-medium ${
                tipePerjalanan === 'Dalam Daerah'
                  ? 'border-emerald-200 focus:ring-emerald-500 focus:border-emerald-500'
                  : 'border-orange-200 focus:ring-orange-500 focus:border-orange-500'
              }`}
              id="select-spt-ttd"
            >
              {tipePerjalanan === 'Dalam Daerah' ? (
                <>
                  <option value="1">1 : KEPALA DINAS</option>
                  <option value="2">2 : SEKRETARIS</option>
                </>
              ) : (
                <>
                  <option value="1">1 : BUPATI</option>
                  <option value="2">2 : WAKIL BUPATI</option>
                  <option value="3">3 : SEKDA</option>
                  <option value="4">4 : ASISTEN 1</option>
                  <option value="5">5 : ASISTEN 2</option>
                  <option value="6">6 : ASISTEN 3</option>
                </>
              )}
            </select>
          </div>

          {/* Pejabat Ttd SPD */}
          <div>
            <label className={`block text-3xs font-extrabold uppercase tracking-wider mb-1 ${
              tipePerjalanan === 'Dalam Daerah' ? 'text-emerald-900' : 'text-orange-900'
            }`}>Penandatangan SPD</label>
            <select
              value={pejabatTtdSpdType}
              onChange={(e) => setPejabatTtdSpdType(e.target.value)}
              className={`w-full px-3 py-1.5 border rounded-lg text-xs bg-white font-medium ${
                tipePerjalanan === 'Dalam Daerah'
                  ? 'border-emerald-200 focus:ring-emerald-500 focus:border-emerald-500'
                  : 'border-orange-200 focus:ring-orange-500 focus:border-orange-500'
              }`}
              id="select-spd-ttd"
            >
              <option value="1">1 : KEPALA DINAS</option>
              <option value="2">2 : SEKRETARIS</option>
            </select>
          </div>

          {/* Pejabat Ttd SPD Pulang */}
          <div>
            <label className={`block text-3xs font-extrabold uppercase tracking-wider mb-1 ${
              tipePerjalanan === 'Dalam Daerah' ? 'text-emerald-900' : 'text-orange-900'
            }`}>Penandatangan SPD Pulang</label>
            <select
              value={pejabatTtdSpdPulangType}
              onChange={(e) => setPejabatTtdSpdPulangType(e.target.value)}
              className={`w-full px-3 py-1.5 border rounded-lg text-xs bg-white font-medium ${
                tipePerjalanan === 'Dalam Daerah'
                  ? 'border-emerald-200 focus:ring-emerald-500 focus:border-emerald-500'
                  : 'border-orange-200 focus:ring-orange-500 focus:border-orange-500'
              }`}
              id="select-spd-pulang-ttd"
            >
              <option value="1">1 : KEPALA DINAS</option>
              <option value="2">2 : SEKRETARIS</option>
            </select>
          </div>
        </div>
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
