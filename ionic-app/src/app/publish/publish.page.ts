import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IonContent, IonIcon } from '@ionic/angular';
import { bookOutline, peopleOutline } from 'ionicons/icons';

import { HeaderComponent } from '../shared/layout/header/header.component';
import { CardComponent } from '../shared/ui/card/card.component';

// Ported 1:1 from src/app/(protected)/publish/page.tsx (the chooser, 2
// Card+Link pairs). Per Boundaries: the "Ofrecer clases" card links to
// /publish/tutor (CAP-4, not migrated yet) and falls into the app's existing
// wildcard catch-all — same accepted pattern already used by CAP-2/CAP-3 for
// links to un-migrated domains, not a new decision this spec makes. Icons:
// lucide's BookOpen/Users swapped for ionicons book-outline/people-outline —
// the same substitutes already used elsewhere in this app for notes/tutors
// (library.page.ts, explore.page.ts).
@Component({
  selector: 'app-publish-page',
  standalone: true,
  imports: [IonContent, IonIcon, RouterLink, HeaderComponent, CardComponent],
  templateUrl: './publish.page.html',
  styleUrl: './publish.page.scss',
})
export class PublishPage {
  readonly bookIcon = bookOutline;
  readonly peopleIcon = peopleOutline;
}
