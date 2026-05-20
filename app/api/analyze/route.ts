import { GoogleGenAI, Type } from "@google/genai";
import { NextRequest, NextResponse } from "next/server";

const ai = new GoogleGenAI({ 
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

export const maxDuration = 60; // Increase timeout for longer generations

export async function POST(req: NextRequest) {
  try {
    const { text, imageBase64, audioBase64, mimeType } = await req.json();

    const parts: any[] = [];
    
    if (text) {
      parts.push({ text: `Analyze this content for misinformation and hoax potential in INDONESIAN context:\n\n${text}` });
    } else {
       parts.push({ text: `Analyze the provided media for misinformation and hoax potential in INDONESIAN context.` });
    }

    if (imageBase64) {
      parts.push({
        inlineData: {
          data: imageBase64.split(",")[1] || imageBase64,
          mimeType: mimeType || "image/jpeg",
        },
      });
    }

    if (audioBase64) {
      parts.push({
        inlineData: {
           data: audioBase64.split(",")[1] || audioBase64,
           mimeType: mimeType || "audio/webm",
        }
      });
    }

    const responseSchema = {
      type: Type.OBJECT,
      properties: {
        verdict: {
          type: Type.STRING,
          description: "One of: 'Kemungkinan Valid', 'Perlu Verifikasi', 'Kemungkinan Hoax'",
        },
        confidenceScore: {
          type: Type.NUMBER,
          description: "Confidence score from 0 to 100",
        },
        explanation: {
          type: Type.STRING,
          description: "A detailed but clear explanation of why it is valid, needs verification, or is a hoax.",
        },
        parentExplanationMode: {
          type: Type.STRING,
          description: "A very simplified explanation, respectfully addressing parents (Bapak/Ibu), using a natural conversational Indonesian tone without technical jargon.",
        },
        extractedClaims: {
          type: Type.ARRAY,
          items: {
            type: Type.STRING,
          },
          description: "Main claims extracted from the content.",
        },
        emotionalManipulation: {
          type: Type.OBJECT,
          properties: {
            isManipulative: {
              type: Type.BOOLEAN,
            },
            tactics: {
               type: Type.ARRAY,
               items: {
                 type: Type.STRING,
               },
               description: "Tactics used like 'Fear Bait', 'Urgency', 'Religious Exploitation', etc."
            },
            explanation: {
              type: Type.STRING,
              description: "Briefly explain how they manipulate emotion, e.g. 'Pesan ini mencoba membuat pembaca panik...'"
            }
          },
          required: ["isManipulative", "tactics", "explanation"]
        },
        recommendation: {
            type: Type.STRING,
            description: "Recommendation on whether to forward or not."
        }
      },
      required: ["verdict", "confidenceScore", "explanation", "parentExplanationMode", "extractedClaims", "emotionalManipulation", "recommendation"],
    };

    const configObj = {
      systemInstruction: `You are an expert fact-checker and misinformation intelligence analyst specializing in Indonesian social media content (WhatsApp, TikTok, Facebook). 
Analyze the input carefully.

CRITICAL INTELLIGENCE RULES:
1. DO NOT hallucinate or make up facts. Your analysis MUST be based on real, verifiable information.
2. Use Google Search grounding to validate claims.
3. Prioritize these Trusted Sources for Indonesia when checking facts:
   - Kominfo (hoax references)
   - TurnBackHoax (fact checking)
   - WHO (health/kesehatan)
   - Kemenkes (Indonesian medical)
   - BMKG (weather/disasters)
   - Tempo Cek Fakta (news verification)
   
DETECTED MANIPULATION:
You must strictly identify manipulation tactics used in scams or hoaxes, such as:
- Memicu Rasa Takut (Fear-mongering)
- Urgensi Palsu (False Urgency)
- Menyalahgunakan Otoritas (Authority Abuse)
- Janji Keuntungan Finansial (Financial Bait)
- Format Mencurigakan (Suspicious Formatting/Links)
- Tanpa Sumber Kredibel (No Credible Sources)

PARENT EXPLANATION MODE:
Provide a "parent explanation mode" that uses extremely polite, conversational, simple Indonesian for elders (e.g. "Bapak/Ibu, info ini kurang tepat karena..."). Do not sound technical or like a robot.

Keep the general explanation clear, helpful, and structured like a modern threat intelligence briefing.
Output ONLY JSON according to the schema.`,
      responseMimeType: "application/json",
      responseSchema: responseSchema,
      tools: [{ googleSearch: {} }],
      toolConfig: { includeServerSideToolInvocations: true },
    };

    let response;
    try {
      response = await ai.models.generateContent({
        model: "gemini-2.0-flash",
        contents: { parts: parts },
        config: configObj,
      });
    } catch (primaryError: any) {
      console.warn("Primary model (gemini-2.0-flash) failed, attempting fallback:", primaryError.message);
      try {
        response = await ai.models.generateContent({
          model: "gemini-1.5-flash",
          contents: { parts: parts },
          config: configObj,
        });
      } catch (fallbackError: any) {
        console.error("Fallback model (gemini-1.5-flash) also failed:", fallbackError.message);
        // Return mock fallback response on API rate limit / quota exceeded
        return NextResponse.json({
          verdict: "Perlu Verifikasi",
          confidenceScore: 50,
          explanation: "Sistem AI kami sedang mencapai batas kapasitas harian (Quota Exceeded Limit). Tolong pastikan untuk memverifikasi informasi secara mandiri via Google atau sumber resmi melalui Google Pencarian.",
          parentExplanationMode: "Bapak/Ibu, sistem pengecek otomatis kami sedang penuh kapasitasnya saat ini dan sibuk. Kami tidak bisa memeriksa secara akurat. Tolong jangan disebarkan dulu pesannya sebelum dicek kebenarannya secara langsung ya.",
          extractedClaims: ["Sistem perlindungan misinformasi sedang overcapacity (Quota limit)"],
          emotionalManipulation: {
            isManipulative: true,
            tactics: ["Tidak Dapat Dianalisis"],
            explanation: "Sistem sedang sibuk. Mohon berhati-hati terhadap pesan yang menimbulkan kepanikan."
          },
          recommendation: "Pesan tidak dapat divalidasi. Jangan sebarkan dulu.",
          sources: []
        });
      }
    }

    let jsonStr = response.text?.trim() || "{}";
    let analysis;
    try {
      analysis = JSON.parse(jsonStr);
    } catch(e) {
      console.error("JSON parse error from GenAI", e, jsonStr);
       return NextResponse.json({ error: "Failed to parse AI response" }, { status: 500 });
    }

    // Attempt to extract source links from grounding chunks
    let sources: any[] = [];
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    if (chunks) {
      chunks.forEach((chunk: any) => {
        if (chunk.web?.uri && chunk.web?.title) {
          sources.push({ url: chunk.web.uri, title: chunk.web.title });
        }
      });
    }

    // remove duplicate sources with same url
    const uniqueSources = sources.filter((v,i,a)=>a.findIndex(v2=>(v2.url===v.url))===i);

    return NextResponse.json({ ...analysis, sources: uniqueSources });
  } catch (error: any) {
    console.error("Analyze error:", error);
    return NextResponse.json(
      { error: error.message || "Something went wrong" },
      { status: 500 }
    );
  }
}
