import React, { useEffect, useState, useRef } from 'react';
import { ApiService } from '../services/api';
import { GeminiService } from '../services/geminiService';
import { TelegramService } from '../services/telegram';
import { ChannelMessage, TranscriptionResult } from '../types';
import { Eye, Sparkles, ExternalLink, Megaphone, Play, Pause, Volume2, VolumeX, Share2, Smile, Plus, Mic, StopCircle, Languages, Loader2, X, AlertCircle } from 'lucide-react';

const AVAILABLE_REACTIONS = ['👍', '❤️', '🔥', '🎉', '👏', '😂'];

// Custom Video Player Component
const VideoPlayer: React.FC<{ src: string; poster?: string; onTranslateClick: () => void }> = ({ src, poster, onTranslateClick }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleError = () => setHasError(true);

    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('error', handleError);

    return () => {
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('error', handleError);
    };
  }, []);

  const togglePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (videoRef.current && !hasError) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play().catch(err => {
            console.error("Play failed:", err);
            setHasError(true);
        });
      }
    }
  };

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (videoRef.current && !hasError) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  if (hasError) {
    return (
        <div className="relative w-full aspect-video group bg-neutral-900 rounded-lg overflow-hidden shadow-lg border border-neutral-800 flex flex-col items-center justify-center">
            {poster && (
                <img src={poster} alt="Video thumbnail" className="absolute inset-0 w-full h-full object-cover opacity-20" />
            )}
            <div className="z-10 flex flex-col items-center gap-2 p-4 text-center">
                <AlertCircle className="text-red-500" size={32} />
                <p className="text-xs text-neutral-400 font-medium">Video playback unavailable</p>
            </div>
             {/* AI Translate Overlay Button (Still available even if playback fails) */}
            <div className="absolute top-2 right-2 z-20">
                <button 
                onClick={(e) => { e.stopPropagation(); onTranslateClick(); }}
                className="bg-black/70 backdrop-blur-md text-amber-500 px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 hover:bg-black/90 transition-colors border border-amber-500/30"
                >
                <Sparkles size={12} className="text-amber-400" />
                AI Translate
                </button>
            </div>
        </div>
    );
  }

  return (
    <div className="relative w-full aspect-video group bg-black rounded-lg overflow-hidden shadow-lg shadow-black/50 border border-neutral-800">
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        className="w-full h-full object-contain"
        playsInline
        onError={() => setHasError(true)}
        onClick={togglePlay}
      />
      
      {/* AI Translate Overlay Button (Top Right) */}
      <div className="absolute top-2 right-2 z-20">
         <button 
           onClick={(e) => { e.stopPropagation(); onTranslateClick(); }}
           className="bg-black/70 backdrop-blur-md text-amber-500 px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 hover:bg-black/90 transition-colors border border-amber-500/30"
         >
           <Sparkles size={12} className="text-amber-400" />
           AI Translate
         </button>
      </div>

      {/* Center Play Overlay (Visible when paused) */}
      {!isPlaying && (
        <div 
          className="absolute inset-0 flex items-center justify-center bg-black/40 cursor-pointer transition-opacity"
          onClick={togglePlay}
        >
          <div className="bg-amber-500/10 backdrop-blur-md p-4 rounded-full border border-amber-500/50 hover:scale-110 transition-transform shadow-[0_0_15px_rgba(245,158,11,0.3)]">
            <Play size={32} className="text-amber-500 ml-1" fill="currentColor" />
          </div>
        </div>
      )}

      {/* Bottom Controls Bar (Visible on pause or hover) */}
      <div 
        className={`absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black to-transparent flex items-center justify-between transition-opacity duration-300 ${
          isPlaying ? 'opacity-0 group-hover:opacity-100' : 'opacity-100'
        }`}
        onClick={(e) => e.stopPropagation()} 
      >
        <button 
          onClick={togglePlay} 
          className="text-white hover:text-amber-500 transition-colors p-1"
        >
          {isPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" />}
        </button>

        <button 
          onClick={toggleMute} 
          className="text-white hover:text-amber-500 transition-colors p-1"
        >
          {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
        </button>
      </div>
    </div>
  );
};

const MessageList: React.FC = () => {
  const [messages, setMessages] = useState<ChannelMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<string | null>(null);
  const [summarizing, setSummarizing] = useState(false);
  
  // Transcription States
  const [showTranscriber, setShowTranscriber] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcriptionResult, setTranscriptionResult] = useState<TranscriptionResult | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  
  // Translation States
  const [translatedMessages, setTranslatedMessages] = useState<Record<string, TranscriptionResult>>({});
  const [translatingIds, setTranslatingIds] = useState<Record<string, boolean>>({});

  // Track which message currently has the reaction picker open
  const [activeReactionId, setActiveReactionId] = useState<string | null>(null);

  useEffect(() => {
    const loadMessages = async () => {
      try {
        const data = await ApiService.fetchMessages();
        setMessages(data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    loadMessages();
  }, []);

  const handleSummarize = async () => {
    if (messages.length === 0) return;
    setSummarizing(true);
    try {
      const textContent = messages.map(m => m.content);
      const result = await GeminiService.summarizeMessages(textContent);
      setSummary(result);
    } catch (e) {
      console.error(e);
    } finally {
      setSummarizing(false);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      chunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorderRef.current.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.onloadend = async () => {
          const base64String = (reader.result as string).split(',')[1];
          await processAudio(base64String, blob.type);
        };
        reader.readAsDataURL(blob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
      TelegramService.haptic.impact('medium');
    } catch (err) {
      console.error("Error accessing microphone:", err);
      TelegramService.haptic.error();
      alert("Could not access microphone. Please ensure permissions are granted.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsTranscribing(true);
      TelegramService.haptic.impact('light');
    }
  };

  const processAudio = async (base64Audio: string, mimeType: string) => {
    try {
      const result = await GeminiService.transcribeAudio(base64Audio, mimeType);
      setTranscriptionResult(result);
      TelegramService.haptic.success();
    } catch (error) {
      console.error("Transcription failed", error);
      TelegramService.haptic.error();
      // Set a partial result with error indicators
      setTranscriptionResult({
        original: "Transcription failed. Please try again.",
        hindi: "FAILED",
        urdu: "FAILED",
        telugu: "FAILED"
      });
    } finally {
      setIsTranscribing(false);
    }
  };
  
  const handleVideoTranslate = async (msgId: string, videoUrl: string) => {
      const key = `${msgId}_video`;
      if (translatedMessages[key]) return;

      setTranslatingIds(prev => ({ ...prev, [key]: true }));
      TelegramService.haptic.impact('light');
      
      try {
          const result = await GeminiService.transcribeVideo(videoUrl);
          setTranslatedMessages(prev => ({ ...prev, [key]: result }));
          TelegramService.haptic.success();
      } catch (error) {
          console.error("Video Translation failed", error);
          TelegramService.haptic.error();
           setTranslatedMessages(prev => ({ 
            ...prev, 
            [key]: {
            original: "Video translation unavailable for this content.",
            hindi: "FAILED",
            urdu: "FAILED",
            telugu: "FAILED"
          }}));
      } finally {
          setTranslatingIds(prev => ({ ...prev, [key]: false }));
      }
  };

  const handleTextTranslate = async (msgId: string, text: string) => {
    if (translatedMessages[msgId]) return;

    setTranslatingIds(prev => ({ ...prev, [msgId]: true }));
    TelegramService.haptic.impact('light');

    try {
      const result = await GeminiService.translateText(text);
      setTranslatedMessages(prev => ({ ...prev, [msgId]: result }));
      TelegramService.haptic.success();
    } catch (error) {
      console.error("Text translation failed", error);
      TelegramService.haptic.error();
      // Use fallback error object
      setTranslatedMessages(prev => ({ 
          ...prev, 
          [msgId]: {
            original: text,
            hindi: "FAILED",
            urdu: "FAILED",
            telugu: "FAILED"
          } 
      }));
    } finally {
      setTranslatingIds(prev => ({ ...prev, [msgId]: false }));
    }
  };

  const openChannel = () => {
    TelegramService.haptic.impact('light');
    TelegramService.openTelegramLink('https://t.me/AzadStudioOfficial');
  };

  const handleShare = (msg: ChannelMessage) => {
    TelegramService.haptic.impact('light');
    const postUrl = `https://t.me/${msg.author}/${msg.id}`;
    const previewText = msg.content.length > 100 
      ? msg.content.substring(0, 97) + '...' 
      : msg.content;
      
    TelegramService.share(postUrl, `Check out this post from @${msg.author}:\n\n${previewText}`);
  };

  const handleReactionClick = (msgId: string, emoji: string) => {
    TelegramService.haptic.selectionChanged();

    setMessages(prevMessages => prevMessages.map(msg => {
      if (msg.id !== msgId) return msg;

      const currentReactions = msg.reactions || [];
      const existingReactionIndex = currentReactions.findIndex(r => r.emoji === emoji);

      let newReactions = [...currentReactions];

      if (existingReactionIndex > -1) {
        const reaction = newReactions[existingReactionIndex];
        if (reaction.userReacted) {
          reaction.count -= 1;
          reaction.userReacted = false;
          if (reaction.count <= 0) {
             newReactions.splice(existingReactionIndex, 1);
          }
        } else {
          reaction.count += 1;
          reaction.userReacted = true;
        }
      } else {
        newReactions.push({ emoji, count: 1, userReacted: true });
      }

      return { ...msg, reactions: newReactions };
    }));

    setActiveReactionId(null);
  };

  const toggleReactionPicker = (msgId: string) => {
    TelegramService.haptic.impact('light');
    setActiveReactionId(current => current === msgId ? null : msgId);
  };

  const closePicker = () => {
    if (activeReactionId) setActiveReactionId(null);
  };
  
  const playTTS = (text: string, lang: string) => {
      if ('speechSynthesis' in window) {
          window.speechSynthesis.cancel();
          const utterance = new SpeechSynthesisUtterance(text);
          const langMap: Record<string, string> = {
              'en': 'en-US',
              'hi': 'hi-IN',
              'ur': 'ur-PK',
              'te': 'te-IN'
          };
          utterance.lang = langMap[lang] || lang;
          utterance.rate = 0.9; 
          window.speechSynthesis.speak(utterance);
          TelegramService.haptic.impact('light');
      } else {
          alert("Text-to-Speech is not supported in this browser/webview.");
      }
  };

  if (loading) {
    return (
      <div className="flex flex-col gap-4 p-4 animate-pulse">
        <div className="h-32 bg-neutral-900 border border-neutral-800 rounded-xl w-full mb-2"></div>
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 bg-neutral-900 border border-neutral-800 rounded-lg w-full"></div>
        ))}
      </div>
    );
  }
  
  // Empty state check
  if (messages.length === 0) {
      return (
          <div className="flex flex-col items-center justify-center h-[70vh] p-4 text-center">
              <Megaphone size={48} className="text-neutral-700 mb-4" />
              <h3 className="text-white font-bold text-lg mb-2">No Updates Yet</h3>
              <p className="text-neutral-500 text-sm max-w-xs">
                We couldn't fetch the latest messages. Please check your connection or try again later.
              </p>
              <button 
                  onClick={() => window.location.reload()}
                  className="mt-6 px-6 py-2 bg-neutral-800 text-amber-500 rounded-full text-sm font-bold"
              >
                  Refresh Feed
              </button>
          </div>
      );
  }

  return (
    <div className="pb-24 pt-4 px-4 space-y-5" onClick={closePicker}>
      {/* Channel Header Card */}
      <div className="bg-gradient-to-r from-neutral-900 via-neutral-950 to-black rounded-xl p-5 text-white shadow-xl shadow-amber-900/10 relative overflow-hidden border border-amber-500/20">
        <div className="absolute top-0 right-0 -mt-2 -mr-2 w-32 h-32 bg-amber-500 opacity-5 rounded-full blur-3xl"></div>
        
        <div className="flex justify-between items-center relative z-10">
          <div className="flex items-center gap-3">
            <div className="bg-amber-500/10 p-2.5 rounded-lg border border-amber-500/20">
               <Megaphone size={24} className="text-amber-500" />
            </div>
            <div>
              <h2 className="font-bold text-lg leading-tight text-amber-500">AzadStudio Official</h2>
              <p className="text-neutral-400 text-xs font-medium">@AzadStudioOfficial</p>
            </div>
          </div>
          <button 
            onClick={openChannel}
            className="bg-amber-500 text-black px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wide shadow-[0_0_10px_rgba(245,158,11,0.3)] hover:bg-amber-400 transition-colors flex items-center gap-1"
          >
            View
            <ExternalLink size={12} />
          </button>
        </div>
        <div className="mt-4 flex gap-4 text-xs font-medium text-amber-500/60 border-t border-white/5 pt-3">
          <span>Tech Updates</span>
          <span>•</span>
          <span>Coding Tutorials</span>
          <span>•</span>
          <span>News</span>
        </div>
      </div>

      <div className="flex justify-between items-center mt-2 mb-2">
        <h3 className="text-lg font-bold text-white tracking-wide">LATEST UPDATES</h3>
        <div className="flex gap-2">
          <button
            onClick={(e) => { e.stopPropagation(); handleSummarize(); }}
            disabled={summarizing}
            className="flex items-center gap-2 px-3 py-1.5 bg-neutral-900 border border-amber-500/30 text-amber-500 hover:bg-neutral-800 rounded-full text-xs font-medium transition-all"
          >
            <Sparkles size={14} className={summarizing ? "animate-spin text-amber-500" : "text-amber-500"} />
            {summarizing ? 'Analyzing...' : 'AI Summary'}
          </button>
        </div>
      </div>

      {/* FAB for Microphone */}
      <button
        onClick={() => setShowTranscriber(true)}
        className="fixed bottom-20 right-4 z-40 bg-amber-500 hover:bg-amber-400 text-black p-4 rounded-full shadow-[0_0_20px_rgba(245,158,11,0.4)] transition-transform active:scale-95 flex items-center justify-center"
      >
        <Mic size={24} />
      </button>

      {/* Transcription Interface Drawer/Modal */}
      {showTranscriber && (
        <div className="fixed inset-x-0 bottom-0 z-50 bg-neutral-900 rounded-t-2xl shadow-[0_-5px_20px_rgba(0,0,0,0.8)] border-t border-neutral-800 p-5 animate-in slide-in-from-bottom duration-300 max-h-[85vh] overflow-y-auto">
           <div className="flex justify-between items-center mb-6 sticky top-0 bg-neutral-900 z-10 pb-2 border-b border-neutral-800">
             <h3 className="font-bold text-lg text-white flex items-center gap-2">
               <Languages className="text-amber-500" />
               AI Transcribe & Translate
             </h3>
             <button onClick={() => setShowTranscriber(false)} className="p-2 bg-neutral-800 rounded-full text-neutral-400 hover:text-white">
               <X size={20} />
             </button>
           </div>

           {!transcriptionResult && !isTranscribing && (
             <div className="flex flex-col items-center justify-center py-10 gap-6">
               <div className={`relative flex items-center justify-center`}>
                   {isRecording && <div className="absolute inset-0 bg-red-500/20 rounded-full animate-ping"></div>}
                   <button
                     onClick={isRecording ? stopRecording : startRecording}
                     className={`w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 shadow-xl border-4 border-neutral-800 ${
                       isRecording 
                        ? 'bg-red-600 text-white scale-110' 
                        : 'bg-gradient-to-br from-amber-500 to-amber-600 text-black'
                     }`}
                   >
                     {isRecording ? <StopCircle size={36} /> : <Mic size={36} />}
                   </button>
               </div>
               <p className="text-base text-neutral-300 font-medium text-center">
                 {isRecording ? 'Listening... Tap to process' : 'Tap microphone to speak'}
               </p>
             </div>
           )}

           {isTranscribing && (
             <div className="flex flex-col items-center justify-center py-12">
               <Loader2 size={40} className="animate-spin text-amber-500 mb-4" />
               <p className="text-white font-medium">Processing Audio...</p>
               <p className="text-sm text-neutral-400 mt-2">Translating to Hindi, Urdu, & Telugu</p>
             </div>
           )}

           {transcriptionResult && (
             <div className="space-y-5">
               <div className="p-4 bg-black rounded-xl border border-neutral-800">
                 <div className="flex justify-between items-center mb-2">
                    <p className="text-xs font-bold text-amber-500 uppercase tracking-widest">Original</p>
                 </div>
                 <p className="text-gray-200 text-base leading-relaxed">{transcriptionResult.original}</p>
               </div>
               
               <div className="space-y-3">
                 {[
                    { label: 'Hindi', text: transcriptionResult.hindi, lang: 'hi', color: 'amber' },
                    { label: 'Urdu', text: transcriptionResult.urdu, lang: 'ur', color: 'emerald', rtl: true },
                    { label: 'Telugu', text: transcriptionResult.telugu, lang: 'te', color: 'indigo' }
                 ].map((item) => (
                    <div key={item.label} className={`p-4 rounded-xl border relative group bg-neutral-900 border-neutral-800`}>
                        <div className="flex justify-between items-center mb-2">
                             <p className={`text-xs font-bold uppercase text-${item.color === 'amber' ? 'amber-500' : item.color === 'emerald' ? 'emerald-400' : 'indigo-400'}`}>{item.label}</p>
                             {item.text !== "FAILED" && (
                                <button 
                                onClick={() => playTTS(item.text, item.lang)}
                                className="p-1.5 bg-neutral-800 rounded-full text-neutral-400 hover:text-amber-500 transition-colors"
                                >
                                <Volume2 size={16} />
                                </button>
                             )}
                        </div>
                        {item.text === "FAILED" ? (
                            <div className="flex items-center gap-2 text-red-500 text-xs bg-red-500/10 p-2 rounded">
                                <AlertCircle size={14} />
                                <span>Translation failed</span>
                            </div>
                        ) : (
                            <p 
                                className={`text-gray-300 text-sm leading-relaxed ${item.rtl ? 'text-right' : ''}`} 
                                style={item.rtl ? { direction: 'rtl' } : {}}
                            >
                                {item.text}
                            </p>
                        )}
                    </div>
                 ))}
               </div>

               <button 
                onClick={() => setTranscriptionResult(null)}
                className="w-full py-3 text-sm text-black bg-amber-500 rounded-xl font-bold shadow-lg shadow-amber-500/20 active:scale-95 transition-transform hover:bg-amber-400"
               >
                 Start New Recording
               </button>
             </div>
           )}
        </div>
      )}

      {/* AI Summary Card */}
      {summary && (
        <div className="bg-neutral-900/50 p-4 rounded-xl border border-amber-500/30 mb-6 animate-fade-in relative overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-amber-500/10 rounded-full blur-2xl"></div>
          <h3 className="text-xs font-bold text-amber-500 mb-2 uppercase tracking-widest flex items-center gap-2">
            <Sparkles size={12} />
            AI Highlights
          </h3>
          <div className="prose prose-invert text-sm leading-relaxed whitespace-pre-line text-neutral-300">
            {summary}
          </div>
        </div>
      )}

      {/* Message List */}
      {messages.map((msg) => (
        <div key={msg.id} className="bg-neutral-900 p-4 rounded-xl shadow-md border border-neutral-800 relative">
          <div className="flex justify-between items-start mb-3">
            <div className="flex items-center gap-2">
                <span className="font-bold text-amber-500 text-sm tracking-wide">@{msg.author}</span>
            </div>
            <span className="text-[10px] text-neutral-500 uppercase tracking-wide">{new Date(msg.date).toLocaleDateString()}</span>
          </div>
          
          <div className="relative group">
            <p className="text-gray-200 mb-3 whitespace-pre-wrap text-sm leading-relaxed font-light">
                {msg.content}
            </p>
            {/* Translate Button for Text */}
            <div className="flex justify-end mb-3">
                 <button
                   onClick={(e) => { e.stopPropagation(); handleTextTranslate(msg.id, msg.content); }}
                   disabled={translatingIds[msg.id]}
                   className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-amber-500 hover:text-amber-400 bg-amber-900/10 border border-amber-500/20 px-2.5 py-1.5 rounded-lg transition-colors"
                 >
                    {translatingIds[msg.id] ? (
                        <Loader2 size={10} className="animate-spin" />
                    ) : (
                        <Languages size={10} />
                    )}
                    {translatingIds[msg.id] ? 'Translating...' : 'Translate'}
                 </button>
            </div>

            {/* Translated Text Blocks */}
            {translatedMessages[msg.id] && (
                <div className="mt-3 mb-4 space-y-2 animate-in fade-in slide-in-from-top-1">
                    {[
                        { label: 'Hindi', text: translatedMessages[msg.id].hindi, lang: 'hi', color: 'text-amber-500' },
                        { label: 'Urdu', text: translatedMessages[msg.id].urdu, lang: 'ur', color: 'text-emerald-400', rtl: true },
                        { label: 'Telugu', text: translatedMessages[msg.id].telugu, lang: 'te', color: 'text-indigo-400' }
                    ].map((t) => (
                        <div key={t.label} className={`bg-black/40 p-3 rounded-lg border border-neutral-800`}>
                             <div className="flex justify-between items-center mb-1">
                                 <span className={`text-[10px] font-bold uppercase ${t.color}`}>{t.label}</span>
                                 {t.text !== "FAILED" && (
                                     <button 
                                        onClick={(e) => { e.stopPropagation(); playTTS(t.text, t.lang); }}
                                        className="p-1 hover:bg-white/10 rounded-full text-neutral-500 hover:text-white"
                                     >
                                         <Volume2 size={12} />
                                     </button>
                                 )}
                             </div>
                             {t.text === "FAILED" ? (
                                <p className="text-xs text-red-500 italic">Translation failed</p>
                             ) : (
                                <p className={`text-xs text-gray-300 ${t.rtl ? 'text-right' : ''}`} style={t.rtl ? { direction: 'rtl' } : {}}>
                                    {t.text}
                                </p>
                             )}
                        </div>
                    ))}
                </div>
            )}
          </div>

          {msg.media && (
            <div className="mb-4">
              {msg.media.type === 'photo' ? (
                <div className="rounded-lg overflow-hidden border border-neutral-800 bg-black">
                  <img 
                    src={msg.media.url} 
                    alt="Attachment" 
                    className="w-full h-auto object-cover max-h-[400px]"
                    loading="lazy"
                  />
                </div>
              ) : (
                <>
                <VideoPlayer 
                  src={msg.media.url} 
                  poster={msg.media.thumbnailUrl} 
                  onTranslateClick={() => handleVideoTranslate(msg.id, msg.media!.url)}
                />

                 {/* New Button below video */}
                <div className="flex justify-end mt-2">
                     <button
                       onClick={(e) => { e.stopPropagation(); handleVideoTranslate(msg.id, msg.media!.url); }}
                       disabled={translatingIds[`${msg.id}_video`]}
                       className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-amber-500 hover:text-amber-400 bg-amber-900/10 border border-amber-500/20 px-2.5 py-1.5 rounded-lg transition-colors"
                     >
                        {translatingIds[`${msg.id}_video`] ? (
                            <Loader2 size={10} className="animate-spin" />
                        ) : (
                            <Sparkles size={10} />
                        )}
                        {translatingIds[`${msg.id}_video`] ? 'Translating Video...' : 'Translate Video'}
                     </button>
                </div>

                {/* Video Translations */}
                {translatedMessages[`${msg.id}_video`] && (
                    <div className="mt-3 mb-4 space-y-2 animate-in fade-in slide-in-from-top-1 border-t border-neutral-800 pt-2">
                        <p className="text-[10px] text-neutral-500 uppercase font-bold mb-2">Video Transcription & Translation</p>
                         {[
                            { label: 'Original', text: translatedMessages[`${msg.id}_video`].original, lang: 'en', color: 'text-neutral-400' },
                            { label: 'Hindi', text: translatedMessages[`${msg.id}_video`].hindi, lang: 'hi', color: 'text-amber-500' },
                            { label: 'Urdu', text: translatedMessages[`${msg.id}_video`].urdu, lang: 'ur', color: 'text-emerald-400', rtl: true },
                            { label: 'Telugu', text: translatedMessages[`${msg.id}_video`].telugu, lang: 'te', color: 'text-indigo-400' }
                        ].map((t) => (
                             <div key={t.label} className={`bg-black/40 p-3 rounded-lg border border-neutral-800 mb-2`}>
                                 <div className="flex justify-between items-center mb-1">
                                     <span className={`text-[10px] font-bold uppercase ${t.color}`}>{t.label}</span>
                                     {t.text !== "FAILED" && (
                                         <button 
                                            onClick={(e) => { e.stopPropagation(); playTTS(t.text, t.lang); }}
                                            className="p-1 hover:bg-white/10 rounded-full text-neutral-500 hover:text-white"
                                         >
                                             <Volume2 size={12} />
                                         </button>
                                     )}
                                 </div>
                                 {t.text === "FAILED" ? (
                                    <p className="text-xs text-red-500 italic">Translation failed</p>
                                 ) : (
                                    <p className={`text-xs text-gray-300 ${t.rtl ? 'text-right' : ''}`} style={t.rtl ? { direction: 'rtl' } : {}}>
                                        {t.text}
                                    </p>
                                 )}
                            </div>
                        ))}
                    </div>
                )}
                </>
              )}
            </div>
          )}

          {/* Reactions Section */}
          <div className="flex flex-wrap items-center gap-2 mb-4">
             {/* Render existing reactions as chips */}
             {msg.reactions && msg.reactions.map((reaction, idx) => (
               <button
                 key={idx}
                 onClick={(e) => { e.stopPropagation(); handleReactionClick(msg.id, reaction.emoji); }}
                 className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-colors border ${
                   reaction.userReacted 
                    ? 'bg-amber-500/20 border-amber-500/50 text-amber-500' 
                    : 'bg-neutral-800 border-neutral-700 text-neutral-400 hover:bg-neutral-700'
                 }`}
               >
                 <span>{reaction.emoji}</span>
                 <span>{reaction.count}</span>
               </button>
             ))}

             {/* Add Reaction Button & Popup */}
             <div className="relative">
                <button
                  onClick={(e) => { e.stopPropagation(); toggleReactionPicker(msg.id); }}
                  className="flex items-center justify-center w-7 h-7 rounded-full bg-neutral-800 text-neutral-400 hover:bg-neutral-700 hover:text-white transition-colors border border-neutral-700"
                >
                    {activeReactionId === msg.id ? <Smile size={14} /> : <Plus size={14} />}
                </button>

                {/* Picker Popup */}
                {activeReactionId === msg.id && (
                    <div 
                        className="absolute bottom-full left-0 mb-2 p-2 bg-neutral-900 rounded-full shadow-xl border border-amber-500/30 flex gap-1 animate-in fade-in zoom-in duration-200 z-10"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {AVAILABLE_REACTIONS.map(emoji => (
                            <button
                                key={emoji}
                                onClick={() => handleReactionClick(msg.id, emoji)}
                                className="w-8 h-8 flex items-center justify-center text-lg hover:bg-white/10 rounded-full transition-transform hover:scale-110 active:scale-90"
                            >
                                {emoji}
                            </button>
                        ))}
                    </div>
                )}
             </div>
          </div>

          <div className="flex items-center justify-between text-neutral-500 text-[10px] uppercase tracking-wider border-t border-neutral-800 pt-3">
            <div className="flex items-center">
              <Eye size={12} className="mr-1.5" />
              {msg.views.toLocaleString()} views
            </div>
            
            <button 
              onClick={(e) => { e.stopPropagation(); handleShare(msg); }}
              className="flex items-center gap-1 hover:text-amber-500 transition-colors p-1"
            >
              <Share2 size={12} />
              <span>Share</span>
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default MessageList;