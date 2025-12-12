import React, { useState, useEffect } from 'react';
import axiosClient from '../../api/axiosClient';
import {
  LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar, Legend
} from 'recharts';

const StatisticsPage = () => {
  // State for Environment Chart
  const [envRange, setEnvRange] = useState('7d');
  const [envData, setEnvData] = useState([]);

  // State for Activity Chart
  const [activityData, setActivityData] = useState([]);

  // State for Top Users
  const [topUsersRange, setTopUsersRange] = useState('weekly');
  const [topUsers, setTopUsers] = useState([]);

  // Fetch Environmental Data
  useEffect(() => {
    const fetchEnvData = async () => {
      try {
        const res = await axiosClient.get(`/data/stats/environment/?range=${envRange}`);
        // Format if necessary, but API returns { label: '...', temperature: x, humidity: y }
        setEnvData(res.data);
      } catch (err) {
        console.error("Failed to fetch environment stats", err);
      }
    };
    fetchEnvData();
  }, [envRange]);

  // Fetch Activity Data (Weekly)
  useEffect(() => {
    const fetchActivityData = async () => {
      try {
        const res = await axiosClient.get('/data/stats/activity/');
        setActivityData(res.data);
      } catch (err) {
        console.error("Failed to fetch activity stats", err);
      }
    };
    fetchActivityData();
  }, []);

  // Fetch Top Users
  useEffect(() => {
    const fetchTopUsers = async () => {
      try {
        const res = await axiosClient.get(`/data/stats/top-users/?range=${topUsersRange}`);
        setTopUsers(res.data);
      } catch (err) {
        console.error("Failed to fetch top users", err);
      }
    };
    fetchTopUsers();
  }, [topUsersRange]);


  return (
    <div className="flex-1 p-4 md:p-6 overflow-y-auto h-full animate-[fadeIn_0.3s_ease-out] custom-scroll">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-6">

        {/* --- 1. TEMPERATURE & HUMIDITY CHART --- */}
        <div className="bg-white p-6 rounded-[30px] shadow-sm border border-gray-100 lg:col-span-2">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-xl font-bold text-slate-800">Environmental Trends</h2>
              <p className="text-sm text-slate-400">Temperature & Humidity Analysis</p>
            </div>
            <div className="flex bg-gray-50 p-1 rounded-xl">
              {['1d', '7d', '14d', '30d'].map(r => (
                <button
                  key={r}
                  onClick={() => setEnvRange(r)}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${envRange === r
                      ? 'bg-white text-brand-green shadow-sm'
                      : 'text-slate-400 hover:text-slate-600'
                    }`}
                >
                  {r === '1d' ? '24H' : r === '14d' ? '2 Weeks' : r === '30d' ? '1 Month' : '1 Week'}
                </button>
              ))}
            </div>
          </div>

          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={envData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorTemp" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.1} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorHum" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                <RechartsTooltip
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                />
                <Legend iconType="circle" />
                <Area
                  type="monotone"
                  dataKey="temperature"
                  name="Temperature (°C)"
                  stroke="#ef4444"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorTemp)"
                />
                <Area
                  type="monotone"
                  dataKey="humidity"
                  name="Humidity (%)"
                  stroke="#3b82f6"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorHum)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* --- 2. WEEKLY ACTIVITY CHART --- */}
        <div className="bg-white p-6 rounded-[30px] shadow-sm border border-gray-100">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-slate-800">Weekly Activity</h2>
            <p className="text-sm text-slate-400">User Visits per Day</p>
          </div>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={activityData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} tickFormatter={(val) => val.slice(5)} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                <RechartsTooltip
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="visits" name="Visits" fill="#10b981" radius={[4, 4, 0, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* --- 3. TOP USERS --- */}
        <div className="bg-white p-6 rounded-[30px] shadow-sm border border-gray-100 flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-slate-800">Top Users</h2>
              <p className="text-sm text-slate-400">Most Frequent Visitors</p>
            </div>
            <div className="flex bg-gray-50 p-1 rounded-lg">
              <button
                onClick={() => setTopUsersRange('weekly')}
                className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${topUsersRange === 'weekly' ? 'bg-white text-brand-green shadow-sm' : 'text-slate-400'}`}
              >
                Weekly
              </button>
              <button
                onClick={() => setTopUsersRange('monthly')}
                className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${topUsersRange === 'monthly' ? 'bg-white text-brand-green shadow-sm' : 'text-slate-400'}`}
              >
                Monthly
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto custom-scroll pr-2">
            {topUsers.length > 0 ? (
              <div className="flex flex-col gap-3">
                {topUsers.map((user, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-gray-50 hover:bg-emerald-50/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${idx === 0 ? 'bg-yellow-100 text-yellow-600' :
                          idx === 1 ? 'bg-gray-200 text-gray-600' :
                            idx === 2 ? 'bg-orange-100 text-orange-600' :
                              'bg-brand-green/10 text-brand-green'
                        }`}>
                        {idx + 1}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-slate-700">{user.username}</span>
                        <span className="text-[10px] text-slate-400">{user.full_name}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="block text-sm font-bold text-brand-green">{user.visits}</span>
                      <span className="text-[10px] text-slate-400">Visits</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 italic text-sm">
                No activity recorded.
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default StatisticsPage;