'use client';
import React, { useEffect, useRef } from 'react';
import * as echarts from 'echarts';

export default function ChartView({ kind, data }: { kind: 'line'|'bar'; data: { x: any[]; y: number[] }}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!ref.current) return;
    const chart = echarts.init(ref.current);
    chart.setOption({
      tooltip: { trigger: 'axis' },
      xAxis: { type: 'category', data: data.x },
      yAxis: { type: 'value' },
      series: [{ type: kind, data: data.y }]
    });
    const onResize = () => chart.resize();
    window.addEventListener('resize', onResize);
    return () => { window.removeEventListener('resize', onResize); chart.dispose(); };
  }, [kind, data]);
  return <div ref={ref} style={{width:'100%', height: '360px'}} />;
}
