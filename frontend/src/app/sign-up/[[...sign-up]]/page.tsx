'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
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
import toast from 'react-hot-toast';

// Extend the schema to include name and phone number fields
const SignUpSchema = z.object({
  emailAddress: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  phoneNumber: z.string().min(10, 'Phone number must be at least 10 digits'),
  code: z.string().optional(),
});

type SignUpFormValues = z.infer<typeof SignUpSchema>;

export default function Page() {
  const [verifying, setVerifying] = React.useState(false);
  const router = useRouter();

  const form = useForm<SignUpFormValues>({
    resolver: zodResolver(SignUpSchema),
    defaultValues: {
      emailAddress: '',
      password: '',
      name: '',
      phoneNumber: '',
      code: '',
    },
  });

  const handleSubmit = async (data: SignUpFormValues) => {
    console.info('Local sign-up placeholder', data.emailAddress);
    setVerifying(true);
  };

  const handleVerify = async (data: SignUpFormValues) => {
    if (!data.code) return;
    toast.success('Sign up successful!');
    router.push('/');
  };

  if (verifying) {
    return (
      <div className="h-screen flex flex-col items-center justify-center gap-5 -mt-[100px]">
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleVerify)}
            className="space-y-4 max-w-xl w-full"
          >
            <h1>Verify your email</h1>
            <FormField
              control={form.control}
              name="code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Enter your verification code</FormLabel>
                  <FormControl>
                    <Input placeholder="Verification code" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit">Verify</Button>
          </form>
        </Form>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col items-center justify-center gap-5 -mt-[100px]">
      <h1 className="text-2xl font-semibold">Sign up to Admin Portal</h1>
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(handleSubmit)}
          className="space-y-4 max-w-xl w-full"
        >
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Name</FormLabel>
                <FormControl>
                  <Input placeholder="Enter your name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="phoneNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Phone Number</FormLabel>
                <FormControl>
                  <Input
                    type="tel"
                    placeholder="Enter your phone number"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="emailAddress"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email Address</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    placeholder="Enter your email"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Password</FormLabel>
                <FormControl>
                  <Input
                    type="password"
                    placeholder="Enter your password"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit">Continue</Button>
        </form>
      </Form>
    </div>
  );
}
