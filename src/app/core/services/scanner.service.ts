import { Injectable } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { BarcodeFormat, BarcodeScanner, GoogleBarcodeScannerModuleInstallState } from '@capacitor-mlkit/barcode-scanning';

export type ScanResult =
  | { status: 'ok'; value: string }
  | { status: 'cancelled' }
  /** Navigateur, appareil sans scanner ou accès à la caméra refusé : saisie manuelle du lien. */
  | { status: 'unavailable' };

/** Attente maximale de l'installation du scanner Google (première utilisation, hors Play Store). */
const INSTALL_TIMEOUT_MS = 60000;

/** Lecture d'un QR code avec la caméra. N'échoue jamais : l'écran propose alors de coller le lien. */
@Injectable({ providedIn: 'root' })
export class ScannerService {
  get native(): boolean { return Capacitor.isNativePlatform(); }

  async scan(): Promise<ScanResult> {
    if (!this.native) return { status: 'unavailable' };
    try {
      const { supported } = await BarcodeScanner.isSupported();
      if (!supported) return { status: 'unavailable' };
      if (Capacitor.getPlatform() === 'android') {
        // Android : `scan()` ouvre l'écran de scan des services Google, qui gère lui-même la caméra.
        // Aucune autorisation à demander — la demander échoue, CAMERA n'étant pas déclarée dans le manifeste.
        if (!(await this.ensureGoogleScanner())) return { status: 'unavailable' };
      } else {
        const { camera } = await BarcodeScanner.requestPermissions();
        if (camera !== 'granted' && camera !== 'limited') return { status: 'unavailable' };
      }

      const { barcodes } = await BarcodeScanner.scan({ formats: [BarcodeFormat.QrCode] });
      const value = barcodes[0]?.rawValue;
      return value ? { status: 'ok', value } : { status: 'cancelled' };
    } catch (err) {
      // Fermeture du scanner par l'utilisateur : ce n'est pas une panne.
      const message = String((err as { message?: string })?.message || '').toLowerCase();
      return message.includes('cancel') ? { status: 'cancelled' } : { status: 'unavailable' };
    }
  }

  /**
   * Le scanner est un module des services Google. Installée par le Play Store, l'application le
   * reçoit en même temps (AndroidManifest) ; installée depuis un fichier APK, elle le télécharge
   * à la première utilisation : on attend la fin de l'installation au lieu d'abandonner.
   */
  private async ensureGoogleScanner(): Promise<boolean> {
    const { available } = await BarcodeScanner.isGoogleBarcodeScannerModuleAvailable();
    if (available) return true;

    let settle: (ok: boolean) => void = () => {};
    const installed = new Promise<boolean>(resolve => { settle = resolve; });
    const handle = await BarcodeScanner.addListener('googleBarcodeScannerModuleInstallProgress', event => {
      if (event.state === GoogleBarcodeScannerModuleInstallState.COMPLETED) settle(true);
      if (event.state === GoogleBarcodeScannerModuleInstallState.FAILED
        || event.state === GoogleBarcodeScannerModuleInstallState.CANCELED) settle(false);
    });
    const timer = setTimeout(() => settle(false), INSTALL_TIMEOUT_MS);
    BarcodeScanner.installGoogleBarcodeScannerModule().catch(() => settle(false));
    try {
      return await installed;
    } finally {
      clearTimeout(timer);
      handle.remove();
    }
  }
}
