'use client';

// React namespace (useState)
import * as React from 'react';
// Next.js router for programmatic navigation
import { useRouter } from 'next/navigation';
// react-hook-form for form state management
import { useForm } from 'react-hook-form';
// Zod for schema validation
import { z } from 'zod';
// Zod resolver for react-hook-form
import { zodResolver } from '@hookform/resolvers/zod';
// Toast notifications
import toast from 'react-hot-toast';

// shadcn/ui button
import { Button } from '@/components/ui/button';
// shadcn/ui form parts
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
// shadcn/ui input
import { Input } from '@/components/ui/input';
// Auth helper: sign in via the backend proxy
import { login } from '@/lib/auth';
// User and lock icons for the input fields
import { Lock, User } from 'lucide-react';

// Validation schema: both fields must be non-empty
const SignInSchema = z.object({
  username: z.string().min(1, 'Please enter your username'),
  password: z.string().min(1, 'Please enter your password'),
});

// TypeScript type inferred from the schema
type SignInFormValues = z.infer<typeof SignInSchema>;

// Admin sign-in form. On success the user is redirected to the dashboard.
export default function SignInForm() {
  const router = useRouter();
  // Whether a sign-in request is in progress
  const [loading, setLoading] = React.useState(false);

  // Set up react-hook-form with Zod validation
  const form = useForm<SignInFormValues>({
    resolver: zodResolver(SignInSchema),
    defaultValues: {
      username: '',
      password: '',
    },
  });

  // Handle form submission: sign in and redirect to the dashboard
  const handleSubmit = async (data: SignInFormValues) => {
    setLoading(true);
    try {
      // Call the login helper (posts to /api/auth/login)
      await login(data.username, data.password);
      toast.success('Signed in successfully');
      router.push('/dashboard');
    } catch (error) {
      // Show the backend's error message (or a generic fallback)
      toast.error(error instanceof Error ? error.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    // Full-height centered layout with a gradient background. `min-h-full`
    // (instead of min-h-screen) keeps it inside the shared navbar shell, so a
    // phone never gets an extra empty scroll area.
    <div className="min-h-full flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 via-sky-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 p-4 sm:p-6">
      <div className="w-full max-w-md">
        {/* Card container */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-5 sm:p-8">
          {/* Heading */}
          <h1 className="text-2xl sm:text-3xl font-bold text-center text-gray-800 dark:text-gray-100 mb-2">
            Admin Sign In
          </h1>
          <p className="text-center text-gray-600 dark:text-gray-300 mb-6 sm:mb-8">
            Enter your credentials to access the admin dashboard
          </p>

          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(handleSubmit)}
              className="space-y-6"
            >
              {/* Username field with a user icon */}
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-700 dark:text-gray-200">
                      Username
                    </FormLabel>
                    <FormControl>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <Input
                          type="text"
                          placeholder="Enter username"
                          className="pl-10"
                          {...field}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Password field with a lock icon */}
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-700 dark:text-gray-200">
                      Password
                    </FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <Input
                          type="password"
                          placeholder="Enter password"
                          className="pl-10"
                          {...field}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Submit button */}
              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-3 rounded-xl shadow-md transform hover:scale-[1.02] transition-all duration-200 ease-in-out"
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </Button>
            </form>
          </Form>
        </div>

        {/* Footer note clarifying this is admin-only */}
        <p className="text-center text-sm text-gray-600 dark:text-gray-300 mt-6">
          For Admin access only.
        </p>
      </div>
    </div>
  );
}
