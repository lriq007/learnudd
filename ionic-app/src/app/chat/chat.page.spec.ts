import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { vi } from 'vitest';

import { ChatPage } from './chat.page';
import { ButtonComponent } from '../shared/ui/button/button.component';
import { AuthService } from '../shared/state/auth.service';
import { MessagesService } from '../shared/state/messages.service';
import { SupabaseService } from '../shared/state/supabase.service';
import type { Message, Profile } from '../shared/models';

const OTHER_USER: Profile = {
  id: 'u2',
  email: 'diego@udd.cl',
  full_name: 'Diego Fuentes',
  avatar_url: null,
  campus: 'Santiago',
  major: 'Ingeniería Civil Informática',
  semester: 8,
  interests: [],
  verified: true,
  created_at: '2026-01-01',
  onboarding_completed: true,
};

function makeMessage(overrides: Partial<Message>): Message {
  return {
    id: 'm1',
    sender_id: 'u2',
    receiver_id: 'u1',
    booking_id: null,
    content: 'hola',
    read: true,
    created_at: '2026-01-01',
    ...overrides,
  };
}

// Flushes loadConversation()'s 3 sequential awaits (profiles lookup →
// listForConversation → markRead) for the call at `index` (0 = first call),
// so a test that rendered via `fixture.detectChanges()` (automatic ngOnInit)
// can wait for the load to fully settle before asserting on the DOM.
async function flushLoad(
  profileQuery: { single: ReturnType<typeof vi.fn> },
  messagesServiceStub: { listForConversation: ReturnType<typeof vi.fn>; markRead: ReturnType<typeof vi.fn> },
  index = 0,
): Promise<void> {
  await profileQuery.single.mock.results[index]!.value;
  await messagesServiceStub.listForConversation.mock.results[index]!.value;
  await messagesServiceStub.markRead.mock.results[index]!.value;
}

