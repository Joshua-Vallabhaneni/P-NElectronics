'use client';

/**
 * AUTHENTICATION PAGE
 * Login/signup page styled for P&N Electronics.
 */
import React, { useState } from 'react';
import { Eye, EyeOff, Mail, Lock, User, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';

type AuthMode = 'signin' | 'signup' | 'reset';

export const AuthPage: React.FC = () => {
    const [mode, setMode] = useState<AuthMode>('signin');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const { signIn, signUp, resetPassword } = useAuth();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setMessage('');

        try {
            if (mode === 'signin') {
                await signIn(email, password);
            } else if (mode === 'signup') {
                const response = await signUp(email, password, fullName);
                if (response?.user && !response.user.email_confirmed_at) {
                    setMessage('Please check your email and click the confirmation link to complete your registration.');
                } else if (response?.user) {
                    setMessage('Account created successfully! Please check your email to confirm your account.');
                } else {
                    setMessage('Account created! Please check your email for confirmation instructions.');
                }
            } else if (mode === 'reset') {
                await resetPassword(email);
                setMessage('Password reset email sent! Please check your inbox.');
            }
        } catch (err: any) {
            console.error('Authentication error:', err);
            setError(err.message || 'An error occurred. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const isFormValid = () => {
        if (mode === 'reset') {
            return email.length > 0;
        }
        if (mode === 'signup') {
            return email.length > 0 && password.length >= 6 && fullName.length > 0;
        }
        return email.length > 0 && password.length > 0;
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                {/* HEADER */}
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl mx-auto mb-4 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                        <Shield className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-3xl font-bold text-white mb-2">
                        P&N Electronics
                    </h1>
                    <p className="text-slate-400">
                        {mode === 'signin' && 'Sign in to your account'}
                        {mode === 'signup' && 'Create your account'}
                        {mode === 'reset' && 'Reset your password'}
                    </p>
                </div>

                {/* MAIN FORM CARD */}
                <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-8">
                    {/* SUCCESS/ERROR MESSAGES */}
                    {message && (
                        <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                            <p className="text-emerald-400 text-sm">{message}</p>
                        </div>
                    )}

                    {error && (
                        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
                            <p className="text-red-400 text-sm">{error}</p>
                        </div>
                    )}

                    {/* AUTHENTICATION FORM */}
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* FULL NAME FIELD (only for signup) */}
                        {mode === 'signup' && (
                            <div className="space-y-2">
                                <Label htmlFor="fullName" className="text-slate-300 font-medium">
                                    Full Name
                                </Label>
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500 w-5 h-5" />
                                    <Input
                                        id="fullName"
                                        type="text"
                                        value={fullName}
                                        onChange={(e) => setFullName(e.target.value)}
                                        className="pl-10 h-12 rounded-xl bg-white/5 border-white/10 text-white placeholder:text-slate-500 focus:border-emerald-500 focus:ring-emerald-500/20"
                                        placeholder="Enter your full name"
                                        required
                                    />
                                </div>
                            </div>
                        )}

                        {/* EMAIL FIELD */}
                        <div className="space-y-2">
                            <Label htmlFor="email" className="text-slate-300 font-medium">
                                Email Address
                            </Label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500 w-5 h-5" />
                                <Input
                                    id="email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="pl-10 h-12 rounded-xl bg-white/5 border-white/10 text-white placeholder:text-slate-500 focus:border-emerald-500 focus:ring-emerald-500/20"
                                    placeholder="Enter your email"
                                    required
                                />
                            </div>
                        </div>

                        {/* PASSWORD FIELD */}
                        {mode !== 'reset' && (
                            <div className="space-y-2">
                                <Label htmlFor="password" className="text-slate-300 font-medium">
                                    Password
                                </Label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500 w-5 h-5" />
                                    <Input
                                        id="password"
                                        type={showPassword ? 'text' : 'password'}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="pl-10 pr-10 h-12 rounded-xl bg-white/5 border-white/10 text-white placeholder:text-slate-500 focus:border-emerald-500 focus:ring-emerald-500/20"
                                        placeholder={mode === 'signup' ? 'Create a password (min 6 characters)' : 'Enter your password'}
                                        minLength={mode === 'signup' ? 6 : undefined}
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                                    >
                                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* SUBMIT BUTTON */}
                        <Button
                            type="submit"
                            disabled={!isFormValid() || loading}
                            className="w-full h-12 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white rounded-xl shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 transition-all duration-300 font-semibold"
                        >
                            {loading ? (
                                <div className="flex items-center gap-2">
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    {mode === 'signin' && 'Signing in...'}
                                    {mode === 'signup' && 'Creating account...'}
                                    {mode === 'reset' && 'Sending email...'}
                                </div>
                            ) : (
                                <>
                                    {mode === 'signin' && 'Sign In'}
                                    {mode === 'signup' && 'Create Account'}
                                    {mode === 'reset' && 'Send Reset Link'}
                                </>
                            )}
                        </Button>
                    </form>

                    {/* MODE SWITCHING LINKS */}
                    <div className="mt-6 text-center space-y-3">
                        {mode === 'signin' && (
                            <>
                                <button
                                    type="button"
                                    onClick={() => setMode('reset')}
                                    className="text-emerald-400 hover:text-emerald-300 text-sm font-medium transition-colors hover:underline"
                                >
                                    Forgot your password?
                                </button>
                                <div className="text-slate-400 text-sm">
                                    Don&apos;t have an account?{' '}
                                    <button
                                        type="button"
                                        onClick={() => setMode('signup')}
                                        className="text-emerald-400 hover:text-emerald-300 font-medium transition-colors hover:underline"
                                    >
                                        Sign up
                                    </button>
                                </div>
                            </>
                        )}

                        {mode === 'signup' && (
                            <div className="text-slate-400 text-sm">
                                Already have an account?{' '}
                                <button
                                    type="button"
                                    onClick={() => setMode('signin')}
                                    className="text-emerald-400 hover:text-emerald-300 font-medium transition-colors hover:underline"
                                >
                                    Sign in
                                </button>
                            </div>
                        )}

                        {mode === 'reset' && (
                            <div className="text-slate-400 text-sm">
                                Remember your password?{' '}
                                <button
                                    type="button"
                                    onClick={() => setMode('signin')}
                                    className="text-emerald-400 hover:text-emerald-300 font-medium transition-colors hover:underline"
                                >
                                    Sign in
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* FOOTER */}
                <div className="text-center mt-8 text-slate-500 text-sm">
                    Secure ITAD Management Portal — P&N Electronics
                </div>
            </div>
        </div>
    );
};
