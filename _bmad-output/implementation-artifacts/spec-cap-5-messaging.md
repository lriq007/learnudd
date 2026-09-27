---
title: 'CAP-5: Mensajería (Supabase Realtime) en Ionic+Angular'
type: 'feature'
created: '2026-09-27'
status: 'done'
route: 'dispatch'
review_loop_iteration: 0
context: []
baseline_commit: 'c27015d106772ed29123991ee529baf3f52fe56a'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** CAP-1/CAP-2/CAP-3/CAP-4/CAP-7 migraron auth, home/explore/favorites, notes marketplace y tutoring/bookings, pero mensajería (lista de conversaciones + chat 1:1 en tiempo real) no existe en Ionic+Angular todavía: los 3 links ya wired (tab "Mensajes" del navbar, ícono de notificaciones del header, botón de mensaje en tutor-detail) caen en el catch-all (`redirectTo: 'kit'`).

**Approach:** Portar 1:1 desde el MVP Next.js (`src/app/(protected)/messages/page.tsx` y `.../messages/[id]/page.tsx`) la lista de conversaciones (derivadas client-side de la tabla `messages`, sin tabla `conversations`) y el chat individual con Supabase Realtime (`postgres_changes` INSERT), reusando los patrones ya establecidos (servicio fail-soft, signals, `route.paramMap` con dedupe + descarte de respuestas fuera de orden como en `tutor-detail.page.ts`).

## Boundaries & Constraints

**Always:**
- Reusar UI kit y servicios existentes (`HeaderComponent`, `CardComponent`, `EmptyStateComponent`, `SkeletonComponent`, `BadgeComponent`, `ToastComponent`, `SupabaseService`, `AuthService`, `protectedGuard`, `formatRelativeTime`/`getInitials` de `shared/utils.ts`) sin crear componentes de kit nuevos, salvo la burbuja de mensaje (no existe en el kit ni como componente compartido en el MVP).
- "Conversación" sigue sin ser una tabla — se deriva client-side agrupando `messages` por la contraparte (`sender_id`/`receiver_id`), igual que el MVP; la ruta de chat identifica al otro usuario, no una conversación (`/messages/:userId`).
- Nuevos métodos de `MessagesService` siguen el patrón fail-soft (cliente `null` → `[]`) y `{error: string|null}` de mutaciones ya usado en `NotesService`/`BookingsService`.

**Never:**
- Corregir el conteo de no-leídos (hoy es un flag booleano por conversación, no un conteo real) ni el filtro Realtime `or(...)` del canal (el MVP tiene el mismo hueco) — documentar en `deferred-work.md`, no arreglar.
- Agregar envío optimista de mensajes — el MVP también depende 100% del roundtrip de Realtime para mostrar el propio mensaje enviado.
- Agregar manejo de errores de red o guarda anti doble-tap en enviar/marcar-leído — mismo patrón ya diferido repetidamente (CAP-2/3/4).
- Crear una tabla `conversations` o cambiar el modelo de datos de `messages` — Supabase se mantiene tal cual (constraint del SPEC madre).
- Agregar `aria-label` al botón de mensaje de tutor-detail — ya diferido en `deferred-work.md` para un pase de accesibilidad dedicado.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Lista de conversaciones | usuario con mensajes enviados/recibidos | Filas agrupadas por contraparte, orden por mensaje más reciente, avatar+iniciales, texto truncado, hora relativa, badge no-leído si aplica | N/A |
| Sin mensajes | usuario sin `messages` propios | `EmptyStateComponent` ("No tienes mensajes") | N/A |
| Abrir chat | navegación a `/messages/:userId` | Historial ascendente por fecha, marca como leídos los recibidos de esa contraparte, suscripción Realtime activa | N/A |
| Mensaje nuevo en vivo | INSERT en `messages` relevante al chat abierto | aparece al final vía evento Realtime (incluye los propios, sin optimistic) + auto-scroll | N/A |
| Enviar mensaje | texto no vacío + botón/Enter | insert en `messages`, limpia input | insert falla → sin manejo explícito (paridad, ver Never) |
| Otro usuario inexistente | `:userId` sin match en `profiles` | título del chat cae a "Chat" (fallback del MVP) | N/A |

