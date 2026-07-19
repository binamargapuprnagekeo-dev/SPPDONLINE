import React, { useState, useEffect } from 'react';
import { SppdData, DaftarBayarData, DaftarBayarRow } from '../types';

interface DaftarBayarFormProps {
  sppdList: SppdData[];
  initialData: DaftarBayarData | null;
  onSave: (data: DaftarBayarData) => void;
  onCancel: () => void;
}

// Peraturan Bupati Nagekeo Nomor 5 Tahun 2026 rates
const STANDARD_RATES = {
  uangHarian: [
    { nama: 'DKI Jakarta', rate: 530000 },
    { nama: 'Jawa Timur', rate: 510000 },
    { nama: 'Jawa Barat', rate: 430000 },
    { nama: 'Nusa Tenggara Timur (NTT)', rate: 430000 },
  ],
  penginapan: [
    { nama: 'DKI Jakarta', eselon2: 1000000, eselon3: 700000, eselon4: 500000 },
    { nama: 'Jawa Timur', eselon2: 1000000, eselon3: 700000, eselon4: 500000 },
    { nama: 'Jawa Barat', eselon2: 1000000, eselon3: 700000, eselon4: 500000 },
    { nama: 'Nusa Tenggara Timur (NTT)', eselon2: 1000000, eselon3: 700000, eselon4: 500000 },
  ],
  transportasiFlores: [
    { nama: 'Mbay ke Ende', rate: 150000 },
    { nama: 'Mbay ke Bajawa', rate: 150000 },
    { nama: 'Mbay ke Maumere', rate: 275000 },
    { nama: 'Mbay ke Manggarai Barat', rate: 325000 },
  ],
  representasi: [
    { nama: 'Pejabat Eselon II', rate: 150000 },
  ]
};

