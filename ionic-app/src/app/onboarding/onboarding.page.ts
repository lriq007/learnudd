import { Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { IonContent, IonSelect, IonSelectOption } from '@ionic/angular';

import { ButtonComponent } from '../shared/ui/button/button.component';
import { AuthService } from '../shared/state/auth.service';

// Ported from src/app/(protected)/onboarding/page.tsx. Per Code Map:
// CAMPUS_OPTIONS/MAJOR_OPTIONS/SEMESTER_OPTIONS are ported from
// src/types/index.ts (líneas 189-222); INTERESTS is ported from the page's
// own local array. Neither set is shared with any other ionic-app page yet,
// so both live here (not in shared/models.ts).
const CAMPUS_OPTIONS = ['Santiago', 'Vitacura', 'Concepción', 'Valparaíso'] as const;

const MAJOR_OPTIONS = [
  'Ingeniería Civil Informática',
  'Ingeniería Comercial',
  'Derecho',
  'Medicina',
  'Psicología',
  'Arquitectura',
  'Enfermería',
  'Ingeniería Civil',
  'Ingeniería Ambiental',
  'Periodismo',
  'Design',
  'Odontología',
] as const;

const SEMESTER_OPTIONS = [
  '1° Semestre',
  '2° Semestre',
  '3° Semestre',
  '4° Semestre',
  '5° Semestre',
  '6° Semestre',
  '7° Semestre',
  '8° Semestre',
  '9° Semestre',
  '10° Semestre',
] as const;

const INTERESTS = [
  'Cálculo II',
  'Álgebra Lineal',
  'Programación Avanzada',
  'Microeconomía',
  'Anatomía I',
  'Derecho Civil',
  'Estadística',
  'Física I',
  'Química General',
  'Derecho Público',
  'Contabilidad',
  'Finanzas',
] as const;

@Component({
  selector: 'app-onboarding-page',
  standalone: true,
  imports: [IonContent, IonSelect, IonSelectOption, ButtonComponent],
  templateUrl: './onboarding.page.html',
  styleUrl: './onboarding.page.scss',
})
export class OnboardingPage {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly campusOptions = CAMPUS_OPTIONS;
  readonly majorOptions = MAJOR_OPTIONS;
  readonly semesterOptions = SEMESTER_OPTIONS;
  readonly interestOptions = INTERESTS;

  readonly totalSteps = 3;
  readonly step = signal(1);
  readonly campus = signal('');
  readonly major = signal('');
  readonly semester = signal('');
  readonly interests = signal<string[]>([]);
  readonly loading = signal(false);
  readonly error = signal('');

  readonly progress = computed(() => (this.step() / this.totalSteps) * 100);

  readonly canProceed = computed(() => {
    switch (this.step()) {
      case 1:
        return !!this.campus() && !!this.major();
      case 2:
        return !!this.semester();
      case 3:
        return this.interests().length > 0;
      default:
        return false;
    }
  });

  selectCampus(campus: string): void {
    this.campus.set(campus);
  }

  selectMajor(major: string): void {
    this.major.set(major);
  }

  // Ported 1:1 from the MVP: state holds only the ordinal ("1°"), not the
  // full label ("1° Semestre") — split(' ')[0] on the option string.
  selectSemester(option: string): void {
    this.semester.set(option.split(' ')[0]);
  }

  toggleInterest(interest: string): void {
    this.interests.update((current) =>
      current.includes(interest) ? current.filter((i) => i !== interest) : [...current, interest],
    );
  }

  back(): void {
    if (this.loading()) return;
    if (this.step() > 1) {
      this.step.update((s) => s - 1);
    }
  }

  // I/O matrix: "Onboarding paso incompleto" — never advances the step when
  // canProceed() is false (mirrors the MVP's disabled Button, which itself
  // relies on the browser not firing click on a disabled button; a Router
  // guard-free component call needs to enforce it explicitly).
  next(): void {
    if (!this.canProceed()) return;
    if (this.step() < this.totalSteps) {
      this.step.update((s) => s + 1);
    }
  }

  async submit(): Promise<void> {
    if (!this.canProceed()) return;

    this.loading.set(true);
    this.error.set('');

    const { error } = await this.auth.updateProfile({
      campus: this.campus(),
      major: this.major(),
      semester: parseInt(this.semester(), 10),
      interests: this.interests(),
      onboarding_completed: true,
    });

    if (error) {
      this.error.set(error);
      this.loading.set(false);
      return;
    }

    this.loading.set(false);
    await this.router.navigateByUrl('/kit');
  }
}
