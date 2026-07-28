'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Mail, Shield, BookOpen, Users, Lock } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [mode, setMode] = useState<'magic' | 'password'>('password');
  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email.endsWith('@udd.cl')) {
      setError('Solo se aceptan correos institucionales @udd.cl');
      return;
    }

    setLoading(true);

    if (mode === 'password') {
      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        console.error('Login error:', authError);
        const errorMsg = authError.message || JSON.stringify(authError);
        setError(errorMsg.includes('Invalid') || errorMsg.includes('invalid')
          ? 'Correo o contraseña incorrectos'
          : errorMsg);
        setLoading(false);
        return;
      }

      window.location.href = '/';
    } else {
      const { error: authError } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (authError) {
        setError(authError.message);
        setLoading(false);
        return;
      }

      setSuccess(true);
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-6 bg-udd-ivory">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-udd-blue/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Mail size={32} className="text-udd-blue" />
            </div>
            <h1 className="text-2xl font-bold text-udd-graphite mb-2">
              Revisa tu correo
            </h1>
            <p className="text-udd-gray">
              Enviamos un enlace de verificación a{' '}
              <span className="font-medium text-udd-graphite">{email}</span>
            </p>
          </div>

          <Button
            variant="outline"
            fullWidth
            onClick={() => {
              setSuccess(false);
              setEmail('');
            }}
          >
            Usar otro correo
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-6 bg-udd-ivory">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-udd-deep mb-1">
            Learn<span className="text-udd-blue">UDD</span>
          </h1>
          <p className="text-udd-gray text-sm">
            Tu comunidad académica UDD, en un solo lugar
          </p>
        </div>

        {/* Login Form */}
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
          {/* Mode Toggle */}
          <div className="flex bg-udd-gray/5 rounded-xl p-1 mb-4">
            <button
              onClick={() => setMode('password')}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                mode === 'password'
                  ? 'bg-white text-udd-graphite shadow-sm'
                  : 'text-udd-gray'
              }`}
            >
              <Lock size={14} className="inline mr-1.5" />
              Contraseña
            </button>
            <button
              onClick={() => setMode('magic')}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                mode === 'magic'
                  ? 'bg-white text-udd-graphite shadow-sm'
                  : 'text-udd-gray'
              }`}
            >
              <Mail size={14} className="inline mr-1.5" />
              Magia
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Correo institucional"
              type="email"
              placeholder="nombre@udd.cl"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={error}
              hint={mode === 'password' ? 'Contraseña: test123456' : 'Te enviaremos un enlace mágico'}
              required
            />

            {mode === 'password' && (
              <Input
                label="Contraseña"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            )}

            <Button type="submit" fullWidth loading={loading}>
              {mode === 'password' ? 'Iniciar sesión' : 'Continuar con correo UDD'}
            </Button>
          </form>
        </div>

        {/* Demo Accounts */}
        <div className="bg-white rounded-2xl shadow-sm p-4 mb-6">
          <p className="text-xs text-udd-gray text-center mb-3">
            Cuentas de prueba (contraseña: test123456)
          </p>
          <div className="grid grid-cols-2 gap-2">
            {[
              { email: 'martina@udd.cl', name: 'Martina' },
              { email: 'benjamin@udd.cl', name: 'Benjamín' },
              { email: 'sofia@udd.cl', name: 'Sofía' },
              { email: 'tomas@udd.cl', name: 'Tomás' },
            ].map((account) => (
              <button
                key={account.email}
                onClick={() => {
                  setEmail(account.email);
                  setPassword('test123456');
                  setMode('password');
                }}
                className="p-2 rounded-xl border border-border text-left hover:border-udd-blue/40 transition-all"
              >
                <p className="text-xs font-semibold text-udd-graphite">{account.name}</p>
                <p className="text-[10px] text-udd-gray truncate">{account.email}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Features */}
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-udd-blue/10 flex items-center justify-center shrink-0">
              <Shield size={20} className="text-udd-blue" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-udd-graphite">
                Comunidad verificada
              </h3>
              <p className="text-xs text-udd-gray">
                Solo estudiantes con correo UDD pueden acceder
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-udd-sky/10 flex items-center justify-center shrink-0">
              <BookOpen size={20} className="text-udd-sky" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-udd-graphite">
                Material confiable
              </h3>
              <p className="text-xs text-udd-gray">
                Apuntes y tutores que conocen tus ramos
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-udd-gold/10 flex items-center justify-center shrink-0">
              <Users size={20} className="text-udd-gold" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-udd-graphite">
                Estudiantes como tú
              </h3>
              <p className="text-xs text-udd-gray">
                Compra, vende y aprende con tu comunidad
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
