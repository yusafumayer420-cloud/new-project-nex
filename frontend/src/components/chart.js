import React, { useEffect, useRef } from 'react';
import { createChart } from 'lightweight-charts';

const TradingChart = ({ data }) => {
  const chartContainerRef = useRef();
  const chartRef = useRef();

  useEffect(() => {
    // Initialize chart
    chartRef.current = createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth,
      height: 300,
      layout: {
        backgroundColor: '#131A2E',
        textColor: 'rgba(255, 255, 255, 0.9)',
      },
      grid: {
        vertLines: {
          color: 'rgba(255, 255, 255, 0.1)',
        },
        horzLines: {
          color: 'rgba(255, 255, 255, 0.1)',
        },
      },
      timeScale: {
        timeVisible: true,
        secondsVisible: false,
        borderColor: 'rgba(255, 255, 255, 0.1)',
      },
      rightPriceScale: {
        borderColor: 'rgba(255, 255, 255, 0.1)',
      },
    });

    // Add candlestick series
    const candlestickSeries = chartRef.current.addCandlestickSeries({
      upColor: '#00D395',
      downColor: '#FF6B6B',
      borderVisible: false,
      wickUpColor: '#00D395',
      wickDownColor: '#FF6B6B',
    });

    // Sample data
    const generateSampleData = () => {
      const basePrice = 70000;
      const data = [];
      let time = new Date();
      
      for (let i = 0; i < 100; i++) {
        time = new Date(time.getTime() + 60 * 60 * 1000); // Add 1 hour
        const open = basePrice + (Math.random() - 0.5) * 1000;
        const close = open + (Math.random() - 0.5) * 500;
        const high = Math.max(open, close) + Math.random() * 200;
        const low = Math.min(open, close) - Math.random() * 200;
        
        data.push({
          time: time.getTime() / 1000,
          open,
          high,
          low,
          close,
        });
      }
      
      return data;
    };

    candlestickSeries.setData(generateSampleData());

    // Handle resize
    const handleResize = () => {
      chartRef.current.applyOptions({ 
        width: chartContainerRef.current.clientWidth 
      });
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chartRef.current.remove();
    };
  }, []);

  // Update chart with new data
  useEffect(() => {
    if (data && chartRef.current) {
      // Update logic here
    }
  }, [data]);

  return (
    <div 
      ref={chartContainerRef} 
      style={{ 
        width: '100%', 
        height: 300,
        borderRadius: 12,
        overflow: 'hidden'
      }} 
    />
  );
};

export default TradingChart;