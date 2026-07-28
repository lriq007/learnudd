'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function AuthCallbackPage() {
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const handleCallback = async () => {
      const { error } = await supabase.auth.exchangeCodeForSession(
        window.location.search
      );

      if (error) {
        console.error('Auth callback error:', error);
        router.push('/login?error=auth_failed');
        return;
      }

      // Check if user has completed onboarding
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('onboarding_completed')
          .eq('id', user.id)
          .single();

        if (profile && !profile.onboarding_completed) {
          router.push('/onboarding');
        } else {
          router.push('/');
        }
      } else {
        router.push('/login');
      }
    };

    handleCallback();
  }, [router, supabase]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-udd-ivory">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-udd-blue/20 border-t-udd-blue rounded-full animate-spin mx-auto mb-4" />
        <p className="text-udd-gray">Verificando identidad...</p>
      </div>
    </div>
  );
}
