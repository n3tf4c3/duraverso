'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Camera, ScanLine, Square } from 'lucide-react';
import { isValidGtin } from '@duraverso/core';
import type { IScannerControls } from '@zxing/browser';

export function Scanner() {
  const router = useRouter();
  const video = useRef<HTMLVideoElement>(null);
  const controls = useRef<IScannerControls | null>(null);
  const generation = useRef(0);
  const [state, setState] = useState<'idle' | 'starting' | 'reading'>('idle');
  const [message, setMessage] = useState('');
  const [code, setCode] = useState('');
  const [cameras, setCameras] = useState<MediaDeviceInfo[]>([]);
  const [cameraId, setCameraId] = useState('');
  const release = useCallback(() => {
    generation.current += 1;
    controls.current?.stop(); controls.current = null;
    const stream = video.current?.srcObject;
    if (stream instanceof MediaStream) stream.getTracks().forEach((track) => track.stop());
  }, []);
  useEffect(() => {
    const element = video.current;
    function hidden() { if (document.hidden) { release(); setState('idle'); } }
    function leave() { release(); setState('idle'); }
    document.addEventListener('visibilitychange', hidden);
    window.addEventListener('pagehide', leave);
    return () => {
      release();
      const stream = element?.srcObject;
      if (stream instanceof MediaStream) stream.getTracks().forEach((track) => track.stop());
      document.removeEventListener('visibilitychange', hidden);
      window.removeEventListener('pagehide', leave);
    };
  }, [release]);
  useEffect(() => {
    if (state !== 'reading') return;
    const timer = window.setTimeout(() => setMessage((current) => current ||
      'Ainda não lemos o código. Melhore a iluminação, afaste um pouco o celular para focar e mantenha todas as barras visíveis. Se houver mais de uma câmera disponível, tente trocar a câmera.'), 8000);
    return () => window.clearTimeout(timer);
  }, [state]);

  async function start(selectedCamera = cameraId) {
    release();
    const run = generation.current;
    setMessage(''); setState('starting');
    if (!navigator.mediaDevices?.getUserMedia) {
      setMessage('A câmera não está disponível neste navegador. Digite o código abaixo.'); setState('idle'); return;
    }
    try {
      const { createProductReader, readProductGtin, isExpectedScanMiss } = await import('@/lib/scanner-reader');
      if (run !== generation.current || !video.current) return;
      const reader = createProductReader();
      const active = await reader.decodeFromConstraints({
        audio: false,
        video: {
          ...(selectedCamera ? { deviceId: { exact: selectedCamera } } : { facingMode: { ideal: 'environment' } }),
          width: { ideal: 1280 }, height: { ideal: 720 },
        },
      }, video.current, (result, error, scannerControls) => {
        if (run !== generation.current) { scannerControls.stop(); return; }
        if (result) {
          const value = readProductGtin(result);
          if (!value) { setMessage('Esse código não é um EAN ou UPC válido. Use o código de barras da embalagem.'); return; }
          scannerControls.stop(); release(); setState('idle');
          router.push(`/produtos?q=${encodeURIComponent(value)}`);
        } else if (error && !isExpectedScanMiss(error)) {
          scannerControls.stop(); release(); setState('idle');
          setMessage('A leitura foi interrompida. Abra a câmera novamente ou digite os números abaixo.');
        }
      });
      if (run !== generation.current) { active.stop(); return; }
      controls.current = active; setState('reading');
      // A lista só é consultada após a permissão. Sua ausência não interrompe a leitura.
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        if (run !== generation.current) return;
        setCameras(devices.filter((device) => device.kind === 'videoinput' && device.deviceId));
        const stream = video.current?.srcObject;
        if (stream instanceof MediaStream) setCameraId(stream.getVideoTracks()[0]?.getSettings().deviceId ?? selectedCamera);
      } catch { /* Alguns navegadores não disponibilizam a lista de câmeras. */ }
    } catch (error) {
      if (run !== generation.current) return;
      release(); setState('idle');
      setMessage(error instanceof DOMException && error.name === 'NotAllowedError'
        ? 'O acesso à câmera não foi autorizado. Você pode digitar o código ou pesquisar pelo modelo.'
        : 'Não foi possível iniciar essa câmera. Tente outra câmera ou digite o código abaixo.');
    }
  }

  return <div className="scanner-panel">
    <div className={`camera-frame ${state !== 'idle' ? 'camera-active' : ''}`}>
      <video ref={video} muted playsInline aria-label="Imagem da câmera para leitura do código de barras" />
      <div className="camera-overlay">
        {state === 'reading' ? <span className="barcode-guide" aria-hidden="true" /> : <ScanLine size={64} strokeWidth={1} />}
        <p>{state === 'reading' ? 'Enquadre todas as barras, incluindo as margens brancas.' : state === 'starting' ? 'Aguardando acesso à câmera…' : 'A câmera só será aberta quando você permitir.'}</p>
      </div>
    </div>
    <p className="small scanner-help">Use o código de barras com números abaixo, na embalagem. QR codes e o nome do modelo na etiqueta não são lidos aqui.</p>
    <div className="scanner-actions">{state === 'idle'
      ? <button className="button button-primary" onClick={() => void start()}><Camera size={19} /> Abrir câmera</button>
      : <button className="button button-outline" onClick={() => { release(); setState('idle'); }}><Square size={16} /> Encerrar leitura</button>}
    </div>
    {cameras.length > 1 ? <div className="camera-choice"><label htmlFor="camera-choice">Câmera</label><select id="camera-choice" value={cameraId} disabled={state === 'starting'} onChange={(event) => {
      const id = event.target.value; setCameraId(id);
      if (state === 'reading') void start(id);
    }}><option value="">Traseira automática</option>{cameras.map((camera, index) => <option key={camera.deviceId} value={camera.deviceId}>{camera.label || `Câmera ${index + 1}`}</option>)}</select></div> : null}
    <p className="form-message" role="status" aria-live="polite">{message}</p>
    <div className="or-divider"><span>ou digite o código</span></div>
    <form onSubmit={(event) => {
      event.preventDefault(); const value = code.replace(/\s/g, '');
      if (!isValidGtin(value)) { setMessage('Confira os números do código de barras: são 8, 12, 13 ou 14 dígitos, incluindo o dígito final.'); return; }
      release(); setState('idle'); router.push(`/produtos?q=${encodeURIComponent(value)}`);
    }}>
      <label htmlFor="barcode">Código de barras do produto</label>
      <div className="manual-code"><input id="barcode" inputMode="numeric" autoComplete="off" value={code} onChange={(event) => setCode(event.target.value)} maxLength={24} placeholder="Digite todos os números" /><button className="button button-primary" type="submit">Consultar</button></div>
    </form>
    <p className="small">A leitura acontece no dispositivo. Nenhuma imagem da câmera é enviada ao Duraverso.</p>
  </div>;
}
