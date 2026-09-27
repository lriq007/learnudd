import { TestBed } from '@angular/core/testing';
import { star, starHalf, starOutline } from 'ionicons/icons';
import { RatingStarsComponent } from './rating-stars.component';

// Covers the CAP-7 spec's I/O matrix row: "RatingStars medio-relleno".
describe('RatingStarsComponent', () => {
  it('rating=3.5 -> 3 llenas, 1 media, 1 vacia, y showValue muestra "3.5"', () => {
    const fixture = TestBed.createComponent(RatingStarsComponent);
    fixture.componentRef.setInput('rating', 3.5);
    fixture.detectChanges();

    const stars = fixture.componentInstance.stars();
    expect(stars.map((s) => s.icon)).toEqual([star, star, star, starHalf, starOutline]);
    expect(stars.filter((s) => s.filled).length).toBe(3);

    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('3.5');
  });
});
