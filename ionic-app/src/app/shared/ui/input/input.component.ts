import { Component, computed, input, model } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IonInput } from '@ionic/angular';

// Ported from src/components/ui/Input.tsx onto ion-input + ngModel (template
// driven), per spec's explicit form: [ngModel]="value()" (ngModelChange)="value.set($event)".
// label/error/hint are Ionic-less custom markup (Ionic doesn't give the same
// label/error/hint layout out of the box), matching the original.
@Component({
  selector: 'app-input',
  standalone: true,
  imports: [IonInput, FormsModule],
  templateUrl: './input.component.html',
  styleUrl: './input.component.scss',
})
export class InputComponent {
  readonly value = model<string>('');
  readonly label = input<string>();
  readonly error = input<string>();
  readonly hint = input<string>();
  readonly placeholder = input<string>();
  readonly type = input<'text' | 'email' | 'password' | 'number' | 'search' | 'tel'>('text');
  readonly disabled = input(false);
  readonly id = input<string>();

  readonly inputId = computed(() => {
    const explicit = this.id();
    if (explicit) return explicit;
    const label = this.label();
    return label ? label.toLowerCase().replace(/\s+/g, '-') : undefined;
  });
}
