import { describe, expect, it } from 'vitest';
import { BrowserMultiFormatOneDReader } from '@zxing/browser';
import {
  BarcodeFormat,
  BinaryBitmap,
  ChecksumException,
  FormatException,
  HybridBinarizer,
  NotFoundException,
  Result,
  RGBLuminanceSource,
} from '@zxing/library';
import { createProductReader, isExpectedScanMiss, readProductGtin } from './scanner-reader';

// EAN-13 7896584072143: paridade LGLGLG do prefixo 7, com margens brancas.
// A imagem é construída sem usar o codificador da biblioteca sob teste.
const bars =
  '101' +
  '0110111' +
  '0010111' +
  '0101111' +
  '0111001' +
  '0110111' +
  '0011101' +
  '01010' +
  '1110010' +
  '1000100' +
  '1101100' +
  '1100110' +
  '1011100' +
  '1000010' +
  '101';

function barcodeFrame(top = 310, height = 100, pattern = bars) {
  const width = 351;
  const pixels = new Uint8ClampedArray(width * 720).fill(255);
  for (let y = top; y < top + height; y += 1) {
    for (let x = 0; x < pattern.length * 3; x += 1) {
      if (pattern[Math.floor(x / 3)] === '1') pixels[y * width + 33 + x] = 0;
    }
  }
  return new BinaryBitmap(new HybridBinarizer(new RGBLuminanceSource(pixels, width, 720)));
}

describe('leitura de códigos de produto', () => {
  it('decodifica um EAN-13 real a partir dos pixels e mantém todos os dígitos', () => {
    expect(readProductGtin(createProductReader().decodeBitmap(barcodeFrame()))).toBe('7896584072143');
  });
  it('encontra barras perto da borda que escapam da varredura padrão', () => {
    expect(() => new BrowserMultiFormatOneDReader().decodeBitmap(barcodeFrame(20, 40))).toThrow();
    expect(readProductGtin(createProductReader().decodeBitmap(barcodeFrame(20, 40)))).toBe('7896584072143');
  });
  it('lê o mesmo código de ponta-cabeça', () => {
    expect(
      readProductGtin(createProductReader().decodeBitmap(barcodeFrame(310, 100, [...bars].reverse().join('')))),
    ).toBe('7896584072143');
  });
  it('trata quadro sem código como tentativa sem leitura, sem aceitar um produto', () => {
    let error: unknown;
    try {
      createProductReader().decodeBitmap(barcodeFrame(0, 0));
    } catch (caught) {
      error = caught;
    }
    expect(error).toBeInstanceOf(NotFoundException);
    expect(isExpectedScanMiss(error)).toBe(true);
    expect(isExpectedScanMiss(new ChecksumException())).toBe(true);
    expect(isExpectedScanMiss(new FormatException())).toBe(true);
    expect(isExpectedScanMiss(new TypeError('captura indisponível'))).toBe(false);
  });
  it('não trata QR numérico ou UPC-E como GTIN de produto', () => {
    expect(readProductGtin(new Result('7896584072143', new Uint8Array(), 0, [], BarcodeFormat.QR_CODE))).toBeNull();
    expect(readProductGtin(new Result('04252614', new Uint8Array(), 0, [], BarcodeFormat.UPC_E))).toBeNull();
  });
  it('rejeita resultado com dígito verificador inválido', () => {
    expect(readProductGtin(new Result('7896584072144', new Uint8Array(), 0, [], BarcodeFormat.EAN_13))).toBeNull();
  });
});
