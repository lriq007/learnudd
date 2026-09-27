import { Component, computed, inject, signal } from '@angular/core';
import { IonContent, IonIcon, IonInput, IonSelect, IonSelectOption, IonTextarea } from '@ionic/angular';
import { addOutline, checkmarkCircleOutline, closeOutline } from 'ionicons/icons';

import { HeaderComponent } from '../shared/layout/header/header.component';
import { ButtonComponent } from '../shared/ui/button/button.component';
import { CardComponent } from '../shared/ui/card/card.component';
import { InputComponent } from '../shared/ui/input/input.component';
import { ToastComponent, type ToastType } from '../shared/ui/toast/toast.component';

import { AuthService } from '../shared/state/auth.service';
import { TutorsService } from '../shared/state/tutors.service';
import { CAMPUS_OPTIONS, MAJOR_OPTIONS } from '../shared/models';

// Ported 1:1 from src/app/(protected)/publish/tutor/page.tsx. Per Boundaries:
// unlike publish-note.page.ts (a 4-step wizard, `step` signal + `canProceed`
// per step), the MVP tutor page is a single flat form with one submit button
// at the end -- no step/canProceed here, only `canSubmit`. The dynamic
// courses list has no kit component precedent (Design Notes): a plain
// `signal<CourseRow[]>` updated via push/filter/map-by-index, same minimal
// logic as the MVP's own array spreads.
interface CourseRow {
  course_name: string;
  major: string;
}

const MODALITY_OPTIONS = ['presencial', 'online'] as const;

@Component({
  selector: 'app-publish-tutor-page',
  standalone: true,
  imports: [
    IonContent,
    IonIcon,
    IonInput,
    IonSelect,
    IonSelectOption,
    IonTextarea,
    HeaderComponent,
    ButtonComponent,
    CardComponent,
    InputComponent,
    ToastComponent,
  ],
  templateUrl: './publish-tutor.page.html',
  styleUrl: './publish-tutor.page.scss',
})
export class PublishTutorPage {
  private readonly auth = inject(AuthService);
  private readonly tutorsService = inject(TutorsService);

  readonly campusOptions = CAMPUS_OPTIONS;
  readonly majorOptions = MAJOR_OPTIONS;
  readonly modalityOptions = MODALITY_OPTIONS;

  readonly checkIcon = checkmarkCircleOutline;
  readonly addIcon = addOutline;
  readonly closeIcon = closeOutline;

  readonly loading = signal(false);

  readonly bio = signal('');
  readonly experience = signal('');
  readonly hourlyPrice = signal(10000);
  readonly campus = signal<string>(CAMPUS_OPTIONS[0]);
  readonly modalities = signal<string[]>([]);
  readonly courses = signal<CourseRow[]>([{ course_name: '', major: '' }]);

  readonly toastOpen = signal(false);
  readonly toastType = signal<ToastType>('info');
  readonly toastMessage = signal('');

  // Frozen validation: bio && modalities.length > 0 && courses.some(complete).
  readonly canSubmit = computed(
    () => !!this.bio() && this.modalities().length > 0 && this.courses().some((c) => !!c.course_name && !!c.major),
  );

  setBio(value: string | null | undefined): void {
    this.bio.set(value ?? '');
  }

  setCampus(value: string): void {
    this.campus.set(value);
  }

  setHourlyPrice(value: string | number | null | undefined): void {
    this.hourlyPrice.set(parseInt(String(value ?? ''), 10) || 0);
  }

  toggleModality(modality: string): void {
    this.modalities.update((mods) =>
      mods.includes(modality) ? mods.filter((m) => m !== modality) : [...mods, modality],
    );
  }

  addCourse(): void {
    this.courses.update((courses) => [...courses, { course_name: '', major: '' }]);
  }

  removeCourse(index: number): void {
    this.courses.update((courses) => courses.filter((_, i) => i !== index));
  }

  updateCourse(index: number, field: keyof CourseRow, value: string): void {
    this.courses.update((courses) => courses.map((c, i) => (i === index ? { ...c, [field]: value } : c)));
  }

  async submit(): Promise<void> {
    const userId = this.auth.user()?.id;
    if (!userId) return;

    this.loading.set(true);

    const { error } = await this.tutorsService.create(userId, {
      bio: this.bio(),
      experience: this.experience(),
      hourly_price: this.hourlyPrice(),
      campus: this.campus(),
      modalities: this.modalities(),
      courses: this.courses(),
    });

    if (error) {
      this.showToast('error', error);
    } else {
      // Frozen Decision: no redirect after a successful submit -- only the
      // toast, the user stays on the page (/profile/creator, CAP-6, doesn't
      // exist yet), same precedent as publish-note.page.ts.
      this.showToast('success', '¡Perfil de tutor creado!');
    }

    this.loading.set(false);
  }

  private showToast(type: ToastType, message: string): void {
    this.toastType.set(type);
    this.toastMessage.set(message);
    this.toastOpen.set(true);
  }
}
