import { TestBed } from '@angular/core/testing';
import { ToastComponent } from './toast.component';

// Covers the CAP-7 spec's I/O matrix row: "Toast auto-dismiss" — the
// non-timer parts of the contract only. The real 3000ms auto-dismiss is
// ion-toast's own native (Stencil) timer, verified manually against a live
// /kit render (see the spec's Implementation Notes); re-implementing that
// timer in a jsdom unit test would just be testing Ionic's own component,
// not this app's code.
describe('ToastComponent', () => {
  it('duration por defecto es 3000ms', () => {
    const fixture = TestBed.createComponent(ToastComponent);
    fixture.componentRef.setInput('message', 'Guardado con éxito');
    expect(fixture.componentInstance.duration()).toBe(3000);
  });

  it('onDidDismiss() (disparado por ion-toast al vencer duration, o al cerrar manualmente) limpia isOpen', () => {
    const fixture = TestBed.createComponent(ToastComponent);
    fixture.componentRef.setInput('message', 'Guardado con éxito');
    fixture.componentRef.setInput('isOpen', true);
    fixture.detectChanges();

    expect(fixture.componentInstance.isOpen()).toBe(true);

    fixture.componentInstance.onDidDismiss();

    expect(fixture.componentInstance.isOpen()).toBe(false);
  });
});
