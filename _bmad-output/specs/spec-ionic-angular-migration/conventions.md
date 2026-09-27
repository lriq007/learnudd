# Convenciones técnicas Angular para la migración

Decisiones de implementación (el HOW) que sostienen las constraints de `SPEC.md`. Acordadas en la sesión de arquitectura previa (bmad-party-mode).

## Componentes

- **Standalone components**: sin `NgModule`. Cada componente declara sus propios `imports`.

## Estado

- **Signals + `computed()`** para todo estado y valor derivado. No servicios con `BehaviorSubject`/RxJS para estado local de componente (RxJS sigue siendo válido para streams async, p. ej. Supabase Realtime).

## Control de flujo en templates

- Usar la sintaxis moderna: `@if`, `@for`, `@empty`, `@switch`.
- No usar las directivas estructurales clásicas `*ngIf` / `*ngFor`.

## Formularios

- **Template-driven forms** con `ngModel` + `FormsModule`. No Reactive Forms.
- `ngModel` sobre un signal no admite el shorthand `[(ngModel)]` directo. Usar la forma explícita:
  ```html
  <input [ngModel]="valor()" (ngModelChange)="valor.set($event)" />
  ```

## Cutover de Vercel (CAP-8)

El proyecto de Vercel está configurado hoy con Framework Preset "Next.js", guardado en su configuración (no se re-detecta solo en cada push). Al cerrar CAP-8, hay que cambiar manualmente en **Vercel → Project → Settings → General → Build & Development Settings**:

1. **Framework Preset:** Next.js → Angular.
2. **Build Command:** `ng build` (o `ionic build`, que internamente llama a `ng build`).
3. **Output Directory:** `dist/<nombre-del-proyecto>` — con el builder esbuild de Angular suele ser `dist/<nombre-del-proyecto>/browser`; verificar contra el output real del primer build local.
