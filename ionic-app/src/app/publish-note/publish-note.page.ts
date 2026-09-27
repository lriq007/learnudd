import { Component, computed, inject, signal } from '@angular/core';
import { IonContent, IonIcon, IonInput, IonSelect, IonSelectOption, IonTextarea } from '@ionic/angular';
import { checkmarkCircleOutline, sparklesOutline } from 'ionicons/icons';

import { ButtonComponent } from '../shared/ui/button/button.component';
import { CardComponent } from '../shared/ui/card/card.component';
import { InputComponent } from '../shared/ui/input/input.component';
import { ToastComponent, type ToastType } from '../shared/ui/toast/toast.component';

import { AuthService } from '../shared/state/auth.service';
import { NotesService } from '../shared/state/notes.service';
import { MAJOR_OPTIONS, MATERIAL_TYPE_OPTIONS, SEMESTER_OPTIONS, type AIDeclaration } from '../shared/models';
import { formatCLP } from '../shared/utils';

// Ported 1:1 from src/app/(protected)/publish/note/page.tsx (the 4-step
// wizard), following the wizard pattern established by onboarding.page.ts:
// a `step` signal, a `canProceed` computed, and `app-button` [variant]
// toggles for the option grids/rows. Per Boundaries: same 4 steps, same
// fields, same per-step validation, same quick prices [0, 2490, 3990, 5490],
// same insert (status: 'review', no file_url/cover_url — no Storage upload,
// the MVP doesn't do one either). Per the frozen Decision: a successful
// publish only shows the success toast — no redirect, the user stays on
// step 4 (there is no /profile/creator, CAP-6, to send them to yet).
const AI_DECLARATION_OPTIONS: ReadonlyArray<{ value: AIDeclaration; label: string; desc: string }> = [
  { value: 'none', label: 'Sin IA', desc: 'Creé este material sin usar IA' },
  { value: 'assisted', label: 'Asistido por IA', desc: 'Usé IA como herramienta, revisé todo manualmente' },
  { value: 'generated', label: 'Generado con IA', desc: 'La IA generó el contenido, lo revisé antes de publicar' },
];

const QUICK_PRICES = [0, 2490, 3990, 5490] as const;

@Component({
  selector: 'app-publish-note-page',
  standalone: true,
  imports: [
    IonContent,
    IonIcon,
    IonInput,
    IonSelect,
    IonSelectOption,
    IonTextarea,
    ButtonComponent,
    CardComponent,
    InputComponent,
    ToastComponent,
  ],
  templateUrl: './publish-note.page.html',
  styleUrl: './publish-note.page.scss',
})
export class PublishNotePage {
  private readonly auth = inject(AuthService);
  private readonly notesService = inject(NotesService);

  readonly majorOptions = MAJOR_OPTIONS;
  readonly semesterOptions = SEMESTER_OPTIONS;
  readonly materialTypeOptions = MATERIAL_TYPE_OPTIONS;
  readonly aiDeclarationOptions = AI_DECLARATION_OPTIONS;
  readonly quickPrices = QUICK_PRICES;

  readonly checkIcon = checkmarkCircleOutline;
  readonly aiIcon = sparklesOutline;

  readonly totalSteps = 4;
  readonly step = signal(1);
  readonly loading = signal(false);

  readonly title = signal('');
  readonly description = signal('');
  readonly major = signal('');
  readonly course = signal('');
  readonly semester = signal('');
  readonly materialType = signal('');
  readonly price = signal(0);
  readonly pagesInput = signal('');
  readonly aiDeclaration = signal<AIDeclaration>('none');
  readonly aiDetails = signal('');

  readonly toastOpen = signal(false);
  readonly toastType = signal<ToastType>('info');
  readonly toastMessage = signal('');

  readonly progress = computed(() => (this.step() / this.totalSteps) * 100);

  readonly stepLabel = computed(() => {
    switch (this.step()) {
      case 1:
        return 'Datos básicos';
      case 2:
        return 'Categoría';
      case 3:
        return 'Precio';
      default:
        return 'Revisión';
    }
  });

  readonly canProceed = computed(() => {
    switch (this.step()) {
      case 1:
        return !!this.title() && !!this.course();
      case 2:
        return !!this.major() && !!this.materialType();
      case 3:
        return true;
      case 4:
        return true;
      default:
        return false;
    }
  });

  readonly priceLabel = computed(() => this.formatPrice(this.price()));

  formatPrice(price: number): string {
    return price === 0 ? 'Gratis' : formatCLP(price);
  }

  setMajor(value: string): void {
    this.major.set(value);
  }

  // Ported 1:1 from the MVP: unlike onboarding's semester select, the note
  // wizard stores the full option label ("1° Semestre"), not just the
  // ordinal — no split(' ')[0] here.
  setSemester(value: string): void {
    this.semester.set(value);
  }

  setDescription(value: string | null | undefined): void {
    this.description.set(value ?? '');
  }

  setPrice(value: string | number | null | undefined): void {
    this.price.set(parseInt(String(value ?? ''), 10) || 0);
  }

  selectMaterialType(value: string): void {
    this.materialType.set(value);
  }

  selectAiDeclaration(value: AIDeclaration): void {
    this.aiDeclaration.set(value);
  }

  back(): void {
    if (this.step() > 1) {
      this.step.update((s) => s - 1);
    }
  }

  // I/O matrix: "Wizard paso incompleto" — never advances the step when
  // canProceed() is false (mirrors the MVP's disabled Button).
  next(): void {
    if (!this.canProceed()) return;
    if (this.step() < this.totalSteps) {
      this.step.update((s) => s + 1);
    }
  }

  async submit(): Promise<void> {
    const userId = this.auth.user()?.id;
    if (!userId) return;

    this.loading.set(true);

    const { error } = await this.notesService.create(userId, {
      title: this.title(),
      description: this.description(),
      major: this.major(),
      course: this.course(),
      semester: this.semester(),
      material_type: this.materialType(),
      price: this.price(),
      pages: parseInt(this.pagesInput(), 10) || 0,
      ai_declaration: this.aiDeclaration(),
      ai_details: this.aiDetails(),
    });

    if (error) {
      this.showToast('error', error);
    } else {
      this.showToast('success', '¡Apunte enviado a revisión!');
    }

    this.loading.set(false);
  }

  private showToast(type: ToastType, message: string): void {
    this.toastType.set(type);
    this.toastMessage.set(message);
    this.toastOpen.set(true);
  }
}
