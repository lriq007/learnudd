import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';

import { MessagesService } from './messages.service';
import { SupabaseService } from './supabase.service';

interface QueryMock {
  select: ReturnType<typeof vi.fn>;
  eq: ReturnType<typeof vi.fn>;
  or: ReturnType<typeof vi.fn>;
  order: ReturnType<typeof vi.fn>;
  insert: ReturnType<typeof vi.fn>;
  update: ReturnType<typeof vi.fn>;
  then: <T>(onFulfilled: (value: { data: unknown; error?: unknown }) => T) => Promise<T>;
}

// Mirrors the fluent Supabase query builder just enough for MessagesService's
// own chains to run and resolve via `await` — same helper shape as
// notes.service.spec.ts/bookings.service.spec.ts.
function createQueryMock(result: { data: unknown; error?: unknown }): QueryMock {
  const mock: QueryMock = {
    select: vi.fn(() => mock),
    eq: vi.fn(() => mock),
    or: vi.fn(() => mock),
    order: vi.fn(() => mock),
    insert: vi.fn(() => mock),
    update: vi.fn(() => mock),
    then: (onFulfilled) => Promise.resolve(result).then(onFulfilled),
  };
  return mock;
}

interface ChannelMock {
  on: ReturnType<typeof vi.fn>;
  subscribe: ReturnType<typeof vi.fn>;
  capturedCallback: ((payload: { new: unknown }) => void) | null;
}

function createChannelMock(): ChannelMock {
  const channel: ChannelMock = {
    capturedCallback: null,
    on: vi.fn(),
    subscribe: vi.fn(),
  };
  channel.on.mockImplementation((_event: string, _opts: unknown, cb: (payload: { new: unknown }) => void) => {
    channel.capturedCallback = cb;
    return channel;
  });
  channel.subscribe.mockImplementation(() => channel);
  return channel;
}

