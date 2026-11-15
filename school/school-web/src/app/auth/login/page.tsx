'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { School } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { useAuth } from '@/contexts/AuthContext';
import toast from 'react-hot-toast';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);

  const redirect = searchParams.get('redirect') || '/dashboard';

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginForm) => {
    setLoading(true);
    try {
      await login(data.email, data.password);
      toast.success('Welcome back!');
      router.push(redirect);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-12 h-12 bg-primary-600 rounded-xl flex items-center justify-center">
              <School className="w-7 h-7 text-white" />
            </div>
            <span className="text-2xl font-bold text-gray-900">SchoolMS</span>
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Welcome back</h1>
          <p className="mt-2 text-gray-600">Sign in to your account to continue</p>
        </div>

        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold">Sign in</h2>
            <p className="text-gray-500">Enter your credentials to access your account</p>
          </CardHeader>
          <CardContent className="pt-0">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <Input
                label="Email"
                type="email"
                placeholder="teacher@school.com"
                error={errors.email?.message}
                {...register('email')}
              />
              <Input
                label="Password"
                type="password"
                placeholder="••••••••"
                error={errors.password?.message}
                {...register('password')}
              />
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2">
                  <input type="checkbox" className="rounded border-gray-300 text-primary-600 focus:ring-primary-500" />
                  <span className="text-sm text-gray-600">Remember me</span>
                </label>
                <Link href="/auth/forgot-password" className="text-sm text-primary-600 hover:text-primary-500">
                  Forgot password?
                </Link>
              </div>
              <Button type="submit" className="w-full" size="lg" loading={loading}>
                Sign in
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="mt-6 text-center text-sm text-gray-600">
          Need an account?{' '}
          <Link href="/auth/register" className="text-primary-600 hover:text-primary-500 font-medium">
            Register as Headmaster
          </Link>
        </p>

        <div className="mt-8 p-4 bg-gray-50 rounded-lg text-xs text-gray-500">
          <p className="font-medium mb-2">Demo Credentials:</p>
          <p>Super Admin: superadmin@school.com / SuperAdmin123!</p>
          <p>Headmaster: headmaster@demo.com / Headmaster123!</p>
          <p>Teacher: teacher1@demo.com / Teacher123!</p>
        </div>
      </div>
    </div>
  );
}