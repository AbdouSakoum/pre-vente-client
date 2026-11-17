import { Injectable } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { BarcodeFormat, BarcodeScanner } from '@capacitor-mlkit/barcode-scanning';

export type ScanResult =
  | { status: 'ok'; value: string }
  | { status: 'cancelled' }
  /** Navigateur, appareil sans scanner ou accès à la caméra refusé : saisie manuelle du lien. */
  | { status: 'unavailable' };

/** Lecture d'un QR code avec la caméra. N'échoue jamais : l'écran propose alors de coller le lien. */
@Injectable({ providedIn: 'root' })
export class ScannerService {
  get native(): boolean { return Capacitor.isNativePlatform(); }

  async scan(): Promise<ScanResult> {
    if (!this.native) return { status: 'unavailable' };
    try {
      const { supported } = await BarcodeScanner.isSupported();
      if (!supported) return { status: 'unavailable' };
      const { camera } = await BarcodeScanner.requestPermissions();
      if (camera !== 'granted' && camera !== 'limited') return { status: 'unavailable' };

      const { barcodes } = await BarcodeScanner.scan({ formats: [BarcodeFormat.QrCode] });
      const value = barcodes[0]?.rawValue;
      return value ? { status: 'ok', value } : { status: 'cancelled' };
    } catch (err) {
      // Fermeture du scanner par l'utilisateur : ce n'est pas une panne.
      const message = String((err as { message?: string })?.message || '').toLowerCase();
      return message.includes('cancel') ? { status: 'cancelled' } : { status: 'unavailable' };
    }
  }
}
