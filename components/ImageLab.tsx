import React, { useState } from 'react';
import { GoogleGenAI } from '@google/genai';
import { MODEL_NAMES } from '../constants';

const ImageLab: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    if (!prompt) return;
    setLoading(true);
    try {
      const apiKey = process.env.GEMINI_API_KEY || (process.env as any).API_KEY;
      if (!apiKey) throw new Error("API Key missing");
      const ai = new GoogleGenAI({ apiKey });

      // Use Flash Image for speed as per persona requests
      const response = await ai.models.generateContent({
        model: MODEL_NAMES.IMAGE,
        contents: {
          parts: [{ text: prompt }]
        },
        config: {
            // Flash image doesn't support responseMimeType/Schema
            // We just parse the parts
        }
      });

      // Extract image
      const parts = response.candidates?.[0]?.content?.parts;
      if (parts) {
        for (const part of parts) {
           if (part.inlineData) {
             setImageSrc(`data:image/png;base64,${part.inlineData.data}`);
             break;
           }
        }
      }

    } catch (e) {
      console.error(e);
      alert("Failed to generate image. Try a simpler prompt.");
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setImageSrc(ev.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-full p-6 space-y-6">
       <div className="text-center space-y-2">
         <h2 className="text-2xl font-display font-bold text-white">VISUAL ANCHOR LAB</h2>
         <p className="text-gray-400">Generate images to ground your memory.</p>
       </div>

       <div className="w-full max-w-lg aspect-square bg-neutral-900 border-2 border-dashed border-gray-700 rounded-lg flex items-center justify-center relative overflow-hidden group">
         {loading && (
           <div className="absolute inset-0 bg-black/80 z-10 flex items-center justify-center">
             <div className="text-[#00f0ff] font-mono animate-pulse">GENERATING...</div>
           </div>
         )}
         
         {imageSrc ? (
           <img src={imageSrc} alt="Generated" className="w-full h-full object-cover" />
         ) : (
           <div className="text-gray-600 text-center p-8">
             <p className="mb-4 font-mono text-sm">NO VISUAL DATA</p>
             <label className="cursor-pointer bg-neutral-800 hover:bg-neutral-700 px-4 py-2 rounded text-xs uppercase tracking-widest text-white transition-colors">
               Upload Base Image (Optional)
               <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} />
             </label>
           </div>
         )}
       </div>

       <div className="flex w-full max-w-lg gap-2">
         <input 
           type="text" 
           value={prompt}
           onChange={(e) => setPrompt(e.target.value)}
           placeholder="Ex: A futuristic city with neon lights..."
           className="flex-1 bg-neutral-800 border-none rounded p-4 text-white placeholder-gray-500 focus:ring-1 focus:ring-[#00f0ff]"
         />
         <button 
           onClick={handleGenerate}
           disabled={loading || !prompt}
           className="bg-[#00f0ff] text-black font-bold px-6 rounded hover:bg-[#00d0dd] disabled:opacity-50 uppercase font-display"
         >
           Create
         </button>
       </div>
    </div>
  );
};

export default ImageLab;