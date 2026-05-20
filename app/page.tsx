"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  ShieldCheck, AlertTriangle, XCircle, FileText, Image as ImageIcon, 
  Mic, Search, BrainCircuit, HeartHandshake, Link as LinkIcon, AlertOctagon, Info
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";

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
    <div className="flex-1 flex flex-col lg:flex-row overflow-hidden w-full bg-slate-50">
      
      {/* Left Panel: Input Section */}
      <section className="w-full lg:w-[420px] bg-white border-r border-slate-200 p-6 lg:p-8 flex flex-col overflow-y-auto shrink-0 z-10 shadow-sm lg:shadow-none min-h-screen lg:min-h-0">
        
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-left mb-6"
        >
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-blue-600 text-white mb-4">
            <BrainCircuit className="w-6 h-6" />
          </div>
          <h1 className="text-3xl font-bold leading-tight mb-3 text-slate-900">
            CekFakta<span className="text-blue-600">AI</span>
          </h1>
          <p className="text-sm text-slate-500">
            Verifikasi informasi dengan cepat. Kami bantu analisis pesan mencurigakan dan jelaskan dengan bahasa sederhana.
          </p>
        </motion.div>

        {/* Input Section */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="flex-1 flex flex-col"
        >
          <Tabs defaultValue="text" onValueChange={setActiveTab} className="w-full flex-1 flex flex-col space-y-6">
            <TabsList className="grid w-full grid-cols-3 gap-2 bg-transparent h-auto p-0">
              <TabsTrigger value="text" className="p-3 border border-slate-200 rounded-xl hover:bg-slate-50 text-xs sm:text-sm font-medium text-slate-600 data-[state=active]:bg-white data-[state=active]:border-blue-500 data-[state=active]:text-blue-700 data-[state=active]:shadow-sm transition-all focus:ring-0">
                <FileText className="w-4 h-4 mr-2" />
                Teks
              </TabsTrigger>
              <TabsTrigger value="image" className="p-3 border border-slate-200 rounded-xl hover:bg-slate-50 text-xs sm:text-sm font-medium text-slate-600 data-[state=active]:bg-white data-[state=active]:border-blue-500 data-[state=active]:text-blue-700 data-[state=active]:shadow-sm transition-all focus:ring-0">
                <ImageIcon className="w-4 h-4 mr-2" />
                Gambar
              </TabsTrigger>
              <TabsTrigger value="audio" className="p-3 border border-slate-200 rounded-xl hover:bg-slate-50 text-xs sm:text-sm font-medium text-slate-600 data-[state=active]:bg-white data-[state=active]:border-blue-500 data-[state=active]:text-blue-700 data-[state=active]:shadow-sm transition-all focus:ring-0">
                <Mic className="w-4 h-4 mr-2" />
                Audio
              </TabsTrigger>
            </TabsList>
            <div className="flex-1">
              <TabsContent value="text" className="mt-0 h-full">
                <div className="relative group h-full">
                  <Label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2 block">Konten untuk Dicek</Label>
                  <Textarea 
                    placeholder="Paste pesan WhatsApp, tweet, atau link artikel yang mencurigakan di sini..."
                    className="w-full h-48 md:h-64 p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:border-transparent outline-none resize-none text-slate-900"
                    value={textInput}
                    onChange={(e) => setTextInput(e.target.value)}
                  />
                </div>
              </TabsContent>
              
              <TabsContent value="image" className="mt-0 h-full">
                <div className="h-48 md:h-64 border border-dashed border-slate-300 rounded-2xl p-6 text-center bg-slate-50 hover:bg-slate-100 transition-colors flex flex-col items-center justify-center relative group cursor-pointer focus-within:ring-2 focus-within:ring-blue-500">
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={handleImageUpload}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  />
                  {imagePreview ? (
                    <img src={imagePreview} alt="Preview" className="max-h-[200px] object-contain rounded-lg" />
                  ) : (
                    <div className="flex flex-col items-center gap-3 text-muted-foreground group-hover:text-primary transition-colors">
                      <ImageIcon className="w-8 h-8" />
                      <p>Ketuk atau seret gambar/screenshot kemari</p>
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="audio" className="mt-0 h-full">
                <div className="flex flex-col items-center justify-center p-8 bg-slate-50 border border-slate-200 rounded-2xl h-48 md:h-64 gap-6">
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
                        <p className="text-slate-500 text-sm">Rekam Voice Note WhatsApp yang mencurigakan</p>
                      </div>
                      <Button 
                        size="lg"
                        variant="default"
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

              <Button 
                size="lg" 
                className="w-full py-4 mt-6 bg-blue-600 text-white rounded-2xl font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 h-auto"
                onClick={handleAnalyze}
                disabled={isAnalyzing}
              >
                {isAnalyzing ? (
                  <span className="flex items-center gap-2">
                    <Search className="w-5 h-5 animate-pulse" />
                    Sedang Menganalisis...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Search className="w-5 h-5 text-white/50" />
                    Mulai Analisis AI
                  </span>
                )}
              </Button>
            </div>
          </Tabs>
        </motion.div>
      </section>

      {/* Right Panel: Results Section */}
      <section className="flex-1 p-6 lg:p-8 overflow-y-auto w-full">
        <div className="max-w-3xl mx-auto space-y-6 pb-20">
      <AnimatePresence mode="wait">
        {!result && !isAnalyzing && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="h-full flex flex-col items-center justify-center text-slate-400 py-32"
          >
             <BrainCircuit className="w-20 h-20 mb-4 opacity-20" />
             <p className="text-sm font-medium">Hasil analisis akan muncul di sini.</p>
          </motion.div>
        )}
        {isAnalyzing && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center py-32 space-y-4"
          >
             <div className="w-16 h-16 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin"></div>
             <p className="text-blue-600 font-bold uppercase tracking-wider text-sm animate-pulse">Memproses Data Multimodal...</p>
          </motion.div>
        )}
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="w-full space-y-6"
          >
            {/* Verdict Card */}
            <div className={`rounded-3xl p-6 flex flex-col md:flex-row items-center gap-6 border ${
                result.verdict === 'Kemungkinan Valid' ? 'bg-emerald-50 border-emerald-100' :
                result.verdict === 'Perlu Verifikasi' ? 'bg-amber-50 border-amber-100' :
                'bg-red-50 border-red-100'
              }`}>
              <div className={`w-20 h-20 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg ${
                  result.verdict === 'Kemungkinan Valid' ? 'bg-emerald-500 shadow-emerald-200' :
                  result.verdict === 'Perlu Verifikasi' ? 'bg-amber-500 shadow-amber-200' :
                  'bg-red-500 shadow-red-200'
                }`}>
                {(() => {
                  const IconDef = getVerdictVisuals(result.verdict).icon;
                  return <IconDef className="w-10 h-10 text-white" strokeWidth={2.5} />;
                })()}
              </div>
              <div className="flex-1 w-full text-center md:text-left">
                <span className={`text-xs font-black uppercase tracking-widest ${
                    result.verdict === 'Kemungkinan Valid' ? 'text-emerald-700' :
                    result.verdict === 'Perlu Verifikasi' ? 'text-amber-700' :
                    'text-red-700'
                  }`}>Hasil Analisis</span>
                <h2 className={`text-2xl font-bold mb-1 ${
                    result.verdict === 'Kemungkinan Valid' ? 'text-emerald-900' :
                    result.verdict === 'Perlu Verifikasi' ? 'text-amber-900' :
                    'text-red-900'
                  }`}>{result.verdict}</h2>
                <p className={`text-sm ${
                    result.verdict === 'Kemungkinan Valid' ? 'text-emerald-700' :
                    result.verdict === 'Perlu Verifikasi' ? 'text-amber-700' :
                    'text-red-700'
                  }`}>{result.explanation}</p>
              </div>
              <div className="mt-4 md:mt-0 text-center md:text-right shrink-0">
                <div className={`text-3xl font-black leading-none ${
                    result.verdict === 'Kemungkinan Valid' ? 'text-emerald-600' :
                    result.verdict === 'Perlu Verifikasi' ? 'text-amber-600' :
                    'text-red-600'
                  }`}>{result.confidenceScore}%</div>
                <div className={`text-[10px] font-bold uppercase mt-1 ${
                    result.verdict === 'Kemungkinan Valid' ? 'text-emerald-500' :
                    result.verdict === 'Perlu Verifikasi' ? 'text-amber-500' :
                    'text-red-500'
                  }`}>Confidence Score</div>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6 w-full">
              {/* Emotional Map */}
              <div className="bg-white border border-slate-200 rounded-3xl p-6">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                   <AlertOctagon className="w-4 h-4 text-slate-400" />
                   Manipulasi Emosional
                </h3>
                  {result.emotionalManipulation.isManipulative ? (
                    <div className="space-y-4">
                      {result.emotionalManipulation.tactics.map((tactic, i) => (
                        <div key={i} className="flex flex-col gap-1">
                          <div className="flex justify-between text-xs font-bold">
                            <span className="text-slate-700">{tactic}</span>
                            <span className="text-red-500">Terdeteksi</span>
                          </div>
                          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                            <div className="bg-red-500 h-full w-[85%]"></div>
                          </div>
                        </div>
                      ))}
                      <p className="text-xs text-slate-500 mt-2">
                        {result.emotionalManipulation.explanation}
                      </p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center p-4 text-center space-y-2 text-slate-400">
                      <ShieldCheck className="w-8 h-8 opacity-50" />
                      <p className="text-sm">Gaya bahasa netral dan informatif.</p>
                    </div>
                  )}
              </div>

              {/* Claims / Sources Check */}
              <div className="flex flex-col gap-6 w-full">
                <div className="bg-white border border-slate-200 rounded-3xl p-6 flex-1">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                     <FileText className="w-4 h-4 text-slate-400" />
                     Klaim Utama
                  </h3>
                  <div className="space-y-3">
                     {result.extractedClaims.slice(0, 3).map((claim, i) => (
                       <div key={i} className="flex items-start gap-3 p-3 bg-slate-50 border border-slate-100 rounded-xl">
                         <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 shrink-0"></div>
                         <span className="text-xs font-medium text-slate-700">{claim}</span>
                       </div>
                     ))}
                  </div>
                </div>

                {result.sources && result.sources.length > 0 && (
                  <div className="bg-white border border-slate-200 rounded-3xl p-6">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                       <LinkIcon className="w-4 h-4 text-slate-400" />
                       Referensi Terpercaya
                    </h3>
                    <div className="space-y-3">
                      {result.sources.map((source, i) => (
                        <a key={i} href={source.url} target="_blank" rel="noreferrer" className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-100 hover:border-slate-300 rounded-xl transition-colors group">
                          <div className="shrink-0 w-6 h-6 rounded-full bg-white border border-slate-200 flex items-center justify-center group-hover:bg-blue-50">
                            <LinkIcon className="w-3 h-3 text-slate-400 group-hover:text-blue-500" />
                          </div>
                          <div className="truncate flex-1">
                            <span className="text-xs font-bold text-slate-700 block truncate">{source.title}</span>
                            <span className="text-[10px] text-slate-500 uppercase tracking-wide truncate">{new URL(source.url).hostname}</span>
                          </div>
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Parent Explanation Mode - WOW Feature */}
            <div className="bg-blue-600 rounded-3xl p-6 md:p-8 text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-20 pointer-events-none">
                <HeartHandshake className="w-32 h-32" />
              </div>
              <div className="relative z-10">
                <div className="flex flex-wrap items-center gap-2 mb-4">
                  <span className="px-3 py-1 bg-white/20 rounded-full text-[10px] font-bold uppercase tracking-widest backdrop-blur-md">Fitur Unggulan</span>
                  <h3 className="text-xl font-bold">Mode Jelaskan ke Orang Tua</h3>
                </div>
                <p className="text-blue-100 text-lg md:text-xl italic leading-relaxed font-medium">
                  &quot;{result.parentExplanationMode}&quot;
                </p>
                {result.recommendation && (
                  <div className="mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-sm text-blue-50">
                     <Info className="w-4 h-4" />
                     <span className="font-medium">{result.recommendation}</span>
                  </div>
                )}
              </div>
            </div>

          </motion.div>
        )}
      </AnimatePresence>
        </div>
      </section>
    </div>
  );
}
