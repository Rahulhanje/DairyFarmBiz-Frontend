import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { authApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Mail, CheckCircle } from 'lucide-react';

const otpSchema = z.object({
  otp: z.string()
    .length(6, 'OTP must be exactly 6 digits')
    .regex(/^[0-9]+$/, 'OTP must contain only numbers'),
});

type OTPFormData = z.infer<typeof otpSchema>;

const VerifyEmail: React.FC = () => {
  const [searchParams] = useSearchParams();
  const email = searchParams.get('email') || '';
  const navigate = useNavigate();
  const { toast } = useToast();
  const [canResend, setCanResend] = useState(false);
  const [countdown, setCountdown] = useState(60);

  const form = useForm<OTPFormData>({
    resolver: zodResolver(otpSchema),
    defaultValues: {
      otp: '',
    },
  });

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [countdown]);

  const verifyMutation = useMutation({
    mutationFn: (otp: string) => authApi.verifyEmail(email, otp),
    onSuccess: (response) => {
      if (response.success !== false) {
        toast({
          title: 'Email Verified!',
          description: 'Your email has been successfully verified. You can now access all features.',
        });
        setTimeout(() => navigate('/dashboard'), 1500);
      } else {
        toast({
          title: 'Verification Failed',
          description: response.message || 'Failed to verify email',
          variant: 'destructive',
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to verify email. Please try again.',
        variant: 'destructive',
      });
    },
  });

  const resendMutation = useMutation({
    mutationFn: () => authApi.sendVerificationOTP(email),
    onSuccess: () => {
      toast({
        title: 'OTP Sent',
        description: 'A new OTP has been sent to your email.',
      });
      setCanResend(false);
      setCountdown(60);
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to send OTP. Please try again.',
        variant: 'destructive',
      });
    },
  });

  const onSubmit = (data: OTPFormData) => {
    verifyMutation.mutate(data.otp);
  };

  if (!email) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Invalid Link</CardTitle>
            <CardDescription>
              The verification link is invalid. Please try signing up again.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate('/signup')} className="w-full">
              Go to Signup
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
            <Mail className="h-6 w-6 text-primary" />
          </div>
          <CardTitle>Verify Your Email</CardTitle>
          <CardDescription>
            We've sent a 6-digit OTP to <strong>{email}</strong>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="otp"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Enter OTP</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="123456"
                        maxLength={6}
                        className="text-center text-2xl tracking-widest"
                        autoComplete="off"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="w-full"
                disabled={verifyMutation.isPending}
              >
                {verifyMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Verify Email
                  </>
                )}
              </Button>

              <div className="text-center text-sm text-muted-foreground">
                {canResend ? (
                  <Button
                    type="button"
                    variant="link"
                    onClick={() => resendMutation.mutate()}
                    disabled={resendMutation.isPending}
                    className="p-0 h-auto"
                  >
                    {resendMutation.isPending ? 'Sending...' : 'Resend OTP'}
                  </Button>
                ) : (
                  <span>Resend OTP in {countdown}s</span>
                )}
              </div>

              <div className="text-center">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate('/login')}
                >
                  Back to Login
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};

export default VerifyEmail;
