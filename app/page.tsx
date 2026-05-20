"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  ShieldCheck, AlertTriangle, XCircle, FileText, Image as ImageIcon, 
  Mic, Search, BrainCircuit, HeartHandshake, Link as LinkIcon, AlertOctagon, Info,
  ArrowRight, Play, Activity, Target, Zap, Globe, Shield, Eye
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

type ResultData = {
  verdict: 'Kemungkinan Valid' | 'Perlu Verifikasi' | 'Kemungkinan Hoax';
  confidenceScore: number;
  explanation: string;
  parentExplanationMode: string;
  extractedClaims: string[];
  recommendation: string;
  emotionalManipulation: {
    isManipulative: boolean;
    tactics: string[];
    explanation: string;
  };
  sources?: { url: string; title: string }[];
};

const Navbar = () => {
    const scrollToDemo = () => {
      document.getElementById('demo-section')?.scrollIntoView({ behavior: 'smooth' });
    };

    return (
      <nav className="h-20 bg-white/80 backdrop-blur-md border-b border-slate-200 px-6 md:px-8 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-200">
            <BrainCircuit className="w-6 h-6 text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight text-slate-800 hidden sm:inline-block">
            CekFakta<span className="text-blue-600">AI</span>
          </span>
        </div>
        <div className="flex items-center gap-4 md:gap-8">
          <a href="#features" className="text-sm font-medium text-slate-600 hover:text-slate-900 hidden sm:block transition-colors">Fitur Utama</a>
          <Button onClick={scrollToDemo} className="bg-slate-900 text-white rounded-full text-sm font-bold shadow-md hover:bg-slate-800 px-5 transition-transform active:scale-95">
            Cek Informasi Sekarang
          </Button>
        </div>
      </nav>
    );
};

