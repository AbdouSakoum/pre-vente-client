import { Injectable } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { Directory, Filesystem } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';

/**
 * Remet un fichier reçu de l'API au client. Sur téléphone : enregistré dans le cache puis proposé
 * par la feuille de partage (ouvrir, enregistrer, envoyer). Dans le navigateur : téléchargé.
 */
@Injectable({ providedIn: 'root' })
export class FileService {
  async save(blob: Blob, fileName: string): Promise<void> {
    if (!Capacitor.isNativePlatform()) return this.download(blob, fileName);
    const data = await this.toBase64(blob);
    await Filesystem.writeFile({ path: fileName, data, directory: Directory.Cache });
    const { uri } = await Filesystem.getUri({ path: fileName, directory: Directory.Cache });
    try { await Share.share({ title: fileName, url: uri }); } catch { /* partage annulé */ }
  }

  private download(blob: Blob, fileName: string) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = fileName;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 10000);
  }

  private toBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result).split(',')[1] || '');
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(blob);
    });
  }
}
