// This file can be replaced during build by using the `fileReplacements` array.
// `ng build` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
  production: false,
  // Decision (documented, not silent): the Next.js app's real values live in
  // an untracked .env.local (not present in this checkout/session), so these
  // are placeholders. AuthService is written to fail soft (user=null,
  // loading=false) rather than throw when these are empty/invalid — fill in
  // the real project URL/anon key before using auth features for real.
  supabaseUrl: '',
  supabaseAnonKey: '',
};

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/plugins/zone-error';  // Included with Angular CLI.
