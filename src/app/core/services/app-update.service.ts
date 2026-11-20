import { Injectable } from '@angular/core';
import { AlertController } from '@ionic/angular';
import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { firstValueFrom } from 'rxjs';
import { ApiService } from './api.service';
import { LanguageService } from './language.service';

interface AppVersionInfo {
  latest_version: string | null;
  min_version: string | null;
  /** Jours avant que la dernière version devienne obligatoire (null : pas de délai). */
  days_left: number | null;
  store_url: string;
  notes: { fr: string[]; ar: string[] };
}

/** Retour au premier plan : nouvelle vérification si l'application est restée en arrière-plan au moins ce temps. */
const RECHECK_MS = 60 * 60 * 1000;

/** « 0.1.2-dev » → « 0.1.2 » : le suffixe d'une version de test n'entre pas dans la comparaison. */
export function baseVersion(v: string): string { return String(v || '').split('-')[0]; }

/** Compare deux versions « x.y.z » : négatif si a < b. */
function compareVersions(a: string, b: string): number {
  const pa = baseVersion(a).split('.').map(n => Number(n) || 0);
  const pb = baseVersion(b).split('.').map(n => Number(n) || 0);
  for (let i = 0; i < 3; i++) if ((pa[i] || 0) !== (pb[i] || 0)) return (pa[i] || 0) - (pb[i] || 0);
  return 0;
}

/**
 * Mise à jour de Stradi Connect. À chaque ouverture (et au retour après une heure en arrière-plan),
 * compare la version installée à la dernière publiée (GET /client-app/app-version, réglée sur le
 * serveur) : la mise à jour est proposée à chaque fois, avec le nombre de jours restants ; passé ce
 * délai (ou sous la version minimale), la fenêtre ne se ferme plus tant que l'application n'est pas
 * à jour. Silencieux dans un navigateur ou si le serveur ne répond pas : jamais bloquer par erreur.
 */
@Injectable({ providedIn: 'root' })
export class AppUpdateService {
  private open = false;
  private lastCheck = 0;

  constructor(private api: ApiService, private alertCtrl: AlertController, private language: LanguageService) {}

  /** À appeler une fois au démarrage de l'application. */
  start() {
    if (!Capacitor.isNativePlatform()) return;
    this.check();
    App.addListener('resume', () => { if (Date.now() - this.lastCheck >= RECHECK_MS || this.open) this.check(); });
  }

  private async check() {
    if (this.open) return;
    this.lastCheck = Date.now();
    try {
      const [{ version: installed }, info] = await Promise.all([
        App.getInfo(),
        firstValueFrom(this.api.get<AppVersionInfo>('/app-version')),
      ]);
      if (!info.latest_version || compareVersions(installed, info.latest_version) >= 0) return;
      const mandatory = !!info.min_version && compareVersions(installed, info.min_version) < 0;
      await this.prompt(info, mandatory);
    } catch {
      /* Hors ligne ou serveur indisponible : rien à proposer. */
    }
  }

  private async prompt(info: AppVersionInfo, mandatory: boolean) {
    const t = (key: string, params?: Record<string, unknown>) => this.language.t(key, params);
    const notes = info.notes[this.language.current() === 'ar' ? 'ar' : 'fr'] || [];
    const deadline = mandatory ? t('appUpdate.mandatory')
      : info.days_left != null ? this.daysLeft(info.days_left) : undefined;
    const alert = await this.alertCtrl.create({
      header: t('appUpdate.title', { version: info.latest_version }),
      subHeader: deadline,
      message: [t('appUpdate.intro'), ...notes.map(n => `• ${n}`)].join('\n'),
      cssClass: 'app-update-alert',
      backdropDismiss: !mandatory,
      keyboardClose: false,
      buttons: [
        ...(mandatory ? [] : [{ text: t('appUpdate.later'), role: 'cancel' }]),
        // Obligatoire : la fenêtre reste ouverte après le passage au Play Store.
        { text: t('appUpdate.update'), handler: () => { this.openStore(info.store_url); return !mandatory; } },
      ],
    });
    this.open = true;
    alert.onDidDismiss().then(() => { this.open = false; });
    await alert.present();
  }

  /** « Obligatoire dans 1 jour / 3 jours » : forme du pluriel de la langue, sinon le texte simple (arabe). */
  private daysLeft(n: number): string {
    const form = new Intl.PluralRules(this.language.current()).select(n);
    for (const key of [`appUpdate.daysLeft.${form}`, 'appUpdate.daysLeft.other', 'appUpdate.daysLeft']) {
      const text = this.language.t(key, { n });
      if (typeof text === 'string' && text !== key) return text;
    }
    return '';
  }

  /** Fiche Play Store de l'application (l'app Play Store si possible, sinon le site). */
  private openStore(storeUrl: string) {
    const id = new URL(storeUrl).searchParams.get('id');
    window.open(id ? `market://details?id=${id}` : storeUrl, '_system');
  }
}
