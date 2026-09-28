import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IonContent, IonIcon } from '@ionic/angular';
import { chatbubbleOutline } from 'ionicons/icons';

import { HeaderComponent } from '../shared/layout/header/header.component';
import { NavbarComponent } from '../shared/layout/navbar/navbar.component';
import { CardComponent } from '../shared/ui/card/card.component';
import { BadgeComponent } from '../shared/ui/badge/badge.component';
import { EmptyStateComponent } from '../shared/ui/empty-state/empty-state.component';
import { SkeletonComponent } from '../shared/ui/skeleton/skeleton.component';

import { AuthService } from '../shared/state/auth.service';
import { MessagesService } from '../shared/state/messages.service';
import type { Conversation } from '../shared/models';
import { formatRelativeTime, getInitials } from '../shared/utils';

// Ported 1:1 from src/app/(protected)/messages/page.tsx. In the MVP, Navbar
// is rendered by the shared (protected) layout, not by this page itself —
// here it's included directly, same as home/explore/favorites/library
// (top-level list/browse destinations), unlike note-detail/tutor-detail/
// bookings/chat (drill-down sub-pages, no navbar).
@Component({
  selector: 'app-messages-page',
  standalone: true,
  imports: [
    IonContent,
    IonIcon,
    RouterLink,
    HeaderComponent,
    NavbarComponent,
    CardComponent,
    BadgeComponent,
    EmptyStateComponent,
    SkeletonComponent,
  ],
  templateUrl: './messages.page.html',
  styleUrl: './messages.page.scss',
})
export class MessagesPage implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly messagesService = inject(MessagesService);

  readonly chatIcon = chatbubbleOutline;

  readonly conversations = signal<Conversation[]>([]);
  readonly loading = signal(true);

  readonly skeletonRows = [1, 2, 3];

  readonly formatRelativeTime = formatRelativeTime;
  readonly getInitials = getInitials;

  async ngOnInit(): Promise<void> {
    const userId = this.auth.user()?.id;
    if (!userId) {
      this.loading.set(false);
      return;
    }

    this.conversations.set(await this.messagesService.listConversations(userId));
    this.loading.set(false);
  }
}