</frozen-after-approval>

## Code Map

- `ionic-app/src/app/shared/models.ts` -- agregar `Message` (paridad con `src/types/index.ts` líneas 142-152) y `Conversation` (tipo local, no existe en el MVP: `otherUser: Profile`, `lastMessage: string`, `lastMessageTime: string`, `unread: boolean`) para tipar `MessagesService.listConversations()`.
- `ionic-app/src/app/shared/state/messages.service.ts` -- crear -- `listConversations(userId): Promise<Conversation[]>` (portar `messages/page.tsx` líneas 36-74: select con doble join `sender:profiles!messages_sender_id_fkey`/`receiver:profiles!messages_receiver_id_fkey`, `.or('sender_id.eq.userId,receiver_id.eq.userId')`, orden desc, luego `Map` por contraparte quedándose con el primer mensaje visto); `listForConversation(userId, otherUserId): Promise<Message[]>` (`messages/[id]/page.tsx` líneas 38-44, orden asc); `markRead(userId, otherUserId): Promise<void>` (líneas 49-55, update fire-and-forget); `send(senderId, receiverId, content): Promise<{error: string | null}>` (líneas 89-101); `subscribeToConversation(otherUserId, onInsert): RealtimeChannel` + `unsubscribe(channel)` (líneas 60-83, `channel('messages').on('postgres_changes', {event:'INSERT', schema:'public', table:'messages'}, cb)`, filtrado también client-side dentro de `cb` por `sender_id`/`receiver_id === otherUserId`, mismo filtro roto que el MVP).
- `ionic-app/src/app/app.routes.ts` -- agregar `messages` → `MessagesPage` y `messages/:userId` → `ChatPage`, ambas con `protectedGuard`, antes del catch-all; actualizar el comentario del catch-all para sacar `/messages` del inventario de rutas atrapadas.
- `ionic-app/src/app/messages/messages.page.{ts,html,scss,spec.ts}` -- crear -- porta 1:1 `messages/page.tsx` (lista de conversaciones).
- `ionic-app/src/app/chat/chat.page.{ts,html,scss,spec.ts}` -- crear -- porta 1:1 `messages/[id]/page.tsx`; sigue el patrón de `tutor-detail.page.ts` (`route.paramMap` con dedupe de id vía `currentId` + descarte de respuestas fuera de orden, `removeChannel` en `ngOnDestroy`).
- Sin cambios de código en navbar/header/tutor-detail: los 3 links (`navbar.component.ts:48`, `header.component.html:23`, `tutor-detail.page.ts` `goToMessages()`) ya apuntan a `/messages`, dejan de caer en el catch-all.
- Ícono ionicons nuevo: `paperPlaneOutline` para el botón de enviar (sustituye `Send` de lucide).

## Tasks & Acceptance

**Execution:**
- [x] `ionic-app/src/app/shared/models.ts` -- agregar `Message`/`Conversation` -- tipos que faltan para mensajería
- [x] `ionic-app/src/app/shared/state/messages.service.ts` -- crear -- listar conversaciones, historial, marcar leído, enviar, suscripción Realtime
- [x] `ionic-app/src/app/app.routes.ts` -- agregar `messages` y `messages/:userId` con `protectedGuard` -- hoy caen en el catch-all
- [x] `ionic-app/src/app/messages/` -- crear página -- lista de conversaciones
- [x] `ionic-app/src/app/chat/` -- crear página -- chat individual con Realtime
- [x] Tests unitarios para cada método de servicio nuevo y cada página nueva, cubriendo cada fila de la I/O & Edge-Case Matrix -- prevenir regresiones de paridad

**Acceptance Criteria:**
- Given un usuario autenticado con mensajes previos, when navega a `/messages`, then ve sus conversaciones agrupadas por contraparte, ordenadas por más reciente.
- Given un chat abierto, when el otro usuario envía un mensaje nuevo (INSERT en `messages`), then aparece automáticamente sin recargar, vía Realtime.
- Given un usuario sin sesión, when intenta entrar a `/messages` o `/messages/:userId`, then `protectedGuard` lo redirige a `/login`.

## Implementation Notes

