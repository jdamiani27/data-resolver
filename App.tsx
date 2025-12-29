/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useEffect, useRef } from 'react';
import { generateInputData } from './constants';
import { InputData, ProcessedResult } from './types';
import { mergeDataWithFlash } from './services/geminiService';
import { DataCard } from './components/DataCard';
import { LogTerminal } from './components/LogTerminal';
import { Zap, Play, RotateCw, Database, MessageSquare, ArrowRight, Layers, FileJson, Terminal } from 'lucide-react';

const App: React.FC = () => {
  const [queue, setQueue] = useState<InputData[]>([]);
  // We now store a history of results to create the "feed" effect
  const [resolutionHistory, setResolutionHistory] = useState<ProcessedResult[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Processing Stats
  const [processedCount, setProcessedCount] = useState(0);
  const [avgLatency, setAvgLatency] = useState(0);

  const queueRef = useRef<InputData[]>([]);

  // Auto-scroll logic for main window
  const isAtBottomRef = useRef(true);

  useEffect(() => {
    const handleScroll = () => {
      const { scrollY, innerHeight } = window;
      const { scrollHeight } = document.documentElement;
      // Check if user is near bottom (within 150px)
      const isAtBottom = scrollHeight - (scrollY + innerHeight) < 150;
      isAtBottomRef.current = isAtBottom;
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Scroll to bottom when history updates, if user was at bottom
  useEffect(() => {
    if (isAtBottomRef.current) {
      // Delay scrolling slightly so user sees the new item enter, then the scroll catches up.
      // This prevents the "jarring" instant jump when clicking start.
      const timeoutId = setTimeout(() => {
        window.scrollTo({
            top: document.documentElement.scrollHeight,
            behavior: 'smooth'
        });
      }, 200);
      
      return () => clearTimeout(timeoutId);
    }
  }, [resolutionHistory]);

  // Initialize with some data
  useEffect(() => {
    const initialData = generateInputData(5);
    setQueue(initialData);
    queueRef.current = initialData;
  }, []);

  const addToQueue = () => {
    const newData = generateInputData(5);
    setQueue(prev => [...prev, ...newData]);
    queueRef.current = [...queueRef.current, ...newData];
  };

  const processQueue = async () => {
    if (isProcessing || queueRef.current.length === 0) return;
    setIsProcessing(true);

    const processItem = async () => {
      if (queueRef.current.length === 0) {
        setIsProcessing(false);
        return;
      }

      // Pop one item
      const item = queueRef.current.shift();
      setQueue([...queueRef.current]);

      if (!item) return;

      // Create a temporary "processing" result
      const tempResult: ProcessedResult = {
          id: item.id,
          input: item,
          output: null,
          logs: ["Analyzing input sources..."],
          durationMs: 0,
          status: 'processing',
      };

      // Append to history (Add to bottom)
      setResolutionHistory(prev => [...prev, tempResult]);

      const start = performance.now();
      
      // Call Gemini Flash
      const result = await mergeDataWithFlash(item);
      const duration = performance.now() - start;

      // Update the specific item in history with the result
      setResolutionHistory(prev => prev.map(r => {
        if (r.id === item.id) {
          return {
            ...r,
            output: result.json,
            logs: result.logs,
            durationMs: duration,
            status: 'completed'
          };
        }
        return r;
      }));

      setProcessedCount(prev => prev + 1);
      setAvgLatency(prev => (prev * processedCount + duration) / (processedCount + 1));

      // Delay before next item for readability
      if (queueRef.current.length > 0) {
        setTimeout(processItem, 2500); 
      } else {
        setIsProcessing(false);
      }
    };

    processItem();
  };

  // Helper to get the latest result for stats/logs
  const latestResult = resolutionHistory.length > 0 ? resolutionHistory[resolutionHistory.length - 1] : null;

  return (
    <div className="min-h-screen bg-[#121212] text-[#E3E3E3] p-6 font-sans">
      
      {/* Top App Bar */}
      <header className="max-w-[1600px] mx-auto mb-8 flex flex-col md:flex-row justify-between items-center pb-6 border-b border-[#444746]">
        <div className="flex items-center gap-4">
          <div className="bg-[#1E1E1E] p-3 rounded-2xl shadow-lg border border-[#444746]">
            <Layers className="text-[#8AB4F8]" size={28} />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-normal text-[#E3E3E3] tracking-tight">
              Customer Data Resolver
            </h1>
            <p className="text-[#C4C7C5] text-sm mt-1 max-w-3xl">
            Extract, transform, load (ETL) is usually a tedious, multi-step process for merging messy data. <span className="text-[#78D9EC] font-medium">Gemini 3 Flash</span> can quickly resolve mismatched and messy data sources, turning manual data merging into a real-time conveyor belt of clean data.
            </p>
          </div>
        </div>
        
        <div className="flex gap-4 mt-6 md:mt-0">
          <button 
            onClick={addToQueue}
            className="flex items-center gap-2 px-6 py-3 rounded-full border border-[#8AB4F8] text-[#8AB4F8] hover:bg-[#8AB4F8]/10 transition-colors text-sm font-medium tracking-wide uppercase"
          >
            <RotateCw size={18} />
            Generate More Data
          </button>
          <button 
            onClick={processQueue}
            disabled={isProcessing || queue.length === 0}
            className={`flex items-center gap-2 px-8 py-3 rounded-full text-sm font-medium tracking-wide uppercase transition-all shadow-md ${
              isProcessing || queue.length === 0
                ? 'bg-[#1E1E1E] text-[#757775] cursor-not-allowed shadow-none' 
                : 'bg-[#8AB4F8] text-[#001D35] hover:bg-[#A8C7FA] shadow-lg shadow-[#8AB4F8]/20'
            }`}
          >
            <Play size={18} fill="currentColor" />
            {isProcessing ? 'Resolving Stream...' : 'Start Resolution'}
          </button>
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Col: Queue & Logs (Sticky) */}
        <section className="lg:col-span-3 flex flex-col gap-6 lg:sticky lg:top-6 lg:h-[calc(100vh-3rem)]">
           
           {/* Queue Container */}
           <div className="flex flex-col gap-4 flex-1 min-h-0">
               <div className="flex justify-between items-center px-2">
                    <h2 className="text-lg font-medium text-[#E3E3E3] flex items-center gap-2">
                        <Database size={18} className="text-[#C4C7C5]"/> 
                        Pending Transactions
                    </h2>
                    <span className="bg-[#1E1E1E] border border-[#444746] text-[#E3E3E3] text-xs font-bold px-3 py-1 rounded-full">{queue.length}</span>
               </div>
               
               <div className="bg-[#1E1E1E] rounded-[24px] p-2 flex-1 shadow-sm border border-[#444746] overflow-hidden flex flex-col min-h-[200px]">
                 <div className="flex-1 overflow-y-auto space-y-2 p-2 custom-scrollbar">
                   {queue.length === 0 && (
                     <div className="flex flex-col items-center justify-center h-full text-[#757775]">
                        <Database size={32} className="opacity-20 mb-3" />
                        <span className="italic text-sm">No pending data</span>
                     </div>
                   )}
                   {queue.map((item, idx) => (
                     <div key={item.id} className="bg-[#2B2B2B] p-4 rounded-xl border border-transparent hover:border-[#8AB4F8]/30 transition-all group relative overflow-hidden">
                       <div className="flex justify-between items-center mb-2">
                         <span className="text-[#8AB4F8] text-[10px] font-mono tracking-wider">ID: {item.id}</span>
                         <span className="text-[#757775] text-[10px]">{new Date(item.timestamp).toLocaleTimeString()}</span>
                       </div>
                       <div className="text-xs text-[#E3E3E3] font-medium mb-1 truncate">{item.customerRecord.name}</div>
                       <div className="text-[10px] text-[#C4C7C5] bg-[#121212] p-2 rounded border border-[#444746]/50 line-clamp-2 italic">
                         "{item.chatTranscript.replace('User: ', '')}"
                       </div>
                     </div>
                   ))}
                 </div>
               </div>
           </div>

           {/* Log Terminal Container */}
           <div className="h-[300px] shrink-0 flex flex-col gap-2">
               <h2 className="text-sm font-medium text-[#C4C7C5] px-2 flex items-center gap-2">
                  <Terminal size={14}/> Live Output Log
               </h2>
               <div className="flex-1 bg-[#1E1E1E] rounded-2xl border border-[#444746] overflow-hidden shadow-lg">
                  {/* Always show logs from the most recent (last) item in history */}
                  <LogTerminal 
                    logs={latestResult ? latestResult.logs : []} 
                    type="flash" 
                  />
               </div>
           </div>

        </section>

        {/* Right Col: Active Processing Stage */}
        <section className="lg:col-span-9 flex flex-col gap-6">
          
          {/* Active Work Surface */}
          <div className="bg-[#121212] rounded-[32px] border border-[#444746] p-1 shadow-2xl relative flex flex-col min-h-[800px]">
             
             {/* Background Grid Pattern */}
             <div className="absolute inset-0 opacity-10 pointer-events-none" 
                  style={{ backgroundImage: 'radial-gradient(#444746 1px, transparent 1px)', backgroundSize: '24px 24px' }}>
             </div>

             {/* Header */}
             <div className="sticky top-0 z-30 p-6 flex justify-between items-center bg-[#1E1E1E]/90 backdrop-blur-md rounded-t-[28px] border-b border-[#444746]">
                <div className="flex items-center gap-3">
                   <div className="w-10 h-10 rounded-full bg-[#004A77] flex items-center justify-center">
                      <Zap className="fill-[#78D9EC] text-[#78D9EC]" size={20} />
                   </div>
                   <div>
                       <h2 className="text-lg font-medium text-[#E3E3E3]">Merging Messy Data</h2>
                       <p className="text-xs text-[#C4C7C5]">Gemini 3 Flash can quickly resolve mismatched and messy data sources, turning manual data merging into a real-time conveyor belt of clean data.</p>
                   </div>
                </div>
                <div className="flex gap-6">
                    <div className="text-right">
                        <div className="text-[10px] uppercase tracking-wider text-[#C4C7C5] mb-1">Last Latency</div>
                        <div className="font-mono text-lg text-[#E3E3E3]">
                            {latestResult && latestResult.durationMs > 0 
                                ? `${latestResult.durationMs.toFixed(0)}ms` 
                                : '--'}
                        </div>
                    </div>
                    <div className="text-right border-l border-[#444746] pl-6">
                        <div className="text-[10px] uppercase tracking-wider text-[#C4C7C5] mb-1">Total Processed</div>
                        <div className="font-mono text-lg text-[#E3E3E3]">{processedCount}</div>
                    </div>
                </div>
             </div>

             {/* Feed Container */}
             <div className="relative z-10 p-6 pb-20">
                
                {resolutionHistory.length === 0 ? (
                    <div className="flex flex-col items-center justify-center min-h-[600px] opacity-30">
                        <Layers size={80} className="mb-4 text-[#8AB4F8]" />
                        <p className="text-xl">System Idle</p>
                        <p className="text-sm mt-2">Click "Start Resolution" to begin</p>
                    </div>
                ) : (
                    <div className="space-y-12">
                        {resolutionHistory.map((result, index) => {
                          // The last item is the most recent (active) one
                          const isLatest = index === resolutionHistory.length - 1;
                          return (
                            <div 
                                key={result.id} 
                                className={`transition-all duration-700 ease-in-out ${
                                    isLatest ? 'opacity-100 scale-100' : 'opacity-60 scale-100'
                                }`}
                            >
                                <div className="grid grid-cols-1 xl:grid-cols-11 gap-6 items-center">
                                    
                                    {/* Left Side: Inputs */}
                                    <div className="xl:col-span-5 flex flex-col gap-4">
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-[#8AB4F8] text-[10px] font-bold uppercase tracking-wider">Inputs Received</span>
                                            <span className="text-[#444746] text-[10px] font-mono">{result.id}</span>
                                        </div>
                                        
                                        {/* Input 1: Chat */}
                                        <div className="bg-[#1E1E1E] p-4 rounded-tl-2xl rounded-tr-2xl rounded-br-2xl border border-[#444746] relative shadow-lg">
                                            <div className="flex items-start gap-3">
                                                <div className="bg-[#004A77] p-2 rounded-full shrink-0">
                                                    <MessageSquare size={16} className="text-[#D3E3FD]" />
                                                </div>
                                                <div>
                                                    <div className="text-[10px] text-[#C4C7C5] uppercase tracking-wider font-bold mb-1">Unstructured Chat</div>
                                                    <p className="text-sm text-[#E3E3E3] leading-relaxed">
                                                        "{result.input.chatTranscript.replace('User: ', '')}"
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Input 2: Old DB Record */}
                                        <div className="bg-[#1E1E1E] p-4 rounded-2xl border border-[#444746] relative opacity-80">
                                             <div className="flex items-start gap-3">
                                                <div className="bg-[#444746] p-2 rounded-full shrink-0">
                                                    <FileJson size={16} className="text-[#E3E3E3]" />
                                                </div>
                                                <div className="w-full">
                                                    <div className="text-[10px] text-[#C4C7C5] uppercase tracking-wider font-bold mb-1">Existing Customer Record</div>
                                                    <div className="bg-[#121212] p-3 rounded-lg border border-[#444746]/50 font-mono text-[10px] text-[#C4C7C5] overflow-hidden">
                                                        <pre className="whitespace-pre-wrap">{JSON.stringify(result.input.customerRecord, null, 2)}</pre>
                                                    </div>
                                                </div>
                                             </div>
                                        </div>
                                    </div>

                                    {/* Center: Arrow */}
                                    <div className="xl:col-span-1 flex justify-center py-4 xl:py-0">
                                        <div className={`bg-[#2B2B2B] rounded-full p-2 border border-[#444746] ${result.status === 'processing' ? 'animate-pulse' : ''}`}>
                                            <ArrowRight className={`text-[#C4C7C5] ${result.status === 'processing' ? 'text-[#78D9EC]' : ''} xl:rotate-0 rotate-90`} />
                                        </div>
                                    </div>

                                    {/* Right Side: Output */}
                                    <div className="xl:col-span-5">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-[#78D9EC] text-[10px] font-bold uppercase tracking-wider">Gemini Flash Output</span>
                                            {result.status === 'processing' && <span className="text-[#78D9EC] text-[10px] animate-pulse">Thinking...</span>}
                                        </div>
                                        <DataCard 
                                            data={result.output} 
                                            loading={result.status === 'processing'} 
                                        />
                                    </div>

                                </div>
                                {/* Divider for history visual */}
                                <div className="mt-12 border-b border-[#444746]/50 w-full"></div>
                            </div>
                          );
                        })}
                    </div>
                )}
             </div>

          </div>
        </section>

      </main>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: #444746;
          border-radius: 20px;
        }
      `}</style>
    </div>
  );
};

export default App;