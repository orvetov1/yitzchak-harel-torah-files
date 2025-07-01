
import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface AdminUser {
  id: string;
  username: string;
  email?: string;
}

export const useAdmin = () => {
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const adminData = localStorage.getItem('adminUser');
    if (adminData) {
      try {
        setAdminUser(JSON.parse(adminData));
      } catch (error) {
        console.error('Error parsing admin data:', error);
        localStorage.removeItem('adminUser');
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (username: string, password: string) => {
    try {
      const { data, error } = await supabase
        .from('admin_users')
        .select('id, username, email, password_hash')
        .eq('username', username)
        .single();

      if (error || !data) {
        throw new Error('שם משתמש או סিסמה שגויים');
      }

      // Simple password check (in production, use proper hashing)
      if (password !== data.password_hash) {
        throw new Error('שם משתמש או סיסמה שגויים');
      }

      const user = { id: data.id, username: data.username, email: data.email };
      setAdminUser(user);
      localStorage.setItem('adminUser', JSON.stringify(user));
      
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  const logout = () => {
    setAdminUser(null);
    localStorage.removeItem('adminUser');
  };

  const changePassword = async (currentPassword: string, newPassword: string) => {
    if (!adminUser) return { success: false, error: 'לא מחובר' };

    try {
      const { data, error } = await supabase
        .from('admin_users')
        .select('password_hash')
        .eq('id', adminUser.id)
        .single();

      if (error || !data) {
        throw new Error('שגיאה בטעינת נתוני המשתמש');
      }

      if (currentPassword !== data.password_hash) {
        throw new Error('הסיסמה הנוכחית שגויה');
      }

      const { error: updateError } = await supabase
        .from('admin_users')
        .update({ password_hash: newPassword, updated_at: new Date().toISOString() })
        .eq('id', adminUser.id);

      if (updateError) {
        throw new Error('שגיאה בעדכון הסיסמה');
      }

      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  // Use useMemo to stabilize isAuthenticated value
  const isAuthenticated = useMemo(() => !!adminUser, [adminUser]);

  return {
    adminUser,
    isLoading,
    login,
    logout,
    changePassword,
    isAuthenticated
  };
};
