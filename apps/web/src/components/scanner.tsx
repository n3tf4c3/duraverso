'use client';
import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Camera, ScanLine, Square } from 'lucide-react';
import { productCategory, type PublicProduct } from '@duraverso/core';
import { categoryLabel, formatProductMeasure } from '@/lib/product-presentation';
import type { IScannerControls } from '@zxing/browser';
import { fill, localizePath, type Dictionary, type Locale } from '@/lib/i18n';
import { extraCopy } from '@/lib/copy';
import { gtinError, lookupBarcode } from '@/lib/scanner-lookup';
type Result = { state: 'idle' | 'loading' | 'failed' } | { state: 'done'; products: PublicProduct[]; code: string; scanned: boolean };
export function Scanner({ locale, labels: t, states: s }: { locale: Locale; labels: Dictionary['scanner']; states: Dictionary['scannerStates'] }) {
  const c = extraCopy(locale); const video = useRef<HTMLVideoElement>(null); const input = useRef<HTMLInputElement>(null);
  const controls = useRef<IScannerControls | null>(null); const generation = useRef(0); const query = useRef<AbortController | null>(null);
  const [state, setState] = useState<'idle' | 'starting' | 'reading'>('idle');
  const [message, setMessage] = useState(''); const [error, setError] = useState(''); const [cameraError, setCameraError] = useState<'denied' | 'unavailable' | null>(null);
  const [code, setCode] = useState(''); const [result, setResult] = useState<Result>({ state: 'idle' });
  const [cameras, setCameras] = useState<MediaDeviceInfo[]>([]); const [cameraId, setCameraId] = useState('');
  const release = useCallback(() => { generation.current += 1; controls.current?.stop(); controls.current = null; const stream = video.current?.srcObject; if (typeof MediaStream !== 'undefined' && stream instanceof MediaStream) stream.getTracks().forEach((track) => track.stop()); }, []);
  useEffect(() => {
    const element = video.current;
    function hidden() { if (document.hidden) { release(); setState('idle'); } }
    function leave() { release(); setState('idle'); }
    document.addEventListener('visibilitychange', hidden); window.addEventListener('pagehide', leave);
    return () => { release(); query.current?.abort(); query.current = null; const stream = element?.srcObject; if (typeof MediaStream !== 'undefined' && stream instanceof MediaStream) stream.getTracks().forEach((track) => track.stop()); document.removeEventListener('visibilitychange', hidden); window.removeEventListener('pagehide', leave); };
  }, [release]);
  useEffect(() => { if (state !== 'reading') return; const timer = window.setTimeout(() => setMessage(c.scanHelp), 8000); return () => window.clearTimeout(timer); }, [state, c.scanHelp]);
  async function lookup(value: string, scanned = false) {
    if (query.current) return;
    const invalid = gtinError(value); if (invalid) { setError(invalid === 'empty' ? s.errEmpty : invalid === 'chars' ? s.errChars : invalid === 'length' ? fill(s.errLength, { n: value.length }) : s.errCheck); input.current?.focus(); return; }
    release(); setState('idle'); setError(''); setMessage(''); setCode(value); setResult({ state: 'loading' });
    const controller = new AbortController(); query.current = controller;
    const timeout = window.setTimeout(() => controller.abort(), 10000);
    try { const products = await lookupBarcode(value, controller.signal); if (query.current === controller) setResult({ state: 'done', products, code: value, scanned }); }
    catch { if (query.current === controller) setResult({ state: 'failed' }); }
    finally { window.clearTimeout(timeout); if (query.current === controller) query.current = null; }
  }
  async function start(selectedCamera = cameraId) {
    release(); const run = generation.current; setMessage(''); setCameraError(null); setState('starting'); setResult({ state: 'idle' });
    if (!navigator.mediaDevices?.getUserMedia) { setCameraError('unavailable'); setState('idle'); input.current?.focus(); return; }
    try {
      const { createProductReader, readProductGtin, isExpectedScanMiss } = await import('@/lib/scanner-reader');
      if (run !== generation.current || !video.current) return;
      const active = await createProductReader().decodeFromConstraints({ audio: false, video: { ...(selectedCamera ? { deviceId: { exact: selectedCamera } } : { facingMode: { ideal: 'environment' } }), width: { ideal: 1280 }, height: { ideal: 720 } } }, video.current, (decoded, error, scannerControls) => {
        if (run !== generation.current) { scannerControls.stop(); return; }
        if (decoded) { const value = readProductGtin(decoded); if (!value) { setMessage(s.errCheck); return; } scannerControls.stop(); release(); setState('idle'); void lookup(value, true); }
        else if (error && !isExpectedScanMiss(error)) { scannerControls.stop(); release(); setState('idle'); setMessage(c.scanInterrupted); }
      });
      if (run !== generation.current) { active.stop(); return; }
      controls.current = active; setState('reading');
      try { const devices = await navigator.mediaDevices.enumerateDevices(); if (run !== generation.current) return; setCameras(devices.filter((d) => d.kind === 'videoinput' && d.deviceId)); const stream = video.current?.srcObject; if (stream instanceof MediaStream) setCameraId(stream.getVideoTracks()[0]?.getSettings().deviceId ?? selectedCamera); } catch { /* Device enumeration is optional. */ }
    } catch (error) { if (run !== generation.current) return; release(); setState('idle'); setCameraError(error instanceof DOMException && error.name === 'NotAllowedError' ? 'denied' : 'unavailable'); input.current?.focus(); }
  }
  return <div className="scanner-layout"><div className="scanner-panel"><div className={`camera-frame ${state !== 'idle' ? 'camera-active' : ''}`}><video ref={video} muted playsInline aria-label={t.cameraView} /><div className="camera-overlay">{state === 'reading' ? <span className="barcode-guide" aria-hidden="true" /> : <ScanLine size={64} strokeWidth={1} aria-hidden="true" />}<p>{state === 'reading' ? t.aim : state === 'starting' ? c.cameraStarting : t.intro}</p></div></div><div className="scanner-actions">{state === 'idle' ? <button type="button" className="button button-primary" disabled={result.state === 'loading'} onClick={() => void start()}><Camera size={19} />{cameraError ? s.retryCamera : t.openCamera}</button> : <button type="button" className="button button-outline" onClick={() => { release(); setState('idle'); }}><Square size={16} />{t.closeCamera}</button>}</div>{cameras.length > 1 && <div className="camera-choice"><label htmlFor="camera-choice">{c.camera}</label><select id="camera-choice" value={cameraId} disabled={state === 'starting' || result.state === 'loading'} onChange={(event) => { const id = event.target.value; setCameraId(id); if (state === 'reading') void start(id); }}><option value="">{c.automaticCamera}</option>{cameras.map((camera, i) => <option key={camera.deviceId} value={camera.deviceId}>{camera.label || `${c.camera} ${i + 1}`}</option>)}</select></div>}<p className="form-message" role="status">{message}</p>{cameraError && <div className="inline-notice" role="alert"><h3>{cameraError === 'denied' ? s.deniedTitle : s.noCamTitle}</h3><p>{cameraError === 'denied' ? s.deniedText : s.noCamText}</p></div>}<p className="small">{t.privacy}</p></div>
  <div className="scanner-manual"><h2>{s.typeTitle}</h2><form onSubmit={(event) => { event.preventDefault(); void lookup(code); }}><label htmlFor="barcode">{s.typeLabel}</label><p id="barcode-hint" className="small">{s.typeHint}</p><div className="manual-code"><input ref={input} id="barcode" inputMode="numeric" autoComplete="off" value={code} onChange={(event) => { setCode(event.target.value); setError(''); setResult({ state: 'idle' }); }} readOnly={result.state === 'loading'} maxLength={24} aria-invalid={Boolean(error)} aria-describedby={`barcode-hint${error ? ' barcode-error' : ''}`} /><button className="button button-primary" type="submit" disabled={result.state === 'loading'}>{result.state === 'loading' ? s.checking : s.check}</button></div>{error && <p id="barcode-error" role="alert" className="field-error">{error}</p>}</form><div aria-live="polite" aria-atomic="true" aria-busy={result.state === 'loading'} className="scanner-result">{result.state === 'loading' && <p>{s.checking} <code>{code}</code></p>}{result.state === 'failed' && <><span className="status-label">{s.failTag}</span><h3>{s.failTitle}</h3><p>{s.failText}</p><button type="button" className="button button-outline" onClick={() => void lookup(code)}>{s.retry}</button></>}{result.state === 'done' && <><span className="status-label">{result.products.length ? result.scanned ? t.found : s.typedFound : s.notInCatTag}</span><p className="mono">{result.code}</p>{result.products.length ? result.products.map((p) => <article key={p.id}><h3>{p.brand} {p.model}</h3><p>{categoryLabel(productCategory(p), locale)} · {formatProductMeasure(p, locale)} · {t.voltage}: {locale === 'pt' ? 'a confirmar' : locale === 'en' ? 'to be confirmed' : 'por confirmar'}</p><p className="small">{t.labelTip}</p><Link className="button button-primary" href={localizePath(`/produtos/${p.slug}`, locale)}>{s.openRecord} →</Link></article>) : <><h3>{t.notFoundTitle}</h3><p>{c.noMatch}</p></>}</>}</div><Link className="text-link" href={localizePath('/produtos', locale)}>{t.byName} →</Link></div></div>;
}
