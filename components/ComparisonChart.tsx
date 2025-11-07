import React from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from 'recharts';
import type { TimeSeriesDataPoint } from '../types';
import { METRIC_COLORS, METRIC_UNITS } from '../constants';

interface ComparisonChartProps {
  data: TimeSeriesDataPoint[];
  metrics: string[];
}

export const ComparisonChart: React.FC<ComparisonChartProps> = ({ data, metrics }) => {
  const formatDate = (date: string) => {
    const d = new Date(date);
    return `${d.getMonth() + 1}/${d.getDate()}`;
  };
  
  const getUnit = (metricName: string) => {
    const baseMetric = metricName.replace(' (5년 평균)', '');
    return METRIC_UNITS[baseMetric] || '';
  };

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
        <XAxis 
          dataKey="date" 
          tickFormatter={formatDate}
          tick={{ fill: '#94a3b8', fontSize: 12 }} 
          axisLine={{ stroke: '#475569' }} 
          tickLine={{ stroke: '#475569' }}
        />
        <YAxis 
          tick={{ fill: '#94a3b8', fontSize: 12 }} 
          axisLine={{ stroke: '#475569' }} 
          tickLine={{ stroke: '#475569' }}
          yAxisId="left"
        />
        <Tooltip
          cursor={{ stroke: '#475569', strokeWidth: 1 }}
          contentStyle={{
            backgroundColor: 'rgba(30, 41, 59, 0.9)',
            borderColor: '#475569',
            borderRadius: '0.5rem',
            color: '#cbd5e1',
          }}
          labelStyle={{ color: '#f8fafc', fontWeight: 'bold' }}
          formatter={(value: number, name: string) => [`${value}${getUnit(name)}`, name]}
          labelFormatter={formatDate}
        />
        <Legend wrapperStyle={{fontSize: "12px", color: "#cbd5e1", paddingTop: "10px"}}/>
        {metrics.map(metric => (
          <React.Fragment key={metric}>
            <Line
              key={`${metric}-current`}
              type="monotone"
              dataKey={metric}
              stroke={METRIC_COLORS[metric] || '#8884d8'}
              strokeWidth={2}
              dot={{ r: 3, fill: METRIC_COLORS[metric] }}
              activeDot={{ r: 6 }}
              yAxisId="left"
              name={metric}
            />
            <Line
              key={`${metric}-avg`}
              type="monotone"
              dataKey={`${metric}_5yr_avg`}
              stroke={METRIC_COLORS[metric] || '#8884d8'}
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={false}
              activeDot={{ r: 6 }}
              yAxisId="left"
              name={`${metric} (5년 평균)`}
              strokeOpacity={0.7}
            />
          </React.Fragment>
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
};