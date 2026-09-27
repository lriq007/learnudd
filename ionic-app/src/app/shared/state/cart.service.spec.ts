import { TestBed } from '@angular/core/testing';
import { CartService } from './cart.service';

// Covers the CAP-7 spec's I/O matrix row: "CartService total vacio".
describe('CartService', () => {
  it('total() es 0 con items() vacio, y suma tras addItem()', () => {
    const service = TestBed.inject(CartService);

    expect(service.items()).toEqual([]);
    expect(service.total()).toBe(0);

    service.addItem({ id: '1', type: 'note', title: 'Resumen de Cálculo II', price: 3500 });
    expect(service.total()).toBe(3500);
  });
});
