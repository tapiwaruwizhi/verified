import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

export default function WPMGraph({ events, sessionDuration }) {
  // Calculate WPM over time from events
  const calculateWPMData = () => {
    const bucketSize = 30000; // 30-second intervals
    const bucketCount = Math.ceil(sessionDuration / bucketSize);
    const buckets = Array.from({ length: bucketCount }, (_, i) => ({
      time: (i * bucketSize) / 1000 / 60, // Convert to minutes
      keystrokes: 0,
      wpm: 0
    }));

    // Count keystrokes in each bucket
    events.forEach(event => {
      if (event.event_type === 'insert' && event.payload?.text?.length === 1) {
        const bucketIndex = Math.floor(event.timestamp / bucketSize);
        if (buckets[bucketIndex]) {
          buckets[bucketIndex].keystrokes++;
        }
      }
    });

    // Convert keystrokes to WPM (average word = 5 characters)
    buckets.forEach(bucket => {
      bucket.wpm = Math.round((bucket.keystrokes / 5) * 2); // 30 seconds * 2 = 1 minute
    });

    return buckets;
  };

  const data = calculateWPMData();
  const averageWPM = data.reduce((sum, d) => sum + d.wpm, 0) / data.length;

  // Bot detection: check variance
  const variance = data.reduce((sum, d) => sum + Math.pow(d.wpm - averageWPM, 2), 0) / data.length;
  const stdDev = Math.sqrt(variance);
  const isSuspicious = stdDev < 5 && averageWPM > 20; // Unnaturally consistent

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-700">Typing Speed Over Time</h3>
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-500">Avg WPM:</span>
            <span className="font-bold text-slate-900">{Math.round(averageWPM)}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-500">Variance:</span>
            <span className={`font-bold ${isSuspicious ? 'text-rose-600' : 'text-emerald-600'}`}>
              {stdDev.toFixed(1)}
            </span>
          </div>
        </div>
      </div>

      {isSuspicious && (
        <div className="bg-rose-50 border border-rose-200 rounded-lg p-3 text-sm text-rose-700">
          ⚠️ Suspiciously consistent typing pattern detected. May indicate automated input.
        </div>
      )}

      <ResponsiveContainer width="100%" height={250}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis 
            dataKey="time" 
            label={{ value: 'Time (minutes)', position: 'insideBottom', offset: -5 }}
            stroke="#64748b"
          />
          <YAxis 
            label={{ value: 'WPM', angle: -90, position: 'insideLeft' }}
            stroke="#64748b"
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: '#fff', 
              border: '1px solid #e2e8f0',
              borderRadius: '8px'
            }}
            formatter={(value) => [`${value} WPM`, 'Speed']}
            labelFormatter={(label) => `${label.toFixed(1)} min`}
          />
          <ReferenceLine 
            y={averageWPM} 
            stroke="#64748b" 
            strokeDasharray="3 3"
            label={{ value: 'Average', position: 'right', fill: '#64748b' }}
          />
          <Line 
            type="monotone" 
            dataKey="wpm" 
            stroke="#3b82f6" 
            strokeWidth={2}
            dot={{ fill: '#3b82f6', r: 3 }}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>

      <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs text-slate-600">
        <strong>Pattern Analysis:</strong> Human typing naturally varies (spiky graph). 
        Bot/AI typing shows unnaturally flat patterns. Standard deviation below 5 WPM is suspicious.
      </div>
    </div>
  );
}