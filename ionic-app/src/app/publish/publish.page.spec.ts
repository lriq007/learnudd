import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { PublishPage } from './publish.page';

// Smoke test for the CAP-3 spec's chooser: 2 cards, each linking to its
// target route (Publicar apunte -> /publish/note, Ofrecer clases ->
// /publish/tutor, the latter falling into the app's existing catch-all).
describe('PublishPage', () => {
  function setup() {
    TestBed.configureTestingModule({
      imports: [PublishPage],
      providers: [provideRouter([])],
    });

    const fixture = TestBed.createComponent(PublishPage);
    fixture.detectChanges();
    return { fixture };
  }

  it('muestra las 2 tarjetas del chooser', () => {
    const { fixture } = setup();

    expect(fixture.nativeElement.textContent).toContain('Publicar apunte');
    expect(fixture.nativeElement.textContent).toContain('Ofrecer clases');
    expect(fixture.nativeElement.querySelectorAll('app-card').length).toBe(2);
  });

  it('"Publicar apunte" enlaza a /publish/note y "Ofrecer clases" a /publish/tutor', () => {
    const { fixture } = setup();

    const links = fixture.nativeElement.querySelectorAll('a.publish-option') as NodeListOf<HTMLAnchorElement>;
    expect(links.length).toBe(2);
    expect(links[0]!.getAttribute('href')).toBe('/publish/note');
    expect(links[1]!.getAttribute('href')).toBe('/publish/tutor');
  });
});
