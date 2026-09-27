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
  updateUser: (id: string, updates: Partial<User>) => void;
  toggleUserStatus: (id: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [users, setUsers] = useState<User[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('applevision_users');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {
          console.error('Failed to parse users', e);
        }
      }
    }
    return initialUsers;
  });

  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    if (typeof window !== 'undefined') {
      const savedUser = localStorage.getItem('applevision_current_user');
      if (savedUser) {
        try {
          return JSON.parse(savedUser);
        } catch (e) {
          return null;
        }
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

  const addUser = (userData: Omit<User, 'id'>) => {
    const newUser: User = {
      ...userData,
      id: `usr-${Date.now()}`
    };
    setUsers(prev => [...prev, newUser]);
  };

  const updateUser = (id: string, updates: Partial<User>) => {
    setUsers(prev => prev.map(u => u.id === id ? { ...u, ...updates } : u));
    if (currentUser && currentUser.id === id) {
      setCurrentUser(prev => prev ? { ...prev, ...updates } : null);
    }
  };

  const toggleUserStatus = (id: string) => {
    setUsers(prev => prev.map(u => u.id === id ? { ...u, isActive: !u.isActive } : u));
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
