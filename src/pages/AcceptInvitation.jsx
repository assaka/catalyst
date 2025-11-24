import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, CheckCircle, XCircle, UserPlus, Building2, Shield, AlertCircle, Eye, EyeOff } from 'lucide-react';
import apiClient from '@/api/client';
import { toast } from 'sonner';

const ROLE_COLORS = {
  admin: 'bg-blue-100 text-blue-800',
  editor: 'bg-green-100 text-green-800',
  viewer: 'bg-gray-100 text-gray-800'
};

export default function AcceptInvitation() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [invitation, setInvitation] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Form state for account creation/login
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    // Check if user is logged in (check token exists and user not marked as logged out)
    const authToken = localStorage.getItem('store_owner_auth_token');
    const isLoggedOut = localStorage.getItem('user_logged_out') === 'true';
    setIsLoggedIn(!!authToken && !isLoggedOut);

    if (token) {
      fetchInvitation();
    }
  }, [token]);

  const fetchInvitation = async () => {
    try {
      setLoading(true);
      setError(null);

      // Use direct fetch for public endpoint (no auth required)
      const apiUrl = import.meta.env.VITE_API_URL || 'https://catalyst-backend-fzhu.onrender.com';
      const response = await fetch(`${apiUrl}/api/invitations/${token}`);
      const data = await response.json();

      if (response.ok && data.success) {
        setInvitation(data.data);
      } else {
        setError(data.message || 'Invalid or expired invitation');
      }
    } catch (err) {
      console.error('Error fetching invitation:', err);
      if (err.message?.includes('expired')) {
        setError('This invitation has expired. Please ask for a new invitation.');
      } else if (err.message?.includes('not found')) {
        setError('This invitation was not found or has already been used.');
      } else {
        setError(err.message || 'Failed to load invitation details');
      }
    } finally {
      setLoading(false);
    }
  };

  const validatePassword = (pwd) => {
    if (pwd.length < 8) return 'Password must be at least 8 characters';
    if (!/[A-Z]/.test(pwd)) return 'Password must contain an uppercase letter';
    if (!/[a-z]/.test(pwd)) return 'Password must contain a lowercase letter';
    if (!/\d/.test(pwd)) return 'Password must contain a number';
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(pwd)) return 'Password must contain a special character';
    return null;
  };

  const handleAccept = async (e) => {
    e?.preventDefault();
    setFormError('');

    // If logged in, just accept the invitation
    if (isLoggedIn) {
      try {
        setAccepting(true);
        const response = await apiClient.post(`store-teams/accept-invitation/${token}`);

        if (response.success) {
          setSuccess(true);
          toast.success('Invitation accepted! You are now part of the team.');

          // Redirect to the store dashboard after a short delay
          setTimeout(() => {
            navigate('/admin/dashboard');
          }, 2000);
        } else {
          throw new Error(response.message || 'Failed to accept invitation');
        }
      } catch (err) {
        console.error('Error accepting invitation:', err);

        // If session expired or invalid token, mark as logged out
        if (err.message?.includes('Session has been terminated') ||
            err.message?.includes('token') ||
            err.message?.includes('Unauthorized') ||
            err.message?.includes('Authentication')) {
          toast.error('Session expired. Please enter your password to continue.');
          localStorage.removeItem('store_owner_auth_token');
          setIsLoggedIn(false);
          return;
        }

        toast.error(err.message || 'Failed to accept invitation');
        setFormError(err.message);
      } finally {
        setAccepting(false);
      }
      return;
    }

    // Not logged in - need to create account or login
    if (!password) {
      setFormError('Please enter a password');
      return;
    }

    // For new users, validate password and check confirm
    if (!invitation?.userExists) {
      const pwdError = validatePassword(password);
      if (pwdError) {
        setFormError(pwdError);
        return;
      }
      if (password !== confirmPassword) {
        setFormError('Passwords do not match');
        return;
      }
      if (!firstName.trim()) {
        setFormError('Please enter your first name');
        return;
      }
    }

    try {
      setAccepting(true);

      // Call the combined endpoint that handles signup/login + accept invitation
      const apiUrl = import.meta.env.VITE_API_URL || 'https://catalyst-backend-fzhu.onrender.com';
      const response = await fetch(`${apiUrl}/api/invitations/${token}/accept-with-auth`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          password,
          firstName: firstName.trim(),
          lastName: lastName.trim(),
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Store the auth token
        if (data.data?.token) {
          localStorage.removeItem('user_logged_out');
          localStorage.setItem('store_owner_auth_token', data.data.token);
          apiClient.setToken(data.data.token);

          // Store user data
          if (data.data.user) {
            localStorage.setItem('store_owner_user_data', JSON.stringify(data.data.user));
          }
        }

        setSuccess(true);
        toast.success('Welcome to the team!');

        // Redirect to the store dashboard after a short delay
        setTimeout(() => {
          navigate('/admin/dashboard');
        }, 2000);
      } else {
        throw new Error(data.message || 'Failed to accept invitation');
      }
    } catch (err) {
      console.error('Error accepting invitation:', err);
      setFormError(err.message || 'Failed to accept invitation');
      toast.error(err.message || 'Failed to accept invitation');
    } finally {
      setAccepting(false);
    }
  };

  const handleDecline = () => {
    navigate('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-4" />
            <p className="text-gray-600">Loading invitation details...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error && !invitation) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <XCircle className="w-8 h-8 text-red-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Invalid Invitation</h2>
            <p className="text-gray-600 text-center mb-6">{error}</p>
            <Button onClick={() => navigate('/')} variant="outline">
              Go to Homepage
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Welcome to the Team!</h2>
            <p className="text-gray-600 text-center mb-2">
              You've successfully joined <strong>{invitation?.store?.name}</strong>.
            </p>
            <p className="text-sm text-gray-500">Redirecting to dashboard...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-8 text-white text-center">
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <UserPlus className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold">Team Invitation</h1>
          <p className="text-blue-100 mt-1">You've been invited to join a team</p>
        </div>

        <CardContent className="p-6">
          {/* Store Info */}
          <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg mb-6">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Building2 className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">{invitation?.store?.name || 'Store'}</h3>
              <p className="text-sm text-gray-500">{invitation?.store?.domain || ''}</p>
            </div>
          </div>

          {/* Role */}
          <div className="mb-6">
            <p className="text-sm text-gray-500 mb-2">You're invited as:</p>
            <Badge className={`${ROLE_COLORS[invitation?.role]} text-sm px-3 py-1`}>
              <Shield className="w-3 h-3 mr-1" />
              {invitation?.role?.charAt(0).toUpperCase() + invitation?.role?.slice(1)}
            </Badge>
          </div>

          {/* Inviter */}
          {invitation?.inviter && (
            <div className="mb-6">
              <p className="text-sm text-gray-500 mb-1">Invited by:</p>
              <p className="text-gray-900">
                {invitation.inviter.first_name
                  ? `${invitation.inviter.first_name} ${invitation.inviter.last_name || ''}`
                  : invitation.inviter.email}
              </p>
            </div>
          )}

          {/* Message */}
          {invitation?.message && (
            <div className="mb-6 p-3 bg-blue-50 border-l-4 border-blue-400 rounded-r">
              <p className="text-sm text-gray-700 italic">"{invitation.message}"</p>
            </div>
          )}

          {/* Expiration Warning */}
          {invitation?.expires_at && (
            <div className="mb-6 flex items-center gap-2 text-sm text-amber-600">
              <AlertCircle className="w-4 h-4" />
              <span>
                Expires {new Date(invitation.expires_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </span>
            </div>
          )}

          {/* Account Creation/Login Form for non-logged-in users */}
          {!isLoggedIn && (
            <form onSubmit={handleAccept} className="mb-6 space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg border">
                <p className="text-sm font-medium text-gray-700 mb-3">
                  {invitation?.userExists
                    ? `Enter your password for ${invitation?.email}`
                    : `Create your account for ${invitation?.email}`
                  }
                </p>

                {/* Name fields for new users */}
                {!invitation?.userExists && (
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div>
                      <Label htmlFor="firstName" className="text-xs">First Name</Label>
                      <Input
                        id="firstName"
                        type="text"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        placeholder="John"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="lastName" className="text-xs">Last Name</Label>
                      <Input
                        id="lastName"
                        type="text"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        placeholder="Doe"
                        className="mt-1"
                      />
                    </div>
                  </div>
                )}

                {/* Password field */}
                <div className="mb-3">
                  <Label htmlFor="password" className="text-xs">Password</Label>
                  <div className="relative mt-1">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder={invitation?.userExists ? 'Enter your password' : 'Create a password'}
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Confirm password for new users */}
                {!invitation?.userExists && (
                  <div className="mb-3">
                    <Label htmlFor="confirmPassword" className="text-xs">Confirm Password</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm your password"
                      className="mt-1"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Min 8 chars with uppercase, lowercase, number, and special character
                    </p>
                  </div>
                )}

                {/* Form error */}
                {formError && (
                  <p className="text-sm text-red-600 mt-2">{formError}</p>
                )}
              </div>
            </form>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={handleDecline}
            >
              Decline
            </Button>
            <Button
              className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              onClick={handleAccept}
              disabled={accepting}
            >
              {accepting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {isLoggedIn ? 'Accepting...' : (invitation?.userExists ? 'Signing in...' : 'Creating account...')}
                </>
              ) : (
                'Accept Invitation'
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