export default function DaftarBayarForm({ sppdList, initialData, onSave, onCancel }: DaftarBayarFormProps) {
  const [selectedSppdId, setSelectedSppdId] = useState('');
  const [perjalananDinasType, setPerjalananDinasType] = useState('PERJALANAN DINAS LUAR DAERAH');
  const [maksudPerjalanan, setMaksudPerjalanan] = useState('');
  const [tanggalPerjalanan, setTanggalPerjalanan] = useState('');
  const [sumberDana, setSumberDana] = useState('DPA Dinas Pekerjaan Umum dan Penataan Ruang Kabupaten Nagekeo T.A. 2026');
  const [kodeRekening, setKodeRekening] = useState('1.03.10.2.01.5.1.02.04.001.00003');
  const [kodeRup, setKodeRup] = useState('40186842');

  // Input calculator aids
  const [useStandardRates, setUseStandardRates] = useState(true);
  const [targetProvince, setTargetProvince] = useState('Nusa Tenggara Timur (NTT)');
  const [eselonGrade, setEselonGrade] = useState('eselon4'); // eselon2, eselon3, eselon4 (standard/other)
  const [floresRoute, setFloresRoute] = useState('none'); // Mbay ke ...
  const [isEselon2, setIsEselon2] = useState(false);

  // Row items (usually 1 main employee, and optionally followers)
  const [rows, setRows] = useState<DaftarBayarRow[]>([
    {
      nama: '',
      nip: '',
      tanggal: '',
      jumlah: 0,
      potongan: 0,
      terima: 0,
      noRekening: '',
      bank: 'BANK NTT CAB. MBAY',
      statusTransaksi: 'Transfer',
      tandaTerima: 'Selesai'
    }
  ]);

  const [tanggalDikeluarkan, setTanggalDikeluarkan] = useState('');
  const [penggunaAnggaranNama, setPenggunaAnggaranNama] = useState('SYARIFUDIN IBRAHIM, ST');
  const [penggunaAnggaranNip, setPenggunaAnggaranNip] = useState('19681102 199703 1 008');
  const [bendaharaNama, setBendaharaNama] = useState('FLORENTINA WONGA');
  const [bendaharaNip, setBendaharaNip] = useState('19740413 200901 1 001');

  // Setup initial values or loaded edit values
  useEffect(() => {
    if (initialData) {
      setSelectedSppdId(initialData.sppdId);
      setPerjalananDinasType(initialData.perjalananDinasType);
      setMaksudPerjalanan(initialData.maksudPerjalanan);
      setTanggalPerjalanan(initialData.tanggalPerjalanan);
      setSumberDana(initialData.sumberDana);
      setKodeRekening(initialData.kodeRekening);
      setKodeRup(initialData.kodeRup);
      setRows(initialData.rows);
      setTanggalDikeluarkan(initialData.tanggalDikeluarkan);
      setPenggunaAnggaranNama(initialData.penggunaAnggaranNama);
      setPenggunaAnggaranNip(initialData.penggunaAnggaranNip);
      setBendaharaNama(initialData.bendaharaNama);
      setBendaharaNip(initialData.bendaharaNip);
    } else {
      // Default date
      const today = new Date();
      const monthNames = [
        "Januari", "Februari", "Maret", "April", "Mei", "Juni",
        "Juli", "Agustus", "September", "Oktober", "November", "Desember"
      ];
      setTanggalDikeluarkan(`${today.getDate()} ${monthNames[today.getMonth()]} ${today.getFullYear()}`);
    }
  }, [initialData]);

  // When SPPD is selected, auto fill details and calculate estimate!
  const handleSppdChange = (id: string) => {
    setSelectedSppdId(id);
    const sppd = sppdList.find(s => s.id === id);
    if (!sppd) return;

    setMaksudPerjalanan(sppd.maksudPerjalanan);
    setTanggalPerjalanan(`${sppd.tanggalBerangkat} sampai ${sppd.tanggalKembali}`);
    
    // Auto populate signatory from SPPD
    if (sppd.penandatanganNama) {
      setPenggunaAnggaranNama(sppd.penandatanganNama);
      setPenggunaAnggaranNip(sppd.penandatanganNip);
    }

    // Parse travel duration (e.g. "4 Hari" -> 4)
    const durationMatch = sppd.lamanyaPerjalanan.match(/\d+/);
    const durationDays = durationMatch ? parseInt(durationMatch[0]) : 1;

    // Calculate rates
    let dailyRate = 430000; // default NTT
    const matchedDaily = STANDARD_RATES.uangHarian.find(r => r.nama === targetProvince);
    if (matchedDaily) {
      dailyRate = matchedDaily.rate;
    }

    let lodgingRate = 500000; // default eselon 4
    const matchedLodging = STANDARD_RATES.penginapan.find(r => r.nama === targetProvince);
    if (matchedLodging) {
      if (eselonGrade === 'eselon2') lodgingRate = matchedLodging.eselon2;
      else if (eselonGrade === 'eselon3') lodgingRate = matchedLodging.eselon3;
      else lodgingRate = matchedLodging.eselon4;
    }

    let transportRate = 0;
    const matchedTransport = STANDARD_RATES.transportasiFlores.find(r => r.nama.toLowerCase().includes(floresRoute.toLowerCase()));
    if (matchedTransport) {
      transportRate = matchedTransport.rate;
    }

    let representationRate = 0;
    if (isEselon2) {
      representationRate = 150000;
    }

    // Total standard cost for the trip
    const dailyCost = dailyRate * durationDays;
    const lodgingCost = lodgingRate * (durationDays - 1 > 0 ? durationDays - 1 : 1); // hotel is usually nights = days - 1
    const totalEstimate = dailyCost + lodgingCost + transportRate + (representationRate * durationDays);

    // Update row with auto-calculated details
    const newRows: DaftarBayarRow[] = [
      {
        nama: sppd.namaPegawai,
        nip: sppd.nip,
        tanggal: `${sppd.tanggalBerangkat} s/d ${sppd.tanggalKembali}`,
        jumlah: totalEstimate,
        potongan: 0,
        terima: totalEstimate,
        noRekening: '',
        bank: 'BANK NTT CAB. MBAY',
        statusTransaksi: 'Transfer',
        tandaTerima: 'Selesai'
      }
    ];

    // If there are followers (pengikut), add them too!
    if (sppd.pengikut && sppd.pengikut.length > 0) {
      sppd.pengikut.forEach(follower => {
        // followers usually get the same daily rate, but might not get own hotel or can get different lodging
        // let's assume half lodging or same daily cost + same transport
        const fLodging = matchedLodging ? matchedLodging.eselon4 : 500000;
        const fEstimate = (dailyRate * durationDays) + (fLodging * (durationDays - 1 > 0 ? durationDays - 1 : 1)) + transportRate;
        newRows.push({
          nama: follower.nama,
          nip: follower.keterangan || '-',
          tanggal: `${sppd.tanggalBerangkat} s/d ${sppd.tanggalKembali}`,
          jumlah: fEstimate,
          potongan: 0,
          terima: fEstimate,
          noRekening: '',
          bank: 'BANK NTT CAB. MBAY',
          statusTransaksi: 'Transfer',
          tandaTerima: 'Selesai'
        });
      });
    }

    setRows(newRows);
  };

  // Recalculate if standard config changes
  const triggerRecalculate = () => {
    if (!selectedSppdId) return;
    handleSppdChange(selectedSppdId);
  };

  // Row update handlers
  const handleRowChange = (index: number, field: keyof DaftarBayarRow, value: any) => {
    const updatedRows = [...rows];
    const row = { ...updatedRows[index], [field]: value };
    
    // Automatically keep "terima" updated if "jumlah" or "potongan" changes
    if (field === 'jumlah' || field === 'potongan') {
      const g = field === 'jumlah' ? Number(value) : Number(row.jumlah);
      const p = field === 'potongan' ? Number(value) : Number(row.potongan);
      row.terima = g - p;
    }
    
    updatedRows[index] = row as DaftarBayarRow;
    setRows(updatedRows);
  };

  const addRow = () => {
    setRows([
      ...rows,
      {
        nama: '',
        nip: '',
        tanggal: tanggalPerjalanan ? tanggalPerjalanan.replace('sampai', 's/d') : '',
        jumlah: 0,
        potongan: 0,
        terima: 0,
        noRekening: '',
        bank: 'BANK NTT CAB. MBAY',
        statusTransaksi: 'Transfer',
        tandaTerima: 'Selesai'
      }
    ]);
  };

  const removeRow = (index: number) => {
    if (rows.length === 1) return;
    setRows(rows.filter((_, idx) => idx !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSppdId) {
      alert('Silakan pilih berkas SPD terlebih dahulu!');
      return;
    }

    const selectedSppd = sppdList.find(s => s.id === selectedSppdId);

    const submissionData: DaftarBayarData = {
      id: initialData?.id || `db-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      sppdId: selectedSppdId,
      nomorSppd: selectedSppd ? selectedSppd.nomor : '',
      perjalananDinasType,
      maksudPerjalanan,
      tanggalPerjalanan,
      sumberDana,
      kodeRekening,
      kodeRup,
      rows,
      tanggalDikeluarkan,
      penggunaAnggaranNama,
      penggunaAnggaranNip,
      bendaharaNama,
      bendaharaNip,
      createdAt: initialData?.createdAt || new Date().toISOString()
    };

    onSave(submissionData);
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-2xl p-6 shadow-2xs space-y-6">
      <div className="border-b border-gray-100 pb-4">
        <h3 className="text-base font-bold text-slate-800 uppercase tracking-wide">
          {initialData ? 'Edit Daftar Pembayaran' : 'Buat Daftar Pembayaran Baru'}
        </h3>
        <p className="text-3xs sm:text-2xs text-slate-500 mt-0.5">
          Formulir input rincian nominal pembayaran perjalanan dinas berdasarkan standard Peraturan Bupati Nagekeo.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Step 1: Select SPD */}
        <div className="space-y-1.5 md:col-span-2">
          <label className="text-2xs font-bold text-gray-700 block uppercase tracking-wider">Hubungkan dengan Surat Perjalanan Dinas (SPD) *</label>
          <select
            value={selectedSppdId}
            onChange={(e) => handleSppdChange(e.target.value)}
            className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-xs sm:text-sm bg-white focus:ring-2 focus:ring-indigo-500"
            required
          >
            <option value="">-- Pilih Surat Perjalanan Dinas (SPD) --</option>
            {sppdList.map((s) => (
              <option key={s.id} value={s.id}>
                {s.nomor} - {s.namaPegawai} ({s.tempatTujuan})
              </option>
            ))}
          </select>
        </div>

        {/* Step 2: Auto-calculate Setup helper */}
        {selectedSppdId && (
          <div className="md:col-span-2 bg-slate-50 rounded-xl border border-slate-200 p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <span>⚡</span>
                <span>Asisten Penghitung Otomatis (Perbup No. 5 Tahun 2026)</span>
              </h4>
              <label className="flex items-center gap-1 text-3xs font-bold text-indigo-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={useStandardRates}
                  onChange={(e) => setUseStandardRates(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500"
                />
                <span>Aktif</span>
              </label>
            </div>

            {useStandardRates && (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                <div className="space-y-1">
                  <label className="text-4xs font-bold text-gray-500 block uppercase">Wilayah Tujuan</label>
                  <select
                    value={targetProvince}
                    onChange={(e) => {
                      setTargetProvince(e.target.value);
                    }}
                    className="w-full px-2.5 py-1.5 border border-gray-300 rounded-lg text-xs bg-white"
                  >
                    <option value="Nusa Tenggara Timur (NTT)">Nusa Tenggara Timur (NTT)</option>
                    <option value="DKI Jakarta">DKI Jakarta</option>
                    <option value="Jawa Timur">Jawa Timur</option>
                    <option value="Jawa Barat">Jawa Barat</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-4xs font-bold text-gray-500 block uppercase">Fasilitas Hotel (Eselon)</label>
                  <select
                    value={eselonGrade}
                    onChange={(e) => {
                      setEselonGrade(e.target.value);
                    }}
                    className="w-full px-2.5 py-1.5 border border-gray-300 rounded-lg text-xs bg-white"
                  >
                    <option value="eselon4">Eselon IV / Gol III,II,I (Rp 500k)</option>
                    <option value="eselon3">Eselon III / Gol IV (Rp 700k)</option>
                    <option value="eselon2">Eselon II (Rp 1.000k)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-4xs font-bold text-gray-500 block uppercase">Darat Flores (Mbay ke...)</label>
                  <select
                    value={floresRoute}
                    onChange={(e) => {
                      setFloresRoute(e.target.value);
                    }}
                    className="w-full px-2.5 py-1.5 border border-gray-300 rounded-lg text-xs bg-white"
                  >
                    <option value="none">Tidak ada / Pakai Tiket Pesawat</option>
                    <option value="Ende">Ende (Rp 150k)</option>
                    <option value="Bajawa">Bajawa (Rp 150k)</option>
                    <option value="Maumere">Maumere (Rp 275k)</option>
                    <option value="Manggarai Barat">Manggarai Barat (Rp 325k)</option>
                  </select>
                </div>

                <div className="space-y-1 flex items-end">
                  <label className="flex items-center gap-1.5 text-xs text-gray-700 cursor-pointer mb-2.5">
                    <input
                      type="checkbox"
                      checked={isEselon2}
                      onChange={(e) => {
                        setIsEselon2(e.target.checked);
                      }}
                      className="rounded text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-4xs font-bold uppercase text-gray-500">Uang Representasi (Eselon II)</span>
                  </label>
                </div>

                <div className="sm:col-span-2 md:col-span-4 flex justify-end">
                  <button
                    type="button"
                    onClick={triggerRecalculate}
                    className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-3xs font-bold uppercase tracking-wider rounded-lg transition"
                  >
                    Hitung & Terapkan Nominal Rincian
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* General Details */}
        <div className="space-y-1">
          <label className="text-3xs font-bold text-gray-600 uppercase">Jenis Perjalanan Dinas</label>
          <select
            value={perjalananDinasType}
            onChange={(e) => setPerjalananDinasType(e.target.value)}
            className="w-full px-3.5 py-2 border border-gray-300 rounded-xl text-xs sm:text-sm bg-white"
          >
            <option value="PERJALANAN DINAS LUAR DAERAH">PERJALANAN DINAS LUAR DAERAH</option>
            <option value="PERJALANAN DINAS DALAM DAERAH">PERJALANAN DINAS DALAM DAERAH</option>
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-3xs font-bold text-gray-600 uppercase">Tanggal Perjalanan</label>
          <input
            type="text"
            value={tanggalPerjalanan}
            onChange={(e) => setTanggalPerjalanan(e.target.value)}
            className="w-full px-3.5 py-2 border border-gray-300 rounded-xl text-xs sm:text-sm"
            placeholder="e.g. 01 Juli 2026 sampai 04 Juli 2026"
            required
          />
        </div>

        <div className="md:col-span-2 space-y-1">
          <label className="text-3xs font-bold text-gray-600 uppercase">Maksud Perjalanan Dinas</label>
          <textarea
            value={maksudPerjalanan}
            onChange={(e) => setMaksudPerjalanan(e.target.value)}
            className="w-full px-3.5 py-2 border border-gray-300 rounded-xl text-xs sm:text-sm h-16"
            placeholder="Maksud atau rincian perjalanan..."
            required
          />
        </div>

        <div className="space-y-1">
          <label className="text-3xs font-bold text-gray-600 uppercase">Sumber Pembiayaan / DPA</label>
          <input
            type="text"
            value={sumberDana}
            onChange={(e) => setSumberDana(e.target.value)}
            className="w-full px-3.5 py-2 border border-gray-300 rounded-xl text-xs sm:text-sm"
            placeholder="Sumber Dana DPA..."
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <label className="text-3xs font-bold text-gray-600 uppercase">Kode Rekening</label>
            <input
              type="text"
              value={kodeRekening}
              onChange={(e) => setKodeRekening(e.target.value)}
              className="w-full px-3.5 py-2 border border-gray-300 rounded-xl text-xs sm:text-sm"
              placeholder="Kode Rekening..."
              required
            />
          </div>
          <div className="space-y-1">
            <label className="text-3xs font-bold text-gray-600 uppercase">Kode RUP</label>
            <input
              type="text"
              value={kodeRup}
              onChange={(e) => setKodeRup(e.target.value)}
              className="w-full px-3.5 py-2 border border-gray-300 rounded-xl text-xs sm:text-sm"
              placeholder="Kode RUP..."
              required
            />
          </div>
        </div>
      </div>

      {/* Rows of payee (penerima) */}
      <div className="space-y-4">
        <div className="flex justify-between items-center border-b border-gray-100 pb-2">
          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide">Daftar Penerima Pembayaran</h4>
          <button
            type="button"
            onClick={addRow}
            className="px-3 py-1 bg-indigo-50 text-indigo-700 border border-indigo-150 hover:bg-indigo-100 text-3xs font-bold rounded-lg transition"
          >
            + Tambah Penerima
          </button>
        </div>

        <div className="space-y-4">
          {rows.map((row, idx) => (
            <div key={idx} className="bg-slate-50/50 border border-slate-200 rounded-2xl p-4 space-y-3 relative">
              {rows.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeRow(idx)}
                  className="absolute top-3 right-3 text-red-500 hover:text-red-700 font-bold text-xs"
                  title="Hapus Penerima"
                >
                  ✕ Hapus
                </button>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                <div className="space-y-1">
                  <label className="text-4xs font-bold text-gray-500 block uppercase">Nama Penerima *</label>
                  <input
                    type="text"
                    value={row.nama}
                    onChange={(e) => handleRowChange(idx, 'nama', e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-gray-300 rounded-lg text-xs bg-white"
                    placeholder="Nama lengkap..."
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-4xs font-bold text-gray-500 block uppercase">NIP / Keterangan</label>
                  <input
                    type="text"
                    value={row.nip}
                    onChange={(e) => handleRowChange(idx, 'nip', e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-gray-300 rounded-lg text-xs bg-white"
                    placeholder="NIP / Pangkat..."
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-4xs font-bold text-gray-500 block uppercase">Tanggal Perjalanan</label>
                  <input
                    type="text"
                    value={row.tanggal}
                    onChange={(e) => handleRowChange(idx, 'tanggal', e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-gray-300 rounded-lg text-xs bg-white"
                    placeholder="e.g. 01 Juli - 04 Juli"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-4xs font-bold text-gray-500 block uppercase">Jumlah Bruto (Rp) *</label>
                  <input
                    type="number"
                    value={row.jumlah}
                    onChange={(e) => handleRowChange(idx, 'jumlah', Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 border border-gray-300 rounded-lg text-xs bg-white font-mono"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-4xs font-bold text-gray-500 block uppercase">Potongan / Pajak (Rp)</label>
                  <input
                    type="number"
                    value={row.potongan}
                    onChange={(e) => handleRowChange(idx, 'potongan', Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 border border-gray-300 rounded-lg text-xs bg-white font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-4xs font-bold text-gray-500 block uppercase">Netto Diterima (Rp)</label>
                  <input
                    type="number"
                    value={row.terima}
                    className="w-full px-2.5 py-1.5 border border-gray-200 bg-gray-100 rounded-lg text-xs font-mono font-bold text-slate-800 cursor-not-allowed"
                    readOnly
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-4xs font-bold text-gray-500 block uppercase">No. Rekening</label>
                  <input
                    type="text"
                    value={row.noRekening}
                    onChange={(e) => handleRowChange(idx, 'noRekening', e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-gray-300 rounded-lg text-xs bg-white font-mono"
                    placeholder="e.g. 040.02..."
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-4xs font-bold text-gray-500 block uppercase">Bank & Cara Bayar</label>
                  <div className="grid grid-cols-2 gap-1">
                    <input
                      type="text"
                      value={row.bank}
                      onChange={(e) => handleRowChange(idx, 'bank', e.target.value)}
                      className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-xs bg-white"
                      placeholder="Nama Bank..."
                    />
                    <select
                      value={row.statusTransaksi}
                      onChange={(e) => handleRowChange(idx, 'statusTransaksi', e.target.value)}
                      className="w-full px-1 py-1.5 border border-gray-300 rounded-lg text-xs bg-white"
                    >
                      <option value="Transfer">Transfer</option>
                      <option value="Tunai">Tunai</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Signatures & Disbursal info */}
      <div className="border-t border-gray-100 pt-4 space-y-4">
        <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide">Pengesahan & Tanggal</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          <div className="space-y-1">
            <label className="text-3xs font-bold text-gray-600 uppercase">Mbay, Tanggal Pengeluaran Uang</label>
            <input
              type="text"
              value={tanggalDikeluarkan}
              onChange={(e) => setTanggalDikeluarkan(e.target.value)}
              className="w-full px-3.5 py-2 border border-gray-300 rounded-xl text-xs sm:text-sm"
              placeholder="e.g. 04 Juli 2026"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-3xs font-bold text-gray-600 uppercase">Nama Pengguna Anggaran</label>
            <input
              type="text"
              value={penggunaAnggaranNama}
              onChange={(e) => setPenggunaAnggaranNama(e.target.value)}
              className="w-full px-3.5 py-2 border border-gray-300 rounded-xl text-xs sm:text-sm"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-3xs font-bold text-gray-600 uppercase">NIP Pengguna Anggaran</label>
            <input
              type="text"
              value={penggunaAnggaranNip}
              onChange={(e) => setPenggunaAnggaranNip(e.target.value)}
              className="w-full px-3.5 py-2 border border-gray-300 rounded-xl text-xs sm:text-sm font-mono"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-3xs font-bold text-gray-600 uppercase">Nama Bendahara Pengeluaran</label>
            <input
              type="text"
              value={bendaharaNama}
              onChange={(e) => setBendaharaNama(e.target.value)}
              className="w-full px-3.5 py-2 border border-gray-300 rounded-xl text-xs sm:text-sm"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-3xs font-bold text-gray-600 uppercase">NIP Bendahara Pengeluaran</label>
            <input
              type="text"
              value={bendaharaNip}
              onChange={(e) => setBendaharaNip(e.target.value)}
              className="w-full px-3.5 py-2 border border-gray-300 rounded-xl text-xs sm:text-sm font-mono"
              required
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-2.5 border-t border-gray-100 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-gray-300 rounded-xl text-xs font-bold text-gray-700 bg-white hover:bg-gray-50 transition"
        >
          Batal
        </button>
        <button
          type="submit"
          className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition"
        >
          {initialData ? 'Simpan Perubahan' : 'Simpan Daftar Pembayaran'}
        </button>
      </div>
    </form>
  );
}
