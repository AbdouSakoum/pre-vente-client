import { Component, ElementRef, EventEmitter, Input, OnChanges, Output, ViewChild } from '@angular/core';
import { formatMoney, initials, mediaUrl } from '../../../../shared/format';
import { OfferCard } from '../../../../shared/offers';

/** Le temps restant passe en alerte à partir de ce nombre de jours. */
const URGENT_DAYS = 3;

/**
 * « Offres du moment » : carrousel de bannières, une promotion par bannière (accueil, et accueil de
 * la boutique d'un fournisseur). La bannière est l'image chargée par le distributeur sur la promotion ;
 * sans image, une bannière est dessinée. Le nom de l'offre, la remise et le temps restant sont écrits en
 * vrai texte sous l'image (une image peut être illisible sur un petit écran).
 * Pas de défilement automatique (sur téléphone, une bannière qui change pendant qu'on la touche ouvre la
 * mauvaise offre — Baymard) : on glisse au doigt, la bannière suivante dépasse au bord, des points indiquent
 * la position. Toucher une bannière émet `pick`.
 */
@Component({
  selector: 'app-offers-carousel',
  templateUrl: './offers-carousel.component.html',
  styleUrls: ['./offers-carousel.component.scss'],
  standalone: false,
})
export class OffersCarouselComponent implements OnChanges {
  @Input({ required: true }) cards: OfferCard[] = [];
  /** Titre « Offres du moment » au-dessus (masqué quand la page a déjà le sien). */
  @Input() showTitle = true;
  @Output() pick = new EventEmitter<OfferCard>();
  @ViewChild('track') track?: ElementRef<HTMLElement>;

  /** Bannière affichée, pour les points de position. */
  active = 0;

  readonly media = mediaUrl;
  readonly initials = initials;

  ngOnChanges() { this.active = Math.min(this.active, Math.max(0, this.cards.length - 1)); }

  money(card: OfferCard, value: number | null): string { return formatMoney(value, card.currency); }

  /** Clé de traduction du temps restant. */
  remainingKey(card: OfferCard): string {
    if (card.daysLeft === 0) return 'offers.lastDay';
    return card.daysLeft === 1 ? 'offers.oneDay' : 'offers.days';
  }

  urgent(card: OfferCard): boolean { return card.daysLeft !== null && card.daysLeft <= URGENT_DAYS; }

  open(card: OfferCard) { this.pick.emit(card); }

  /** Défilement : la bannière la plus proche du bord de départ devient la bannière active. */
  onScroll() {
    const el = this.track?.nativeElement;
    const first = el?.firstElementChild as HTMLElement | null;
    if (!el || !first) return;
    const step = first.offsetWidth + parseFloat(getComputedStyle(el).columnGap || '0');
    // En arabe (droite à gauche), scrollLeft est négatif.
    this.active = step > 0 ? Math.max(0, Math.min(this.cards.length - 1, Math.round(Math.abs(el.scrollLeft) / step))) : 0;
  }

  /** Toucher un point amène sa bannière. */
  goTo(index: number) {
    const slide = this.track?.nativeElement.children[index] as HTMLElement | undefined;
    slide?.scrollIntoView({ behavior: 'smooth', inline: 'start', block: 'nearest' });
  }

  trackCard(_: number, card: OfferCard) { return (card.linkId || '') + card.promo.id; }
}
