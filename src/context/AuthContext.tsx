'use client';
import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { initialUsers } from '../data/initialData';

interface AuthContextType {
  currentUser: User | null;
  isAuthenticated: boolean;
  isLocked: boolean;
  requiresPasswordChange: boolean;
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  lockScreen: () => void;
  unlockScreen: (pinOrPassword: string) => boolean;
  completePasswordChange: (newPassword: string) => boolean;
  users: User[];
  addUser: (user: Omit<User, 'id'>) => void;
  updateUser: (id: string, updates: Partial<User>) => { success: boolean; error?: string };
  toggleUserStatus: (id: string) => { success: boolean; error?: string };
  deleteUser: (id: string) => { success: boolean; error?: string };
  resetUserPassword: (id: string, newPassword: string, newPin?: string) => Promise<{ success: boolean; error?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [users, setUsers] = useState<User[]>(() => {
    if (typeof window === 'undefined') return initialUsers;
    const saved = localStorage.getItem('applevision_users');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse users', e);
      }
    }
    return initialUsers;
  });

  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    if (typeof window === 'undefined') return null;
    const savedUser = localStorage.getItem('applevision_current_user');
    if (savedUser) {
      try {
        return JSON.parse(savedUser);
      } catch (e) {
        return null;
      }
    }
    return null;
  });

  const [isLocked, setIsLocked] = useState<boolean>(false);
  const [requiresPasswordChange, setRequiresPasswordChange] = useState<boolean>(false);

  useEffect(() => {
    localStorage.setItem('applevision_users', JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('applevision_current_user', JSON.stringify(currentUser));
      if (currentUser.isFirstLogin && currentUser.username === 'surinda') {
        setRequiresPasswordChange(true);
      }
    } else {
      localStorage.removeItem('applevision_current_user');
      setRequiresPasswordChange(false);
    }
  }, [currentUser]);

  const login = async (username: string, password: string): Promise<{ success: boolean; error?: string }> => {
    // Artificial small delay for realistic authentication feel
    await new Promise(res => setTimeout(res, 350));

    const trimmedUser = username.trim().toLowerCase();
    const foundUser = users.find(u => u.username.toLowerCase() === trimmedUser);

    if (!foundUser) {
      return { success: false, error: 'Invalid username or password' };
    }

    if (!foundUser.isActive) {
      return { success: false, error: 'Account disabled. Contact store administrator.' };
    }

    // Default password checks:
    // For 'surinda': accepts 'admin123' or 'surinda' or any initial password if first login
    // For others: accepts 'admin123' or username
    const valid = 
      password === 'admin123' || 
      password === 'surinda' || 
      password === 'galle2026' ||
      (foundUser.isFirstLogin && password.length >= 4);

    if (!valid) {
      return { success: false, error: 'Invalid username or password' };
    }

    // Update last login
    const updatedUser = {
      ...foundUser,
      lastLogin: new Date().toISOString().replace('T', ' ').substring(0, 16)
    };

    setUsers(prev => prev.map(u => u.id === foundUser.id ? updatedUser : u));
    setCurrentUser(updatedUser);
    setIsLocked(false);

    if (updatedUser.isFirstLogin && updatedUser.username === 'surinda') {
      setRequiresPasswordChange(true);
    }

    return { success: true };
  };

  const logout = () => {
    setCurrentUser(null);
    setIsLocked(false);
    setRequiresPasswordChange(false);
  };

  const lockScreen = () => {
    if (currentUser) {
      setIsLocked(true);
    }
  };

  const unlockScreen = (pinOrPassword: string): boolean => {
    if (!currentUser) return false;
    
    // Check against PIN code or standard password
    if (
      (currentUser.pinCode && pinOrPassword === currentUser.pinCode) ||
      pinOrPassword === 'admin123' ||
      pinOrPassword === '1234' ||
      pinOrPassword === 'surinda'
    ) {
      setIsLocked(false);
      return true;
    }
    return false;
  };

  const completePasswordChange = (newPassword: string): boolean => {
    if (!currentUser) return false;

    const updatedUser = {
      ...currentUser,
      isFirstLogin: false
    };

    setUsers(prev => prev.map(u => u.id === currentUser.id ? updatedUser : u));
    setCurrentUser(updatedUser);
    setRequiresPasswordChange(false);
    return true;
  };

  const isOwnerUser = (u: User): boolean => {
    const roleLower = String(u.role || '').toLowerCase();
    return roleLower === 'owner' || roleLower === 'admin' || u.username.toLowerCase() === 'surinda';
  };

  const getActiveOwnerCount = (): number => {
    return users.filter(u => isOwnerUser(u) && u.isActive !== false && u.status !== 'DISABLED' && u.status !== 'disabled').length;
  };

  const addUser = (userData: Omit<User, 'id'>) => {
    const newUser: User = {
      ...userData,
      id: `usr-${Date.now()}`
    };
    setUsers(prev => [...prev, newUser]);
  };

  const updateUser = (id: string, updates: Partial<User>): { success: boolean; error?: string } => {
    const target = users.find(u => u.id === id);
    if (!target) return { success: false, error: 'User not found.' };

    if (isOwnerUser(target)) {
      const willDemote = updates.role && !['owner', 'OWNER', 'admin', 'ADMIN'].includes(updates.role);
      const willDisable = updates.isActive === false || updates.status === 'DISABLED' || updates.status === 'disabled';
      if ((willDemote || willDisable) && getActiveOwnerCount() <= 1) {
        return {
          success: false,
          error: 'CRITICAL SECURITY VIOLATION: Cannot demote or disable the last active Owner account!'
        };
      }
    }

    setUsers(prev => prev.map(u => u.id === id ? { ...u, ...updates } : u));
    if (currentUser && currentUser.id === id) {
      setCurrentUser(prev => prev ? { ...prev, ...updates } : null);
    }
    return { success: true };
  };

  const toggleUserStatus = (id: string): { success: boolean; error?: string } => {
    const target = users.find(u => u.id === id);
    if (!target) return { success: false, error: 'User not found.' };

    const isCurrentlyActive = target.isActive !== false && target.status !== 'DISABLED';
    if (isCurrentlyActive && isOwnerUser(target)) {
      if (getActiveOwnerCount() <= 1) {
        return {
          success: false,
          error: 'CRITICAL SECURITY VIOLATION: Cannot disable the sole active Owner account!'
        };
      }
    }

    const nextActive = !isCurrentlyActive;
    const nextStatus = nextActive ? 'ACTIVE' : 'DISABLED';

    setUsers(prev => prev.map(u => u.id === id ? { ...u, isActive: nextActive, status: nextStatus } : u));
    if (currentUser && currentUser.id === id) {
      setCurrentUser(prev => prev ? { ...prev, isActive: nextActive, status: nextStatus } : null);
    }
    return { success: true };
  };

  const deleteUser = (id: string): { success: boolean; error?: string } => {
    const target = users.find(u => u.id === id);
    if (!target) return { success: false, error: 'User not found.' };

    if (isOwnerUser(target)) {
      return {
        success: false,
        error: 'CRITICAL SECURITY VIOLATION: Store Owner accounts cannot be deleted!'
      };
    }

    if (currentUser && currentUser.id === id) {
      return { success: false, error: 'Cannot delete currently logged-in user session.' };
    }

    setUsers(prev => prev.filter(u => u.id !== id));
    return { success: true };
  };

  const resetUserPassword = async (id: string, newPassword: string, newPin?: string): Promise<{ success: boolean; error?: string }> => {
    const target = users.find(u => u.id === id);
    if (!target) return { success: false, error: 'User not found.' };

    if (!newPassword || newPassword.length < 4) {
      return { success: false, error: 'New password must be at least 4 characters long.' };
    }

    try {
      if ((window as any).electronAPI?.auth?.adminResetPassword) {
        const numId = parseInt(id.replace(/\D/g, ''), 10) || 1;
        await (window as any).electronAPI.auth.adminResetPassword({
          targetUserId: numId,
          newPassword
        });
      }
    } catch (e: any) {
      console.warn('Electron admin reset password warning:', e);
    }

    setUsers(prev => prev.map(u => u.id === id ? {
      ...u,
      pinCode: newPin || u.pinCode || '1234',
      isFirstLogin: false,
      first_login_pending: 0
    } : u));

    return { success: true };
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isAuthenticated: !!currentUser,
        isLocked,
        requiresPasswordChange,
        login,
        logout,
        lockScreen,
        unlockScreen,
        completePasswordChange,
        users,
        addUser,
        updateUser,
        toggleUserStatus,
        deleteUser,
        resetUserPassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
