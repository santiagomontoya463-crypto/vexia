export interface Business {
  id: string;
  name: string;
  type: string;
  description?: string;
  documentType?: string;
  documentNumber?: string;
  email?: string;
  phone?: string;
  address?: string;
  countryCode: string;
  currency: string;
  createdAt: string;
  updatedAt: string;
}

export interface BusinessSettings {
  businessId: string;
  timezone: string;
  theme: "light" | "dark" | "system";
  updatedAt: string;
}