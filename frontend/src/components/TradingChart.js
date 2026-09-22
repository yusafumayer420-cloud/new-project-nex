import React, {
  useEffect,
  useRef,
  useState,
  useCallback,
} from 'react';
import { createChart, ColorType, CrosshairMode, CandlestickSeries, HistogramSeries, LineSeries } from 'lightweight-charts';
import { Box, Typography, Chip, IconButton, Tooltip, CircularProgress } from '@mui/material';
import { ShowChart, CandlestickChart, Fullscreen, FullscreenExit } from '@mui/icons-material';
import axios from '../utils/axiosConfig';

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────
const PAIRS = [
  { label: 'BTC/USDT',  symbol: 'BTCUSDT',  wsSymbol: 'BTC/USDT',  precision: 2 },
  { label: 'ETH/USDT',  symbol: 'ETHUSDT',  wsSymbol: 'ETH/USDT',  precision: 2 },
  { label: 'BNB/USDT',  symbol: 'BNBUSDT',  wsSymbol: 'BNB/USDT',  precision: 3 },
  { label: 'SOL/USDT',  symbol: 'SOLUSDT',  wsSymbol: 'SOL/USDT',  precision: 3 },
  { label: 'XRP/USDT',  symbol: 'XRPUSDT',  wsSymbol: 'XRP/USDT',  precision: 4 },
];

const TIMEFRAMES = [
  { label: '1m',  interval: '1m',  seconds: 60        },
  { label: '5m',  interval: '5m',  seconds: 300       },
  { label: '15m', interval: '15m', seconds: 900       },
  { label: '1h',  interval: '1h',  seconds: 3600      },
  { label: '4h',  interval: '4h',  seconds: 14400     },
  { label: '1D',  interval: '1d',  seconds: 86400     },
];

// ─────────────────────────────────────────────────────────────────────────────
// Dark chart theme
// ─────────────────────────────────────────────────────────────────────────────
const CHART_THEME = {
  layout: {
    background: { type: ColorType.Solid, color: '#0d1117' },
    textColor: '#8b949e',
    fontSize: 12,
    fontFamily: "'Inter', 'Roboto', sans-serif",
  },
  grid: {
    vertLines: { color: 'rgba(255,255,255,0.04)' },
    horzLines: { color: 'rgba(255,255,255,0.04)' },
  },
  crosshair: {
    mode: CrosshairMode.Normal,
    vertLine: {
      color: 'rgba(59, 130, 246, 0.4)',
      width: 1,
      style: 1,
      labelBackgroundColor: '#1a2332',
    },
    horzLine: {
      color: 'rgba(59, 130, 246, 0.4)',
      width: 1,
      style: 1,
      labelBackgroundColor: '#1a2332',
    },
  },
  rightPriceScale: {
    borderColor: 'rgba(255,255,255,0.08)',
    textColor: '#8b949e',
    scaleMargins: { top: 0.1, bottom: 0.3 },
  },
  timeScale: {
    borderColor: 'rgba(255,255,255,0.08)',
    textColor: '#8b949e',
    timeVisible: true,
    secondsVisible: false,
    fixLeftEdge: false,
    fixRightEdge: false,
  },
};

const CANDLE_UP_COLOR   = '#3B82F6';
const CANDLE_DOWN_COLOR = '#FF3366';
const VOLUME_UP_COLOR   = 'rgba(59, 130, 246, 0.35)';
const VOLUME_DOWN_COLOR = 'rgba(255, 51, 102, 0.35)';

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────
const fmt = (n, dec = 2) =>
  n != null ? Number(n).toLocaleString('en-US', { minimumFractionDigits: dec, maximumFractionDigits: dec }) : '—';

const fmtVolume = (n) => {
  if (n == null) return '—';
  if (n >= 1e9) return `${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(2)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(2)}K`;
  return `${n.toFixed(2)}`;
};

const candleKey = (unixSec, intervalSec) =>
  Math.floor(unixSec / intervalSec) * intervalSec;

