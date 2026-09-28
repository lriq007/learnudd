import { Component, DestroyRef, ElementRef, OnDestroy, OnInit, computed, effect, inject, signal, viewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { IonContent, IonIcon, IonInput } from '@ionic/angular';
import { paperPlaneOutline } from 'ionicons/icons';
import type { RealtimeChannel } from '@supabase/supabase-js';

import { HeaderComponent } from '../shared/layout/header/header.component';
import { ButtonComponent } from '../shared/ui/button/button.component';
import { SkeletonComponent } from '../shared/ui/skeleton/skeleton.component';

import { AuthService } from '../shared/state/auth.service';
import { MessagesService } from '../shared/state/messages.service';
import { SupabaseService } from '../shared/state/supabase.service';
import type { Message, Profile } from '../shared/models';
import { formatRelativeTime, getInitials } from '../shared/utils';

// Ported 1:1 from src/app/(protected)/messages/[id]/page.tsx. Lives in its
// own `chat/` folder as `ChatPage` (not nested under `messages/`) to avoid a
// class-name collision with MessagesPage — the MVP doesn't have this
// collision because it uses route folders (`messages/[id]`), not classes
// (Design Notes). Route param is `:userId` (not `:id`): this identifies the
// OTHER USER in the chat, not a conversation/message id — no `conversations`
// table exists.
//
// Same route-reactivity dedupe (`currentId`) + stale-response discard as
// tutor-detail.page.ts/note-detail.page.ts, extended here to also tear down
// and re-open the Realtime subscription when `:userId` changes — a case
// neither of those pages has, but the same Angular route-reuse mechanics
// apply (this component instance is reused across a `/messages/:userId` →
// `/messages/:otherId` navigation).
@Component({
  selector: 'app-chat-page',
  standalone: true,
  imports: [IonContent, IonIcon, IonInput, HeaderComponent, ButtonComponent, SkeletonComponent],
  templateUrl: './chat.page.html',
  styleUrl: './chat.page.scss',
})
export class ChatPage implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly auth = inject(AuthService);
  private readonly messagesService = inject(MessagesService);
  private readonly supabaseService = inject(SupabaseService);
  private readonly destroyRef = inject(DestroyRef);

  private currentId: string | null = null;
  private channel: RealtimeChannel | null = null;
  // Per-call token: bumped on every loadConversation() call and in
  // ngOnDestroy(). A call only applies its effects (state writes, storing
  // `this.channel`, dispatching Realtime inserts) while its own token still
  // matches — this is what actually protects against two overlapping calls
  // both targeting the same id (rapid A→B→A) and against a channel opened
  // after the component was already destroyed; plain id-equality checks
  // can't tell those cases apart.
  private generation = 0;

  readonly messagesEnd = viewChild<ElementRef<HTMLDivElement>>('messagesEnd');

  readonly sendIcon = paperPlaneOutline;

  readonly messages = signal<Message[]>([]);
  readonly otherUser = signal<Profile | null>(null);
  readonly newMessage = signal('');
  readonly loading = signal(true);

  readonly skeletonRows = [1, 2, 3];

  readonly formatRelativeTime = formatRelativeTime;

  // I/O matrix: "Otro usuario inexistente" — title falls back to "Chat",
  // ported 1:1 from `otherUser?.full_name || 'Chat'`.
  readonly headerTitle = computed(() => this.otherUser()?.full_name || 'Chat');
  readonly otherUserInitials = computed(() => getInitials(this.otherUser()?.full_name || 'U'));
  readonly canSend = computed(() => this.newMessage().trim().length > 0);

  constructor() {
    // Ported from the MVP's `useEffect(() => { messagesEndRef.current?.
    // scrollIntoView(...) }, [messages])` — auto-scroll on every new message
    // (including the round-tripped copy of the user's own, per Never: no
    // optimistic send).
    effect(() => {
      this.messages();
      this.messagesEnd()?.nativeElement.scrollIntoView({ behavior: 'smooth' });
    });
  }

  async ngOnInit(): Promise<void> {
    const initialId = this.route.snapshot.paramMap.get('userId');
    this.currentId = initialId;

    this.route.paramMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      const userId = params.get('userId');
      if (userId === this.currentId) return;
      this.currentId = userId;
      void this.loadConversation(userId);
    });

    await this.loadConversation(initialId);
  }

  ngOnDestroy(): void {
    // Invalidate any in-flight loadConversation() call first — otherwise a
    // call suspended at one of its `await`s below would resume after this
    // runs and still store/re-open a channel nothing will ever unsubscribe.
    this.generation++;
    this.messagesService.unsubscribe(this.channel);
    this.channel = null;
  }

  private async loadConversation(otherUserId: string | null): Promise<void> {
    const myGeneration = ++this.generation;

    const userId = this.auth.user()?.id;
    if (!userId || !otherUserId) {
      this.messagesService.unsubscribe(this.channel);
      this.channel = null;
      this.otherUser.set(null);
      this.messages.set([]);
      this.loading.set(false);
      return;
    }

    this.loading.set(true);

    // Open the Realtime channel immediately — in parallel with the fetches
    // below, matching the MVP (messages/[id]/page.tsx líneas 58-78) — instead
    // of waiting for every await to finish first, which would widen the
    // window where an incoming message during initial load is missed. The
    // callback only applies an insert while this call's token is still the
    // current one, so a message routed to a superseded call is dropped
    // rather than corrupting the newer conversation's state.
    const channel = this.messagesService.subscribeToConversation(otherUserId, (message) => {
      if (myGeneration !== this.generation) return;
      this.messages.update((current) => [...current, message]);
    });
    this.messagesService.unsubscribe(this.channel);
    this.channel = channel;

    // Per Boundaries: reuses SupabaseService directly for this one
    // `profiles` lookup — MessagesService's boundary is the `messages` table,
    // same split the MVP has (its own `profiles` query lives inline in
    // ChatPage, not in a shared store).
    const client = this.supabaseService.client;
    const otherUserData: Profile | null = client
      ? ((await client.from('profiles').select('*').eq('id', otherUserId).single()).data as Profile | null)
      : null;

    // Review-fix pattern (tutor-detail.page.ts/note-detail.page.ts), now on
    // the generation token instead of an id-equality check: discard a stale
    // response if a newer call (or ngOnDestroy()) has already taken over.
    if (myGeneration !== this.generation) return;
    this.otherUser.set(otherUserData);

    const msgs = await this.messagesService.listForConversation(userId, otherUserId);
    if (myGeneration !== this.generation) return;
    this.messages.set(msgs);
    this.loading.set(false);

    await this.messagesService.markRead(userId, otherUserId);
  }

  isMine(message: Message): boolean {
    return message.sender_id === this.auth.user()?.id;
  }

  setNewMessage(value: string | null | undefined): void {
    this.newMessage.set(value ?? '');
  }

  onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      void this.send();
    }
  }

  // Ported 1:1 from handleSend (líneas 89-101). Per Never: no optimistic
  // insert, no error toast, no anti-double-tap guard — same parity gaps the
  // MVP has.
  async send(): Promise<void> {
    const userId = this.auth.user()?.id;
    const otherUserId = this.currentId;
    const content = this.newMessage().trim();
    if (!userId || !otherUserId || !content) return;

    const { error } = await this.messagesService.send(userId, otherUserId, content);

    // Only clear the draft if the route is still on the conversation this
    // send() was issued for — otherwise a slow send while the user has
    // already navigated to a different chat would wipe that OTHER
    // conversation's in-progress draft.
    if (!error && this.currentId === otherUserId) {
      this.newMessage.set('');
    }
  }
}
