import React, { useState, useEffect } from 'react';

interface Slide {
  id: number;
  badge: string;
  title: string;
  description: string;
  emoji: string;
  bgGradient: string;
  badgeBg: string;
  actionText?: string;
  actionUrl?: string;
}

export default function InfoBanner() {
  const [currentSlide, setCurrentSlide] = useState(0);

  const slides: Slide[] = [
    {
      id: 1,
      badge: "KAMPANYE INTEGRITAS",
      title: "DINAS PUPR NAGEKEO BEBAS GRATIFIKASI & PUNGLI",
      description: "Kami berkomitmen penuh untuk menyelenggarakan pelayanan administrasi Surat Perjalanan Dinas (SPD) yang jujur, akuntabel, transparan, dan bebas dari segala bentuk korupsi demi kemajuan Kabupaten Nagekeo.",
      emoji: "🛡️",
      bgGradient: "from-slate-800 via-slate-900 to-red-950 border-red-900/40",
      badgeBg: "bg-red-500/20 text-red-300 border border-red-500/30",
      actionText: "Pedoman Benturan Kepentingan",
    },
    {
      id: 2,
      badge: "SINKRONISASI CLOUD",
      title: "KEMUDAHAN REKAPITULASI DENGAN GOOGLE SHEETS",
      description: "Gunakan integrasi Cloud Drive resmi untuk sinkronisasi otomatis seluruh data SPT dan SPD secara real-time. Data aman, bebas resiko kehilangan, dan siap diunduh kapan saja oleh tim verifikator.",
      emoji: "☁️",
      bgGradient: "from-emerald-950 via-slate-950 to-teal-950 border-emerald-900/30",
      badgeBg: "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30",
      actionText: "Pelajari Sinkronisasi",
    },
    {
      id: 3,
      badge: "DIGITAL SIGNATURE QR",
      title: "OTENTIKASI INSTAN ANTI-PEMALSUAN DOKUMEN",
      description: "Setiap lembar Surat Perjalanan Dinas yang dicetak dilengkapi dengan QR Code Kriptografi AES yang dapat didekripsi menggunakan PIN otorisasi dinas. Menjamin dokumen asli bebas dari pemalsuan ilegal.",
      emoji: "🔑",
      bgGradient: "from-indigo-950 via-slate-950 to-violet-950 border-indigo-900/30",
      badgeBg: "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30",
      actionText: "Uji Validitas QR Code",
    },
    {
      id: 4,
      badge: "FITUR TERBARU",
      title: "BUKU REGISTRASI DIGITAL RESMI DINAS PUPR",
      description: "Sekarang Anda dapat memantau, menyortir, memfilter, dan mencetak rekapitulasi register resmi Surat Perintah Tugas (SPT) serta Rincian Pembayaran (SPPD) secara digital melalui tab Buku Registrasi.",
      emoji: "📖",
      bgGradient: "from-amber-950 via-slate-950 to-yellow-950 border-amber-900/30",
      badgeBg: "bg-amber-500/20 text-amber-300 border border-amber-500/30",
      actionText: "Buka Buku Register",
    }
  ];

  // Auto-rotate slides
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 6000); // changes every 6 seconds
    return () => clearInterval(interval);
  }, [slides.length]);

  const slide = slides[currentSlide];

  return (
    <div 
      className={`relative rounded-3xl overflow-hidden border p-5 sm:p-6 text-white bg-gradient-to-r ${slide.bgGradient} transition-all duration-700 shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-6 animate-fade-in`}
      id="info-tips-banner"
    >
      {/* Background Decorative Element */}
      <div className="absolute right-0 top-0 -mt-10 -mr-10 w-44 h-44 rounded-full bg-white/5 blur-3xl pointer-events-none"></div>
      <div className="absolute left-1/3 bottom-0 -mb-10 w-32 h-32 rounded-full bg-white/5 blur-2xl pointer-events-none"></div>

      {/* Main Content Area */}
      <div className="space-y-3 max-w-3xl z-10">
        <div className="flex flex-wrap items-center gap-2">
          <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold tracking-wider ${slide.badgeBg}`}>
            📢 {slide.badge}
          </span>
          <span className="text-3xs text-slate-400 font-mono tracking-widest uppercase">
            • INFORMASI LAYANAN / TIPS
          </span>
        </div>

        <div className="space-y-1">
          <h2 className="text-sm sm:text-base font-black tracking-wide leading-snug text-slate-100 uppercase">
            {slide.title}
          </h2>
          <p className="text-3xs sm:text-2xs text-slate-300 font-medium leading-relaxed">
            {slide.description}
          </p>
        </div>

        {/* Action Button Link (Purely aesthetic, looks like an ad CTA) */}
        <div className="flex items-center gap-4 pt-1">
          <span className="text-4xs text-slate-400 uppercase font-bold tracking-widest flex items-center gap-1">
            <span>Portal Informasi Resmi Dinas PUPR Nagekeo</span>
            <span className="text-emerald-400 font-black">✓ Verified</span>
          </span>
        </div>
      </div>

      {/* Decorative Visual / Icon Area (Right side) */}
      <div className="flex flex-col items-center justify-center self-stretch md:self-auto gap-3 shrink-0 z-10">
        <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white/10 backdrop-blur-xs rounded-2xl flex items-center justify-center border border-white/15 shadow-inner transform hover:rotate-3 transition duration-300 select-none">
          <span className="text-3xl sm:text-4xl animate-bounce-slow">{slide.emoji}</span>
        </div>

        {/* Slide indicator dots */}
        <div className="flex gap-1.5 justify-center mt-1">
          {slides.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentSlide(idx)}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                currentSlide === idx ? 'w-5 bg-white' : 'w-1.5 bg-white/30 hover:bg-white/50'
              }`}
              title={`Buka slide ${idx + 1}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