// ─────────────────────────────────────────────────────────────────────────────
// TradingChart component
// ─────────────────────────────────────────────────────────────────────────────
const TradingChart = ({ socket, defaultPair }) => {
  const containerRef  = useRef(null);
  const chartRef      = useRef(null);
  const candleSeriesRef = useRef(null);
  const volumeSeriesRef = useRef(null);
  const candlesRef    = useRef([]);  // current candle array (mutable)
  const resizeObsRef  = useRef(null);

  // State
  const [activePair, setActivePair]       = useState(() => {
    const p = PAIRS.find(p => p.label === defaultPair);
    return p || PAIRS[0];
  });
  const [activeTimeframe, setActiveTimeframe] = useState(TIMEFRAMES[0]);
  const [chartType, setChartType]         = useState('candlestick'); // 'candlestick' | 'line'
  const [loading, setLoading]             = useState(true);
  const [legend, setLegend]               = useState(null);     // { open, high, low, close, volume, change, isUp }
  const [livePrice, setLivePrice]         = useState(null);
  const [isFullscreen, setIsFullscreen]   = useState(false);
  const [error, setError]                 = useState(null);

  // ─── Sync activePair when defaultPair prop changes ────────────────────────
  useEffect(() => {
    if (defaultPair) {
      const p = PAIRS.find(p => p.label === defaultPair);
      if (p) {
        setActivePair(p);
      } else {
        setActivePair({
          label: defaultPair,
          symbol: defaultPair.replace('/', ''),
          wsSymbol: defaultPair,
          precision: 6, // 6 precision for custom pairs like SHIB
        });
      }
    }
  }, [defaultPair]);

  // ─── Build or rebuild chart series ──────────────────────────────────────
  const buildSeries = useCallback(() => {
    if (!chartRef.current) return;
    const chart = chartRef.current;

    // Remove existing series
    if (candleSeriesRef.current) { try { chart.removeSeries(candleSeriesRef.current); } catch(_){} }
    if (volumeSeriesRef.current) { try { chart.removeSeries(volumeSeriesRef.current); } catch(_){} }

    // Volume histogram — v5 API: chart.addSeries(HistogramSeries, options)
    const volSeries = chart.addSeries(HistogramSeries, {
      color: VOLUME_UP_COLOR,
      priceFormat: { type: 'volume' },
      priceScaleId: 'volume',
      scaleMargins: { top: 0.75, bottom: 0 },
    });
    chart.priceScale('volume').applyOptions({
      scaleMargins: { top: 0.75, bottom: 0 },
      borderVisible: false,
    });
    volumeSeriesRef.current = volSeries;

    // Main series — v5 API: chart.addSeries(CandlestickSeries | LineSeries, options)
    if (chartType === 'candlestick') {
      const cs = chart.addSeries(CandlestickSeries, {
        upColor:          CANDLE_UP_COLOR,
        downColor:        CANDLE_DOWN_COLOR,
        borderUpColor:    CANDLE_UP_COLOR,
        borderDownColor:  CANDLE_DOWN_COLOR,
        wickUpColor:      CANDLE_UP_COLOR,
        wickDownColor:    CANDLE_DOWN_COLOR,
      });
      candleSeriesRef.current = cs;
    } else {
      const ls = chart.addSeries(LineSeries, {
        color:     CANDLE_UP_COLOR,
        lineWidth: 2,
        crosshairMarkerVisible: true,
        crosshairMarkerRadius:  5,
        crosshairMarkerBorderColor: '#0d1117',
        crosshairMarkerBackgroundColor: CANDLE_UP_COLOR,
      });
      candleSeriesRef.current = ls;
    }
  }, [chartType]);

  // ─── Initialize lightweight-charts once ─────────────────────────────────
  useEffect(() => {
    if (!containerRef.current) return;

    const chart = createChart(containerRef.current, {
      ...CHART_THEME,
      width:  containerRef.current.clientWidth,
      height: containerRef.current.clientHeight || 420,
      handleScroll: { mouseWheel: true, pressedMouseMove: true, horzTouchDrag: true },
      handleScale:  { axisPressedMouseMove: true, mouseWheel: true, pinch: true },
    });
    chartRef.current = chart;

    // Crosshair legend
    chart.subscribeCrosshairMove((param) => {
      if (!candleSeriesRef.current) return;
      if (!param || !param.time) { setLegend(null); return; }
      const d = param.seriesData.get(candleSeriesRef.current);
      if (!d) { setLegend(null); return; }
      const isCandle = 'open' in d;
      const open  = isCandle ? d.open  : null;
      const high  = isCandle ? d.high  : null;
      const low   = isCandle ? d.low   : null;
      const close = isCandle ? d.close : d.value;
      const volD  = volumeSeriesRef.current && param.seriesData.get(volumeSeriesRef.current);
      const volume = volD ? volD.value : null;
      const change = (open && close) ? (((close - open) / open) * 100) : null;
      setLegend({ open, high, low, close, volume, change, isUp: close >= (open || close) });
    });

    // Responsive resize
    const obs = new ResizeObserver(() => {
      if (containerRef.current && chartRef.current) {
        chartRef.current.applyOptions({
          width:  containerRef.current.clientWidth,
          height: containerRef.current.clientHeight || 420,
        });
      }
    });
    obs.observe(containerRef.current);
    resizeObsRef.current = obs;

    return () => {
      obs.disconnect();
      chart.remove();
      chartRef.current = null;
      candleSeriesRef.current = null;
      volumeSeriesRef.current = null;
    };
  }, []); // intentionally only once

  // ─── Rebuild series when chartType changes ───────────────────────────────
  useEffect(() => {
    if (!chartRef.current) return;
    buildSeries();
    // Re-apply existing candle data after series rebuild
    if (candlesRef.current.length > 0) {
      applyCandles(candlesRef.current);
    }
  }, [chartType]);

  // ─── Apply candle array to both series ──────────────────────────────────
  const applyCandles = useCallback((candles) => {
    if (!candleSeriesRef.current || !volumeSeriesRef.current) return;

    if (chartType === 'candlestick') {
      candleSeriesRef.current.setData(
        candles.map(c => ({ time: c.time, open: c.open, high: c.high, low: c.low, close: c.close }))
      );
    } else {
      candleSeriesRef.current.setData(
        candles.map(c => ({ time: c.time, value: c.close }))
      );
    }
    volumeSeriesRef.current.setData(
      candles.map(c => ({
        time:  c.time,
        value: c.volume,
        color: c.close >= c.open ? VOLUME_UP_COLOR : VOLUME_DOWN_COLOR,
      }))
    );
    // Set last legend to last candle
    const last = candles[candles.length - 1];
    if (last) {
      setLivePrice(last.close);
      setLegend({
        open: last.open, high: last.high, low: last.low, close: last.close,
        volume: last.volume,
        change: ((last.close - last.open) / last.open) * 100,
        isUp: last.close >= last.open,
      });
    }
  }, [chartType]);

  // ─── Fetch historical klines ─────────────────────────────────────────────
  const fetchKlines = useCallback(async () => {
    if (!chartRef.current) return;
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get('/api/market/klines', {
        params: {
          symbol:   activePair.symbol,
          interval: activeTimeframe.interval,
          limit:    500,
        },
      });
      const candles = res.data;
      if (!Array.isArray(candles) || candles.length === 0) throw new Error('No data');
      candlesRef.current = candles;
      buildSeries(); // ensure series exist
      applyCandles(candles);
      chartRef.current.timeScale().fitContent();
    } catch (e) {
      console.error('Chart klines fetch error:', e);
      setError('Failed to load chart data. Retrying…');
      setTimeout(fetchKlines, 5000);
    } finally {
      setLoading(false);
    }
  }, [activePair, activeTimeframe, buildSeries, applyCandles]);

  // Fetch on pair/timeframe change
  useEffect(() => {
    fetchKlines();
  }, [fetchKlines]);

  // ─── Real-time price update via Socket.IO ────────────────────────────────
  useEffect(() => {
    if (!socket) return;

    const handlePriceUpdate = (prices) => {
      const found = prices.find(p => p.symbol === activePair.wsSymbol);
      if (!found) return;
      const latestPrice = parseFloat(found.price);
      setLivePrice(latestPrice);

      // Aggregate tick into current open candle
      if (!candleSeriesRef.current || !volumeSeriesRef.current) return;
      const intervalSec = activeTimeframe.seconds;
      const nowSec      = Math.floor(Date.now() / 1000);
      const candles     = candlesRef.current;
      if (candles.length === 0) return;

      const currentKey = candleKey(nowSec, intervalSec);
      const lastCandle  = candles[candles.length - 1];

      // Ignore updates that are older than the last candle (e.g., during timeframe switch)
      if (currentKey < lastCandle.time) return;

      let updated;
      if (lastCandle.time === currentKey) {
        // Update existing open candle
        updated = {
          ...lastCandle,
          high:  Math.max(lastCandle.high, latestPrice),
          low:   Math.min(lastCandle.low,  latestPrice),
          close: latestPrice,
        };
        candles[candles.length - 1] = updated;
      } else if (nowSec >= currentKey) {
        // Start a new candle
        updated = {
          time:   currentKey,
          open:   latestPrice,
          high:   latestPrice,
          low:    latestPrice,
          close:  latestPrice,
          volume: 0,
        };
        candles.push(updated);
        // Keep candles array bounded to 600 entries
        if (candles.length > 600) candles.shift();
      } else {
        return;
      }

      // Update chart
      if (chartType === 'candlestick') {
        candleSeriesRef.current.update({ time: updated.time, open: updated.open, high: updated.high, low: updated.low, close: updated.close });
      } else {
        candleSeriesRef.current.update({ time: updated.time, value: updated.close });
      }
      volumeSeriesRef.current.update({
        time:  updated.time,
        value: updated.volume,
        color: updated.close >= updated.open ? VOLUME_UP_COLOR : VOLUME_DOWN_COLOR,
      });
    };

    socket.on('priceUpdate', handlePriceUpdate);
    return () => socket.off('priceUpdate', handlePriceUpdate);
  }, [socket, activePair, activeTimeframe, chartType]);

  // ─── Fullscreen toggle ───────────────────────────────────────────────────
  const toggleFullscreen = () => setIsFullscreen(f => !f);

  // ─── Price change color ──────────────────────────────────────────────────
  const priceColor = legend ? (legend.isUp ? CANDLE_UP_COLOR : CANDLE_DOWN_COLOR) : CANDLE_UP_COLOR;
  const precision  = activePair.precision;

  return (
    <Box
      sx={{
        background:   'rgba(13, 17, 23, 0.98)',
        border:       '1px solid rgba(255,255,255,0.07)',
        borderRadius: isFullscreen ? 0 : 2,
        overflow:     'hidden',
        position:     isFullscreen ? 'fixed' : 'relative',
        top:          isFullscreen ? 0 : 'auto',
        left:         isFullscreen ? 0 : 'auto',
        width:        isFullscreen ? '100vw' : '100%',
        height:       isFullscreen ? '100vh' : 'auto',
        zIndex:       isFullscreen ? 9999 : 'auto',
        display:      'flex',
        flexDirection:'column',
        boxShadow:    '0 4px 32px rgba(0,0,0,0.5)',
      }}
    >
      {/* ── Top toolbar ─────────────────────────────────────────────────── */}
      <Box
        sx={{
          display:        'flex',
          alignItems:     'center',
          flexWrap:       'wrap',
          gap:            0.5,
          px:             1.5,
          py:             1,
          borderBottom:   '1px solid rgba(255,255,255,0.06)',
          background:     'rgba(255,255,255,0.015)',
        }}
      >
        {/* Pair chips */}
        <Box sx={{ display: 'flex', gap: 0.5, mr: 1 }}>
          {[...PAIRS, ...(PAIRS.find(p => p.label === activePair.label) ? [] : [activePair])].map(p => (
            <Chip
              key={p.label}
              label={p.label}
              size="small"
              onClick={() => setActivePair(p)}
              sx={{
                fontSize:   '0.7rem',
                fontWeight: 'bold',
                height:     24,
                bgcolor:    activePair.label === p.label ? 'rgba(59, 130, 246,0.18)' : 'rgba(255,255,255,0.05)',
                color:      activePair.label === p.label ? '#3B82F6' : '#8b949e',
                border:     `1px solid ${activePair.label === p.label ? 'rgba(59, 130, 246,0.5)' : 'transparent'}`,
                cursor:     'pointer',
                transition: 'all 0.15s',
                '&:hover':  { bgcolor: 'rgba(59, 130, 246,0.1)', color: '#3B82F6' },
              }}
            />
          ))}
        </Box>

        {/* Separator */}
        <Box sx={{ width: '1px', height: 20, bgcolor: 'rgba(255,255,255,0.08)', mx: 0.5 }} />

        {/* Timeframe chips */}
        <Box sx={{ display: 'flex', gap: 0.4 }}>
          {TIMEFRAMES.map(tf => (
            <Chip
              key={tf.label}
              label={tf.label}
              size="small"
              onClick={() => setActiveTimeframe(tf)}
              sx={{
                fontSize:   '0.65rem',
                fontWeight: 'bold',
                height:     22,
                minWidth:   28,
                bgcolor:    activeTimeframe.label === tf.label ? 'rgba(59, 130, 246,0.18)' : 'transparent',
                color:      activeTimeframe.label === tf.label ? '#3B82F6' : '#6b7280',
                border:     `1px solid ${activeTimeframe.label === tf.label ? 'rgba(59, 130, 246,0.4)' : 'transparent'}`,
                cursor:     'pointer',
                transition: 'all 0.15s',
                '&:hover':  { color: '#3B82F6', bgcolor: 'rgba(59, 130, 246,0.08)' },
              }}
            />
          ))}
        </Box>

        {/* Spacer */}
        <Box sx={{ flex: 1 }} />

        {/* Chart type toggle */}
        <Tooltip title="Candlestick Chart">
          <IconButton
            size="small"
            onClick={() => setChartType('candlestick')}
            sx={{
              color:   chartType === 'candlestick' ? '#3B82F6' : '#6b7280',
              bgcolor: chartType === 'candlestick' ? 'rgba(59, 130, 246,0.12)' : 'transparent',
              border:  chartType === 'candlestick' ? '1px solid rgba(59, 130, 246,0.3)' : '1px solid transparent',
              borderRadius: 1,
              p: '4px',
              '&:hover': { bgcolor: 'rgba(59, 130, 246,0.1)' },
            }}
          >
            <CandlestickChart fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Line Chart">
          <IconButton
            size="small"
            onClick={() => setChartType('line')}
            sx={{
              color:   chartType === 'line' ? '#3B82F6' : '#6b7280',
              bgcolor: chartType === 'line' ? 'rgba(59, 130, 246,0.12)' : 'transparent',
              border:  chartType === 'line' ? '1px solid rgba(59, 130, 246,0.3)' : '1px solid transparent',
              borderRadius: 1,
              p: '4px',
              ml: 0.5,
              '&:hover': { bgcolor: 'rgba(59, 130, 246,0.1)' },
            }}
          >
            <ShowChart fontSize="small" />
          </IconButton>
        </Tooltip>

        {/* Fullscreen toggle */}
        <Tooltip title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}>
          <IconButton
            size="small"
            onClick={toggleFullscreen}
            sx={{
              color:   '#6b7280',
              ml: 0.5,
              p: '4px',
              '&:hover': { color: '#3B82F6', bgcolor: 'rgba(59, 130, 246,0.08)' },
            }}
          >
            {isFullscreen ? <FullscreenExit fontSize="small" /> : <Fullscreen fontSize="small" />}
          </IconButton>
        </Tooltip>
      </Box>

      {/* ── Price legend bar ─────────────────────────────────────────────── */}
      <Box
        sx={{
          display:    'flex',
          alignItems: 'center',
          flexWrap:   'wrap',
          gap:        2,
          px:         1.5,
          py:         0.75,
          borderBottom: '1px solid rgba(255,255,255,0.04)',
          minHeight:  36,
        }}
      >
        {/* Pair name + live price */}
        <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
          <Typography sx={{ fontSize: '0.8rem', fontWeight: 700, color: '#e6edf3', letterSpacing: 0.5 }}>
            {activePair.label}
          </Typography>
          {livePrice != null && (
            <Typography
              sx={{
                fontSize:   '1.1rem',
                fontWeight: 700,
                color:      priceColor,
                transition: 'color 0.3s',
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {fmt(livePrice, precision)}
            </Typography>
          )}
        </Box>

        {/* OHLCV from crosshair */}
        {legend && (
          <>
            {legend.open != null && (
              <LegendItem label="O" value={fmt(legend.open, precision)} color={legend.isUp ? CANDLE_UP_COLOR : CANDLE_DOWN_COLOR} />
            )}
            {legend.high != null && (
              <LegendItem label="H" value={fmt(legend.high, precision)} color={CANDLE_UP_COLOR} />
            )}
            {legend.low != null && (
              <LegendItem label="L" value={fmt(legend.low, precision)} color={CANDLE_DOWN_COLOR} />
            )}
            {legend.close != null && (
              <LegendItem label="C" value={fmt(legend.close, precision)} color={legend.isUp ? CANDLE_UP_COLOR : CANDLE_DOWN_COLOR} />
            )}
            {legend.volume != null && (
              <LegendItem label="Vol" value={fmtVolume(legend.volume)} color="#6b7280" />
            )}
            {legend.change != null && (
              <Typography
                sx={{
                  fontSize:   '0.72rem',
                  fontWeight: 700,
                  color:      legend.change >= 0 ? CANDLE_UP_COLOR : CANDLE_DOWN_COLOR,
                  bgcolor:    legend.change >= 0 ? 'rgba(59, 130, 246,0.1)' : 'rgba(255,51,102,0.1)',
                  px:         0.75,
                  py:         0.25,
                  borderRadius: 1,
                }}
              >
                {legend.change >= 0 ? '+' : ''}{legend.change.toFixed(2)}%
              </Typography>
            )}
          </>
        )}

        {/* Live indicator */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, ml: 'auto' }}>
          <Box sx={{
            width: 6, height: 6, borderRadius: '50%',
            bgcolor: '#3B82F6',
            boxShadow: '0 0 6px #3B82F6',
            animation: 'pulse 2s infinite',
            '@keyframes pulse': {
              '0%,100%': { opacity: 1, transform: 'scale(1)' },
              '50%':     { opacity: 0.5, transform: 'scale(0.8)' },
            },
          }} />
          <Typography sx={{ fontSize: '0.65rem', color: '#6b7280', fontWeight: 600, letterSpacing: 0.5 }}>
            LIVE
          </Typography>
        </Box>
      </Box>

      {/* ── Chart container ──────────────────────────────────────────────── */}
      <Box
        sx={{
          position: 'relative',
          flex: 1,
          minHeight: isFullscreen ? 'calc(100vh - 120px)' : 400,
        }}
      >
        {/* Loading overlay */}
        {loading && (
          <Box sx={{
            position:   'absolute', inset: 0, zIndex: 10,
            display:    'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            bgcolor:    'rgba(13,17,23,0.85)',
            backdropFilter: 'blur(4px)',
            gap: 1.5,
          }}>
            <CircularProgress size={32} sx={{ color: '#3B82F6' }} />
            <Typography sx={{ fontSize: '0.8rem', color: '#6b7280' }}>
              Loading {activePair.label} chart…
            </Typography>
          </Box>
        )}

        {/* Error overlay */}
        {error && !loading && (
          <Box sx={{
            position: 'absolute', inset: 0, zIndex: 10,
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            bgcolor: 'rgba(13,17,23,0.85)',
            gap: 1,
          }}>
            <Typography sx={{ fontSize: '0.85rem', color: CANDLE_DOWN_COLOR }}>
              {error}
            </Typography>
          </Box>
        )}

        {/* The actual chart DOM node */}
        <Box
          ref={containerRef}
          sx={{ width: '100%', height: '100%', minHeight: isFullscreen ? 'calc(100vh - 120px)' : 400 }}
        />
      </Box>
    </Box>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Legend item helper
// ─────────────────────────────────────────────────────────────────────────────
const LegendItem = ({ label, value, color }) => (
  <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.4 }}>
    <Typography sx={{ fontSize: '0.65rem', color: '#6b7280', fontWeight: 600 }}>
      {label}
    </Typography>
    <Typography sx={{ fontSize: '0.72rem', color, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
      {value}
    </Typography>
  </Box>
);

export default TradingChart;
