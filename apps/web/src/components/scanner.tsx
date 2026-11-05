'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Camera, ScanLine, Square } from 'lucide-react';
import { isValidGtin } from '@duraverso/core';
import type { IScannerControls } from '@zxing/browser';

export function Scanner() {
  const router = useRouter(); const video = useRef<HTMLVideoElement>(null);
  const controls = useRef<IScannerControls | null>(null); const generation = useRef(0);
  const [state, setState] = useState<'idle' | 'starting' | 'reading'>('idle');
  const [message, setMessage] = useState(''); const [code, setCode] = useState('');
  const release = useCallback(() => {
    generation.current += 1; controls.current?.stop(); controls.current = null;
    const stream = video.current?.srcObject;
    if (stream instanceof MediaStream) stream.getTracks().forEach((track) => track.stop());
  }, []);
  useEffect(() => {
    const element = video.current;
    return () => { release(); const stream = element?.srcObject; if (stream instanceof MediaStream) stream.getTracks().forEach((track) => track.stop()); };
  }, [release]);
  useEffect(() => {
    function hidden() { if (document.hidden) { release(); setState('idle'); } }
    document.addEventListener('visibilitychange', hidden);
    return () => document.removeEventListener('visibilitychange', hidden);
  }, [release]);
  async function start() {
    release(); const run = generation.current; setMessage(''); setState('starting');
    if (!navigator.mediaDevices?.getUserMedia) { setMessage('A câmera não está disponível neste navegador. Digite o código abaixo.'); setState('idle'); return; }
    try {
      const { BrowserMultiFormatReader } = await import('@zxing/browser');
      if (run !== generation.current || !video.current) return;
      const reader = new BrowserMultiFormatReader();
      const active = await reader.decodeFromConstraints({ video: { facingMode: { ideal: 'environment' } }, audio: false }, video.current, (result) => {
        if (run !== generation.current || !result) return;
        const value = result.getText();
        if (!isValidGtin(value)) { setMessage('Aponte para um código de barras de produto (EAN ou UPC).'); return; }
        release(); setState('idle'); router.push(`/produtos?q=${encodeURIComponent(value)}`);
      });
      if (run !== generation.current) { active.stop(); return; }
      controls.current = active; setState('reading');
    } catch (error) {
      if (run !== generation.current) return;
      release(); setState('idle');
      setMessage(error instanceof DOMException && error.name === 'NotAllowedError'
        ? 'O acesso à câmera não foi autorizado. Você pode digitar o código ou pesquisar pelo modelo.'
        : 'Não foi possível iniciar a câmera. Confira se ela está disponível ou digite o código abaixo.');
    }
  }
  return <div className="scanner-panel"><div className={`camera-frame ${state !== 'idle' ? 'camera-active' : ''}`}><video ref={video} muted playsInline aria-label="Imagem da câmera para leitura do código de barras" /><div className="camera-overlay"><ScanLine size={64} strokeWidth={1} /><p>{state === 'reading' ? 'Posicione o código dentro da câmera.' : state === 'starting' ? 'Aguardando acesso à câmera…' : 'A câmera só será aberta quando você permitir.'}</p></div></div><div className="scanner-actions">{state === 'idle' ? <button className="button button-primary" onClick={start}><Camera size={19} /> Abrir câmera</button> : <button className="button button-outline" onClick={() => { release(); setState('idle'); }}><Square size={16} /> Encerrar leitura</button>}</div><p className="form-message" role="status" aria-live="polite">{message}</p><div className="or-divider"><span>ou digite o código</span></div><form onSubmit={(event) => { event.preventDefault(); const value = code.replace(/\s/g, ''); if (!isValidGtin(value)) { setMessage('Confira os números do código de barras: são 8, 12, 13 ou 14 dígitos, incluindo o dígito final.'); return; } release(); setState('idle'); router.push(`/produtos?q=${encodeURIComponent(value)}`); }}><label htmlFor="barcode">Código de barras do produto</label><div className="manual-code"><input id="barcode" inputMode="numeric" autoComplete="off" value={code} onChange={(event) => setCode(event.target.value)} maxLength={24} placeholder="Digite todos os números" /><button className="button button-primary" type="submit">Consultar</button></div></form><p className="small">A leitura acontece no dispositivo. Nenhuma imagem da câmera é enviada ao Duraverso.</p></div>;
}
