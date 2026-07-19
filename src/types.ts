export interface Pengikut {
  nama: string;
  tanggalLahir: string;
  keterangan: string;
}

export interface PembebananAnggaran {
  instansi: string;
  akun: string;
  sumberDana: string;
}

export interface SppdData {
  id: string;
  nomor: string;
  penggunaAnggaran: string;
  namaPegawai: string;
  nip: string;
  pangkatGol: string;
  jabatan: string;
  tingkatPerjalanan: string;
  maksudPerjalanan: string;
  alatAngkutan: string;
  tempatBerangkat: string;
  tempatTujuan: string;
  lamanyaPerjalanan: string;
  tanggalBerangkat: string;
  tanggalKembali: string;
  pengikut: Pengikut[];
  pembebananAnggaran: PembebananAnggaran;
  keteranganLain: string;
  dikeluarkanDi: string;
  tanggalDikeluarkan: string;
  penandatanganNama: string;
  penandatanganPangkat: string;
  penandatanganNip: string;
  encryptedSignature: string;
  createdAt: string;
  syncStatus: 'synced' | 'pending' | 'failed';
}

export interface TugaskanKepada {
  nama: string;
  nip: string;
  pangkatGol: string;
  jabatan: string;
}

export interface SptData {
  id: string;
  nomor: string;
  dasar: string;
  tugaskanKepada: TugaskanKepada[];
  keperluan: string;
  tempatTujuan: string;
  tanggalBerangkat: string;
  tanggalKembali: string;
  alatAngkut: string;
  pembebananAnggaran: string;
  ditetapkanDi: string;
  tanggalDitetapkan: string;
  penandatanganNama: string;
  penandatanganPangkat: string;
  penandatanganNip: string;
  encryptedSignature: string;
  createdAt: string;
  syncStatus: 'synced' | 'pending' | 'failed';
}

export interface SyncLog {
  id: string;
  type: 'sppd' | 'spt' | 'pembayaran';
  docId: string;
  nomor: string;
  timestamp: string;
  status: 'success' | 'failed';
  message: string;
}

export interface DecryptedSignaturePayload {
  type: 'SPPD' | 'SPT';
  docId: string;
  nomor: string;
  signedBy: string;
  signedDate: string;
  details: {
    namaPegawai?: string;
    keperluan?: string;
    tempatTujuan?: string;
    tanggalBerangkat?: string;
    tanggalKembali?: string;
  };
  hash: string;
}

export interface DaftarBayarRow {
  nama: string;
  nip: string;
  tanggal: string;
  jumlah: number;
  potongan: number;
  terima: number;
  noRekening: string;
  bank: string;
  statusTransaksi: string;
  tandaTerima: string;
}

export interface DaftarBayarData {
  id: string;
  sppdId: string;
  nomorSppd: string;
  perjalananDinasType: string;
  maksudPerjalanan: string;
  tanggalPerjalanan: string;
  sumberDana: string;
  kodeRekening: string;
  kodeRup: string;
  rows: DaftarBayarRow[];
  tanggalDikeluarkan: string;
  penggunaAnggaranNama: string;
  penggunaAnggaranNip: string;
  bendaharaNama: string;
  bendaharaNip: string;
  createdAt: string;
}

export interface PejabatStaff {
  id: string;
  nama: string;
  nip: string;
  pangkatGol: string;
  jabatan: string;
  email: string;
  pin: string; // Secret signature PIN/token
  status: 'Aktif' | 'Nonaktif';
  createdAt: string;
}


