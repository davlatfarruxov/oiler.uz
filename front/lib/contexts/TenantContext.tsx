'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAppSelector } from '@/lib/store/hooks';
import api from '@/lib/api/axios';

interface Tenant {
  id: string;
  companyName: string;
  businessEmail: string;
  businessPhone: string;
  address?: string;
  plan: string;
  isActive: boolean;
  maxEmployees?: number;
  maxVehicles?: number;
  expiresAt?: string;
}

interface TenantContextType {
  tenant: Tenant | null;
  isLoading: boolean;
  updateTenant: (data: Partial<Tenant>) => Promise<void>;
  refreshTenant: () => Promise<void>;
}

const TenantContext = createContext<TenantContextType | undefined>(undefined);

export function TenantProvider({ children }: { children: React.ReactNode }) {
  const { tenant: authTenant } = useAppSelector((state) => state.auth);
  const [tenant, setTenant] = useState<Tenant | null>(authTenant);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (authTenant) {
      setTenant(authTenant);
    }
  }, [authTenant]);

  const refreshTenant = async () => {
    try {
      setIsLoading(true);
      const response = await api.get('/auth/profile');
      if (response.data.data.tenant) {
        setTenant(response.data.data.tenant);
        localStorage.setItem('tenant', JSON.stringify(response.data.data.tenant));
      }
    } catch (error) {
      console.error('Failed to refresh tenant:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateTenant = async (data: Partial<Tenant>) => {
    try {
      setIsLoading(true);
      // Update tenant via settings API
      await api.put('/settings/company-info', data);
      
      // Refresh tenant data
      await refreshTenant();
    } catch (error) {
      console.error('Failed to update tenant:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <TenantContext.Provider value={{ tenant, isLoading, updateTenant, refreshTenant }}>
      {children}
    </TenantContext.Provider>
  );
}

export function useTenant() {
  const context = useContext(TenantContext);
  if (context === undefined) {
    throw new Error('useTenant must be used within a TenantProvider');
  }
  return context;
}
