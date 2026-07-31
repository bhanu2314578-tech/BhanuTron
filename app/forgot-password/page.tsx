'use client';

import * as React from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { ArrowLeft, MailCheck } from 'lucide-react';

import { AuthLayout } from '@/components/layout/auth-layout';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  forgotPasswordSchema,
  type ForgotPasswordInput,
} from '@/lib/validations';
import { authService } from '@/services/auth.service';

export default function ForgotPasswordPage() {
  const [sent, setSent] = React.useState(false);

  const form = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  });

  const onSubmit = async (values: ForgotPasswordInput) => {
    try {
      await authService.resetPassword(values.email);
      setSent(true);
      toast.success('Reset link sent', {
        description: `Check ${values.email} for instructions.`,
      });
    } catch (err) {
      toast.error('Failed to send reset link', {
        description: err instanceof Error ? err.message : 'Please try again.',
      });
    }
  };

  if (sent) {
    return (
      <AuthLayout
        title="Check your email"
        description="We sent a password reset link to your email address."
        footer={
          <>
            Remembered your password?{' '}
            <Link
              href="/login"
              className="font-medium text-primary hover:underline"
            >
              Back to sign in
            </Link>
          </>
        }
      >
        <div className="flex flex-col items-center gap-4 py-4 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <MailCheck className="h-6 w-6" />
          </div>
          <p className="text-sm text-muted-foreground">
            Click the link in the email to reset your password. The link
            expires in 60 minutes.
          </p>
          <Button
            variant="outline"
            className="w-full"
            onClick={() => {
              setSent(false);
              form.reset();
            }}
          >
            Use a different email
          </Button>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Forgot password"
      description="Enter your email and we'll send you a reset link."
      footer={
        <>
          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 font-medium text-primary hover:underline"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to sign in
          </Link>
        </>
      }
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    placeholder="you@company.com"
                    autoComplete="email"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button
            type="submit"
            className="w-full"
            isLoading={form.formState.isSubmitting}
          >
            Send reset link
          </Button>
        </form>
      </Form>
    </AuthLayout>
  );
}
