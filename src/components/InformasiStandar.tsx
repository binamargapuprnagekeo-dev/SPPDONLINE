import React from 'react';

export default function InformasiStandar() {
  const formatRupiah = (num: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(num).replace('IDR', 'Rp');
  };

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-2xs space-y-6" id="informasi-standar-root">
      <div className="border-b border-gray-100 pb-4">
        <h3 className="text-base font-bold text-slate-800 uppercase tracking-wide flex items-center gap-2">
          <span>📜</span>
          <span>Informasi Standar Perjalanan Dinas</span>
        </h3>
        <p className="text-3xs sm:text-2xs text-slate-500 mt-0.5">
          Peraturan Bupati Nagekeo Nomor 5 Tahun 2026 tentang Standar Biaya Perjalanan Dinas di Lingkungan Pemerintah Kabupaten Nagekeo.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* 1. Uang Harian */}
        <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 space-y-3">
          <h4 className="text-xs font-bold text-indigo-900 border-b border-indigo-100 pb-1.5 uppercase tracking-wide flex items-center justify-between">
            <span>1. Satuan Biaya Uang Harian</span>
            <span className="text-4xs bg-indigo-100 text-indigo-800 px-1.5 py-0.5 rounded">Per Orang / Hari</span>
          </h4>
          <div className="overflow-x-auto">
            <table className="w-full text-[11px] text-left">
              <thead>
                <tr className="text-gray-400 font-bold uppercase tracking-wider text-[9px] border-b border-slate-200">
                  <th className="pb-2 w-10 text-center">No</th>
                  <th className="pb-2">Provinsi</th>
                  <th className="pb-2 text-right">Besaran</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr>
                  <td className="py-2 text-center text-gray-400">1</td>
                  <td className="py-2 font-semibold">DKI Jakarta</td>
                  <td className="py-2 text-right font-mono font-bold">{formatRupiah(530000)}</td>
                </tr>
                <tr>
                  <td className="py-2 text-center text-gray-400">2</td>
                  <td className="py-2 font-semibold">Jawa Timur</td>
                  <td className="py-2 text-right font-mono font-bold">{formatRupiah(510000)}</td>
                </tr>
                <tr>
                  <td className="py-2 text-center text-gray-400">3</td>
                  <td className="py-2 font-semibold">Jawa Barat</td>
                  <td className="py-2 text-right font-mono font-bold">{formatRupiah(430000)}</td>
                </tr>
                <tr>
                  <td className="py-2 text-center text-gray-400">4</td>
                  <td className="py-2 font-semibold">Nusa Tenggara Timur (NTT)</td>
                  <td className="py-2 text-right font-mono font-bold">{formatRupiah(430000)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* 2. Biaya Penginapan (Akomodasi) */}
        <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 space-y-3">
          <h4 className="text-xs font-bold text-indigo-900 border-b border-indigo-100 pb-1.5 uppercase tracking-wide flex items-center justify-between">
            <span>2. Satuan Biaya Penginapan (Akomodasi)</span>
            <span className="text-4xs bg-indigo-100 text-indigo-800 px-1.5 py-0.5 rounded">Per Orang / Hari</span>
          </h4>
          <div className="overflow-x-auto">
            <table className="w-full text-[10px] text-left">
              <thead>
                <tr className="text-gray-400 font-bold uppercase tracking-wider text-[8px] border-b border-slate-200">
                  <th className="pb-2">Provinsi</th>
                  <th className="pb-2 text-right">Eselon II</th>
                  <th className="pb-2 text-right">Eselon III / Gol IV</th>
                  <th className="pb-2 text-right">Eselon IV / Gol I,II,III</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr>
                  <td className="py-2 font-semibold">DKI Jakarta</td>
                  <td className="py-2 text-right font-mono font-bold text-emerald-700">{formatRupiah(1000000)}</td>
                  <td className="py-2 text-right font-mono">{formatRupiah(700000)}</td>
                  <td className="py-2 text-right font-mono">{formatRupiah(500000)}</td>
                </tr>
                <tr>
                  <td className="py-2 font-semibold">Jawa Timur</td>
                  <td className="py-2 text-right font-mono font-bold text-emerald-700">{formatRupiah(1000000)}</td>
                  <td className="py-2 text-right font-mono">{formatRupiah(700000)}</td>
                  <td className="py-2 text-right font-mono">{formatRupiah(500000)}</td>
                </tr>
                <tr>
                  <td className="py-2 font-semibold">Jawa Barat</td>
                  <td className="py-2 text-right font-mono font-bold text-emerald-700">{formatRupiah(1000000)}</td>
                  <td className="py-2 text-right font-mono">{formatRupiah(700000)}</td>
                  <td className="py-2 text-right font-mono">{formatRupiah(500000)}</td>
                </tr>
                <tr>
                  <td className="py-2 font-semibold">NTT</td>
                  <td className="py-2 text-right font-mono font-bold text-emerald-700">{formatRupiah(1000000)}</td>
                  <td className="py-2 text-right font-mono">{formatRupiah(700000)}</td>
                  <td className="py-2 text-right font-mono">{formatRupiah(500000)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* 3. Transportasi Darat Flores */}
        <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 space-y-3">
          <h4 className="text-xs font-bold text-indigo-900 border-b border-indigo-100 pb-1.5 uppercase tracking-wide flex items-center justify-between">
            <span>3. Transportasi Darat Dalam Pulau Flores</span>
            <span className="text-4xs bg-indigo-100 text-indigo-800 px-1.5 py-0.5 rounded">Per Orang / Kali</span>
          </h4>
          <div className="overflow-x-auto">
            <table className="w-full text-[11px] text-left">
              <thead>
                <tr className="text-gray-400 font-bold uppercase tracking-wider text-[9px] border-b border-slate-200">
                  <th className="pb-2 w-10 text-center">No</th>
                  <th className="pb-2">Tempat Asal</th>
                  <th className="pb-2">Tujuan</th>
                  <th className="pb-2 text-right">Besaran</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr>
                  <td className="py-2 text-center text-gray-400">1</td>
                  <td className="py-2">Mbay</td>
                  <td className="py-2 font-semibold">Ende</td>
                  <td className="py-2 text-right font-mono font-bold">{formatRupiah(150000)}</td>
                </tr>
                <tr>
                  <td className="py-2 text-center text-gray-400">2</td>
                  <td className="py-2">Mbay</td>
                  <td className="py-2 font-semibold">Bajawa</td>
                  <td className="py-2 text-right font-mono font-bold">{formatRupiah(150000)}</td>
                </tr>
                <tr>
                  <td className="py-2 text-center text-gray-400">3</td>
                  <td className="py-2">Mbay</td>
                  <td className="py-2 font-semibold">Maumere</td>
                  <td className="py-2 text-right font-mono font-bold">{formatRupiah(275000)}</td>
                </tr>
                <tr>
                  <td className="py-2 text-center text-gray-400">4</td>
                  <td className="py-2">Mbay</td>
                  <td className="py-2 font-semibold">Manggarai Barat</td>
                  <td className="py-2 text-right font-mono font-bold">{formatRupiah(325000)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* 4. Representasi Eselon II */}
        <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 space-y-3">
          <h4 className="text-xs font-bold text-indigo-900 border-b border-indigo-100 pb-1.5 uppercase tracking-wide flex items-center justify-between">
            <span>4. Uang Representasi Khusus Eselon II</span>
            <span className="text-4xs bg-indigo-100 text-indigo-800 px-1.5 py-0.5 rounded">Per Orang / Hari</span>
          </h4>
          <div className="overflow-x-auto">
            <table className="w-full text-[11px] text-left">
              <thead>
                <tr className="text-gray-400 font-bold uppercase tracking-wider text-[9px] border-b border-slate-200">
                  <th className="pb-2 w-10 text-center">No</th>
                  <th className="pb-2">Uraian Jabatan</th>
                  <th className="pb-2 text-right">Besaran</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr>
                  <td className="py-3 text-center text-gray-400">1</td>
                  <td className="py-3 font-semibold">Pejabat Eselon II (Kepala Dinas)</td>
                  <td className="py-3 text-right font-mono font-bold text-emerald-800">{formatRupiah(150000)}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="bg-amber-50 text-amber-800 text-[10px] p-2.5 rounded-lg border border-amber-100 font-medium leading-relaxed">
            💡 <strong>Catatan:</strong> Uang representasi diberikan di samping uang harian reguler jika pejabat yang bersangkutan merupakan Eselon II (Kepala Dinas / Pengguna Anggaran).
          </div>
        </div>

      </div>
    </div>
  );
}
