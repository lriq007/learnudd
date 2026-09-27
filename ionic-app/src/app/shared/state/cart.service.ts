import { Injectable, computed, signal } from '@angular/core';
import type { CartItem } from '../models';

// Ported from src/stores/cartStore.ts (Zustand) to an injectable signal-based
// service. `getTotal()` becomes a `total` computed() signal (per Always:
// signals + computed() for all derived state).
@Injectable({ providedIn: 'root' })
export class CartService {
  private readonly _items = signal<CartItem[]>([]);

  readonly items = this._items.asReadonly();
  readonly total = computed(() => this._items().reduce((sum, item) => sum + item.price, 0));

  addItem(item: CartItem): void {
    this._items.update((items) => [...items, item]);
  }

  removeItem(id: string): void {
    this._items.update((items) => items.filter((item) => item.id !== id));
  }

  clearCart(): void {
    this._items.set([]);
  }
}