// Covers the CAP-5 spec's I/O matrix rows: "Abrir chat", "Mensaje nuevo en
// vivo", "Enviar mensaje" and "Otro usuario inexistente".
describe('ChatPage', () => {
  let scrollIntoViewSpy: ReturnType<typeof vi.fn>;
  const originalScrollIntoView = Element.prototype.scrollIntoView;

  beforeEach(() => {
    // jsdom doesn't implement scrollIntoView — the auto-scroll effect calls
    // it for real once `#messagesEnd` is actually rendered (tests that use
    // `fixture.detectChanges()`), so stub it for every test in this file.
    scrollIntoViewSpy = vi.fn();
    Element.prototype.scrollIntoView = scrollIntoViewSpy as unknown as typeof Element.prototype.scrollIntoView;
  });

  afterEach(() => {
    Element.prototype.scrollIntoView = originalScrollIntoView;
  });

  function setup(overrides: {
    userId?: string | null;
    authUserId?: string | null;
    otherUserProfile?: Profile | null;
    messagesServiceStub?: Partial<
      Record<'listForConversation' | 'markRead' | 'send' | 'subscribeToConversation' | 'unsubscribe', ReturnType<typeof vi.fn>>
    >;
  } = {}) {
    const messagesServiceStub = {
      listForConversation: vi.fn().mockResolvedValue([]),
      markRead: vi.fn().mockResolvedValue(undefined),
      send: vi.fn().mockResolvedValue({ error: null }),
      subscribeToConversation: vi.fn().mockReturnValue({}),
      unsubscribe: vi.fn(),
      ...overrides.messagesServiceStub,
    };
    const authStub = {
      user: vi.fn().mockReturnValue(overrides.authUserId === null ? null : { id: overrides.authUserId ?? 'u1' }),
    };
    const profileQuery = {
      select: vi.fn(function (this: unknown) {
        return this;
      }),
      eq: vi.fn(function (this: unknown) {
        return this;
      }),
      single: vi.fn().mockResolvedValue({ data: overrides.otherUserProfile === undefined ? OTHER_USER : overrides.otherUserProfile, error: null }),
    };
    const supabaseServiceStub = { client: { from: vi.fn(() => profileQuery) } };

    const initialId = overrides.userId === undefined ? 'u2' : overrides.userId;
    const paramMap$ = new BehaviorSubject(convertToParamMap(initialId ? { userId: initialId } : {}));

    TestBed.configureTestingModule({
      imports: [ChatPage],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: authStub },
        { provide: MessagesService, useValue: messagesServiceStub },
        { provide: SupabaseService, useValue: supabaseServiceStub },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { paramMap: { get: (key: string) => (key === 'userId' ? initialId : null) } },
            paramMap: paramMap$,
          },
        },
      ],
    });

    const fixture = TestBed.createComponent(ChatPage);
    return { fixture, component: fixture.componentInstance, messagesServiceStub, paramMap$, profileQuery };
  }

  // Note: this sub-suite calls `component.ngOnInit()` directly (never
  // combined with `fixture.detectChanges()` on the same instance) and
  // asserts purely against component/signal state — the same discipline
  // tutor-detail.page.spec.ts documents: TestBed's own first
  // `detectChanges()` would otherwise trigger a SECOND, automatic `ngOnInit`
  // call (Angular has no way to know one was already invoked manually),
  // double-firing every service call this test counts. DOM-rendering
  // assertions live in their own sub-suite further below, using
  // `fixture.detectChanges()` exclusively.
  it('abrir chat: carga el otro usuario y el historial ascendente, marca leídos y se suscribe a Realtime', async () => {
    const messages = [makeMessage({ id: 'm1' }), makeMessage({ id: 'm2', sender_id: 'u1', receiver_id: 'u2' })];
    const { component, messagesServiceStub } = setup({
      messagesServiceStub: { listForConversation: vi.fn().mockResolvedValue(messages) },
    });

    await component.ngOnInit();

    expect(component.otherUser()).toEqual(OTHER_USER);
    expect(component.messages()).toEqual(messages);
    expect(component.loading()).toBe(false);
    expect(messagesServiceStub.listForConversation).toHaveBeenCalledWith('u1', 'u2');
    expect(messagesServiceStub.markRead).toHaveBeenCalledWith('u1', 'u2');
    expect(messagesServiceStub.subscribeToConversation).toHaveBeenCalledWith('u2', expect.any(Function));
  });

  it('otro usuario inexistente: headerTitle cae a "Chat"', async () => {
    const { component } = setup({ otherUserProfile: null });

    await component.ngOnInit();

    expect(component.otherUser()).toBeNull();
    expect(component.headerTitle()).toBe('Chat');
  });

  it('sin userId en la ruta: no llama a MessagesService y deja de cargar', async () => {
    const { component, messagesServiceStub } = setup({ userId: null });

    await component.ngOnInit();

    expect(messagesServiceStub.listForConversation).not.toHaveBeenCalled();
    expect(component.loading()).toBe(false);
  });

  it('sin sesión: no llama a MessagesService y deja de cargar', async () => {
    const { component, messagesServiceStub } = setup({ authUserId: null });

    await component.ngOnInit();

    expect(messagesServiceStub.listForConversation).not.toHaveBeenCalled();
    expect(component.loading()).toBe(false);
  });

  it('mensaje nuevo en vivo: el callback de Realtime agrega el mensaje al final', async () => {
    let capturedOnInsert!: (message: Message) => void;
    const { component } = setup({
      messagesServiceStub: {
        subscribeToConversation: vi.fn().mockImplementation((_otherId: string, onInsert: (m: Message) => void) => {
          capturedOnInsert = onInsert;
          return {};
        }),
      },
    });

    await component.ngOnInit();

    const newMsg = makeMessage({ id: 'm2', content: 'nuevo mensaje' });
    capturedOnInsert(newMsg);

    expect(component.messages()).toEqual([newMsg]);
  });

  it('enviar mensaje: limpia el input cuando el insert tiene éxito', async () => {
    const { component, messagesServiceStub } = setup({
      messagesServiceStub: { send: vi.fn().mockResolvedValue({ error: null }) },
    });

    await component.ngOnInit();
    component.setNewMessage('Hola!');

    await component.send();

    expect(messagesServiceStub.send).toHaveBeenCalledWith('u1', 'u2', 'Hola!');
    expect(component.newMessage()).toBe('');
  });

  it('enviar mensaje: mantiene el texto cuando el insert falla (sin manejo de error, paridad con el MVP)', async () => {
    const { component } = setup({
      messagesServiceStub: { send: vi.fn().mockResolvedValue({ error: 'boom' }) },
    });

    await component.ngOnInit();
    component.setNewMessage('Hola!');

    await component.send();

    expect(component.newMessage()).toBe('Hola!');
  });

  it('enviar mensaje: no llama a send() con texto vacío o solo espacios', async () => {
    const { component, messagesServiceStub } = setup();

    await component.ngOnInit();
    component.setNewMessage('   ');

    await component.send();

    expect(messagesServiceStub.send).not.toHaveBeenCalled();
  });

  it('enviar mensaje: no limpia el draft si el usuario ya navegó a otra conversación mientras el insert estaba en vuelo', async () => {
    let resolveSend!: (result: { error: string | null }) => void;
    const send = vi.fn().mockReturnValue(new Promise((resolve) => (resolveSend = resolve)));
    const { component } = setup({ messagesServiceStub: { send } });

    await component.ngOnInit();
    component.setNewMessage('Para u2');

    const sendPromise = component.send();
    // Navigate away to a different conversation while the send() to u2 is
    // still in flight.
    (component as unknown as { currentId: string | null }).currentId = 'u3';
    resolveSend({ error: null });
    await sendPromise;

    expect(component.newMessage()).toBe('Para u2');
  });

  it('onKeydown(): Enter sin Shift envía el mensaje y previene el default', async () => {
    const { component, messagesServiceStub } = setup();

    await component.ngOnInit();
    component.setNewMessage('Hola!');

    const event = new KeyboardEvent('keydown', { key: 'Enter' });
    const preventSpy = vi.spyOn(event, 'preventDefault');
    component.onKeydown(event);
    await Promise.resolve();

    expect(preventSpy).toHaveBeenCalled();
    expect(messagesServiceStub.send).toHaveBeenCalledWith('u1', 'u2', 'Hola!');
  });

  it('onKeydown(): Shift+Enter no envía el mensaje', async () => {
    const { component, messagesServiceStub } = setup();

    await component.ngOnInit();
    component.setNewMessage('Hola!');

    component.onKeydown(new KeyboardEvent('keydown', { key: 'Enter', shiftKey: true }));

    expect(messagesServiceStub.send).not.toHaveBeenCalled();
  });

  it('ngOnDestroy(): desuscribe el canal Realtime activo', async () => {
    const channel = {};
    const { component, messagesServiceStub } = setup({
      messagesServiceStub: { subscribeToConversation: vi.fn().mockReturnValue(channel) },
    });

    await component.ngOnInit();
    component.ngOnDestroy();

    expect(messagesServiceStub.unsubscribe).toHaveBeenCalledWith(channel);
  });

  // Review fix: ngOnDestroy() must invalidate any loadConversation() call
  // still in flight (suspended at one of its awaits) so it can't store/leak
  // a channel after destroy already ran.
  it('ngOnDestroy(): si loadConversation() sigue en vuelo, su canal ya abierto queda desuscrito y su resolución tardía no reabre uno nuevo', async () => {
    const channel = { id: 'c1' };
    let resolveProfile!: (value: { data: Profile | null; error: null }) => void;
    const profileQuery = {
      select: vi.fn(function (this: unknown) {
        return this;
      }),
      eq: vi.fn(function (this: unknown) {
        return this;
      }),
      single: vi.fn().mockReturnValue(new Promise((resolve) => (resolveProfile = resolve))),
    };
    const messagesServiceStub = {
      listForConversation: vi.fn().mockResolvedValue([]),
      markRead: vi.fn().mockResolvedValue(undefined),
      send: vi.fn(),
      subscribeToConversation: vi.fn().mockReturnValue(channel),
      unsubscribe: vi.fn(),
    };
    const authStub = { user: vi.fn().mockReturnValue({ id: 'u1' }) };
    const supabaseServiceStub = { client: { from: vi.fn(() => profileQuery) } };
    const paramMap$ = new BehaviorSubject(convertToParamMap({ userId: 'u2' }));

    TestBed.configureTestingModule({
      imports: [ChatPage],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: authStub },
        { provide: MessagesService, useValue: messagesServiceStub },
        { provide: SupabaseService, useValue: supabaseServiceStub },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { paramMap: { get: () => 'u2' } },
            paramMap: paramMap$,
          },
        },
      ],
    });
    const component = TestBed.createComponent(ChatPage).componentInstance;

    const initPromise = component.ngOnInit();
    // Channel opens synchronously (before the profile-lookup await) — it's
    // already stored by the time we destroy.
    expect(messagesServiceStub.subscribeToConversation).toHaveBeenCalledTimes(1);

    component.ngOnDestroy();
    expect(messagesServiceStub.unsubscribe).toHaveBeenCalledWith(channel);
    messagesServiceStub.unsubscribe.mockClear();

    // The suspended profile lookup resolves AFTER destroy.
    resolveProfile({ data: OTHER_USER, error: null });
    await initPromise;

    expect(component.otherUser()).toBeNull();
    expect(messagesServiceStub.listForConversation).not.toHaveBeenCalled();
    expect(messagesServiceStub.subscribeToConversation).toHaveBeenCalledTimes(1);
  });

  it('cambia el :userId de la ruta (misma instancia reusada): se resuscribe de inmediato (antes de cualquier await) y termina reflejando la nueva conversación', async () => {
    const channel1 = { id: 'c1' };
    const channel2 = { id: 'c2' };
    const subscribeToConversation = vi.fn().mockReturnValueOnce(channel1).mockReturnValueOnce(channel2);
    const otherUserU3: Profile = { ...OTHER_USER, id: 'u3', full_name: 'Martina Rojas' };
    const u3Message = makeMessage({ id: 'm3', sender_id: 'u3', receiver_id: 'u1', content: 'hola u3' });
    const listForConversation = vi.fn().mockImplementation((_userId: string, otherId: string) => Promise.resolve(otherId === 'u3' ? [u3Message] : []));
    const { component, paramMap$, messagesServiceStub, profileQuery } = setup({
      messagesServiceStub: { subscribeToConversation, listForConversation },
    });

    await component.ngOnInit();
    expect(messagesServiceStub.subscribeToConversation).toHaveBeenCalledTimes(1);

    profileQuery.single.mockResolvedValueOnce({ data: otherUserU3, error: null });
    paramMap$.next(convertToParamMap({ userId: 'u3' }));

    // The new channel opens synchronously, right after the top-of-function
    // guard — before any of loadConversation()'s awaits — so by the time
    // `next()` returns, the old channel is already torn down and the new
    // one already open (no window where the leaked/duplicated channel bug
    // could occur).
    expect(messagesServiceStub.unsubscribe).toHaveBeenCalledWith(channel1);
    expect(messagesServiceStub.subscribeToConversation).toHaveBeenCalledTimes(2);
    expect(messagesServiceStub.subscribeToConversation).toHaveBeenLastCalledWith('u3', expect.any(Function));

    // Flush the rest of loadConversation('u3') and confirm the component
    // ends up showing u3's data, not stale u2 data.
    await flushLoad(profileQuery, messagesServiceStub, 1);

    expect(component.otherUser()).toEqual(otherUserU3);
    expect(component.messages()).toEqual([u3Message]);
  });

  // DOM-rendering assertions: every test below uses `fixture.detectChanges()`
  // exclusively (never a manual `ngOnInit()` call on the same instance).
  describe('rendering', () => {
    it('renderiza la burbuja propia a la derecha y la de la contraparte a la izquierda', async () => {
      const messages = [
        makeMessage({ id: 'm1', sender_id: 'u2', receiver_id: 'u1', content: 'hola' }),
        makeMessage({ id: 'm2', sender_id: 'u1', receiver_id: 'u2', content: 'hola de vuelta' }),
      ];
      const { fixture, messagesServiceStub, profileQuery } = setup({
        messagesServiceStub: { listForConversation: vi.fn().mockResolvedValue(messages) },
      });

      fixture.detectChanges();
      await flushLoad(profileQuery, messagesServiceStub);
      fixture.detectChanges();

      const rows: HTMLElement[] = Array.from(fixture.nativeElement.querySelectorAll('.chat-bubble-row'));
      expect(rows).toHaveLength(2);
      expect(rows[0]!.classList.contains('chat-bubble-row--mine')).toBe(false);
      expect(rows[1]!.classList.contains('chat-bubble-row--mine')).toBe(true);
      expect(rows[0]!.querySelector('.chat-bubble')!.classList.contains('chat-bubble--mine')).toBe(false);
      expect(rows[1]!.querySelector('.chat-bubble')!.classList.contains('chat-bubble--mine')).toBe(true);
    });

    it('el botón de enviar refleja canSend(): deshabilitado sin texto, habilitado con texto', async () => {
      const { fixture, component, messagesServiceStub, profileQuery } = setup();

      fixture.detectChanges();
      await flushLoad(profileQuery, messagesServiceStub);
      fixture.detectChanges();

      const buttonDebugEl = fixture.debugElement.query(By.directive(ButtonComponent));
      expect(buttonDebugEl.componentInstance.disabled()).toBe(true);

      component.setNewMessage('Hola!');
      fixture.detectChanges();

      expect(buttonDebugEl.componentInstance.disabled()).toBe(false);

      component.setNewMessage('   ');
      fixture.detectChanges();

      expect(buttonDebugEl.componentInstance.disabled()).toBe(true);
    });

    it('un keydown real sobre el <ion-input> renderizado dispara send()', async () => {
      const { fixture, component, messagesServiceStub, profileQuery } = setup();

      fixture.detectChanges();
      await flushLoad(profileQuery, messagesServiceStub);
      fixture.detectChanges();

      component.setNewMessage('Hola real!');
      fixture.detectChanges();

      const input: HTMLElement = fixture.nativeElement.querySelector('ion-input');
      input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }));
      await Promise.resolve();

      expect(messagesServiceStub.send).toHaveBeenCalledWith('u1', 'u2', 'Hola real!');
    });

    it('autoscroll: hace scroll al final cuando messages() cambia por un INSERT de Realtime', async () => {
      let capturedOnInsert!: (message: Message) => void;
      const { fixture, messagesServiceStub, profileQuery } = setup({
        messagesServiceStub: {
          subscribeToConversation: vi.fn().mockImplementation((_otherId: string, onInsert: (m: Message) => void) => {
            capturedOnInsert = onInsert;
            return {};
          }),
        },
      });

      fixture.detectChanges();
      await flushLoad(profileQuery, messagesServiceStub);
      fixture.detectChanges();
      TestBed.flushEffects();
      scrollIntoViewSpy.mockClear();

      capturedOnInsert(makeMessage({ id: 'mX', content: 'nuevo mensaje' }));
      fixture.detectChanges();
      TestBed.flushEffects();

      expect(scrollIntoViewSpy).toHaveBeenCalledWith({ behavior: 'smooth' });
    });
  });
});
