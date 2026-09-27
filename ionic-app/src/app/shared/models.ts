// Locally redeclared subset of src/types/index.ts — ionic-app is a separate
// npm project (own package.json), so types are not imported cross-project.
// Only the shapes actually used by the ported UI kit / stores are kept here
// (per Code Map: Profile, AIDeclaration, shape of CartItem).

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  campus: string | null;
  major: string | null;
  semester: number | null;
  interests: string[];
  verified: boolean;
  created_at: string;
  onboarding_completed: boolean;
}

export type AIDeclaration = 'none' | 'assisted' | 'generated';

export interface CartItem {
  id: string;
  type: 'note' | 'booking';
  title: string;
  price: number;
  image?: string;
}
