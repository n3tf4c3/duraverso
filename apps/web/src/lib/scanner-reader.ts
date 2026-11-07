import { BrowserMultiFormatOneDReader } from '@zxing/browser';
import {
  BarcodeFormat,
  ChecksumException,
  DecodeHintType,
  FormatException,
  NotFoundException,
  type Result,
} from '@zxing/library';
import { isValidGtin } from '@duraverso/core';

const productFormats = [BarcodeFormat.EAN_13, BarcodeFormat.EAN_8, BarcodeFormat.UPC_A, BarcodeFormat.ITF];

export function createProductReader() {
  const hints = new Map<DecodeHintType, unknown>([
    [DecodeHintType.POSSIBLE_FORMATS, productFormats],
    [DecodeHintType.TRY_HARDER, true],
  ]);
  return new BrowserMultiFormatOneDReader(hints, { delayBetweenScanAttempts: 200, delayBetweenScanSuccess: 500 });
}

export function readProductGtin(result: Result) {
  // UPC-E precisa de expansão antes de virar GTIN; não deve ser tratado como EAN-8.
  if (!productFormats.includes(result.getBarcodeFormat())) return null;
  const value = result.getText();
  return isValidGtin(value) ? value : null;
}

export function isExpectedScanMiss(error: unknown) {
  return error instanceof NotFoundException || error instanceof ChecksumException || error instanceof FormatException;
}
