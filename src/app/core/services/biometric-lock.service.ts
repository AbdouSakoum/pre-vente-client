import { Injectable, signal } from '@angular/core';
import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { BiometricAuth } from '@aparajita/capacitor-biometric-auth';
import { LanguageService } from './language.service';

const ENABLED_KEY = 'sc_biometric_lock';
/** Retour au premier plan après ce délai : l'empreinte est redemandée. */
const LOCK_AFTER_MS = 2 * 60 * 1000;

/**
 * Verrou par empreinte (ou code du téléphone) : la session reste ouverte, aucun mot de passe n'est
 * gardé sur le téléphone. Activé depuis « Mon compte », il est demandé à l'ouverture de
 * l'application et au retour au premier plan après deux minutes. Téléphone seulement.
 */
@Injectable({ providedIn: 'root' })
export class BiometricLockService {
  readonly locked = signal(false);
  private pausedAt = 0;
  private started = false;
  private prompting = false;

  constructor(private language: LanguageService) {}

  get enabled(): boolean { try { return localStorage.getItem(ENABLED_KEY) === 'true'; } catch { return false; } }

  /** Empreinte (ou visage) enregistrée sur le téléphone ; jamais dans le navigateur. */
  async isAvailable(): Promise<boolean> {
    if (!Capacitor.isNativePlatform()) return false;
    try {
      return (await BiometricAuth.checkBiometry()).isAvailable;
    } catch { return false; }
  }

  /**
   * À l'ouverture, avec une session : verrouille si l'option est active, puis surveille les
   * passages en arrière-plan. `isLoggedIn` est relu à chaque retour (session fermée entre-temps).
   */
  start(isLoggedIn: () => boolean) {
    if (this.started || !Capacitor.isNativePlatform()) return;
    this.started = true;
    if (this.enabled && isLoggedIn()) this.lockAndPrompt();
    App.addListener('pause', () => { if (!this.prompting) this.pausedAt = Date.now(); }).catch(() => {});
    App.addListener('resume', () => {
      if (!this.enabled || !isLoggedIn() || this.prompting || this.locked() || !this.pausedAt) return;
      if (Date.now() - this.pausedAt >= LOCK_AFTER_MS) this.lockAndPrompt();
    }).catch(() => {});
  }

  /** Active l'option après une première vérification réussie. `false` si annulée ou refusée. */
  async enable(): Promise<boolean> {
    if (!(await this.authenticate())) return false;
    localStorage.setItem(ENABLED_KEY, 'true');
    return true;
  }

  disable() { try { localStorage.removeItem(ENABLED_KEY); } catch { /* stockage indisponible */ } }

  /** Écran verrouillé : nouvelle tentative (bouton « Déverrouiller »). */
  async unlock(): Promise<boolean> {
    const ok = await this.authenticate();
    if (ok) { this.locked.set(false); this.pausedAt = 0; }
    return ok;
  }

  /** Déconnexion : l'option est liée au compte, elle repart désactivée. */
  reset() { this.disable(); this.locked.set(false); this.pausedAt = 0; }

  private lockAndPrompt() {
    this.locked.set(true);
    this.unlock();
  }

  private async authenticate(): Promise<boolean> {
    if (this.prompting) return false;
    this.prompting = true;
    try {
      await BiometricAuth.authenticate({
        reason: this.language.t('lock.reason'),
        cancelTitle: this.language.t('common.cancel'),
        androidTitle: this.language.t('lock.title'),
        androidSubtitle: this.language.t('lock.subtitle'),
        // Sans empreinte enregistrée (ou si elle échoue), le code du téléphone prend le relais.
        allowDeviceCredential: true,
      });
      return true;
    } catch {
      return false;
    } finally {
      this.prompting = false;
    }
  }
}
