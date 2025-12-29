/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React from 'react';
import { MergedProfile } from '../types';
import { CheckCircle2, AlertCircle, TrendingUp, User } from 'lucide-react';

interface DataCardProps {
  data: MergedProfile | null;
  loading: boolean;
}

export const DataCard: React.FC<DataCardProps> = ({ data, loading }) => {
  if (loading) {
    return (
      <div className="w-full bg-[#1E1E1E] rounded-3xl p-8 border border-[#444746] flex flex-col items-center justify-center min-h-[300px] gap-4">
        <div className="relative w-16 h-16">
           <div className="absolute inset-0 rounded-full border-4 border-[#444746]"></div>
           <div className="absolute inset-0 rounded-full border-4 border-[#8AB4F8] border-t-transparent animate-spin"></div>
        </div>
        <p className="text-[#8AB4F8] font-medium animate-pulse">Resolving Identity...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="w-full bg-[#1E1E1E] rounded-3xl p-8 border border-[#444746] border-dashed flex items-center justify-center min-h-[300px]">
        <div className="text-center">
            <User size={48} className="mx-auto text-[#444746] mb-3" />
            <span className="text-[#757775]">Waiting for transaction...</span>
        </div>
      </div>
    );
  }

  const getSentimentColor = (s: string) => {
    switch(s.toLowerCase()) {
        case 'positive': return 'bg-[#1b5e20] text-[#a8dab5] border-[#a8dab5]/30';
        case 'negative': return 'bg-[#5e1b1b] text-[#f2b8b5] border-[#f2b8b5]/30';
        default: return 'bg-[#444746] text-[#e3e3e3] border-[#8e918f]/30';
    }
  };

  const isUpdated = (field: string) => data.updates_applied.includes(field);

  return (
    <div className="w-full bg-[#1E1E1E] rounded-3xl overflow-hidden border border-[#444746] shadow-xl transition-all duration-500">
      
      {/* Header Badge */}
      <div className="bg-[#004A77] px-6 py-3 flex justify-between items-center border-b border-[#00639B]">
        <div className="flex items-center gap-2">
            <CheckCircle2 size={18} className="text-[#78D9EC]" />
            <span className="text-[#D3E3FD] font-medium tracking-wide text-sm">GOLDEN RECORD GENERATED</span>
        </div>
        <span className="text-[#78D9EC] font-mono text-xs opacity-80">CONFIDENCE: {(data.confidence_score * 100).toFixed(0)}%</span>
      </div>

      <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Left Column: Core Identity */}
        <div className="space-y-6">
            <div>
                <label className="text-[11px] uppercase tracking-widest text-[#C4C7C5] mb-1 block">Customer Name</label>
                <div className={`text-xl font-medium text-[#E3E3E3] ${isUpdated('name') ? 'text-[#a8dab5]' : ''}`}>
                    {data.name}
                </div>
            </div>

            <div>
                <label className="text-[11px] uppercase tracking-widest text-[#C4C7C5] mb-1 block">Email Address</label>
                <div className={`p-3 rounded-lg bg-[#121212] font-mono text-sm border flex flex-wrap items-center gap-2 ${isUpdated('email') ? 'border-[#a8dab5] text-[#a8dab5] bg-[#a8dab5]/5' : 'border-transparent text-[#E3E3E3]'}`}>
                    <span className="break-all">{data.email}</span>
                    {isUpdated('email') && <span className="text-[10px] bg-[#a8dab5] text-[#003816] px-1.5 py-0.5 rounded uppercase font-bold shrink-0">Updated</span>}
                </div>
            </div>

            <div>
                <label className="text-[11px] uppercase tracking-widest text-[#C4C7C5] mb-1 block">Phone Number</label>
                <div className={`p-3 rounded-lg bg-[#121212] font-mono text-sm border flex flex-wrap items-center gap-2 ${isUpdated('phone') ? 'border-[#a8dab5] text-[#a8dab5] bg-[#a8dab5]/5' : 'border-transparent text-[#E3E3E3]'}`}>
                    <span>{data.phone || 'N/A'}</span>
                    {isUpdated('phone') && <span className="text-[10px] bg-[#a8dab5] text-[#003816] px-1.5 py-0.5 rounded uppercase font-bold shrink-0">New</span>}
                </div>
            </div>
        </div>

        {/* Right Column: Dynamic Insights */}
        <div className="space-y-6">
             <div className="flex justify-between items-start">
                 <div>
                    <label className="text-[11px] uppercase tracking-widest text-[#C4C7C5] mb-1 block">Current Tier</label>
                    <div className="flex items-center gap-2">
                        <span className={`text-lg text-[#E3E3E3] ${isUpdated('current_tier') ? 'text-[#a8dab5]' : ''}`}>{data.current_tier}</span>
                        {isUpdated('current_tier') && <TrendingUp size={16} className="text-[#a8dab5]" />}
                    </div>
                 </div>
                 <div className="text-right">
                    <label className="text-[11px] uppercase tracking-widest text-[#C4C7C5] mb-1 block">ID</label>
                    <span className="font-mono text-xs text-[#757775]">{data.customer_id}</span>
                 </div>
             </div>

             <div>
                <label className="text-[11px] uppercase tracking-widest text-[#C4C7C5] mb-2 block">Real-time Insights</label>
                <div className="flex flex-wrap gap-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getSentimentColor(data.latest_sentiment)}`}>
                        Sentiment: {data.latest_sentiment}
                    </span>
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-[#1E1E1E] text-[#D3E3FD] border border-[#00639B]">
                        Intent: {data.identified_intent}
                    </span>
                </div>
             </div>

             {data.updates_applied.length > 0 ? (
                 <div className="bg-[#1b5e20]/20 p-3 rounded-xl border border-[#1b5e20] flex gap-3 items-center">
                     <div className="bg-[#1b5e20] p-1.5 rounded-full">
                         <TrendingUp size={14} className="text-[#a8dab5]"/>
                     </div>
                     <div>
                         <span className="text-[#a8dab5] text-xs font-bold block">SYSTEM ACTION</span>
                         <span className="text-[#c4eed0] text-xs">Automatically patched {data.updates_applied.join(', ')}.</span>
                     </div>
                 </div>
             ) : (
                 <div className="bg-[#444746]/20 p-3 rounded-xl border border-[#444746] flex gap-3 items-center opacity-70">
                     <div className="bg-[#444746] p-1.5 rounded-full">
                         <CheckCircle2 size={14} className="text-[#E3E3E3]"/>
                     </div>
                     <div>
                         <span className="text-[#E3E3E3] text-xs font-bold block">NO CHANGES</span>
                         <span className="text-[#C4C7C5] text-xs">Record matches transcript.</span>
                     </div>
                 </div>
             )}
        </div>

      </div>
    </div>
  );
};