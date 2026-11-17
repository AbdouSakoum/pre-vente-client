import { Component } from '@angular/core';
import { LanguageService } from '../../../core/services/language.service';

/** Bascule français / arabe : affiche le nom de l'autre langue. */
@Component({
  selector: 'app-lang-switch',
  templateUrl: './lang-switch.component.html',
  styleUrls: ['./lang-switch.component.scss'],
  standalone: false,
})
export class LangSwitchComponent {
  constructor(public language: LanguageService) {}
}
