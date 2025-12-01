import React, { useEffect, useState } from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import { ApiService } from '../services/api';
import { AnalyticsData } from '../types';
import { TrendingUp, Users } from 'lucide-react';

const Dashboard: React.FC = () => {
  const [viewsData, setViewsData] = useState<AnalyticsData[]>([]);
  const [subsData, setSubsData] = useState<AnalyticsData[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const [v, s] = await Promise.all([
        ApiService.fetchAnalytics('views'),
        ApiService.fetchAnalytics('subs')
      ]);
      setViewsData(v);
      setSubsData(s);
    };
    fetchData();
  }, []);

  // Calculate totals
  const totalViews = viewsData.reduce((acc, curr) => acc + curr.value, 0);
  const totalSubs = subsData.reduce((acc, curr) => acc + curr.value, 0);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-neutral-900 p-3 border border-amber-500/30 shadow-xl rounded-lg">
          <p className="text-xs font-bold text-neutral-400 mb-1 uppercase tracking-wider">{label}</p>
          <p className="text-sm font-bold text-amber-500">
            {payload[0].name}: {payload[0].value.toLocaleString()}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="pb-24 pt-4 px-4 space-y-6 bg-black min-h-screen">
      <h1 className="text-xl font-bold text-white mb-4 tracking-wide">ANALYTICS OVERVIEW</h1>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-neutral-900 p-5 rounded-xl border border-amber-500/20 relative overflow-hidden group hover:border-amber-500/40 transition-colors">
          <div className="absolute top-0 right-0 w-16 h-16 bg-amber-500/5 rounded-bl-full"></div>
          <div className="flex items-center gap-2 mb-2 text-amber-500">
            <TrendingUp size={18} />
            <span className="text-[10px] font-bold uppercase tracking-widest">Total Views</span>
          </div>
          <p className="text-2xl font-bold text-white group-hover:text-amber-400 transition-colors">{totalViews.toLocaleString()}</p>
        </div>
        <div className="bg-neutral-900 p-5 rounded-xl border border-neutral-800 relative overflow-hidden group hover:border-white/20 transition-colors">
          <div className="absolute top-0 right-0 w-16 h-16 bg-white/5 rounded-bl-full"></div>
          <div className="flex items-center gap-2 mb-2 text-neutral-400">
            <Users size={18} />
            <span className="text-[10px] font-bold uppercase tracking-widest">New Subs</span>
          </div>
          <p className="text-2xl font-bold text-white">{totalSubs.toLocaleString()}</p>
        </div>
      </div>
      
      <div className="bg-neutral-900 p-4 rounded-xl shadow-sm border border-neutral-800">
        <h2 className="text-xs font-bold text-neutral-500 mb-4 uppercase tracking-widest">Weekly Engagement</h2>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={viewsData}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.1} vertical={false} stroke="#fff" />
              <XAxis 
                dataKey="name" 
                fontSize={10} 
                stroke="#525252" 
                tickLine={false} 
                axisLine={false} 
                dy={10}
              />
              <YAxis 
                fontSize={10} 
                stroke="#525252" 
                tickLine={false} 
                axisLine={false} 
                tickFormatter={(value) => `${value}`} 
              />
              <Tooltip content={<CustomTooltip />} />
              <Line 
                type="monotone" 
                dataKey="value" 
                name="Views"
                stroke="#F59E0B" 
                strokeWidth={3} 
                dot={{ r: 4, fill: '#000', stroke: '#F59E0B', strokeWidth: 2 }} 
                activeDot={{ r: 6, fill: '#F59E0B' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-neutral-900 p-4 rounded-xl shadow-sm border border-neutral-800">
        <h2 className="text-xs font-bold text-neutral-500 mb-4 uppercase tracking-widest">Growth</h2>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={subsData}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.1} vertical={false} stroke="#fff" />
              <XAxis 
                dataKey="name" 
                fontSize={10} 
                stroke="#525252" 
                tickLine={false} 
                axisLine={false}
                dy={10}
              />
              <YAxis 
                fontSize={10} 
                stroke="#525252" 
                tickLine={false} 
                axisLine={false} 
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar 
                dataKey="value" 
                name="Subscribers"
                fill="#F59E0B" 
                radius={[4, 4, 0, 0]}
                fillOpacity={0.8}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;