import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { vi } from 'vitest';

import { MessagesPage } from './messages.page';
import { AuthService } from '../shared/state/auth.service';
import { MessagesService } from '../shared/state/messages.service';
import type { Conversation } from '../shared/models';

function makeConversation(overrides: Partial<Conversation> = {}): Conversation {
  return {
    otherUser: { id: 'u2', full_name: 'Diego Fuentes', avatar_url: null } as Conversation['otherUser'],
    lastMessage: 'Hola, ¿sigue disponible el horario?',
    lastMessageTime: new Date().toISOString(),
    unread: false,
    ...overrides,
  };
}

// Covers the CAP-5 spec's I/O matrix rows: "Lista de conversaciones" and
// "Sin mensajes".
describe('MessagesPage', () => {
  function setup(overrides: { userId?: string | null; conversations?: Conversation[] } = {}) {
    const messagesServiceStub = {
      listConversations: vi.fn().mockResolvedValue(overrides.conversations ?? []),
    };
    const authStub = {
      user: vi.fn().mockReturnValue(overrides.userId === null ? null : { id: overrides.userId ?? 'u1' }),
    };

    TestBed.configureTestingModule({
      imports: [MessagesPage],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: authStub },
        { provide: MessagesService, useValue: messagesServiceStub },
      ],
    });

    const fixture = TestBed.createComponent(MessagesPage);
    return { fixture, component: fixture.componentInstance, messagesServiceStub };
  }

  it('sin sesión: no llama a MessagesService y deja de cargar', async () => {
    const { fixture, component, messagesServiceStub } = setup({ userId: null });

    fixture.detectChanges();
    await Promise.resolve();

    expect(messagesServiceStub.listConversations).not.toHaveBeenCalled();
    expect(component.loading()).toBe(false);
  });

  it('sin mensajes: muestra EmptyStateComponent', async () => {
    const { fixture, messagesServiceStub } = setup({ conversations: [] });

    fixture.detectChanges();
    await messagesServiceStub.listConversations.mock.results[0]!.value;
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('app-empty-state')).not.toBeNull();
    expect(fixture.nativeElement.textContent).toContain('No tienes mensajes');
  });

  it('lista de conversaciones: muestra avatar+iniciales, hora relativa y badge no-leído solo cuando unread es true', async () => {
    const conversations = [
      makeConversation({ otherUser: { id: 'u2', full_name: 'Diego Fuentes', avatar_url: null } as Conversation['otherUser'], unread: true }),
      makeConversation({
        otherUser: { id: 'u3', full_name: 'Martina Rojas', avatar_url: null } as Conversation['otherUser'],
        lastMessage: 'Gracias por la clase!',
        unread: false,
      }),
    ];
    const { fixture, component, messagesServiceStub } = setup({ conversations });

    fixture.detectChanges();
    await messagesServiceStub.listConversations.mock.results[0]!.value;
    fixture.detectChanges();

    expect(component.conversations()).toEqual(conversations);
    expect(fixture.nativeElement.textContent).toContain('Diego Fuentes');
    expect(fixture.nativeElement.textContent).toContain('DF');
    expect(fixture.nativeElement.textContent).toContain('Martina Rojas');
    expect(fixture.nativeElement.textContent).toContain('Gracias por la clase!');
    expect(fixture.nativeElement.querySelectorAll('app-badge').length).toBe(1);

    const links = fixture.nativeElement.querySelectorAll('a.messages-item-link');
    expect(links[0].getAttribute('href')).toBe('/messages/u2');
    expect(links[1].getAttribute('href')).toBe('/messages/u3');
  });
});