export default function Home() {
  const [activeTab, setActiveTab] = useState("text");
  const [textInput, setTextInput] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<ResultData | null>(null);

  // Audio recording states
  const [isRecording, setIsRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = () => {
          const base64AudioMessage = reader.result as string;
          setAudioUrl(base64AudioMessage);
        };
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      toast.error("Gagal mengakses mikropon. Pastikan izin diberikan.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }
  };

  const handleAnalyze = async () => {
    if (activeTab === "text" && !textInput.trim()) {
      toast.error("Mohon masukkan teks atau link untuk dianalisis.");
      return;
    }
    if (activeTab === "image" && !imagePreview) {
      toast.error("Mohon unggah gambar terlebih dahulu.");
      return;
    }
    if (activeTab === "audio" && !audioUrl) {
      toast.error("Mohon rekam audio terlebih dahulu.");
      return;
    }

    setIsAnalyzing(true);
    setResult(null);

    try {
      const payload: any = {};
      
      if (activeTab === "text") {
        payload.text = textInput;
      } else if (activeTab === "image" && imagePreview) {
        payload.imageBase64 = imagePreview;
      } else if (activeTab === "audio" && audioUrl) {
        payload.audioBase64 = audioUrl;
      }

      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error("Gagal menganalisis konten. Silakan coba lagi.");
      }

      const data = await res.json();
      if (data.error) throw new Error(data.error);

      setResult(data);
      toast.success("Analisis selesai!");
    } catch (err: any) {
      toast.error(err.message || "Terjadi kesalahan.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getVerdictVisuals = (verdict: string) => {
    switch (verdict) {
      case 'Kemungkinan Valid':
        return { icon: ShieldCheck, color: "text-emerald-400", bg: "bg-emerald-400/10", border: "border-emerald-400/30" };
      case 'Perlu Verifikasi':
        return { icon: AlertTriangle, color: "text-amber-400", bg: "bg-amber-400/10", border: "border-amber-400/30" };
      case 'Kemungkinan Hoax':
      default:
        return { icon: XCircle, color: "text-rose-500", bg: "bg-rose-500/10", border: "border-rose-500/30" };
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 w-full overflow-x-hidden">
      <Navbar />

      {/* HERO SECTION */}
      <section className="relative px-6 py-20 lg:py-32 flex flex-col items-center text-center overflow-hidden">
          <div className="absolute inset-0 w-full h-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-100 via-slate-50 to-slate-50 -z-10"></div>
          
          <motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="max-w-4xl mx-auto space-y-8"
          >
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 border border-blue-100 rounded-full text-blue-700 text-xs font-bold uppercase tracking-widest shadow-sm">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                  </span>
                  Gemini 2.0 AI Powered
              </div>

              <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-slate-900 leading-tight">
                  Jangan Sebarkan Sebelum <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-500">Cek Fakta.</span>
              </h1>
              
              <p className="text-xl text-slate-500 max-w-2xl mx-auto leading-relaxed">
                  AI membantu masyarakat Indonesia memahami informasi dengan kritis. Deteksi manipulasi emosi, verifikasi klaim, dan dapatkan penjelasan sederhana dalam hitungan detik.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                  <Button 
                      onClick={() => document.getElementById('demo-section')?.scrollIntoView({ behavior: 'smooth' })}
                      className="w-full sm:w-auto px-8 py-6 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-lg shadow-xl shadow-blue-200 transition-transform active:scale-95"
                  >
                      <Search className="w-5 h-5 mr-2" />
                      Cek Informasi Gratis
                  </Button>
                  <Button 
                      variant="outline"
                      onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
                      className="w-full sm:w-auto px-8 py-6 rounded-full border-slate-300 text-slate-700 hover:bg-slate-100 font-bold text-lg transition-colors"
                  >
                      <Play className="w-5 h-5 mr-2 text-slate-500" />
                      Lihat Cara Kerja
                  </Button>
              </div>
          </motion.div>

          {/* Animated Mockup Hook */}
          <motion.div 
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="w-full max-w-5xl mx-auto mt-20 relative"
          >
              <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-cyan-400 rounded-2xl md:rounded-[2rem] blur-xl md:blur-2xl opacity-20 animate-pulse"></div>
              <div className="relative bg-white rounded-2xl md:rounded-[2rem] border border-slate-200 shadow-2xl overflow-hidden p-6 md:p-10 flex flex-col md:flex-row items-center gap-8">
                  <div className="flex-1 space-y-4">
                      <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                              <svg className="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z"/></svg> 
                          </div>
                          <div className="text-left">
                              <h3 className="font-bold text-slate-900">Pesan WhatsApp Mencurigakan</h3>
                              <p className="text-xs text-slate-500">Diteruskan Berkali-kali di Grup Keluarga</p>
                          </div>
                      </div>
                      <div className="bg-slate-100 rounded-xl p-4 md:p-6 text-slate-700 text-sm md:text-base border-l-4 border-orange-400 text-left relative overflow-hidden">
                          <div className="absolute top-0 right-0 h-full w-32 bg-gradient-to-r from-transparent to-white/50 animate-[shimmer_2s_infinite]"></div>
                          &quot;Bapak Ibu cepat kosongkan tabungan di bank X! Tadi pagi direkturnya kabur bawa triliunan, sore ini bank akan dibekukan pemerintah! Tolong sebarkan supaya saudara kita selamat!&quot;
                      </div>
                  </div>
                  <div className="w-full md:w-auto flex flex-col gap-4 text-left">
                      <div className="flex items-center gap-3 bg-red-50 text-red-700 px-4 py-3 rounded-xl border border-red-100 shadow-sm animate-bounce">
                          <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                          <div className="text-sm">
                              <span className="font-bold block">Manipulasi Terdeteksi</span>
                              Urgensi Palsu & Rasa Takut Tinggi
                          </div>
                      </div>
                      <div className="flex items-center gap-3 bg-green-50 text-green-700 px-4 py-3 rounded-xl border border-green-100 shadow-sm opacity-90">
                          <ShieldCheck className="w-5 h-5 flex-shrink-0" />
                          <div className="text-sm">
                              <span className="font-bold block">Verifikasi Sumber</span>
                              Kementerian Keuangan RI (Tidak Ada Bukti)
                          </div>
                      </div>
                  </div>
              </div>
          </motion.div>
      </section>

      {/* THREAT INTELLIGENCE MARQUEE */}
      <div className="border-y border-slate-200 bg-white py-4 overflow-hidden flex items-center select-none shadow-sm relative z-20">
          <div className="flex space-x-12 animate-[scroll_30s_linear_infinite] whitespace-nowrap px-4 min-w-max">
              <div className="flex items-center gap-2"><Activity className="w-4 h-4 text-blue-500" /><span className="text-sm font-semibold text-slate-600">LIVE THREAT INTEL:</span></div>
              <span className="text-sm text-slate-500"><span className="font-bold text-slate-800">43%</span> Hoax Politik</span>
              <span className="text-sm text-slate-500"><span className="font-bold text-slate-800">27%</span> Misinformasi Kesehatan</span>
              <span className="text-sm text-slate-500"><span className="font-bold text-slate-800">18%</span> Penipuan Keuangan</span>
              <span className="text-sm text-slate-500 pr-12">Top Emotional Trigger: <span className="font-bold text-red-500 uppercase bg-red-50 px-2 py-0.5 rounded ml-1">FEAR & PANIC</span></span>
              
              {/* Duplicate for infinite loop illusion */}
              <div className="flex items-center gap-2"><Activity className="w-4 h-4 text-blue-500" /><span className="text-sm font-semibold text-slate-600">LIVE THREAT INTEL:</span></div>
              <span className="text-sm text-slate-500"><span className="font-bold text-slate-800">43%</span> Hoax Politik</span>
              <span className="text-sm text-slate-500"><span className="font-bold text-slate-800">27%</span> Misinformasi Kesehatan</span>
              <span className="text-sm text-slate-500"><span className="font-bold text-slate-800">18%</span> Penipuan Keuangan</span>
              <span className="text-sm text-slate-500">Top Emotional Trigger: <span className="font-bold text-red-500 uppercase bg-red-50 px-2 py-0.5 rounded ml-1">FEAR & PANIC</span></span>
          </div>
      </div>

      {/* FEATURES BENTO GRID */}
      <section id="features" className="py-24 px-6 max-w-7xl mx-auto space-y-12">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
              <h2 className="text-3xl md:text-5xl font-bold tracking-tight">Lebih dari Sekadar Pengecek Fakta.</h2>
              <p className="text-lg text-slate-500">Platform intelligence yang didesain untuk menangkal ancaman misinformasi di grup keluarga Anda secara emosional dan logika.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Bento Box 1 */}
              <div className="md:col-span-2 bg-white border border-slate-200 rounded-[2rem] p-8 md:p-10 shadow-sm hover:shadow-xl transition-all group flex flex-col xl:flex-row justify-between overflow-hidden relative gap-8">
                  <div className="absolute right-0 top-0 w-64 h-64 bg-blue-50 rounded-bl-full -z-0 opacity-50 group-hover:scale-110 transition-transform"></div>
                  <div className="z-10 max-w-md">
                      <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mb-6">
                          <AlertOctagon className="w-6 h-6" />
                      </div>
                      <h3 className="text-2xl font-bold mb-3">Deteksi Manipulasi Emosi</h3>
                      <p className="text-slate-500 leading-relaxed">Pesan hoax sering memicu kepanikan, kemarahan, atau urgensi palsu. AI kami memetakan manipulasi ini agar Anda bisa berpikir lebih jernih.</p>
                  </div>
                  <div className="w-full xl:w-72 h-auto bg-slate-50 rounded-xl border border-slate-100 p-6 flex flex-col gap-4 z-10 my-auto">
                        <div className="flex justify-between text-sm font-bold text-slate-700"><span>Rasa Takut (Fear)</span><span className="text-red-500">95%</span></div>
                        <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden mb-2"><div className="bg-red-500 h-full w-[95%]"></div></div>
                        
                        <div className="flex justify-between text-sm font-bold text-slate-700"><span>Urgensi Palsu</span><span className="text-orange-500">80%</span></div>
                        <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden"><div className="bg-orange-500 h-full w-[80%]"></div></div>
                  </div>
              </div>

              {/* Bento Box 2 */}
              <div className="bg-white border border-slate-200 rounded-[2rem] p-8 lg:p-10 shadow-sm hover:shadow-xl transition-all group">
                  <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-2xl flex items-center justify-center mb-6">
                      <HeartHandshake className="w-6 h-6" />
                  </div>
                  <h3 className="text-2xl font-bold mb-3">Jelaskan ke Orang Tua</h3>
                  <p className="text-slate-500 leading-relaxed mb-6 text-sm lg:text-base">Penalaran teknis rumit dipahami lansia. Kami menyediakan template bahasa santun, sederhana, dan tidak menggurui untuk membalas pesan keluarga.</p>
                  <div className="text-sm font-medium italic text-purple-700 bg-purple-50 p-4 rounded-xl border border-purple-100">&quot;Pak, Bu, info dari WA itu kurang tepat. Jangan disebarkan ya supaya teman lain terhindar dari bahaya...&quot;</div>
              </div>

              {/* Bento Box 3 */}
              <div className="bg-slate-900 text-white rounded-[2rem] p-8 lg:p-10 shadow-lg relative overflow-hidden group">
                  <div className="absolute -right-10 -bottom-10 text-white/5 group-hover:scale-110 transition-transform"><Mic className="w-64 h-64" /></div>
                  <div className="relative z-10 h-full flex flex-col">
                      <div className="w-12 h-12 bg-white/10 text-white rounded-2xl flex items-center justify-center mb-6">
                          <Mic className="w-6 h-6" />
                      </div>
                      <h3 className="text-2xl font-bold mb-3">Analisis Voice Note</h3>
                      <p className="text-slate-400 leading-relaxed text-sm lg:text-base">Sering mendapat ceramah audio hoax? Unggah Voice Note, AI kami mentranskrip dan menganalisis isinya secara realtime.</p>
                  </div>
              </div>

              {/* Bento Box 4 */}
              <div className="md:col-span-2 bg-white border border-slate-200 rounded-[2rem] p-8 md:p-10 shadow-sm hover:shadow-xl transition-all group flex flex-col md:flex-row gap-8 items-center">
                  <div className="flex-1">
                      <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mb-6">
                          <Globe className="w-6 h-6" />
                      </div>
                      <h3 className="text-2xl font-bold mb-3">Referensi Terpercaya (Trusted Sources)</h3>
                      <p className="text-slate-500 leading-relaxed">Setiap kesimpulan AI divalidasi silang menggunakan mesin pencari khusus, memprioritaskan situs resmi kesehatan dan pemerintah.</p>
                  </div>
                  <div className="flex-1 grid grid-cols-2 gap-4 w-full">
                        <div className="flex items-center gap-2 bg-slate-50 p-3 rounded-xl border border-slate-100"><Shield className="w-4 h-4 text-emerald-500"/><span className="font-bold text-xs text-slate-700">Kominfo RI</span></div>
                        <div className="flex items-center gap-2 bg-slate-50 p-3 rounded-xl border border-slate-100"><Shield className="w-4 h-4 text-emerald-500"/><span className="font-bold text-xs text-slate-700">Kemenkes</span></div>
                        <div className="flex items-center gap-2 bg-slate-50 p-3 rounded-xl border border-slate-100"><Shield className="w-4 h-4 text-emerald-500"/><span className="font-bold text-xs text-slate-700">TurnBackHoax</span></div>
                        <div className="flex items-center gap-2 bg-slate-50 p-3 rounded-xl border border-slate-100"><Shield className="w-4 h-4 text-emerald-500"/><span className="font-bold text-xs text-slate-700">WHO Guidelines</span></div>
                  </div>
              </div>
          </div>
      </section>

      {/* THE APP DEMO SECTION (Tool) */}
      <section id="demo-section" className="py-24 bg-slate-900 border-y border-slate-800 text-slate-50 relative">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10"></div>
          
          <div className="max-w-7xl mx-auto px-6 relative z-10">
              <div className="text-center mb-16 space-y-4">
                  <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-white">Coba Langsung Ecosystem AI Kami</h2>
                  <p className="text-slate-400 text-lg">Tempel hoax WhatsApp yang pernah Anda terima, atau rekam Voice Note langsung.</p>
              </div>

              {/* Ecosystem UI App */}
              <div className="bg-slate-50 text-slate-900 rounded-[2rem] overflow-hidden shadow-2xl flex flex-col lg:flex-row min-h-[600px] border border-slate-700/50">
                
                {/* Left Panel: Input Section */}
                <div className="w-full lg:w-[420px] bg-white border-r border-slate-200 p-6 lg:p-8 flex flex-col shrink-0 relative z-10 shadow-[4px_0_24px_rgba(0,0,0,0.02)]">
                  <motion.div className="flex-1 flex flex-col h-full">
                    <Tabs defaultValue="text" onValueChange={setActiveTab} className="w-full h-full flex flex-col space-y-6">
                      <TabsList className="grid w-full grid-cols-3 gap-2 bg-transparent h-auto p-0">
                        <TabsTrigger value="text" className="p-3 border border-slate-200 rounded-xl hover:bg-slate-50 text-xs sm:text-sm font-bold text-slate-500 data-[state=active]:bg-white data-[state=active]:border-blue-500 data-[state=active]:text-blue-700 data-[state=active]:shadow-sm transition-all focus:ring-0">
                          <FileText className="w-4 h-4 mr-2" /> Teks
                        </TabsTrigger>
                        <TabsTrigger value="image" className="p-3 border border-slate-200 rounded-xl hover:bg-slate-50 text-xs sm:text-sm font-bold text-slate-500 data-[state=active]:bg-white data-[state=active]:border-blue-500 data-[state=active]:text-blue-700 data-[state=active]:shadow-sm transition-all focus:ring-0">
                          <ImageIcon className="w-4 h-4 mr-2" /> Gambar
                        </TabsTrigger>
                        <TabsTrigger value="audio" className="p-3 border border-slate-200 rounded-xl hover:bg-slate-50 text-xs sm:text-sm font-bold text-slate-500 data-[state=active]:bg-white data-[state=active]:border-blue-500 data-[state=active]:text-blue-700 data-[state=active]:shadow-sm transition-all focus:ring-0">
                          <Mic className="w-4 h-4 mr-2" /> Audio
                        </TabsTrigger>
                      </TabsList>
                      <div className="flex-1">
                        <TabsContent value="text" className="mt-0 h-full">
                          <div className="relative group h-full">
                            <Label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2 block">Konten untuk Dicek</Label>
                            <Textarea 
                              placeholder="Paste pesan WhatsApp mencurigakan di sini..."
                              className="w-full h-48 lg:h-64 p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:border-transparent outline-none resize-none text-slate-900"
                              value={textInput}
                              onChange={(e) => setTextInput(e.target.value)}
                            />
                            {/* Live Suggestion Demo Button */}
                            <button 
                                onClick={() => {
                                    setTextInput("BAHAYA! Jangan makan buah pisang dicampur susu! Hal ini akan menyebabkan asam urat dan racun mematikan di dalam perut. Dr. Setiawan sudah membuktikan banyak korban masuk IGD. Viralkan!");
                                    toast.info("Contoh teks dimasukkan. Silakan mulai analisis.");
                                }}
                                className="mt-3 text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1"
                            >
                                <Play className="w-3 h-3" /> Masukkan contoh Hoax Kesehatan
                            </button>
                          </div>
                        </TabsContent>
                        
                        <TabsContent value="image" className="mt-0 h-full">
                          <div className="h-48 lg:h-64 border border-dashed border-slate-300 rounded-2xl p-6 text-center bg-slate-50 hover:bg-slate-100 transition-colors flex flex-col items-center justify-center relative group cursor-pointer focus-within:ring-2 focus-within:ring-blue-500">
                            <input 
                              type="file" accept="image/*" onChange={handleImageUpload}
                              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                            />
                            {imagePreview ? (
                              <img src={imagePreview} alt="Preview" className="max-h-[180px] object-contain rounded-lg" />
                            ) : (
                              <div className="flex flex-col items-center gap-3 text-slate-400 group-hover:text-blue-500 transition-colors">
                                <ImageIcon className="w-8 h-8" />
                                <p className="text-sm font-medium">Ketuk atau seret gambar screenshot dari WhatsApp here</p>
                              </div>
                            )}
                          </div>
                        </TabsContent>

                        <TabsContent value="audio" className="mt-0 h-full">
                          <div className="flex flex-col items-center justify-center p-8 bg-slate-50 border border-slate-200 rounded-2xl h-48 lg:h-64 gap-6">
                            {audioUrl ? (
                              <div className="w-full space-y-4">
                                  <audio src={audioUrl} controls className="w-full h-12" />
                                  <Button variant="outline" size="sm" onClick={() => setAudioUrl(null)} className="w-full text-slate-500 border-slate-300">
                                    Hapus Rekaman
                                  </Button>
                              </div>
                            ) : (
                              <>
                                <div className="text-center space-y-2">
                                  <p className="text-slate-500 text-sm font-medium">Rekam Voice Note</p>
                                </div>
                                <Button 
                                  size="lg" variant="default"
                                  className={`w-16 h-16 rounded-full transition-all duration-300 ${isRecording ? 'bg-red-500 hover:bg-red-600 shadow-lg shadow-red-200 scale-110 animate-pulse' : 'bg-slate-900 text-white hover:bg-slate-800 shadow-md'}`}
                                  onClick={isRecording ? stopRecording : startRecording}
                                >
                                  {isRecording ? <div className="w-5 h-5 bg-white rounded-sm" /> : <Mic className="w-6 h-6" />}
                                </Button>
                                {isRecording && <span className="text-red-500 text-sm font-bold animate-pulse">Merekam...</span>}
                              </>
                            )}
                          </div>
                        </TabsContent>

                        <div className="mt-auto pt-6">
                            <Button 
                                size="lg" 
                                className="w-full py-6 bg-blue-600 text-white rounded-2xl font-bold text-base shadow-xl shadow-blue-200 hover:bg-blue-700 transition-transform active:scale-95"
                                onClick={handleAnalyze}
                                disabled={isAnalyzing}
                            >
                                {isAnalyzing ? (
                                <span className="flex items-center gap-2">
                                    <Search className="w-5 h-5 animate-spin" />
                                    Menganalisis Parameter...
                                </span>
                                ) : (
                                <span className="flex items-center gap-2">
                                    <Zap className="w-5 h-5 text-blue-200" />
                                    Jalankan Analisis AI
                                </span>
                                )}
                            </Button>
                        </div>
                      </div>
                    </Tabs>
                  </motion.div>
                </div>

                {/* Right Panel: Results Section */}
                <div className="flex-1 p-6 lg:p-8 overflow-y-auto bg-slate-50">
                  <div className="max-w-3xl mx-auto">
                      <AnimatePresence mode="wait">
                          {!result && !isAnalyzing && (
                          <motion.div 
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              className="h-full flex flex-col items-center justify-center text-slate-400 py-24 lg:py-40"
                          >
                              <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-sm border border-slate-200 mb-6 relative overflow-hidden">
                                  <div className="absolute inset-0 border-4 border-dashed border-slate-200 rounded-full animate-[spin_10s_linear_infinite]"></div>
                                  <Shield className="w-10 h-10 text-slate-300" />
                              </div>
                              <h3 className="text-lg font-bold text-slate-600 mb-2">Menunggu Input Informasi</h3>
                              <p className="text-sm font-medium text-center max-w-sm text-slate-400">Pilih sampel teks atau masukkan konten Anda di sebelah kiri untuk melihat keajaiban analitik kami secara realtime.</p>
                          </motion.div>
                          )}
                          
                          {isAnalyzing && (
                          <motion.div 
                              initial={{ opacity: 0, scale: 0.9 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0 }}
                              className="flex flex-col items-center justify-center py-24 lg:py-40 space-y-8"
                          >
                              <div className="relative w-28 h-28">
                                  <div className="absolute inset-0 border-4 border-blue-50 rounded-full"></div>
                                  <div className="absolute inset-0 border-4 border-transparent border-t-blue-600 border-r-blue-600 rounded-full animate-spin"></div>
                                  <div className="absolute inset-0 flex items-center justify-center text-blue-600"><Zap className="w-8 h-8 animate-pulse" /></div>
                              </div>
                              <div className="text-center space-y-3">
                                  <p className="text-blue-600 font-black uppercase tracking-widest text-sm animate-pulse">Menghubungkan ke Gemini 2.0 AI...</p>
                                  <p className="text-slate-500 text-xs font-semibold max-w-xs mx-auto">Mendeteksi pola, mengekstrak misinformasi, memverifikasi klaim via Kominfo, Kemenkes, & WHO...</p>
                              </div>
                          </motion.div>
                          )}
                          
                          {result && (
                              <motion.div
                              initial={{ opacity: 0, y: 30 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, scale: 0.95 }}
                              className="w-full space-y-6 pb-12"
                              >
                              {/* Verdict Card */}
                              <div className={`rounded-[2rem] p-6 md:p-8 flex flex-col md:flex-row items-center gap-6 border shadow-sm ${
                                  result.verdict === 'Kemungkinan Valid' ? 'bg-emerald-50 border-emerald-100' :
                                  result.verdict === 'Perlu Verifikasi' ? 'bg-amber-50 border-amber-100' :
                                  'bg-red-50 border-red-100'
                                  }`}>
                                  <div className={`w-20 h-20 md:w-24 md:h-24 rounded-3xl flex items-center justify-center flex-shrink-0 shadow-lg ${
                                      result.verdict === 'Kemungkinan Valid' ? 'bg-emerald-500 shadow-emerald-200' :
                                      result.verdict === 'Perlu Verifikasi' ? 'bg-amber-500 shadow-amber-200' :
                                      'bg-red-500 shadow-red-200'
                                      }`}>
                                      {(() => {
                                      const IconDef = getVerdictVisuals(result.verdict).icon;
                                      return <IconDef className="w-10 h-10 md:w-12 md:h-12 text-white" strokeWidth={2.5} />;
                                      })()}
                                  </div>
                                  <div className="flex-1 w-full text-center md:text-left">
                                  <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full ${
                                      result.verdict === 'Kemungkinan Valid' ? 'bg-emerald-200/50 text-emerald-800' :
                                      result.verdict === 'Perlu Verifikasi' ? 'bg-amber-200/50 text-amber-800' :
                                      'bg-red-200/50 text-red-800'
                                      }`}>Kesimpulan CekFakta</span>
                                  <h2 className={`text-2xl md:text-3xl font-extrabold mt-3 mb-2 ${
                                      result.verdict === 'Kemungkinan Valid' ? 'text-emerald-900' :
                                      result.verdict === 'Perlu Verifikasi' ? 'text-amber-900' :
                                      'text-red-900'
                                      }`}>{result.verdict}</h2>
                                  <p className={`text-sm md:text-base leading-relaxed ${
                                      result.verdict === 'Kemungkinan Valid' ? 'text-emerald-800' :
                                      result.verdict === 'Perlu Verifikasi' ? 'text-amber-800' :
                                      'text-red-800'
                                      }`}>{result.explanation}</p>
                                  </div>
                                  <div className="mt-4 md:mt-0 text-center md:text-right shrink-0 bg-white p-4 rounded-2xl shadow-sm border border-black/5">
                                  <div className={`text-4xl font-black leading-none ${
                                      result.verdict === 'Kemungkinan Valid' ? 'text-emerald-600' :
                                      result.verdict === 'Perlu Verifikasi' ? 'text-amber-600' :
                                      'text-red-600'
                                      }`}>{result.confidenceScore}%</div>
                                  <div className={`text-[10px] font-bold uppercase mt-1 ${
                                      result.verdict === 'Kemungkinan Valid' ? 'text-emerald-500' :
                                      result.verdict === 'Perlu Verifikasi' ? 'text-amber-500' :
                                      'text-red-500'
                                      }`}>AI Confidence</div>
                                  </div>
                              </div>
                  
                              <div className="grid lg:grid-cols-2 gap-6 w-full">
                                  {/* Emotional Map */}
                                  <div className="bg-white border border-slate-200 rounded-[2rem] p-6 shadow-sm">
                                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                                      <AlertOctagon className="w-4 h-4 text-slate-400" />
                                      Peta Manipulasi Psikologis
                                  </h3>
                                      {result.emotionalManipulation.isManipulative ? (
                                      <div className="space-y-4">
                                          {result.emotionalManipulation.tactics.map((tactic, i) => (
                                          <div key={i} className="flex flex-col gap-1.5">
                                              <div className="flex justify-between text-xs font-bold">
                                              <span className="text-slate-800">{tactic}</span>
                                              <span className="text-red-600">Sangat Tinggi</span>
                                              </div>
                                              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                                              <div className="bg-gradient-to-r from-red-400 to-red-600 h-full w-[90%] rounded-full"></div>
                                              </div>
                                          </div>
                                          ))}
                                          <div className="mt-6 pt-4 border-t border-slate-100">
                                            <p className="text-xs text-slate-500 font-medium leading-relaxed italic">
                                                <span className="font-bold block text-slate-700 not-italic mb-1">Penjelasan Taktik:</span>
                                                {result.emotionalManipulation.explanation}
                                            </p>
                                          </div>
                                      </div>
                                      ) : (
                                      <div className="flex flex-col items-center justify-center py-8 text-center space-y-3 text-slate-400">
                                          <ShieldCheck className="w-12 h-12 text-emerald-400 opacity-50 mb-2" />
                                          <p className="text-sm font-semibold max-w-[200px]">Gaya bahasa netral dan informatif. Tidak manipulatif.</p>
                                      </div>
                                      )}
                                  </div>
                  
                                  {/* Claims / Sources Check */}
                                  <div className="flex flex-col gap-6 w-full">
                                    <div className="bg-white border border-slate-200 rounded-[2rem] p-6 shadow-sm">
                                        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                            <Target className="w-4 h-4 text-slate-400" />
                                            Verifikasi Klaim Spesifik
                                        </h3>
                                        <div className="space-y-3">
                                            {result.extractedClaims.slice(0, 3).map((claim, i) => (
                                            <div key={i} className="flex items-start gap-3 p-3 bg-slate-50 border border-slate-100 rounded-xl hover:bg-white hover:border-blue-200 hover:shadow-sm transition-all group">
                                                <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 shrink-0 group-hover:scale-150 transition-transform"></div>
                                                <span className="text-xs font-medium text-slate-700">{claim}</span>
                                            </div>
                                            ))}
                                        </div>
                                    </div>
                    
                                    {result.sources && result.sources.length > 0 && (
                                        <div className="bg-white border border-slate-200 rounded-[2rem] p-6 shadow-sm">
                                        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                            <Globe className="w-4 h-4 text-slate-400" />
                                            Referensi Terpercaya (Validasi)
                                        </h3>
                                        <div className="space-y-3">
                                            {result.sources.map((source, i) => (
                                            <a key={i} href={source.url} target="_blank" rel="noreferrer" className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-100 hover:border-blue-300 rounded-xl transition-all group hover:bg-blue-50/50">
                                                <div className="shrink-0 w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center group-hover:bg-blue-100 group-hover:border-blue-300 transition-colors">
                                                <LinkIcon className="w-3 h-3 text-slate-500 group-hover:text-blue-600" />
                                                </div>
                                                <div className="truncate flex-1">
                                                <span className="text-xs font-bold text-slate-800 block truncate group-hover:text-blue-900">{source.title}</span>
                                                <span className="text-[10px] text-slate-500 uppercase tracking-wider truncate inline-flex items-center gap-1 mt-0.5">
                                                    <Shield className="w-3 h-3" /> {new URL(source.url).hostname}
                                                </span>
                                                </div>
                                            </a>
                                            ))}
                                        </div>
                                        </div>
                                    )}
                                  </div>
                              </div>
                  
                              {/* Parent Explanation Mode - WOW Feature */}
                              <div className="bg-blue-600 rounded-[2rem] p-6 md:p-8 lg:p-10 text-white relative overflow-hidden shadow-xl shadow-blue-900/10">
                                  <div className="absolute right-0 bottom-0 pointer-events-none opacity-10 transform translate-x-1/4 translate-y-1/4 mix-blend-overlay">
                                    <HeartHandshake className="w-64 h-64" />
                                  </div>
                                  <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-bl from-cyan-400/20 to-transparent"></div>
                                  
                                  <div className="relative z-10">
                                    <div className="flex flex-wrap items-center gap-3 mb-6">
                                        <span className="px-3 py-1.5 bg-white/20 rounded-full text-[10px] font-bold uppercase tracking-widest backdrop-blur-md border border-white/20 text-white flex items-center gap-1">
                                            <Zap className="w-3 h-3"/> Fitur Andalan
                                        </span>
                                        <h3 className="text-xl md:text-2xl font-bold tracking-tight">Mode Jelaskan ke Orang Tua / Keluarga</h3>
                                    </div>
                                    <div className="bg-white/10 backdrop-blur-md p-6 lg:p-8 rounded-2xl border border-white/20 relative">
                                        <div className="absolute -left-2 -top-4 text-blue-300 font-serif text-6xl opacity-40">&quot;</div>
                                        <p className="text-white text-lg md:text-2xl italic leading-relaxed font-medium relative z-10 pl-2">
                                        {result.parentExplanationMode}
                                        </p>
                                    </div>
                                    {result.recommendation && (
                                        <div className="mt-8 flex items-start sm:items-center gap-3 p-4 rounded-2xl border border-blue-400/30 bg-blue-700/50 text-sm text-blue-50">
                                            <Info className="w-5 h-5 text-blue-300 shrink-0 mt-0.5 sm:mt-0" />
                                            <span className="font-semibold leading-relaxed">Rekomendasi Aksi: {result.recommendation}</span>
                                        </div>
                                    )}
                                  </div>
                              </div>
                  
                              </motion.div>
                          )}
                      </AnimatePresence>
                  </div>
                </div>
              </div>
          </div>
      </section>

      {/* SOCIAL IMPACT SECTION */}
      <section className="py-24 px-6 max-w-5xl mx-auto text-center space-y-10 border-b border-slate-200">
          <div className="w-20 h-20 bg-red-50 text-red-600 rounded-[2rem] flex items-center justify-center mx-auto shadow-sm rotate-3">
              <AlertTriangle className="w-10 h-10 -rotate-3" />
          </div>
          <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight leading-tight max-w-4xl mx-auto text-slate-900">
              Setiap hari, misinformasi mengancam kesehatan dan keamanan finansial masyarakat.
          </h2>
          <p className="text-xl text-slate-500 max-w-3xl mx-auto leading-relaxed">
              Pesan berantai di grup keluarga seringkali memicu kepanikan dan pengambilan keputusan medis/finansial yang salah. CekFakta AI hadir sebagai <span className="font-bold text-slate-800">lapisan imunitas mental</span> pertama di Indonesia yang menggunakan pendekatan emosional dan penalaran kritis.          </p>
      </section>

      {/* FINAL CTA */}
      <section className="bg-white py-24 px-6 text-center text-slate-900 relative">
          <div className="relative z-10 max-w-3xl mx-auto space-y-8">
              <h2 className="text-4xl md:text-6xl font-extrabold tracking-tight">Berpikir Kritis Dimulai dari Satu Klik.</h2>
              <p className="text-xl text-slate-500 font-medium max-w-xl mx-auto">Verifikasi puluhan broadcast WhatsApp dalam hitungan detik. Gratis dan tanpa login.</p>
              <div className="pt-6">
                  <Button 
                      onClick={() => document.getElementById('demo-section')?.scrollIntoView({ behavior: 'smooth' })}
                      className="px-8 py-6 md:py-8 rounded-full bg-slate-900 text-white hover:bg-slate-800 font-bold text-lg shadow-xl shadow-slate-200 transition-transform active:scale-95"
                  >
                      Mulai Cek Fakta Sekarang
                      <ArrowRight className="w-5 h-5 ml-3" />
                  </Button>
              </div>
          </div>
      </section>

    </div>
  );
}