- Decision (documented, not silent): `MessagesService.subscribeToConversation()`/`unsubscribe()` widen the Code Map's literal `RealtimeChannel` return type to `RealtimeChannel | null`. Every other new method on this service resolves a `null` Supabase client to a safe fallback (`[]`/`{error}`/no-op) instead of throwing — a `null` client can't open a channel either, and `ChatPage` needs to keep working (Realtime just never connects) when Supabase isn't configured, same as every other page in the app. `unsubscribe()` takes the widened type too so `ChatPage.ngOnDestroy()` can call it unconditionally.
- Decision (documented, not silent): `ChatPage` injects `SupabaseService` directly for the one `profiles` lookup (the "other user" header/fallback-to-"Chat" data) instead of adding a method to `MessagesService` for it — `MessagesService`'s Code Map methods are all scoped to the `messages` table; the MVP itself keeps this same query inline in `ChatPage`, not in a shared store. `SupabaseService` is already listed in Boundaries as a service to reuse.
- Decision (documented, not silent): `ChatPage.loadConversation()` extends the `currentId`-dedupe + stale-response-discard pattern from `tutor-detail.page.ts`/`note-detail.page.ts` to also tear down the old Realtime channel (`messagesService.unsubscribe()`) before loading a new `:userId` and re-subscribe once the new conversation's data is in — a case those two pages don't have (no subscription to manage), but the same Angular route-reuse mechanics apply (this component instance is reused across a `/messages/:userId` → `/messages/:otherId` navigation, which the MVP's Next.js page-per-route model never has to handle). Covered by a dedicated test in `chat.page.spec.ts`.
- Decision (documented, not silent): `HeaderComponent`'s existing `[slot=right-action]` projection slot (added in CAP-7, unused until now) is exactly the MVP's `rightAction` prop — used here for the chat header's other-user avatar. Per 1:1 parity, `showNotifications` is left at its default (`true`), matching the MVP's `ChatPage` header call (which never sets `showNotifications={false}`) — this means the notifications bell renders alongside the avatar on the chat page, an apparent MVP oversight that is reproduced rather than fixed.
- `MessagesPage` includes `<app-navbar>` (like home/explore/favorites/library); `ChatPage` doesn't (like note-detail/tutor-detail/bookings) — in the MVP, Navbar is rendered once by the shared `(protected)` layout and is technically visible on every protected page, chat included; the Ionic port's established precedent (since CAP-2/CAP-3) only includes it on top-level list/browse pages, not drill-down sub-pages, and this spec follows that precedent rather than the MVP's literal always-on behavior.
- The 2 gaps Never explicitly calls out (boolean `unread` flag instead of a real count; the unscoped Realtime `filter`/client-side check) are logged in `deferred-work.md`, verified line-by-line against the MVP first (same gaps exist there).

## Spec Change Log

## Review Triage Log

- **[blind-hunter]** `ChatPage`'s Realtime subscription solo abre después de esperar secuencialmente el perfil, el historial y el marcado de leído; el MVP abre el canal en paralelo (misma llamada de efecto, sin esperar `fetchData`). — `low`: verificado en `messages/[id]/page.tsx` líneas 58-78 (el `channel(...).subscribe()` corre síncrono, no dentro de `fetchData`); el port amplía la ventana en la que un mensaje entrante durante la carga inicial no sería capturado por la suscripción en vivo. → **patch**.
- **[blind-hunter + verification-gap]** `chat.page.spec.ts` nunca llama `fixture.detectChanges()` ni renderiza `chat.page.html`, dejando sin test: el estilo `isMine` de las burbujas, el habilitado/deshabilitado del botón de enviar (`canSend`), el disparo real de `keydown` sobre el `<ion-input>`, y el efecto de auto-scroll que la fila "Mensaje nuevo en vivo" de la matriz exige explícitamente. — `medium`: verificado por grep — cero referencias a `detectChanges`/`isMine`/`canSend` fuera de comentarios en el archivo; el auto-scroll depende de un `viewChild` que solo se resuelve con render. Múltiples comportamientos reales quedan sin red de seguridad ante una regresión. → **patch**.
- **[blind-hunter]** El test "cambia el `:userId` de la ruta" en `chat.page.spec.ts` solo verifica cuántas veces se llamó `subscribeToConversation`/`unsubscribe`, nunca que `otherUser()`/`messages()` reflejen la nueva conversación en vez de datos obsoletos de la anterior. — `medium`: real, mismo tipo de hueco que ya causó el bug de datos obsoletos que CAP-4 tuvo que patchear en `tutor-detail.page.ts`. → **patch**.
- **[blind-hunter]** `ChatPage.getInitials` (`readonly getInitials = getInitials;`) es código muerto — la plantilla solo usa el computed `otherUserInitials()`, a diferencia del mismo campo en `MessagesPage`, que sí se usa en su plantilla. — `low`: confirmado por lectura de `chat.page.html`. → **patch**.
- **[blind-hunter]** `MessagesService.listConversations()` arma `Conversation.otherUser` con `{ id, full_name, avatar_url } as Profile` — un objeto parcial forzado al tipo completo `Profile`; el resto de los campos declarados quedan `undefined` sin protección de compilador para un futuro consumidor. — `low`: confirmado en el código; hoy ningún caller lee esos campos, pero el tipo miente sobre su disponibilidad. → **patch**.
- **[blind-hunter]** Los controles del composer de chat (botón enviar ícono-only, `<ion-input>` del mensaje) no tienen `aria-label`. — `false`: verificado que el MVP (`messages/[id]/page.tsx`, el `<input>` y el `<Button><Send/></Button>`) tiene exactamente el mismo hueco en ambos controles — paridad fiel, no un gap adicional introducido por este spec (ya diferido repetidamente como clase de accesibilidad en CAP-2/CAP-4).
- **[blind-hunter]** La rama sin loading de `chat.page.html` no tiene ningún estado vacío cuando `messages()` es `[]` (primer intercambio con un contacto) — queda un área de scroll en blanco. — `false`: verificado que el MVP (`messages/[id]/page.tsx`) tampoco tiene ningún estado vacío para una conversación sin mensajes — paridad fiel.
- **[verification-gap]** `isMine()` no tiene ningún test que lo ejercite directa o indirectamente (ver fila de arriba, mismo root cause: sin render de plantilla). — `medium`: invertir la comparación de `isMine()` cambiaría de lado todas las burbujas del chat sin que ningún test fallara. → **patch**.
- **[verification-gap]** `canSend()` no tiene ningún test que lo ejercite (mismo root cause: sin render de plantilla). — `medium`: invertir la comparación de `canSend()` dejaría el botón de enviar permanentemente deshabilitado para touch/mouse sin que ningún test fallara (el camino de Enter no lo consulta). → **patch**.
- **[verification-gap + edge-case-hunter]** `loadConversation()` no tiene ninguna guarda ligada a la destrucción del componente — si el componente se destruye mientras una llamada sigue en vuelo, `ngOnDestroy()` desuscribe `this.channel` cuando todavía es `null`, y la promesa pendiente abre un canal más tarde que ya nunca se desuscribe. — `medium`: verificado leyendo `ngOnDestroy()`/`loadConversation()` — las guardas comparan `otherUserId !== this.currentId` por valor, no por instancia de llamada ni por estado de destrucción. → **patch**.
- **[edge-case-hunter]** Navegación rápida A→B→A entre dos conversaciones puede dejar dos llamadas a `loadConversation()` en vuelo apuntando ambas a "A" (la guarda por valor de `currentId` no las distingue), y ambas terminan abriendo su propio canal Realtime para la misma conversación — una queda huérfana (fuga) y los mensajes nuevos se entregan/renderizan duplicados. Mismo root cause que la fila anterior (guarda por valor en vez de por generación/instancia de llamada). — `medium`: verificado trazando la secuencia A→B→A contra el código actual de `loadConversation()`. → **patch**.
- **[edge-case-hunter]** `ChatPage.send()` limpia `newMessage()` incondicionalmente al tener éxito, sin comprobar si el `:userId` de la ruta (y por lo tanto el borrador visible) cambió mientras la llamada estaba en vuelo — enviar en una conversación y cambiar rápido a otra antes de que resuelva borra el borrador que el usuario ya está escribiendo en la nueva. — `medium`: real y específico de este port — el MVP nunca reutiliza la misma instancia de página entre conversaciones (una ruta Next.js por chat), así que este borrado cruzado no puede ocurrir ahí. → **patch**.
- **[edge-case-hunter]** Si `listForConversation`/`markRead`/el `select` de `profiles` en `loadConversation()` rechaza, `loading()` queda en `true` para siempre. — `false` (fuera de alcance): excluido explícitamente por el Never de este spec ("agregar manejo de errores de red... mismo patrón ya diferido repetidamente CAP-2/3/4") y paridad fiel — la `fetchData` del MVP tampoco tiene try/catch.
- **[edge-case-hunter]** Si `listConversations()` en `messages.page.ts` rechaza, `loading()` queda en `true` para siempre. — `false` (fuera de alcance): mismo Never explícito que la fila anterior, misma paridad fiel con el MVP.
- **[edge-case-hunter]** `onKeydown()` dispara enviar en Enter incluso durante una composición IME (entrada CJK), pudiendo enviar texto a medio componer. — `false`: verificado que `handleKeyDown` del MVP tiene exactamente el mismo `if (e.key === 'Enter' && !e.shiftKey)` sin chequear `isComposing` — paridad fiel.
- **[edge-case-hunter]** El filtro Realtime de `subscribeToConversation()` (canal `'messages'` + filtro `or(...)` + re-chequeo client-side) no está acotado al usuario actual — un INSERT entre `otherUserId` y un tercer usuario también despacha el callback. — `false` (fuera de alcance): es exactamente el mismo hueco documentado ya en el Never de este spec y ya registrado en `deferred-work.md` por esta misma implementación — no es un hallazgo nuevo.
- **[edge-case-hunter]** Una fila de `messages` con `sender_id === receiver_id === userId` produciría una conversación consigo mismo. — `false`: no existe ningún flujo de la UI (navbar, header, tutor-detail, bookings) que navegue a `/messages/:userId` con el propio id del usuario — estado no demostrado como alcanzable.

## Design Notes

El param de ruta se llama `:userId` (no `:id` como en el MVP) para dejar explícito que no es un id de conversación ni de mensaje, sino el id del otro usuario en `profiles` — coherente con que no existe tabla `conversations`. La página de chat vive en una carpeta separada (`chat/`, clase `ChatPage`) en vez de anidarse bajo `messages/`, para no chocar con el nombre de la página de lista (`messages/`, clase `MessagesPage`); el MVP no tiene esta colisión porque usa carpetas de ruta (`messages/[id]`), no clases.

## Verification

**Commands:**
- `npx ng test` -- ejecutado tras los patches de la review: 203/207 tests pasan; los 4 que fallan son el flake preexistente de `auth.service.spec.ts` (`TypeError: fetch failed`), confirmado no relacionado: pasa aislado (6/6) y este diff nunca toca `auth.service.ts`. Incluye los tests nuevos/reescritos de `chat.page.spec.ts` (generación/destroy, no-borrado-de-draft, resubscribe síncrono con datos frescos, sub-suite de rendering para `isMine`/`canSend`/`keydown` real/auto-scroll), `messages.service.spec.ts`, `messages.page.spec.ts` y las 4 rutas nuevas en `app.routes.spec.ts`.
- `npx ng build` -- ejecutado: build sin errores; solo los 4 warnings preexistentes de presupuesto de estilos por-componente (`tutor-detail`, `publish-note`, `note-detail`, `home`), ninguno nuevo en `messages`/`chat`.
- `npx ng lint` -- ejecutado: sin errores.

Patches aplicados tras la review (7, ver Review Triage Log): `loadConversation()` reemplaza sus guardas por-valor por un contador de generación (protege contra fuga de canal en destroy y contra doble-canal en navegación rápida A→B→A); el canal Realtime ahora se abre en paralelo con los fetches, no después (paridad con el MVP); `send()` ya no borra el draft si el usuario cambió de conversación mientras la llamada estaba en vuelo; se eliminó el campo muerto `getInitials` de `ChatPage`; `Conversation.otherUser` se angostó a `Pick<Profile, 'id' | 'full_name' | 'avatar_url'>` sin cast forzado; `chat.page.spec.ts` gana cobertura de render real (clases de burbuja, `canSend()`, `keydown` real, auto-scroll) y de la data final tras un cambio de `:userId`.