describe('MessagesService', () => {
  function setup(client: unknown) {
    TestBed.configureTestingModule({
      providers: [{ provide: SupabaseService, useValue: { client } }],
    });
    return TestBed.inject(MessagesService);
  }

  // CAP-5: I/O matrix "Lista de conversaciones" / "Sin mensajes".
  describe('listConversations()', () => {
    it('resuelve [] cuando Supabase no está configurado (cliente null)', async () => {
      const service = setup(null);

      await expect(service.listConversations('u1')).resolves.toEqual([]);
    });

    it('pide los mensajes del usuario con el doble join de perfiles, ordenados desc (paridad fetchConversations líneas 36-44)', async () => {
      const query = createQueryMock({ data: [] });
      const from = vi.fn(() => query);
      const service = setup({ from });

      await service.listConversations('u1');

      expect(from).toHaveBeenCalledWith('messages');
      expect(query.select).toHaveBeenCalledWith(expect.stringContaining('sender:profiles!messages_sender_id_fkey'));
      expect(query.select).toHaveBeenCalledWith(expect.stringContaining('receiver:profiles!messages_receiver_id_fkey'));
      expect(query.or).toHaveBeenCalledWith('sender_id.eq.u1,receiver_id.eq.u1');
      expect(query.order).toHaveBeenCalledWith('created_at', { ascending: false });
    });

    it('agrupa por contraparte quedándose con el primer mensaje visto (el más reciente) y marca unread solo cuando el último mensaje recibido no está leído', async () => {
      const messages = [
        {
          id: 'm3',
          sender_id: 'u1',
          receiver_id: 'u2',
          content: 'later',
          created_at: '2026-01-03',
          read: true,
          receiver: { id: 'u2', full_name: 'Bob', avatar_url: null },
        },
        {
          id: 'm2',
          sender_id: 'u2',
          receiver_id: 'u1',
          content: 'earlier reply (mismo contraparte, debe ignorarse)',
          created_at: '2026-01-02',
          read: false,
          sender: { id: 'u2', full_name: 'Bob', avatar_url: null },
        },
        {
          id: 'm1',
          sender_id: 'u3',
          receiver_id: 'u1',
          content: 'other convo',
          created_at: '2026-01-01',
          read: false,
          sender: { id: 'u3', full_name: 'Carla', avatar_url: null },
        },
      ];
      const query = createQueryMock({ data: messages });
      const service = setup({ from: vi.fn(() => query) });

      const result = await service.listConversations('u1');

      expect(result).toEqual([
        {
          otherUser: { id: 'u2', full_name: 'Bob', avatar_url: null },
          lastMessage: 'later',
          lastMessageTime: '2026-01-03',
          unread: false,
        },
        {
          otherUser: { id: 'u3', full_name: 'Carla', avatar_url: null },
          lastMessage: 'other convo',
          lastMessageTime: '2026-01-01',
          unread: true,
        },
      ]);
    });

    it('cae a [] cuando data es null', async () => {
      const query = createQueryMock({ data: null });
      const service = setup({ from: vi.fn(() => query) });

      await expect(service.listConversations('u1')).resolves.toEqual([]);
    });

    it('usa full_name/avatar_url null cuando el join de perfil no vino en la fila', async () => {
      const messages = [{ id: 'm1', sender_id: 'u2', receiver_id: 'u1', content: 'hola', created_at: '2026-01-01', read: false }];
      const query = createQueryMock({ data: messages });
      const service = setup({ from: vi.fn(() => query) });

      const result = await service.listConversations('u1');

      expect(result[0]!.otherUser).toEqual({ id: 'u2', full_name: null, avatar_url: null });
    });
  });

  // CAP-5: I/O matrix "Abrir chat".
  describe('listForConversation()', () => {
    it('resuelve [] cuando Supabase no está configurado (cliente null)', async () => {
      const service = setup(null);

      await expect(service.listForConversation('u1', 'u2')).resolves.toEqual([]);
    });

    it('pide el historial entre ambos usuarios, ordenado asc (paridad fetchData líneas 38-44)', async () => {
      const messages = [{ id: 'm1' }];
      const query = createQueryMock({ data: messages });
      const from = vi.fn(() => query);
      const service = setup({ from });

      const result = await service.listForConversation('u1', 'u2');

      expect(from).toHaveBeenCalledWith('messages');
      expect(query.select).toHaveBeenCalledWith('*');
      expect(query.or).toHaveBeenCalledWith('and(sender_id.eq.u1,receiver_id.eq.u2),and(sender_id.eq.u2,receiver_id.eq.u1)');
      expect(query.order).toHaveBeenCalledWith('created_at', { ascending: true });
      expect(result).toBe(messages);
    });

    it('cae a [] cuando data es null', async () => {
      const query = createQueryMock({ data: null });
      const service = setup({ from: vi.fn(() => query) });

      await expect(service.listForConversation('u1', 'u2')).resolves.toEqual([]);
    });
  });

  // CAP-5: I/O matrix "Abrir chat" (marcar leídos).
  describe('markRead()', () => {
    it('no llama a Supabase cuando el cliente es null', async () => {
      const service = setup(null);

      await expect(service.markRead('u1', 'u2')).resolves.toBeUndefined();
    });

    it('marca como leídos los mensajes recibidos de esa contraparte (paridad fetchData líneas 49-55)', async () => {
      const query = createQueryMock({ data: null, error: null });
      const from = vi.fn(() => query);
      const service = setup({ from });

      await service.markRead('u1', 'u2');

      expect(from).toHaveBeenCalledWith('messages');
      expect(query.update).toHaveBeenCalledWith({ read: true });
      expect(query.eq).toHaveBeenCalledWith('sender_id', 'u2');
      expect(query.eq).toHaveBeenCalledWith('receiver_id', 'u1');
      expect(query.eq).toHaveBeenCalledWith('read', false);
    });
  });

  // CAP-5: I/O matrix "Enviar mensaje".
  describe('send()', () => {
    it('devuelve error cuando Supabase no está configurado (cliente null)', async () => {
      const service = setup(null);

      await expect(service.send('u1', 'u2', 'hola')).resolves.toEqual({ error: 'Error al enviar el mensaje' });
    });

    it('inserta el mensaje (paridad handleSend líneas 89-101)', async () => {
      const query = createQueryMock({ data: null, error: null });
      const from = vi.fn(() => query);
      const service = setup({ from });

      const result = await service.send('u1', 'u2', 'hola');

      expect(from).toHaveBeenCalledWith('messages');
      expect(query.insert).toHaveBeenCalledWith({ sender_id: 'u1', receiver_id: 'u2', content: 'hola' });
      expect(result).toEqual({ error: null });
    });

    it('cuando el insert falla, devuelve el error genérico', async () => {
      const query = createQueryMock({ data: null, error: { message: 'boom' } });
      const service = setup({ from: vi.fn(() => query) });

      await expect(service.send('u1', 'u2', 'hola')).resolves.toEqual({ error: 'Error al enviar el mensaje' });
    });
  });

  // CAP-5: I/O matrix "Mensaje nuevo en vivo".
  describe('subscribeToConversation()', () => {
    it('resuelve null cuando Supabase no está configurado (cliente null)', () => {
      const service = setup(null);

      expect(service.subscribeToConversation('u2', vi.fn())).toBeNull();
    });

    it('abre un canal "messages" filtrado (mismo filtro roto que el MVP) y despacha solo los INSERT que matchean al otro usuario', () => {
      const channelMock = createChannelMock();
      const client = { channel: vi.fn(() => channelMock) };
      const service = setup(client);
      const onInsert = vi.fn();

      const result = service.subscribeToConversation('u2', onInsert);

      expect(client.channel).toHaveBeenCalledWith('messages');
      expect(channelMock.on).toHaveBeenCalledWith(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: 'or(sender_id.eq.u2,receiver_id.eq.u2)',
        },
        expect.any(Function),
      );
      expect(channelMock.subscribe).toHaveBeenCalled();
      expect(result).toBe(channelMock);

      channelMock.capturedCallback!({ new: { id: 'm1', sender_id: 'u2', receiver_id: 'u1' } });
      expect(onInsert).toHaveBeenCalledWith({ id: 'm1', sender_id: 'u2', receiver_id: 'u1' });

      onInsert.mockClear();
      channelMock.capturedCallback!({ new: { id: 'm2', sender_id: 'u3', receiver_id: 'u4' } });
      expect(onInsert).not.toHaveBeenCalled();
    });
  });

  describe('unsubscribe()', () => {
    it('no hace nada cuando channel es null', () => {
      const removeChannel = vi.fn();
      const service = setup({ removeChannel });

      service.unsubscribe(null);

      expect(removeChannel).not.toHaveBeenCalled();
    });

    it('remueve el canal cuando existe', () => {
      const removeChannel = vi.fn();
      const service = setup({ removeChannel });
      const fakeChannel = createChannelMock();

      service.unsubscribe(fakeChannel as never);

      expect(removeChannel).toHaveBeenCalledWith(fakeChannel);
    });
  });
});
