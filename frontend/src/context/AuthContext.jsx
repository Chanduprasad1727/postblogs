import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '../supabase';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [loading, setLoading] = useState(true);

  // Helper to build normalized user object from Supabase user & profile
  const buildSupabaseUserData = (sbUser, profile) => {
    const isSoleAdmin = sbUser.email?.toLowerCase() === 'pavan@kalagawealth.com';
    const role = isSoleAdmin ? 'admin' : (profile?.role || 'client');
    const fullName = profile?.full_name 
      || sbUser.user_metadata?.full_name 
      || (isSoleAdmin ? 'Kalaga Pavan Kishore' : sbUser.email?.split('@')[0]);
    const avatarUrl = profile?.avatar_url 
      || sbUser.user_metadata?.avatar_url 
      || `https://api.dicebear.com/7.x/avataaars/svg?seed=${sbUser.email}`;

    const meta = sbUser.user_metadata || {};
    let membershipStatus = isSoleAdmin ? 'active' : (profile?.membership_status || meta.membership_status || 'unpaid');
    let membershipExpiresAt = isSoleAdmin ? null : (profile?.membership_expires_at || meta.membership_expires_at || null);
    let lastPaymentUtr = isSoleAdmin ? null : (profile?.last_payment_utr || meta.last_payment_utr || null);
    let daysRemaining = null;

    if (membershipExpiresAt) {
      try {
        const expDt = new Date(membershipExpiresAt);
        const diffMs = expDt.getTime() - Date.now();
        if (diffMs > 0) {
          daysRemaining = Math.max(1, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
        } else {
          daysRemaining = 0;
          if (membershipStatus === 'active') membershipStatus = 'expired';
        }
      } catch (err) {
        console.warn('Membership expiry parsing error:', err);
      }
    }

    return {
      id: sbUser.id,
      email: sbUser.email,
      full_name: fullName,
      role: role,
      avatar_url: avatarUrl,
      membership_status: membershipStatus,
      membership_expires_at: membershipExpiresAt,
      last_payment_utr: lastPaymentUtr,
      days_remaining: daysRemaining,
      provider: 'supabase'
    };
  };

  // Helper to fetch Supabase profile record
  const fetchSupabaseProfile = async (userId) => {
    if (!supabase) return null;
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      if (!error && data) return data;
    } catch (err) {
      console.warn('Could not fetch Supabase profile:', err);
    }
    return null;
  };

  // Helper to check local FastAPI session
  const checkLocalSession = async (savedToken) => {
    if (!savedToken) return null;
    try {
      const res = await fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${savedToken}` }
      });
      if (res.ok) {
        const userData = await res.json();
        return userData;
      }
    } catch (err) {
      console.warn('Local session verification failed:', err);
    }
    return null;
  };

  // Sync Supabase session state
  const syncSupabaseSession = useCallback(async (session) => {
    if (!session?.user) {
      setUser(null);
      setToken('');
      localStorage.removeItem('token');
      return null;
    }
    const profile = await fetchSupabaseProfile(session.user.id);
    let userData = buildSupabaseUserData(session.user, profile);

    // Attempt to pull latest live backend computed status (e.g. days_remaining, latest admin approval)
    try {
      const backendUser = await checkLocalSession(session.access_token);
      if (backendUser) {
        userData = { ...userData, ...backendUser };
      }
    } catch {
      // Fallback to userData built from Supabase
    }

    setUser(userData);
    setToken(session.access_token);
    localStorage.setItem('token', session.access_token);
    return userData;
  }, []);

  // Initialize auth state on mount
  useEffect(() => {
    let isMounted = true;

    const initAuth = async () => {
      const savedToken = localStorage.getItem('token');

      // 1. If Supabase is configured, check Supabase session first
      if (isSupabaseConfigured && supabase) {
        try {
          const { data: { session }, error } = await supabase.auth.getSession();
          if (!error && session?.user && isMounted) {
            await syncSupabaseSession(session);
            if (isMounted) setLoading(false);
            return;
          }
        } catch (err) {
          console.warn('Error fetching Supabase session:', err);
        }

        // 2. Fallback to check if saved token is valid locally or via API
        if (savedToken && isMounted) {
          const localUser = await checkLocalSession(savedToken);
          if (localUser && isMounted) {
            setUser(localUser);
            setToken(savedToken);
            setLoading(false);
            return;
          }
        }
      } else if (savedToken) {
        // Local FastAPI only
        const localUser = await checkLocalSession(savedToken);
        if (localUser && isMounted) {
          setUser(localUser);
          setToken(savedToken);
        } else if (isMounted) {
          localStorage.removeItem('token');
          setUser(null);
          setToken('');
        }
      }

      if (isMounted) setLoading(false);
    };

    initAuth();

    // Setup Supabase auth state change subscription
    let subscription = null;
    if (isSupabaseConfigured && supabase) {
      const { data } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (!isMounted) return;
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          if (session) await syncSupabaseSession(session);
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          setToken('');
          localStorage.removeItem('token');
          setLoading(false);
        }
      });
      subscription = data.subscription;
    }

    return () => {
      isMounted = false;
      if (subscription) subscription.unsubscribe();
    };
  }, [syncSupabaseSession]);

  // LOGIN METHOD
  const login = async (email, password) => {
    const cleanEmail = email.trim().toLowerCase();

    // 1. Try Supabase Auth first if configured
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password
        });

        if (error) {
          // If Supabase authentication fails, attempt fallback to local backend
          console.warn('Supabase sign-in error, trying backend fallback:', error.message);
          return await loginWithBackend(cleanEmail, password);
        }

        if (data?.session) {
          const userData = await syncSupabaseSession(data.session);
          return userData;
        }
      } catch (err) {
        console.warn('Supabase sign-in exception, trying backend fallback:', err);
        return await loginWithBackend(cleanEmail, password);
      }
    }

    // 2. Otherwise backend login
    return await loginWithBackend(cleanEmail, password);
  };

  // Helper: Backend FastAPI login
  const loginWithBackend = async (email, password) => {
    let res;
    try {
      res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
    } catch (err) {
      throw new Error('Cannot connect to backend server. Please verify the server is running.');
    }

    let data;
    try {
      data = await res.json();
    } catch {
      throw new Error(`Server returned ${res.status}: Invalid response.`);
    }

    if (!res.ok) {
      throw new Error(data.detail || 'Invalid email or password.');
    }
    localStorage.setItem('token', data.access_token);
    setToken(data.access_token);
    setUser(data.user);
    return data.user;
  };

  // REGISTER METHOD (Registers in Supabase Auth & profiles table via backend Admin API)
  const register = async (email, password, full_name) => {
    const cleanEmail = email.trim().toLowerCase();
    const targetRole = cleanEmail === 'pavan@kalagawealth.com' ? 'admin' : 'client';

    // 1. Register through backend which provisions in Supabase Auth & profiles table
    let res;
    try {
      res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail, password, full_name, role: targetRole })
      });
    } catch (err) {
      throw new Error('Cannot connect to backend server. Please verify the server is running.');
    }

    let data;
    try {
      data = await res.json();
    } catch {
      throw new Error(`Server returned ${res.status}: Invalid response.`);
    }

    if (!res.ok) {
      throw new Error(data.detail || 'Registration failed.');
    }

    // 2. Immediately establish Supabase Auth session in the browser
    if (isSupabaseConfigured && supabase) {
      try {
        const { data: sbData, error: sbError } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password
        });
        if (!sbError && sbData?.session) {
          return await syncSupabaseSession(sbData.session);
        }
      } catch (err) {
        console.warn('Post-registration Supabase login deferred to backend session:', err);
      }
    }

    localStorage.setItem('token', data.access_token);
    setToken(data.access_token);
    setUser(data.user);
    return data.user;
  };

  // UPLOAD USER AVATAR / DP (Available to ANY User - Admin & Client)
  const uploadAvatar = async (fileOrBase64, filename = 'avatar.jpg') => {
    let payload = {};
    if (typeof fileOrBase64 === 'string') {
      payload = { image_base64: fileOrBase64, filename };
    } else if (fileOrBase64 instanceof File) {
      // Read as DataURL base64 for universal multipart/CORS compatibility
      const base64Str = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(fileOrBase64);
      });
      payload = { image_base64: base64Str, filename: fileOrBase64.name };
    }

    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch('/api/users/avatar', {
      method: 'POST',
      headers,
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.detail || 'Failed to upload display photo');
    }

    const newAvatarUrl = data.avatar_url;
    setUser((prev) => (prev ? { ...prev, avatar_url: newAvatarUrl } : null));

    // Sync to Supabase profile if client active
    if (isSupabaseConfigured && supabase && user?.id) {
      try {
        await supabase.from('profiles').update({ avatar_url: newAvatarUrl }).eq('id', user.id);
        await supabase.auth.updateUser({ data: { avatar_url: newAvatarUrl } });
      } catch (err) {
        console.warn('Supabase profile avatar sync deferred:', err);
      }
    }

    return newAvatarUrl;
  };

  // UPDATE PROFILE (Update avatar URL or name)
  const updateProfile = async ({ avatar_url, full_name }) => {
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch('/api/users/profile', {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ avatar_url, full_name })
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.detail || 'Failed to update profile');
    }

    setUser((prev) => (prev ? { 
      ...prev, 
      avatar_url: data.avatar_url, 
      full_name: data.full_name 
    } : null));

    if (isSupabaseConfigured && supabase && user?.id) {
      try {
        const updates = {};
        if (avatar_url) updates.avatar_url = avatar_url;
        if (full_name) updates.full_name = full_name;
        await supabase.from('profiles').update(updates).eq('id', user.id);
        await supabase.auth.updateUser({ data: updates });
      } catch (err) {
        console.warn('Supabase profile update deferred:', err);
      }
    }

    return data;
  };

  // REFRESH USER DATA
  const refreshUser = async () => {
    const savedToken = token || localStorage.getItem('token');
    if (!savedToken) return null;
    const userData = await checkLocalSession(savedToken);
    if (userData) {
      setUser(userData);
      return userData;
    }
    return null;
  };

  // LOGOUT METHOD
  const logout = async () => {
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.auth.signOut();
      } catch (err) {
        console.warn('Supabase signOut error:', err);
      }
    }
    localStorage.removeItem('token');
    setToken('');
    setUser(null);
  };

  // FORGOT PASSWORD: 1. Send OTP to email via Supabase Auth
  const sendPasswordResetOtp = async (email) => {
    const cleanEmail = email.trim().toLowerCase();
    let directSupabaseSuccess = false;
    let devHint = null;

    // A. Attempt via Supabase JS client
    if (isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail);
        if (!error) {
          directSupabaseSuccess = true;
        } else {
          console.warn('Supabase resetPasswordForEmail direct notice:', error.message);
        }
      } catch (err) {
        console.warn('Supabase resetPasswordForEmail direct exception:', err);
      }
    }

    // B. Call backend forgot-password API to ensure OTP generation / delivery
    try {
      const res = await fetch('/api/auth/forgot-password/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail })
      });
      const data = await res.json();
      if (!res.ok) {
        if (!directSupabaseSuccess) {
          throw new Error(data.detail || 'Failed to send OTP code.');
        }
      } else {
        devHint = data.dev_otp_hint || null;
      }
    } catch (err) {
      if (!directSupabaseSuccess) {
        throw err;
      }
    }

    return {
      success: true,
      email: cleanEmail,
      devOtpHint: devHint,
      message: `Verification code sent to ${cleanEmail}. Please check your email inbox.`
    };
  };

  // FORGOT PASSWORD: 2. Verify Email OTP via Supabase Auth
  const verifyPasswordResetOtp = async (email, otp) => {
    const cleanEmail = email.trim().toLowerCase();
    const cleanOtp = otp.trim();

    // A. Attempt via Supabase JS client
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase.auth.verifyOtp({
          email: cleanEmail,
          token: cleanOtp,
          type: 'recovery'
        });
        if (!error && data?.session) {
          return {
            success: true,
            recoveryToken: data.session.access_token,
            session: data.session
          };
        }
        console.warn('Supabase verifyOtp notice, checking backend:', error?.message);
      } catch (err) {
        console.warn('Supabase verifyOtp exception, checking backend:', err);
      }
    }

    // B. Backend verification
    const res = await fetch('/api/auth/forgot-password/verify-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: cleanEmail, otp: cleanOtp })
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.detail || 'Invalid or expired OTP code.');
    }
    return {
      success: true,
      recoveryToken: data.recovery_token,
      userId: data.user_id
    };
  };

  // FORGOT PASSWORD: 3. Set New Password in Supabase Auth
  const resetPassword = async (email, newPassword, recoveryToken, otp) => {
    const cleanEmail = email.trim().toLowerCase();

    // A. If Supabase client has active recovery session
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase.auth.updateUser({
          password: newPassword
        });
        if (!error && data?.user) {
          return {
            success: true,
            message: 'Password reset successfully! You can now sign in with your new password.'
          };
        }
        console.warn('Supabase updateUser notice, falling back to backend:', error?.message);
      } catch (err) {
        console.warn('Supabase updateUser exception:', err);
      }
    }

    // B. Backend reset
    const res = await fetch('/api/auth/forgot-password/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: cleanEmail,
        new_password: newPassword,
        recovery_token: recoveryToken,
        otp
      })
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.detail || 'Failed to reset password.');
    }
    return {
      success: true,
      message: data.message || 'Password reset successfully! You can now sign in with your new password.'
    };
  };

  const isAdmin = user?.role === 'admin';
  const isClient = user?.role === 'client';

  return (
    <AuthContext.Provider value={{
      user,
      token,
      loading,
      isAdmin,
      isClient,
      isSupabase: isSupabaseConfigured,
      login,
      register,
      uploadAvatar,
      updateProfile,
      refreshUser,
      logout,
      sendPasswordResetOtp,
      verifyPasswordResetOtp,
      resetPassword
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
