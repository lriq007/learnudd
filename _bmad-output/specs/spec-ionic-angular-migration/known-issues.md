# Bugs preexistentes del MVP (backlog de producción)

Detectados leyendo el código durante la sesión de arquitectura previa. No bloquean ni forman parte de esta migración (ver Non-goals en `SPEC.md`); quedan registrados para no perderse.

1. **Ingresos de creador siempre en 0.** `profile/creator` calcula ingresos/ventas con `.in('note_id', [])`, un arreglo siempre vacío, por lo que la consulta nunca trae resultados.
2. **Filtro de tabs sin implementar en biblioteca.** `library.tsx` tiene un `TODO` pendiente para el filtro de tabs.
3. **Pago simulado.** La compra ("purchase") de apuntes usa un `setTimeout` en vez de una pasarela de pago real.
4. **Credenciales demo hardcodeadas.** `login.tsx` tiene credenciales de demostración hardcodeadas que deben salir antes de producción.
