import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { vi } from 'vitest';

import { ProfilePage } from './profile.page';
import { AuthService } from '../shared/state/auth.service';
import { SupabaseService } from '../shared/state/supabase.service';
import type { Profile } from '../shared/models';

// Covers the CAP-6 spec's I/O matrix rows: "Perfil cargado", "Counts fallan",
// "Logout", "Editar y guardar", "Editar con campo vacío".
describe('ProfilePage', () => {
  const baseUser: Profile = {
    id: 'u1',
    email: 'estudiante@udd.cl',
    full_name: 'Ana Pérez',
    avatar_url: null,
    campus: 'Santiago',
    major: 'Ingeniería Civil Informática',
    semester: 3,
    interests: [],
    verified: true,
    created_at: '2026-01-01',
    onboarding_completed: true,
  };

  function makeSupabaseStub(counts: { library: number; favorites: number; notes: number } | null) {
    // Records the (field, value) each table's .eq() was called with, so
    // tests can assert the count queries actually scope to the current user.
    const eqCalls = {} as Record<'library' | 'favorites' | 'notes', [string, unknown]>;

    if (counts === null) return { client: null, eqCalls };

    return {
      eqCalls,
      client: {
        from: vi.fn((table: 'library' | 'favorites' | 'notes') => ({
          select: vi.fn(() => ({
            eq: vi.fn((field: string, value: unknown) => {
              eqCalls[table] = [field, value];
              return Promise.resolve({ count: counts[table], error: null });
            }),
          })),
        })),
      },
    };
  }

  function setup(
    userOverrides: Partial<Profile> = {},
    counts: { library: number; favorites: number; notes: number } | null = { library: 2, favorites: 3, notes: 1 },
    authOverrides: Record<string, unknown> = {},
  ) {
    const user = { ...baseUser, ...userOverrides };
    const authStub = {
      user: vi.fn().mockReturnValue(user),
      signOut: vi.fn().mockResolvedValue(undefined),
      updateProfile: vi.fn().mockResolvedValue({ error: null }),
      ...authOverrides,
    };
    const supabaseServiceStub = makeSupabaseStub(counts);

    TestBed.configureTestingModule({
      imports: [ProfilePage],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: authStub },
        { provide: SupabaseService, useValue: supabaseServiceStub },
      ],
    });

    const fixture = TestBed.createComponent(ProfilePage);
    return { fixture, component: fixture.componentInstance, authStub, supabaseServiceStub };
  }

  it('perfil cargado: muestra nombre, carrera, email y las 3 stats', async () => {
    const { fixture, component, supabaseServiceStub } = setup();

    await component.ngOnInit();
    fixture.detectChanges();

    expect(component.stats()).toEqual({ library: 2, favorites: 3, notesPublished: 1 });
    expect(fixture.nativeElement.textContent).toContain('Ana Pérez');
    expect(fixture.nativeElement.textContent).toContain('Ingeniería Civil Informática');
    expect(fixture.nativeElement.textContent).toContain('estudiante@udd.cl');
    expect(fixture.nativeElement.querySelector('app-verified-badge')).toBeTruthy();

    // Each count query must be scoped to the current user, not global.
    expect(supabaseServiceStub.eqCalls).toEqual({
      library: ['user_id', baseUser.id],
      favorites: ['user_id', baseUser.id],
      notes: ['author_id', baseUser.id],
    });
  });

  // Acceptance Criteria (spec-cap-6-creator-dashboard): "un card 'Modo
  // creador' enlaza a /profile/creator".
  it('muestra el card "Modo creador" enlazando a /profile/creator', async () => {
    const { fixture, component } = setup();

    await component.ngOnInit();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Modo creador');
    const link = fixture.nativeElement.querySelector('.profile-creator-link');
    expect(link?.getAttribute('href')).toBe('/profile/creator');
  });

  it('perfil sin verificar: no muestra app-verified-badge', async () => {
    const { fixture, component } = setup({ verified: false });

    await component.ngOnInit();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('app-verified-badge')).toBeNull();
  });

  it('un query resuelve con count null y error (cliente presente): esa stat cae a 0, las demás no se ven afectadas', async () => {
    const authStub = { user: vi.fn().mockReturnValue(baseUser) };
    const client = {
      from: vi.fn((table: 'library' | 'favorites' | 'notes') => ({
        select: vi.fn(() => ({
          eq: vi.fn(() =>
            table === 'favorites'
              ? Promise.resolve({ count: null, error: { message: 'boom' } })
              : Promise.resolve({ count: 5, error: null }),
          ),
        })),
      })),
    };

    TestBed.configureTestingModule({
      imports: [ProfilePage],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: authStub },
        { provide: SupabaseService, useValue: { client } },
      ],
    });

    const component = TestBed.createComponent(ProfilePage).componentInstance;
    await component.ngOnInit();

    expect(component.stats()).toEqual({ library: 5, favorites: 0, notesPublished: 5 });
  });

  it('counts fallan (cliente no configurado): las 3 stats muestran 0, sin throw', async () => {
    const { component } = setup({}, null);

    await component.ngOnInit();

    expect(component.stats()).toEqual({ library: 0, favorites: 0, notesPublished: 0 });
  });

  it('sin usuario: no consulta counts', async () => {
    const { component, supabaseServiceStub } = setup({}, { library: 2, favorites: 3, notes: 1 }, {
      user: vi.fn().mockReturnValue(null),
    });

    await component.ngOnInit();

    expect(supabaseServiceStub.client!.from).not.toHaveBeenCalled();
    expect(component.stats()).toEqual({ library: 0, favorites: 0, notesPublished: 0 });
  });

  it('logout: signOut() delega en AuthService.signOut()', async () => {
    const { component, authStub } = setup();

    await component.signOut();

    expect(authStub.signOut).toHaveBeenCalled();
  });

  it('startEditing() precarga los drafts con los valores actuales', () => {
    const { component } = setup();

    component.startEditing();

    expect(component.editing()).toBe(true);
    expect(component.fullNameDraft()).toBe('Ana Pérez');
    expect(component.majorDraft()).toBe('Ingeniería Civil Informática');
  });

  it('campo vacío tras trim (fullNameDraft): canSave() es false', () => {
    const { component } = setup();

    component.startEditing();
    component.fullNameDraft.set('   ');
    component.majorDraft.set('Derecho');

    expect(component.canSave()).toBe(false);
  });

  it('campo vacío tras trim (majorDraft): canSave() es false', () => {
    const { component } = setup();

    component.startEditing();
    component.fullNameDraft.set('Ana Pérez');
    component.majorDraft.set('   ');

    expect(component.canSave()).toBe(false);
  });

  it('ambos campos no vacíos: canSave() es true', () => {
    const { component } = setup();

    component.startEditing();
    component.fullNameDraft.set('Ana Pérez');
    component.majorDraft.set('Derecho');

    expect(component.canSave()).toBe(true);
  });

  it('cancelEditing() sale de modo edición sin llamar a updateProfile()', () => {
    const { component, authStub } = setup();

    component.startEditing();
    component.fullNameDraft.set('Otro nombre');
    component.cancelEditing();

    expect(component.editing()).toBe(false);
    expect(authStub.updateProfile).not.toHaveBeenCalled();
  });

  it('saveProfile() con éxito: llama a updateProfile(), muestra toast de éxito y vuelve a modo lectura', async () => {
    const { component, authStub } = setup();

    component.startEditing();
    component.fullNameDraft.set('Ana P. Editada');
    component.majorDraft.set('Derecho');

    await component.saveProfile();

    expect(authStub.updateProfile).toHaveBeenCalledWith({ full_name: 'Ana P. Editada', major: 'Derecho' });
    expect(component.editing()).toBe(false);
    expect(component.toastOpen()).toBe(true);
    expect(component.toastType()).toBe('success');
    expect(component.loading()).toBe(false);
  });

  it('saveProfile() con error: muestra toast de error y permanece en modo edición', async () => {
    const { component } = setup({}, undefined, {
      updateProfile: vi.fn().mockResolvedValue({ error: 'No se pudo actualizar' }),
    });

    component.startEditing();
    component.fullNameDraft.set('Ana P. Editada');
    component.majorDraft.set('Derecho');

    await component.saveProfile();

    expect(component.editing()).toBe(true);
    expect(component.toastOpen()).toBe(true);
    expect(component.toastType()).toBe('error');
    expect(component.toastMessage()).toBe('No se pudo actualizar');
  });

  it('saveProfile() con campo vacío: no llama a updateProfile()', async () => {
    const { component, authStub } = setup();

    component.startEditing();
    component.fullNameDraft.set('  ');

    await component.saveProfile();

    expect(authStub.updateProfile).not.toHaveBeenCalled();
  });
});
