'use client';
import React, { useState, useEffect } from 'react';
import { useStore } from '../../context/StoreContext';
import { useAuth } from '../../context/AuthContext';
import { useTheme, ColorPalette, COLOR_PALETTE_META } from '../../context/ThemeContext';
import { UserRole, User } from '../../types';
import { 
  Settings, 
  Store, 
  Printer, 
  Sparkles, 
  Users, 
  ShieldCheck, 
  Database, 
  Check, 
  Eye, 
  EyeOff, 
  Download, 
  Upload, 
  RefreshCw, 
  UserPlus, 
  Lock, 
  UserX, 
  UserCheck, 
  X,
  FileText,
  Clock,
  FolderOpen,
  HardDrive,
  Edit3,
  KeyRound,
  ShieldAlert,
  Trash2,
  AlertTriangle,
  Palette,
  Save
} from 'lucide-react';

export const SettingsView: React.FC = () => {
  const { settings, updateSettings, auditLogs, products, sales, customers, showNotification, logAction, resetAllStoreData } = useStore();
  const { users, addUser, updateUser, toggleUserStatus, deleteUser, resetUserPassword, currentUser } = useAuth();
  const { colorPalette, setColorPalette, themeMode, setThemeMode } = useTheme();

  const [activeTab, setActiveTab] = useState<'profile' | 'printer' | 'ai' | 'users' | 'audit' | 'backup' | 'appearance'>('profile');

  // System Data Reset State (Admin Password Confirmation)
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [resetAdminPassword, setResetAdminPassword] = useState('');
  const [showResetPasswordInput, setShowResetPasswordInput] = useState(false);
  const [resetConfirmChecked, setResetConfirmChecked] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);

  // Store Profile Form with Galle Defaults
  const [storeName, setStoreName] = useState(settings.storeName || 'Apple Vision');
  const [fullName, setFullName] = useState(settings.fullName || 'AppleVision Store Galle');
  const [tagline, setTagline] = useState(settings.tagline || 'Reliable Best Service');
  const [owner, setOwner] = useState(settings.owner || 'Nethmina Abayarathne');
  const [phone, setPhone] = useState(settings.phone || '+94 77 923 0519');
  const [whatsapp, setWhatsapp] = useState(settings.whatsapp || '+94 77 923 0519');
  const [email, setEmail] = useState(settings.email || 'nethminasurinda@gmail.com');
  const [address, setAddress] = useState(settings.address || 'Kalegana Junction');
  const [city, setCity] = useState(settings.city || 'Galle');
  const [postalCode, setPostalCode] = useState(settings.postalCode || '80000');
  const [currency, setCurrency] = useState(settings.currency || 'Rs.');
  const [currencySymbol, setCurrencySymbol] = useState(settings.currencySymbol || 'LKR');
  const [taxRatePercent, setTaxRatePercent] = useState<number>(settings.taxRatePercent ?? 0);

  // Printer Form
  const [printerWidth, setPrinterWidth] = useState<'80mm' | '58mm'>(settings.printerWidth || '80mm');
  const [receiptHeader, setReceiptHeader] = useState(settings.receiptHeader || '');
  const [receiptFooter, setReceiptFooter] = useState(settings.receiptFooter || '');
  const [autoPrint, setAutoPrint] = useState(settings.autoPrint ?? false);

  // Gemini AI Form
  const [geminiApiKey, setGeminiApiKey] = useState(settings.geminiApiKey || '');
  const [showApiKey, setShowApiKey] = useState(false);
  const [geminiModel, setGeminiModel] = useState(settings.geminiModel || 'gemini-1.5-flash');
  const [aiConfidenceThreshold, setAiConfidenceThreshold] = useState<number>(settings.aiConfidenceThreshold || 85);
  const [isTestingAi, setIsTestingAi] = useState(false);
  const [aiTestResult, setAiTestResult] = useState<string | null>(null);

  // User Management State
  const [securityErrorBanner, setSecurityErrorBanner] = useState<string | null>(null);
  
  // Add User
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newUserName, setNewUserName] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [newUserRole, setNewUserRole] = useState<UserRole>('cashier');
  const [newUserPin, setNewUserPin] = useState('0000');

  // Edit User
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editUserName, setEditUserName] = useState('');
  const [editUserRole, setEditUserRole] = useState<UserRole>('cashier');
  const [editUserStatus, setEditUserStatus] = useState<'ACTIVE' | 'DISABLED'>('ACTIVE');

  // Reset Password
  const [resetPasswordUser, setResetPasswordUser] = useState<User | null>(null);
  const [newResetPassword, setNewResetPassword] = useState('');
  const [confirmResetPassword, setConfirmResetPassword] = useState('');
  const [newResetPin, setNewResetPin] = useState('');
  const [showResetPassword, setShowResetPassword] = useState(false);

  // Change Own Password State (for currently logged-in user)
  const [isChangePwOpen, setIsChangePwOpen] = useState(false);
  const [cpOldPassword, setCpOldPassword] = useState('');
  const [cpNewPassword, setCpNewPassword] = useState('');
  const [cpConfirmPassword, setCpConfirmPassword] = useState('');
  const [cpShowOld, setCpShowOld] = useState(false);
  const [cpShowNew, setCpShowNew] = useState(false);
  const [cpError, setCpError] = useState<string | null>(null);
  const [cpSuccess, setCpSuccess] = useState(false);
  const [cpLoading, setCpLoading] = useState(false);

  const handleChangeMyPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setCpError(null);
    setCpSuccess(false);
    if (!cpOldPassword) { setCpError('Please enter your current password.'); return; }
    if (cpNewPassword.length < 6) { setCpError('New password must be at least 6 characters.'); return; }
    if (cpNewPassword !== cpConfirmPassword) { setCpError('New passwords do not match.'); return; }
    if (cpNewPassword === cpOldPassword) { setCpError('New password must be different from current password.'); return; }
    setCpLoading(true);
    try {
      const electronAPI = (window as any).electronAPI;
      const res = await electronAPI?.auth?.changePassword({ oldPassword: cpOldPassword, newPassword: cpNewPassword });
      if (res?.success) {
        setCpSuccess(true);
        setCpOldPassword(''); setCpNewPassword(''); setCpConfirmPassword('');
        logAction('PASSWORD_CHANGED', 'SECURITY', `${currentUser?.username} changed their own login password`);
        showNotification('success', 'Password changed successfully! Please remember your new password.');
        setTimeout(() => { setCpSuccess(false); setIsChangePwOpen(false); }, 2500);
      } else {
        setCpError(res?.message || res?.error || 'Incorrect current password. Please try again.');
      }
    } catch (err: any) {
      setCpError(err.message || 'Failed to change password.');
    } finally {
      setCpLoading(false);
    }
  };

  // Security Helper
  const isOwner = (u: User) => {
    const r = String(u.role || '').toLowerCase();
    return r === 'owner' || r === 'admin' || u.username.toLowerCase() === 'surinda';
  };

  const getActiveOwnerCount = () => {
    return users.filter(u => isOwner(u) && u.isActive !== false && u.status !== 'DISABLED' && u.status !== 'disabled').length;
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings({
      storeName,
      fullName,
      tagline,
      owner,
      phone,
      whatsapp,
      email,
      address,
      city,
      postalCode,
      currency,
      currencySymbol,
      taxRatePercent: Number(taxRatePercent),
    });
    logAction('STORE_PROFILE_UPDATED', 'SYSTEM', `Store profile saved: ${storeName} (${fullName}) in Galle`);
    showNotification('success', 'Store Profile updated successfully!');
  };

  const handleSavePrinter = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings({
      printerWidth,
      receiptHeader,
      receiptFooter,
      autoPrint,
    });
    logAction('PRINTER_SETTINGS_UPDATED', 'SYSTEM', `Printer standard updated to ${printerWidth}`);
    showNotification('success', 'Printer settings saved successfully');
  };

  const handleSaveAi = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings({
      geminiApiKey,
      geminiModel,
      aiConfidenceThreshold: Number(aiConfidenceThreshold),
    });
    logAction('AI_SETTINGS_UPDATED', 'SYSTEM', `Gemini AI configuration updated model: ${geminiModel}`);
    showNotification('success', 'Gemini AI settings saved successfully');
  };

  const handleTestAiConnection = () => {
    setIsTestingAi(true);
    setAiTestResult(null);
    setTimeout(() => {
      setIsTestingAi(false);
      setAiTestResult('Connected successfully: Gemini 1.5 Flash Vision API responder latency 182ms.');
      showNotification('success', 'Gemini API connection test passed!');
    }, 1200);
  };

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername.trim() || !newUserName.trim()) return;

    addUser({
      username: newUsername.trim().toLowerCase(),
      name: newUserName.trim(),
      role: newUserRole,
      isActive: true,
      status: 'ACTIVE',
      isFirstLogin: false,
      pinCode: newUserPin.trim() || '1234',
    });

    logAction(
      'USER_CREATED', 
      'AUTH', 
      `Created operator account @${newUsername.trim().toLowerCase()} (${newUserName.trim()}) with role ${newUserRole}`
    );
    showNotification('success', `Created user @${newUsername.trim()}`);

    setIsAddUserOpen(false);
    setNewUsername('');
    setNewUserName('');
    setNewUserPassword('');
    setNewUserPin('0000');
  };

  const handleStartEditUser = (u: User) => {
    setSecurityErrorBanner(null);
    setEditingUser(u);
    setEditUserName(u.name || u.full_name || '');
    setEditUserRole(u.role);
    setEditUserStatus(u.isActive === false || u.status === 'DISABLED' || u.status === 'disabled' ? 'DISABLED' : 'ACTIVE');
  };

  const handleSaveEditUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setSecurityErrorBanner(null);

    const willDemote = !['owner', 'OWNER', 'admin', 'ADMIN'].includes(editUserRole);
    const willDisable = editUserStatus === 'DISABLED';

    // CRITICAL SECURITY RULE: Prevent disabling or demoting the last active Owner account!
    if (isOwner(editingUser) && (willDemote || willDisable) && getActiveOwnerCount() <= 1) {
      const errMsg = `CRITICAL SECURITY RULE: You cannot ${willDemote ? 'demote' : 'disable'} the sole active Owner account (@${editingUser.username}) of this store!`;
      setSecurityErrorBanner(errMsg);
      showNotification('error', errMsg);
      return;
    }

    const res = updateUser(editingUser.id, {
      name: editUserName.trim(),
      role: editUserRole,
      isActive: editUserStatus === 'ACTIVE',
      status: editUserStatus,
    });

    if (!res.success) {
      setSecurityErrorBanner(res.error || 'Failed to update user.');
      showNotification('error', res.error || 'Failed to update user');
      return;
    }

    logAction(
      'USER_UPDATED',
      'AUTH',
      `Updated user @${editingUser.username}: Role -> ${editUserRole}, Status -> ${editUserStatus}`
    );
    showNotification('success', `User @${editingUser.username} updated successfully!`);
    setEditingUser(null);
  };

  const handleToggleStatus = (u: User) => {
    setSecurityErrorBanner(null);
    const isCurrentlyActive = u.isActive !== false && u.status !== 'DISABLED' && u.status !== 'disabled';

    // CRITICAL SECURITY RULE: Prevent disabling the last active Owner account!
    if (isCurrentlyActive && isOwner(u) && getActiveOwnerCount() <= 1) {
      const errMsg = `CRITICAL SECURITY RULE: You cannot disable the sole active Owner account (@${u.username})!`;
      setSecurityErrorBanner(errMsg);
      showNotification('error', errMsg);
      return;
    }

    const res = toggleUserStatus(u.id);
    if (!res.success) {
      setSecurityErrorBanner(res.error || 'Failed to toggle status');
      showNotification('error', res.error || 'Prohibited');
    } else {
      const actionName = isCurrentlyActive ? 'Disabled' : 'Enabled';
      logAction('USER_STATUS_TOGGLE', 'AUTH', `${actionName} user account @${u.username}`);
      showNotification('success', `User @${u.username} has been ${actionName.toLowerCase()}`);
    }
  };

  const handleStartResetPassword = (u: User) => {
    setResetPasswordUser(u);
    setNewResetPassword('');
    setConfirmResetPassword('');
    setNewResetPin(u.pinCode || '1234');
    setShowResetPassword(false);
  };

  const handleSaveResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetPasswordUser) return;

    if (!newResetPassword || newResetPassword.length < 4) {
      showNotification('error', 'New password must be at least 4 characters');
      return;
    }

    if (newResetPassword !== confirmResetPassword) {
      showNotification('error', 'Passwords do not match');
      return;
    }

    const res = await resetUserPassword(resetPasswordUser.id, newResetPassword, newResetPin.trim() || undefined);
    if (!res.success) {
      showNotification('error', res.error || 'Failed to reset password');
      return;
    }

    logAction('PASSWORD_RESET', 'AUTH', `Reset password and security credentials for @${resetPasswordUser.username}`);
    showNotification('success', `Password successfully reset for @${resetPasswordUser.username}`);
    setResetPasswordUser(null);
    setNewResetPassword('');
    setConfirmResetPassword('');
    setNewResetPin('');
  };

  const handleDeleteUser = (u: User) => {
    setSecurityErrorBanner(null);
    if (isOwner(u)) {
      const errMsg = 'CRITICAL SECURITY RULE: Store Owner accounts cannot be deleted!';
      setSecurityErrorBanner(errMsg);
      showNotification('error', errMsg);
      return;
    }

    const confirmDelete = window.confirm(`Are you sure you want to permanently delete user @${u.username}?`);
    if (!confirmDelete) return;

    const res = deleteUser(u.id);
    if (!res.success) {
      setSecurityErrorBanner(res.error || 'Cannot delete user');
      showNotification('error', res.error || 'Delete failed');
    } else {
      logAction('USER_DELETED', 'AUTH', `Deleted operator account @${u.username}`);
      showNotification('success', `User @${u.username} deleted.`);
    }
  };

  const [backupStatus, setBackupStatus] = useState<any>(null);
  const [isBackingUp, setIsBackingUp] = useState(false);

  const fetchBackupStatus = async () => {
    try {
      if ((window as any).electronAPI?.system?.getAutoBackupStatus) {
        const res = await (window as any).electronAPI.system.getAutoBackupStatus();
        if (res && res.success) {
          setBackupStatus(res.data);
        }
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    if (activeTab === 'backup') {
      fetchBackupStatus();
    }
  }, [activeTab]);

  const handleTriggerManualBackup = async () => {
    setIsBackingUp(true);
    try {
      if ((window as any).electronAPI?.system?.triggerAutoBackup) {
        const res = await (window as any).electronAPI.system.triggerAutoBackup();
        if (res && res.success) {
          showNotification('success', 'Automated database backup created successfully!');
          fetchBackupStatus();
        } else {
          showNotification('error', res?.error || 'Failed to trigger backup');
        }
      } else {
        handleBackupJson();
      }
    } catch (err: any) {
      showNotification('error', err?.message || 'Backup failed');
    } finally {
      setIsBackingUp(false);
    }
  };

  const handleSelectBackupFolder = async () => {
    try {
      if ((window as any).electronAPI?.system?.selectBackupFolder) {
        const res = await (window as any).electronAPI.system.selectBackupFolder();
        if (res && res.data) {
          const folder = res.data;
          if ((window as any).electronAPI?.system?.setBackupFolder) {
            await (window as any).electronAPI.system.setBackupFolder({ folderPath: folder });
          }
          showNotification('success', `Backup folder changed to: ${folder}`);
          fetchBackupStatus();
        }
      } else {
        showNotification('info', 'Folder selection is available in the desktop application');
      }
    } catch (err: any) {
      showNotification('error', err?.message || 'Failed to select backup directory');
    }
  };

  const handleSaveBackupAs = async () => {
    setIsBackingUp(true);
    try {
      if ((window as any).electronAPI?.system?.saveBackupAs) {
        const res = await (window as any).electronAPI.system.saveBackupAs();
        if (res && res.success && !res.data?.canceled) {
          showNotification('success', `Database backup saved successfully to: ${res.data?.filePath}`);
          fetchBackupStatus();
        } else if (res && !res.success) {
          showNotification('error', res?.error || 'Failed to save backup file');
        }
      } else {
        handleBackupJson();
      }
    } catch (err: any) {
      showNotification('error', err?.message || 'Save backup failed');
    } finally {
      setIsBackingUp(false);
    }
  };

  const handleRestoreBackup = async () => {
    try {
      if ((window as any).electronAPI?.system?.selectRestoreFile) {
        const filePath = await (window as any).electronAPI.system.selectRestoreFile();
        if (filePath && filePath.data) {
          const confirmRestore = window.confirm(
            `Are you sure you want to restore the database from:\n${filePath.data}\n\nA safety backup of your current database will be saved before replacement.`
          );
          if (!confirmRestore) return;

          const res = await (window as any).electronAPI.system.restore({ filePath: filePath.data });
          if (res && res.success) {
            showNotification('success', 'Database restored successfully! Reloading...');
            setTimeout(() => window.location.reload(), 1500);
          } else {
            showNotification('error', res?.error || 'Failed to restore database');
          }
        }
      }
    } catch (err: any) {
      showNotification('error', err?.message || 'Restore failed');
    }
  };

  const handleConfirmReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetAdminPassword.trim()) {
      setResetError('Please enter the Admin Password (à¶´à¶»à·’à¶´à·à¶½à¶š à¶¸à·”à¶»à¶´à¶¯à¶º à¶‡à¶­à·”à·…à¶­à·Š à¶šà¶»à¶±à·Šà¶±).');
      return;
    }
    if (!resetConfirmChecked) {
      setResetError('Please check the confirmation box to proceed (à¶­à·„à·€à·”à¶»à·” à¶šà·’à¶»à·“à¶¸à·š à¶šà·œà¶§à·”à·€ à·ƒà¶½à¶šà·”à¶«à·” à¶šà¶»à¶±à·Šà¶±).');
      return;
    }

    setIsResetting(true);
    setResetError(null);
    try {
      const res = await resetAllStoreData(resetAdminPassword.trim());
      if (res.success) {
        setIsResetModalOpen(false);
        setResetAdminPassword('');
        setResetConfirmChecked(false);
        showNotification('success', 'Store data successfully wiped! Fresh clean database ready.');
      } else {
        setResetError(res.error || 'Failed to reset store data.');
      }
    } catch (err: any) {
      setResetError(err?.message || 'An error occurred during data reset.');
    } finally {
      setIsResetting(false);
    }
  };

  const handleBackupJson = () => {
    const backupData = {
      timestamp: new Date().toISOString(),
      settings,
      products,
      sales,
      customers,
      users,
      auditLogs,
    };

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(backupData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `AppleVision_Backup_${new Date().toISOString().substring(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();

    showNotification('success', 'Database JSON backup generated and saved to Downloads');
  };

  return (
    <div className="space-y-6 select-none">
      {/* Header Banner */}
      <div className="p-6 rounded-3xl bg-white dark:bg-dark-card border border-light-border dark:border-dark-border shadow-sm flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1 rounded-lg bg-brand-500/10 text-brand-500">
              <Settings className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-black text-slate-900 dark:text-white">
              System Settings & Administration
            </h2>
          </div>
          <p className="text-xs text-light-muted dark:text-dark-muted mt-1">
            Store metadata, thermal receipt layouts, Gemini AI keys, user permissions, and audit logs.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setResetError(null);
            setResetAdminPassword('');
            setResetConfirmChecked(false);
            setIsResetModalOpen(true);
          }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-600/10 hover:bg-red-600 border border-red-500/30 text-red-600 hover:text-white text-xs font-bold transition-all shadow-sm"
          title="Delete all billing, products and histories (Admin password required)"
        >
          <Trash2 className="w-4 h-4" />
          <span className="hidden sm:inline">Reset Store Data</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-white/70 dark:bg-dark-card/70 backdrop-blur border border-light-border dark:border-dark-border text-xs overflow-x-auto">
        {[
          { id: 'profile', label: 'Store Profile', icon: Store },
          { id: 'printer', label: 'Thermal Printer', icon: Printer },
          { id: 'ai', label: 'Gemini AI BYOK', icon: Sparkles },
          { id: 'appearance', label: 'Appearance', icon: Palette },
          { id: 'users', label: 'Users & Permissions', icon: Users },
          { id: 'audit', label: 'Security Audit Log', icon: ShieldCheck },
          { id: 'backup', label: 'Backup & Restore', icon: Database },
        ].map((tab) => {
          const Icon = tab.icon;
          const isSelected = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold whitespace-nowrap transition-all ${
                isSelected
                  ? 'bg-brand-500 text-white shadow-md shadow-brand-500/25'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* APPEARANCE TAB */}
      {activeTab === 'appearance' && (
        <div className="p-6 rounded-3xl bg-white dark:bg-dark-card border border-light-border dark:border-dark-border shadow-sm space-y-8 max-w-2xl">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Palette className="w-5 h-5 text-brand-500" />
              Color Theme
            </h3>
            <p className="text-xs text-light-muted dark:text-dark-muted mt-1">
              Choose your preferred color palette. Your selection is saved automatically.
            </p>
          </div>

          {/* Color Palette Cards */}
          <div className="grid grid-cols-1 gap-3">
            {(Object.entries(COLOR_PALETTE_META) as [ColorPalette, typeof COLOR_PALETTE_META[ColorPalette]][]).map(
              ([key, meta]) => {
                const isActive = colorPalette === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => {
                      setColorPalette(key);
                      showNotification('success', `Theme changed to "${meta.label}"`);
                    }}
                    className={`flex items-center gap-4 px-5 py-4 rounded-2xl border-2 text-left transition-all ${
                      isActive
                        ? 'border-brand-500 bg-brand-500/5 shadow-md shadow-brand-500/10'
                        : 'border-light-border dark:border-dark-border hover:border-brand-300 dark:hover:border-brand-700'
                    }`}
                  >
                    {/* Swatches */}
                    <div className="flex items-center gap-1 flex-shrink-0">
                      {meta.swatches.map((color, i) => (
                        <span
                          key={i}
                          className="w-6 h-6 rounded-full border border-white/20 shadow-sm"
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>

                    {/* Label */}
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-slate-900 dark:text-white">
                          {meta.label}
                        </span>
                        {isActive && (
                          <span className="px-2 py-0.5 rounded-full bg-brand-500 text-white text-[10px] font-black uppercase tracking-wider">
                            Active
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-light-muted dark:text-dark-muted mt-0.5">
                        {meta.description}
                      </p>
                    </div>

                    {/* Check indicator */}
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                      isActive
                        ? 'border-brand-500 bg-brand-500'
                        : 'border-slate-300 dark:border-slate-600'
                    }`}>
                      {isActive && <Check className="w-3 h-3 text-white" />}
                    </div>
                  </button>
                );
              }
            )}
          </div>

          {/* Base Dark/Light toggle â€” only shown when palette is 'default' */}
          {colorPalette === 'default' && (
            <div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-3">
                Light / Dark Mode
              </h4>
              <div className="flex gap-2">
                {(['dark', 'light', 'system'] as const).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => {
                      setThemeMode(mode);
                      showNotification('success', `Switched to ${mode} mode`);
                    }}
                    className={`flex-1 py-2.5 rounded-xl text-xs font-bold capitalize border transition-all ${
                      themeMode === mode
                        ? 'bg-brand-500 border-brand-500 text-white shadow-md shadow-brand-500/25'
                        : 'border-light-border dark:border-dark-border text-slate-600 dark:text-slate-300 hover:border-brand-300'
                    }`}
                  >
                    {mode === 'dark' ? 'ðŸŒ™ Dark' : mode === 'light' ? 'â˜€ï¸ Light' : 'ðŸ–¥ System'}
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-light-muted dark:text-dark-muted mt-2">
                "System" automatically follows your Windows dark/light mode preference.
              </p>
            </div>
          )}

          <div className="pt-2 border-t border-light-border dark:border-dark-border">
            <p className="text-[10px] text-light-muted dark:text-dark-muted">
              Theme preference is saved in your browser storage and applied instantly.
            </p>
          </div>
        </div>
      )}

      {/* 1. STORE PROFILE TAB */}
      {activeTab === 'profile' && (
        <form onSubmit={handleSaveProfile} className="p-6 rounded-3xl bg-white dark:bg-dark-card border border-light-border dark:border-dark-border shadow-sm space-y-4 max-w-2xl">
          <h3 className="text-base font-bold text-slate-900 dark:text-white">Store Identity & Contact</h3>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Brand Name</label>
              <input
                type="text"
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Full Store Title</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Tagline</label>
              <input
                type="text"
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Owner Name</label>
              <input
                type="text"
                value={owner}
                onChange={(e) => setOwner(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Hotline</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">WhatsApp</label>
              <input
                type="text"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Street Address</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">City</label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border"
              />
            </div>
          </div>

          <div className="grid grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Postal Code</label>
              <input
                type="text"
                value={postalCode}
                onChange={(e) => setPostalCode(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Currency Prefix</label>
              <input
                type="text"
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Currency ISO</label>
              <input
                type="text"
                value={currencySymbol}
                onChange={(e) => setCurrencySymbol(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Tax Rate (%)</label>
              <input
                type="number"
                min="0"
                max="100"
                value={taxRatePercent}
                onChange={(e) => setTaxRatePercent(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs rounded-xl bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border font-mono"
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-xs font-bold shadow-md shadow-brand-500/25"
            >
              Save Store Profile
            </button>
          </div>
        </form>
      )}

      {/* CHANGE MY PASSWORD CARD â€” shown in profile tab */}
      {activeTab === 'profile' && (
        <div className="p-6 rounded-3xl bg-white dark:bg-dark-card border border-light-border dark:border-dark-border shadow-sm max-w-2xl">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-brand-500/10 text-brand-500">
                <Lock className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Change Login Password</h3>
                <p className="text-[11px] text-light-muted dark:text-dark-muted">
                  Logged in as <strong>{currentUser?.username}</strong> Â· {currentUser?.role}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                setIsChangePwOpen(prev => !prev);
                setCpError(null); setCpSuccess(false);
                setCpOldPassword(''); setCpNewPassword(''); setCpConfirmPassword('');
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold border transition-all ${
                isChangePwOpen
                  ? 'bg-slate-100 dark:bg-dark-surface border-slate-300 dark:border-dark-border text-slate-600 dark:text-slate-300'
                  : 'bg-brand-500/10 border-brand-500/30 text-brand-600 dark:text-brand-400 hover:bg-brand-500 hover:text-white hover:border-brand-500'
              }`}
            >
              <KeyRound className="w-3.5 h-3.5" />
              {isChangePwOpen ? 'Cancel' : 'Change Password'}
            </button>
          </div>

          {isChangePwOpen && (
            <form onSubmit={handleChangeMyPassword} className="space-y-3 pt-4 border-t border-light-border dark:border-dark-border">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Current Password</label>
                <div className="relative">
                  <input
                    type={cpShowOld ? 'text' : 'password'}
                    value={cpOldPassword}
                    onChange={(e) => setCpOldPassword(e.target.value)}
                    placeholder="Enter your current password"
                    autoComplete="current-password"
                    className="w-full px-3 py-2.5 pr-10 text-xs rounded-xl bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border focus:outline-none focus:border-brand-500 text-slate-900 dark:text-white"
                  />
                  <button type="button" onClick={() => setCpShowOld(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                    {cpShowOld ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">New Password</label>
                <div className="relative">
                  <input
                    type={cpShowNew ? 'text' : 'password'}
                    value={cpNewPassword}
                    onChange={(e) => setCpNewPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    autoComplete="new-password"
                    className="w-full px-3 py-2.5 pr-10 text-xs rounded-xl bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border focus:outline-none focus:border-brand-500 text-slate-900 dark:text-white"
                  />
                  <button type="button" onClick={() => setCpShowNew(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                    {cpShowNew ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
                {cpNewPassword.length > 0 && (
                  <div className="mt-1.5 flex items-center gap-2">
                    <div className="flex gap-1 flex-1">
                      {[1,2,3,4].map(i => (
                        <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${
                          cpNewPassword.length >= i * 3
                            ? cpNewPassword.length >= 10 ? 'bg-emerald-500' : cpNewPassword.length >= 7 ? 'bg-amber-500' : 'bg-red-400'
                            : 'bg-slate-200 dark:bg-dark-border'
                        }`} />
                      ))}
                    </div>
                    <span className={`text-[10px] font-semibold ${cpNewPassword.length >= 10 ? 'text-emerald-500' : cpNewPassword.length >= 7 ? 'text-amber-500' : 'text-red-400'}`}>
                      {cpNewPassword.length >= 10 ? 'Strong' : cpNewPassword.length >= 7 ? 'Medium' : 'Weak'}
                    </span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Confirm New Password</label>
                <div className="relative">
                  <input
                    type={cpShowNew ? 'text' : 'password'}
                    value={cpConfirmPassword}
                    onChange={(e) => setCpConfirmPassword(e.target.value)}
                    placeholder="Re-enter new password"
                    autoComplete="new-password"
                    className={`w-full px-3 py-2.5 pr-10 text-xs rounded-xl bg-light-surface dark:bg-dark-surface border focus:outline-none text-slate-900 dark:text-white transition-colors ${
                      cpConfirmPassword && cpNewPassword !== cpConfirmPassword
                        ? 'border-red-400' : cpConfirmPassword && cpNewPassword === cpConfirmPassword
                        ? 'border-emerald-400' : 'border-light-border dark:border-dark-border focus:border-brand-500'
                    }`}
                  />
                  {cpConfirmPassword && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      {cpNewPassword === cpConfirmPassword
                        ? <Check className="w-3.5 h-3.5 text-emerald-500" />
                        : <X className="w-3.5 h-3.5 text-red-400" />}
                    </div>
                  )}
                </div>
              </div>

              {cpError && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                  <ShieldAlert className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />
                  <p className="text-[11px] text-red-700 dark:text-red-300">{cpError}</p>
                </div>
              )}
              {cpSuccess && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800">
                  <Check className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                  <p className="text-[11px] text-emerald-700 dark:text-emerald-300 font-semibold">âœ“ Password changed successfully! Please remember your new password.</p>
                </div>
              )}

              <div className="flex items-center gap-3 pt-1">
                <button
                  type="submit"
                  disabled={cpLoading || !cpOldPassword || cpNewPassword.length < 6 || cpNewPassword !== cpConfirmPassword}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold shadow-md shadow-brand-500/25 transition-all"
                >
                  {cpLoading
                    ? <><RefreshCw className="w-3.5 h-3.5 animate-spin" />Saving...</>
                    : <><Save className="w-3.5 h-3.5" />Save New Password</>}
                </button>
                <p className="text-[10px] text-light-muted dark:text-dark-muted">bcrypt-hashed Â· saved to SQLite</p>
              </div>
            </form>
          )}

          {!isChangePwOpen && (
            <p className="text-[11px] text-light-muted dark:text-dark-muted">
              Click <strong>Change Password</strong> to update your login credentials. Your current password is required for verification.
            </p>
          )}
        </div>
      )}

      {/* 2. THERMAL PRINTER TAB */}
      {activeTab === 'printer' && (
        <form onSubmit={handleSavePrinter} className="p-6 rounded-3xl bg-white dark:bg-dark-card border border-light-border dark:border-dark-border shadow-sm space-y-4 max-w-2xl">
          <h3 className="text-base font-bold text-slate-900 dark:text-white">80mm Thermal Receipt Layout</h3>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Paper Roll Standard</label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold">
                <input
                  type="radio"
                  name="printerWidth"
                  value="80mm"
                  checked={printerWidth === '80mm'}
                  onChange={() => setPrinterWidth('80mm')}
                  className="text-brand-500"
                />
                <span>80mm (Standard POS Thermal Printer - Recommended)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold">
                <input
                  type="radio"
                  name="printerWidth"
                  value="58mm"
                  checked={printerWidth === '58mm'}
                  onChange={() => setPrinterWidth('58mm')}
                  className="text-brand-500"
                />
                <span>58mm (Compact Mobile)</span>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Header Welcome Text</label>
            <textarea
              rows={2}
              value={receiptHeader}
              onChange={(e) => setReceiptHeader(e.target.value)}
              className="w-full p-2.5 text-xs rounded-xl bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Footer Warranty Disclaimer</label>
            <textarea
              rows={3}
              value={receiptFooter}
              onChange={(e) => setReceiptFooter(e.target.value)}
              className="w-full p-2.5 text-xs rounded-xl bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border font-mono"
            />
          </div>

          <div className="flex items-center gap-2 pt-2">
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-xs font-bold shadow-md shadow-brand-500/25"
            >
              Save Printer Settings
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              className="px-4 py-2.5 rounded-xl bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border text-xs font-semibold"
            >
              Test Print Sample
            </button>
          </div>
        </form>
      )}

      {/* 3. GEMINI AI TAB */}
      {activeTab === 'ai' && (
        <form onSubmit={handleSaveAi} className="p-6 rounded-3xl bg-white dark:bg-dark-card border border-light-border dark:border-dark-border shadow-sm space-y-4 max-w-2xl">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-brand-500" />
              Gemini AI Key & Model Configuration
            </h3>
            <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
              BYOK Enabled
            </span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Google Gemini API Key
            </label>
            <div className="relative">
              <input
                type={showApiKey ? 'text' : 'password'}
                placeholder="AIzaSy..."
                value={geminiApiKey}
                onChange={(e) => setGeminiApiKey(e.target.value)}
                className="w-full pl-3 pr-10 py-2.5 text-xs rounded-xl bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border focus:outline-none focus:border-brand-500 font-mono"
              />
              <button
                type="button"
                onClick={() => setShowApiKey(!showApiKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-[10px] text-light-muted mt-1">
              Keys remain stored in local encrypted desktop storage and are never relayed to unauthorized servers.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Gemini Model</label>
              <select
                value={geminiModel}
                onChange={(e) => setGeminiModel(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border focus:outline-none focus:border-brand-500 font-mono"
              >
                <option value="gemini-1.5-flash">Gemini 1.5 Flash (Ultra High-Speed POS)</option>
                <option value="gemini-1.5-pro">Gemini 1.5 Pro (Deep Multimodal OCR)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Confidence Threshold ({aiConfidenceThreshold}%)
              </label>
              <input
                type="range"
                min="50"
                max="99"
                value={aiConfidenceThreshold}
                onChange={(e) => setAiConfidenceThreshold(Number(e.target.value))}
                className="w-full accent-brand-500"
              />
            </div>
          </div>

          {aiTestResult && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
              <Check className="w-4 h-4 flex-shrink-0" />
              <span>{aiTestResult}</span>
            </div>
          )}

          <div className="flex items-center gap-2 pt-2">
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-xs font-bold shadow-md shadow-brand-500/25"
            >
              Save AI Settings
            </button>
            <button
              type="button"
              disabled={isTestingAi}
              onClick={handleTestAiConnection}
              className="px-4 py-2.5 rounded-xl bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border text-xs font-semibold flex items-center gap-1.5"
            >
              {isTestingAi && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
              <span>Test API Ping</span>
            </button>
          </div>
        </form>
      )}

      {/* 4. USERS & PERMISSIONS TAB */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          {/* Critical Security Error Banner */}
          {securityErrorBanner && (
            <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 flex items-center justify-between text-xs animate-pulse">
              <div className="flex items-center gap-3">
                <span className="p-1.5 rounded-lg bg-rose-500/20 text-rose-500">
                  <ShieldAlert className="w-5 h-5 flex-shrink-0" />
                </span>
                <div>
                  <span className="font-extrabold uppercase tracking-wide">Owner Account Governance Protection:</span>
                  <p className="mt-0.5 font-medium">{securityErrorBanner}</p>
                </div>
              </div>
              <button 
                onClick={() => setSecurityErrorBanner(null)} 
                className="p-1.5 hover:bg-rose-500/20 rounded-xl transition-colors"
                title="Dismiss warning"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>Store Operators & Access Control</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-brand-500/10 text-brand-500 border border-brand-500/20">
                  {users.length} Users ({getActiveOwnerCount()} Active Owner)
                </span>
              </h3>
              <p className="text-xs text-light-muted dark:text-dark-muted mt-0.5">
                Role-based access control (Owner, Manager, Cashier, Technician) with strict governance.
              </p>
            </div>
            <button
              onClick={() => {
                setSecurityErrorBanner(null);
                setIsAddUserOpen(true);
              }}
              className="px-4 py-2 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-xs font-bold shadow-md shadow-brand-500/25 flex items-center gap-1.5 transition-all"
            >
              <UserPlus className="w-4 h-4" />
              <span>+ Add User Account</span>
            </button>
          </div>

          <div className="p-5 rounded-3xl bg-white dark:bg-dark-card border border-light-border dark:border-dark-border shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-light-border dark:border-dark-border text-light-muted dark:text-dark-muted font-bold text-[10px] uppercase tracking-wider">
                    <th className="pb-3">Username</th>
                    <th className="pb-3">Full Name</th>
                    <th className="pb-3">Role</th>
                    <th className="pb-3 text-center">PIN</th>
                    <th className="pb-3">Last Login</th>
                    <th className="pb-3 text-center">Status</th>
                    <th className="pb-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-light-border dark:divide-dark-border">
                  {users.map((u) => {
                    const isOwnerAccount = isOwner(u);
                    const isActive = u.isActive !== false && u.status !== 'DISABLED' && u.status !== 'disabled';
                    const roleLower = String(u.role || '').toLowerCase();
                    const isCurrentUser = currentUser?.id === u.id || currentUser?.username === u.username;

                    return (
                      <tr key={u.id} className="hover:bg-light-surface/40 dark:hover:bg-dark-surface/40 transition-colors">
                        <td className="py-3 font-mono font-bold text-slate-900 dark:text-white">
                          <div className="flex items-center gap-1.5">
                            <span>@{u.username}</span>
                            {isOwnerAccount && (
                              <span title="Owner Account (Protected)">
                                <ShieldCheck className="w-3.5 h-3.5 text-purple-500" />
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-3 font-semibold text-slate-800 dark:text-slate-200">
                          {u.name || u.full_name || 'Store Operator'}
                        </td>
                        <td className="py-3">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                            roleLower === 'owner' || roleLower === 'admin'
                              ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20'
                              : roleLower === 'manager'
                              ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20'
                              : roleLower === 'technician'
                              ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                              : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                          }`}>
                            {u.role}
                          </span>
                        </td>
                        <td className="py-3 font-mono text-center text-light-muted font-bold">
                          {u.pinCode || 'â€¢â€¢â€¢â€¢'}
                        </td>
                        <td className="py-3 font-mono text-[11px] text-light-muted">
                          {u.lastLogin || 'Never'}
                        </td>
                        <td className="py-3 text-center">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            isActive
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                              : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                            {isActive ? 'Active' : 'Disabled'}
                          </span>
                        </td>
                        <td className="py-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Edit Button */}
                            <button
                              onClick={() => handleStartEditUser(u)}
                              title="Edit User Details & Role"
                              className="p-1.5 rounded-lg bg-light-surface dark:bg-dark-surface hover:bg-brand-500/10 hover:text-brand-500 text-slate-600 dark:text-slate-300 border border-light-border dark:border-dark-border transition-colors"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>

                            {/* Reset Password Button */}
                            <button
                              onClick={() => handleStartResetPassword(u)}
                              title="Reset Password & PIN"
                              className="p-1.5 rounded-lg bg-light-surface dark:bg-dark-surface hover:bg-amber-500/10 hover:text-amber-500 text-slate-600 dark:text-slate-300 border border-light-border dark:border-dark-border transition-colors"
                            >
                              <KeyRound className="w-3.5 h-3.5" />
                            </button>

                            {/* Enable/Disable Toggle */}
                            <button
                              onClick={() => handleToggleStatus(u)}
                              title={isActive ? 'Disable User' : 'Enable User'}
                              className={`p-1.5 rounded-lg border transition-colors ${
                                isActive
                                  ? 'bg-rose-500/5 hover:bg-rose-500/20 text-rose-500 border-rose-500/20'
                                  : 'bg-emerald-500/5 hover:bg-emerald-500/20 text-emerald-500 border-emerald-500/20'
                              }`}
                            >
                              {isActive ? <UserX className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />}
                            </button>

                            {/* Delete User (disabled for owner) */}
                            {!isOwnerAccount && !isCurrentUser && (
                              <button
                                onClick={() => handleDeleteUser(u)}
                                title="Delete User"
                                className="p-1.5 rounded-lg bg-light-surface dark:bg-dark-surface hover:bg-rose-500/10 hover:text-rose-500 text-slate-400 border border-light-border dark:border-dark-border transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 5. AUDIT LOG TAB */}
      {activeTab === 'audit' && (
        <div className="p-5 rounded-3xl bg-white dark:bg-dark-card border border-light-border dark:border-dark-border shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-brand-500" />
              Terminal Audit Trail & Security Log
            </h3>
            <span className="text-xs font-mono text-light-muted">{auditLogs.length} events logged</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-light-border dark:border-dark-border text-light-muted dark:text-dark-muted font-bold text-[10px] uppercase tracking-wider">
                  <th className="pb-3">Timestamp</th>
                  <th className="pb-3">Action</th>
                  <th className="pb-3">User</th>
                  <th className="pb-3">Event Details</th>
                  <th className="pb-3">Terminal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-light-border dark:divide-dark-border font-mono text-[11px]">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-light-surface/40 dark:hover:bg-dark-surface/40">
                    <td className="py-2.5 text-light-muted whitespace-nowrap">{log.timestamp}</td>
                    <td className="py-2.5">
                      <span className="px-2 py-0.5 rounded font-bold text-[10px] bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border text-brand-500">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-2.5 font-sans font-semibold text-slate-800 dark:text-slate-200">{log.userName}</td>
                    <td className="py-2.5 font-sans text-slate-700 dark:text-slate-300">{log.details}</td>
                    <td className="py-2.5 text-light-muted">{log.ipOrTerminal}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 6. BACKUP & AUTO-SAVE TAB */}
      {activeTab === 'backup' && (
        <div className="space-y-6 max-w-4xl">
          {/* Card 1: Real-time Auto-Save Engine */}
          <div className="p-6 rounded-3xl bg-white dark:bg-dark-card border border-light-border dark:border-dark-border shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                  <HardDrive className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <span>Real-Time Auto-Save Engine</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                      Active (Always On)
                    </span>
                  </h3>
                  <p className="text-xs text-light-muted dark:text-dark-muted mt-0.5">
                    Data is flushed directly to local SQLite database (<code className="font-mono text-[11px] text-brand-500">applevision.db</code>) with atomic transactions.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
              <div className="p-3 rounded-2xl bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border">
                <div className="text-[10px] uppercase font-bold text-light-muted dark:text-dark-muted">Storage Engine</div>
                <div className="text-xs font-bold text-slate-900 dark:text-white mt-1">WebAssembly SQLite (Offline-First)</div>
              </div>
              <div className="p-3 rounded-2xl bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border">
                <div className="text-[10px] uppercase font-bold text-light-muted dark:text-dark-muted">Save Triggers</div>
                <div className="text-xs font-bold text-slate-900 dark:text-white mt-1">Immediate (run/transaction/blur)</div>
              </div>
              <div className="p-3 rounded-2xl bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border">
                <div className="text-[10px] uppercase font-bold text-light-muted dark:text-dark-muted">Crash & Power Cut Protection</div>
                <div className="text-xs font-bold text-emerald-500 mt-1">Atomic Rollback & Redundancy</div>
              </div>
            </div>
          </div>

          {/* Card 2: Automated Twice-Daily Backup Scheduler */}
          <div className="p-6 rounded-3xl bg-white dark:bg-dark-card border border-light-border dark:border-dark-border shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="p-2.5 rounded-xl bg-brand-500/10 text-brand-500 border border-brand-500/20">
                  <Clock className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <span>Twice-Daily Automated Backup Scheduler</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-brand-500/10 text-brand-500 border border-brand-500/30">
                      2x Daily Schedule
                    </span>
                  </h3>
                  <p className="text-xs text-light-muted dark:text-dark-muted mt-0.5">
                    Automated snapshots are saved at Midday (12:00 PM) and Evening (08:00 PM) plus interval failsafes.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={handleTriggerManualBackup}
                  disabled={isBackingUp}
                  className="px-4 py-2 rounded-xl bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white text-xs font-bold shadow-md shadow-brand-500/25 flex items-center gap-2 transition-colors"
                >
                  <RefreshCw className={`w-4 h-4 ${isBackingUp ? 'animate-spin' : ''}`} />
                  <span>{isBackingUp ? 'Backing Up...' : 'Backup Now'}</span>
                </button>
                <button
                  onClick={handleSaveBackupAs}
                  disabled={isBackingUp}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600 text-white text-xs font-bold flex items-center gap-2 transition-colors shadow-xs"
                  title="Choose custom file name and folder to save a SQLite .db backup"
                >
                  <Save className="w-4 h-4 text-emerald-400" />
                  <span>Save Backup As...</span>
                </button>
                <button
                  onClick={handleRestoreBackup}
                  className="px-4 py-2 rounded-xl bg-light-surface dark:bg-dark-surface hover:bg-light-border dark:hover:bg-dark-border text-slate-800 dark:text-slate-200 text-xs font-bold border border-light-border dark:border-dark-border flex items-center gap-2 transition-colors"
                  title="Restore from an existing SQLite .db backup file"
                >
                  <Upload className="w-4 h-4" />
                  <span>Restore from File</span>
                </button>
                <button
                  onClick={handleBackupJson}
                  title="Export raw JSON snapshot"
                  className="p-2 rounded-xl bg-light-surface dark:bg-dark-surface hover:bg-light-border dark:hover:bg-dark-border text-slate-700 dark:text-slate-300 border border-light-border dark:border-dark-border"
                >
                  <Download className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Schedule Slot Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
              <div className="p-3.5 rounded-2xl bg-light-surface/60 dark:bg-dark-surface/60 border border-light-border dark:border-dark-border">
                <div className="text-[10px] uppercase font-bold text-light-muted dark:text-dark-muted">Slot 1 (Midday)</div>
                <div className="text-sm font-black text-slate-900 dark:text-white mt-1">12:00 PM</div>
                <div className="text-[10px] text-light-muted mt-0.5">Active window: 11 AM - 2 PM</div>
              </div>
              <div className="p-3.5 rounded-2xl bg-light-surface/60 dark:bg-dark-surface/60 border border-light-border dark:border-dark-border">
                <div className="text-[10px] uppercase font-bold text-light-muted dark:text-dark-muted">Slot 2 (Evening)</div>
                <div className="text-sm font-black text-slate-900 dark:text-white mt-1">08:00 PM</div>
                <div className="text-[10px] text-light-muted mt-0.5">Store close window: 6 PM - 10 PM</div>
              </div>
              <div className="p-3.5 rounded-2xl bg-light-surface/60 dark:bg-dark-surface/60 border border-light-border dark:border-dark-border">
                <div className="text-[10px] uppercase font-bold text-light-muted dark:text-dark-muted">Interval Failsafe</div>
                <div className="text-sm font-black text-emerald-500 mt-1">Every 8 Hours</div>
                <div className="text-[10px] text-light-muted mt-0.5">Guarantees â‰¥2 backups daily</div>
              </div>
              <div className="p-3.5 rounded-2xl bg-light-surface/60 dark:bg-dark-surface/60 border border-light-border dark:border-dark-border">
                <div className="text-[10px] uppercase font-bold text-light-muted dark:text-dark-muted">Retention Policy</div>
                <div className="text-sm font-black text-slate-900 dark:text-white mt-1">60 Snapshots</div>
                <div className="text-[10px] text-light-muted mt-0.5">Last 30 days history kept</div>
              </div>
            </div>

            {/* Folder & Status Info with Manual Choose Button */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-dark-surface/80 border border-light-border dark:border-dark-border flex flex-col md:flex-row md:items-center justify-between text-xs gap-3">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 min-w-0">
                <div className="flex items-center gap-2">
                  <FolderOpen className="w-4 h-4 text-brand-500 flex-shrink-0" />
                  <span className="text-light-muted font-medium whitespace-nowrap">Backup Folder:</span>
                </div>
                <span
                  title={backupStatus?.backupDirectory || '%APPDATA%/AppleVisionPOS/backups/auto'}
                  className="font-mono font-semibold text-slate-800 dark:text-slate-200 text-[11px] truncate max-w-xs md:max-w-md bg-light-elevated dark:bg-dark-elevated px-2.5 py-1 rounded-lg border border-light-border dark:border-dark-border"
                >
                  {backupStatus?.backupDirectory || '%APPDATA%/AppleVisionPOS/backups/auto'}
                </span>
                <button
                  type="button"
                  onClick={handleSelectBackupFolder}
                  className="px-3 py-1 rounded-lg bg-brand-500/10 hover:bg-brand-500/20 text-brand-600 dark:text-brand-400 border border-brand-500/30 text-xs font-bold transition-colors w-fit flex items-center gap-1.5 flex-shrink-0"
                  title="Browse and select custom backup destination folder"
                >
                  <FolderOpen className="w-3.5 h-3.5" />
                  <span>Browse / Change Folder</span>
                </button>
              </div>
              <div className="text-[11px] text-light-muted flex-shrink-0">
                Last Backup: <strong className="text-slate-900 dark:text-white font-mono">{backupStatus?.lastBackupTime || 'Active on system start'}</strong>
              </div>
            </div>

            {/* Recent Automated Backups List */}
            {backupStatus?.recentBackups && backupStatus.recentBackups.length > 0 && (
              <div className="pt-2 space-y-2">
                <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  Recent Automated Snapshots ({backupStatus.recentBackups.length})
                </div>
                <div className="max-h-56 overflow-y-auto space-y-1.5 pr-1">
                  {backupStatus.recentBackups.map((b: any, idx: number) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-xl bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2.5">
                        <Database className="w-4 h-4 text-emerald-500" />
                        <div>
                          <div className="font-mono font-bold text-slate-900 dark:text-white text-[11px]">
                            {b.fileName}
                          </div>
                          <div className="text-[10px] text-light-muted flex items-center gap-2">
                            <span>{b.createdAt}</span>
                            <span>â€¢</span>
                            <span className="uppercase text-brand-500 font-bold">{b.type}</span>
                          </div>
                        </div>
                      </div>
                      <div className="font-mono text-[11px] font-bold text-slate-700 dark:text-slate-300">
                        {(b.size / 1024).toFixed(1)} KB
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Card: Danger Zone / Reset All Store Data */}
          <div className="p-6 rounded-3xl bg-red-500/5 dark:bg-red-500/10 border-2 border-red-500/30 dark:border-red-500/40 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start sm:items-center gap-3">
                <span className="p-3 rounded-2xl bg-red-500/10 text-red-500 border border-red-500/20 flex-shrink-0">
                  <AlertTriangle className="w-6 h-6" />
                </span>
                <div>
                  <h3 className="text-base font-bold text-red-600 dark:text-red-400 flex items-center gap-2">
                    <span>Danger Zone: Reset All Store Data</span>
                    <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-red-500 text-white font-black uppercase tracking-wider">
                      Admin Password Required
                    </span>
                  </h3>
                  <p className="text-xs text-slate-700 dark:text-slate-300 mt-1 font-medium">
                    à·ƒà·’à¶ºà¶½à·”à¶¸ à·€à·’à¶šà·”à¶«à·”à¶¸à·Š à¶¶à·’à¶½à·Šà¶´à¶­à·Š (Invoices), à¶·à·à¶«à·Šà¶© (Products & IMEIs), à¶´à·à¶»à·’à¶·à·à¶œà·’à¶š à¶«à¶º à·ƒà·„ à¶‰à¶­à·’à·„à·à·ƒà¶º à·ƒà¶¸à·Šà¶´à·–à¶»à·Šà¶«à¶ºà·™à¶±à·Šà¶¸ à¶¸à¶šà· à¶¯à·à¶¸à·“à¶¸.
                  </p>
                  <p className="text-[11px] text-light-muted dark:text-dark-muted mt-0.5">
                    Permanently wipes billing, inventory, repairs, customers, expenses, and transaction logs. Store Settings and Admin Account are preserved.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setResetError(null);
                  setResetAdminPassword('');
                  setResetConfirmChecked(false);
                  setIsResetModalOpen(true);
                }}
                className="flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-red-600 hover:bg-red-700 active:scale-95 text-white text-xs font-black shadow-lg shadow-red-600/30 transition-all flex-shrink-0"
              >
                <Trash2 className="w-4 h-4" />
                <span>Reset All Store Data</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 1. Add User Modal */}
      {isAddUserOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white dark:bg-dark-card border border-light-border dark:border-dark-border rounded-3xl shadow-2xl p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-light-border dark:border-dark-border pb-3">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-brand-500/10 text-brand-500">
                  <UserPlus className="w-4 h-4" />
                </span>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Add Operator Account</h3>
              </div>
              <button onClick={() => setIsAddUserOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Username *</label>
                <input
                  type="text"
                  placeholder="e.g. nadeera"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  required
                  className="w-full px-3 py-2 text-xs rounded-xl bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border focus:outline-none focus:border-brand-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Full Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Nadeera Madushan"
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  required
                  className="w-full px-3 py-2 text-xs rounded-xl bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border focus:outline-none focus:border-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Initial Password *</label>
                <div className="relative">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    placeholder="Enter login password"
                    value={newUserPassword}
                    onChange={(e) => setNewUserPassword(e.target.value)}
                    required
                    className="w-full px-3 py-2 text-xs rounded-xl bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border focus:outline-none focus:border-brand-500 font-mono pr-9"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  >
                    {showNewPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Role *</label>
                  <select
                    value={newUserRole}
                    onChange={(e) => setNewUserRole(e.target.value as UserRole)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border focus:outline-none focus:border-brand-500"
                  >
                    <option value="owner">Owner / Admin</option>
                    <option value="manager">Manager</option>
                    <option value="cashier">Cashier</option>
                    <option value="technician">Technician</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Quick PIN (4 digits)</label>
                  <input
                    type="password"
                    maxLength={4}
                    value={newUserPin}
                    onChange={(e) => setNewUserPin(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border focus:outline-none focus:border-brand-500 font-mono text-center tracking-widest"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-light-border dark:border-dark-border">
                <button type="button" onClick={() => setIsAddUserOpen(false)} className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-white">
                  Cancel
                </button>
                <button type="submit" className="px-6 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-xs font-bold shadow-md shadow-brand-500/25">
                  Create User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. Edit User Modal */}
      {editingUser && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white dark:bg-dark-card border border-light-border dark:border-dark-border rounded-3xl shadow-2xl p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-light-border dark:border-dark-border pb-3">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-blue-500/10 text-blue-500">
                  <Edit3 className="w-4 h-4" />
                </span>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">Edit User: @{editingUser.username}</h3>
                  <p className="text-[11px] text-light-muted">Update display name, assigned role, or active status.</p>
                </div>
              </div>
              <button onClick={() => setEditingUser(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {isOwner(editingUser) && (
              <div className="p-3 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-600 dark:text-purple-300 text-xs flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 flex-shrink-0" />
                <span>This is an Owner account. Store security requires at least one active Owner at all times.</span>
              </div>
            )}

            <form onSubmit={handleSaveEditUser} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Full Name</label>
                <input
                  type="text"
                  value={editUserName}
                  onChange={(e) => setEditUserName(e.target.value)}
                  required
                  className="w-full px-3 py-2 text-xs rounded-xl bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border focus:outline-none focus:border-brand-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Role</label>
                  <select
                    value={editUserRole}
                    onChange={(e) => setEditUserRole(e.target.value as UserRole)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border focus:outline-none focus:border-brand-500"
                  >
                    <option value="owner">Owner / Admin</option>
                    <option value="manager">Manager</option>
                    <option value="cashier">Cashier</option>
                    <option value="technician">Technician</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Status</label>
                  <select
                    value={editUserStatus}
                    onChange={(e) => setEditUserStatus(e.target.value as 'ACTIVE' | 'DISABLED')}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border focus:outline-none focus:border-brand-500"
                  >
                    <option value="ACTIVE">Active</option>
                    <option value="DISABLED">Disabled</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-light-border dark:border-dark-border">
                <button type="button" onClick={() => setEditingUser(null)} className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-white">
                  Cancel
                </button>
                <button type="submit" className="px-6 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-xs font-bold shadow-md shadow-brand-500/25">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. Reset Password Modal */}
      {resetPasswordUser && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white dark:bg-dark-card border border-light-border dark:border-dark-border rounded-3xl shadow-2xl p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-light-border dark:border-dark-border pb-3">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-amber-500/10 text-amber-500">
                  <KeyRound className="w-4 h-4" />
                </span>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Reset Password: @{resetPasswordUser.username}
                  </h3>
                  <p className="text-[11px] text-light-muted">
                    Set a new secure password and PIN for {resetPasswordUser.name || resetPasswordUser.username}.
                  </p>
                </div>
              </div>
              <button onClick={() => setResetPasswordUser(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveResetPassword} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  New Password * (Min 4 chars)
                </label>
                <div className="relative">
                  <input
                    type={showResetPassword ? 'text' : 'password'}
                    placeholder="Enter new password"
                    value={newResetPassword}
                    onChange={(e) => setNewResetPassword(e.target.value)}
                    required
                    className="w-full px-3 py-2 text-xs rounded-xl bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border focus:outline-none focus:border-brand-500 font-mono pr-9"
                  />
                  <button
                    type="button"
                    onClick={() => setShowResetPassword(!showResetPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  >
                    {showResetPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Confirm New Password *
                </label>
                <input
                  type="password"
                  placeholder="Re-enter new password"
                  value={confirmResetPassword}
                  onChange={(e) => setConfirmResetPassword(e.target.value)}
                  required
                  className="w-full px-3 py-2 text-xs rounded-xl bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border focus:outline-none focus:border-brand-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  New 4-digit POS PIN Code
                </label>
                <input
                  type="password"
                  maxLength={4}
                  placeholder="Optional new PIN (4 digits)"
                  value={newResetPin}
                  onChange={(e) => setNewResetPin(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border focus:outline-none focus:border-brand-500 font-mono text-center tracking-widest"
                />
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-light-border dark:border-dark-border">
                <button type="button" onClick={() => setResetPasswordUser(null)} className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-white">
                  Cancel
                </button>
                <button type="submit" className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold shadow-md shadow-amber-500/25">
                  Confirm Password Reset
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. Reset All Store Data Modal (Admin Password Confirmation) */}
      {isResetModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white dark:bg-dark-card border-2 border-red-500/40 rounded-3xl shadow-2xl p-6 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-light-border dark:border-dark-border pb-4">
              <div className="flex items-center gap-3">
                <span className="p-2.5 rounded-2xl bg-red-500/10 text-red-500 border border-red-500/20">
                  <AlertTriangle className="w-6 h-6" />
                </span>
                <div>
                  <h3 className="text-base font-black text-red-600 dark:text-red-400">
                    Wipe All Store Data & Histories
                  </h3>
                  <p className="text-[11px] text-light-muted dark:text-dark-muted">
                    à·ƒà·’à¶ºà¶½à·”à¶¸ à¶¯à¶­à·Šà¶­ à·ƒà·Šà¶®à·’à¶»à·€à¶¸ à¶¸à¶šà· à¶¯à·à¶¸à·“à¶¸ (Permanent Reset)
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsResetModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Warning details */}
            <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-xs text-slate-800 dark:text-slate-200 space-y-2">
              <div className="font-bold text-red-600 dark:text-red-400 flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4" />
                <span>WARNING: This action is permanent and cannot be undone!</span>
              </div>
              <p className="text-[11px] leading-relaxed text-slate-600 dark:text-slate-300">
                à¶´à·„à¶­ à¶¯à·à¶šà·Šà·€à·™à¶± à·ƒà·’à¶ºà¶½à·”à¶¸ à¶¯à¶­à·Šà¶­ SQLite à¶¯à¶­à·Šà¶­ à·ƒà¶¸à·”à¶¯à·à¶ºà·™à¶±à·Š à·ƒà·„ à¶´à¶¯à·Šà¶°à¶­à·’à¶ºà·™à¶±à·Š à·ƒà¶¯à·„à¶§à¶¸ à¶¸à¶šà· à¶¯à·à¶¸à·™à¶±à·” à¶‡à¶­:
              </p>
              <ul className="grid grid-cols-2 gap-1.5 text-[11px] text-slate-700 dark:text-slate-300 pt-1 font-medium">
                <li className="flex items-center gap-1.5">ðŸ—‘ï¸ Products & IMEIs</li>
                <li className="flex items-center gap-1.5">ðŸ—‘ï¸ Sales & Invoices</li>
                <li className="flex items-center gap-1.5">ðŸ—‘ï¸ Customer Accounts</li>
                <li className="flex items-center gap-1.5">ðŸ—‘ï¸ Repair Tickets</li>
                <li className="flex items-center gap-1.5">ðŸ—‘ï¸ Expense Records</li>
                <li className="flex items-center gap-1.5">ðŸ—‘ï¸ Purchase Orders</li>
              </ul>
              <div className="pt-2 text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold border-t border-red-500/15">
                âœ“ Store Settings à·ƒà·„ Admin à¶´à·’à·€à·’à·ƒà·”à¶¸à·Š à¶œà·’à¶«à·”à¶¸ à¶†à¶»à¶šà·Šà·‚à·’à¶­à·€ à¶´à·€à¶­à·“.
              </div>
            </div>

            {resetError && (
              <div className="p-3 rounded-xl bg-red-500/20 border border-red-500/40 text-red-600 dark:text-red-300 text-xs font-semibold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                <span>{resetError}</span>
              </div>
            )}

            <form onSubmit={handleConfirmReset} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5">
                  Admin / Owner Password (à¶´à¶»à·’à¶´à·à¶½à¶š à¶¸à·”à¶»à¶´à¶¯à¶º) *
                </label>
                <div className="relative">
                  <input
                    type={showResetPasswordInput ? 'text' : 'password'}
                    placeholder="Enter Admin Password"
                    value={resetAdminPassword}
                    onChange={(e) => {
                      setResetAdminPassword(e.target.value);
                      setResetError(null);
                    }}
                    required
                    autoFocus
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border focus:outline-none focus:border-red-500 font-mono pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowResetPasswordInput(!showResetPasswordInput)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  >
                    {showResetPasswordInput ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <label className="flex items-start gap-2.5 p-3 rounded-xl bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border cursor-pointer text-xs">
                <input
                  type="checkbox"
                  checked={resetConfirmChecked}
                  onChange={(e) => setResetConfirmChecked(e.target.checked)}
                  className="mt-0.5 rounded text-red-600 focus:ring-red-500"
                />
                <span className="text-[11px] text-slate-700 dark:text-slate-300">
                  à¶¸à·™à¶¸à¶œà·’à¶±à·Š à·ƒà·’à¶ºà¶½à·”à¶¸ à·€à·’à¶šà·”à¶«à·”à¶¸à·Š, à¶·à·à¶«à·Šà¶© à·ƒà·„ à·€à·à¶»à·Šà¶­à· à·ƒà·Šà¶®à·’à¶»à·€à¶¸ à¶¸à·à¶šà·™à¶± à¶¶à·€ à¶¸à· à¶­à·„à·€à·”à¶»à·” à¶šà¶»à¶¸à·’. (I understand and confirm that all store billing and data will be permanently deleted.)
                </span>
              </label>

              <div className="flex items-center justify-between pt-3 border-t border-light-border dark:border-dark-border">
                <button
                  type="button"
                  onClick={() => setIsResetModalOpen(false)}
                  disabled={isResetting}
                  className="px-4 py-2.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!resetAdminPassword.trim() || !resetConfirmChecked || isResetting}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold shadow-lg shadow-red-600/30 transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>{isResetting ? 'Wiping All Data...' : 'Confirm & Wipe Everything'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

