export interface BusinessOperations {
  businessId: string;
  social: {
    instagram: string;
    facebook: string;
    tiktok: string;
    whatsapp: string;
    website: string;
  };
  hours: Record<string, {
    enabled: boolean;
    open: string;
    close: string;
  }>;
  cancellationHours: number;
  rescheduleHours: number;
  sundayBookings: boolean;
  appointmentReminders: boolean;
  updatedAt: string;
}

const KEY = "vexia:business-operations";

export function getBusinessOperations(
  businessId: string
): BusinessOperations | undefined {
  if (typeof window === "undefined") return undefined;

  try {
    const all = JSON.parse(
      localStorage.getItem(KEY) ?? "{}"
    ) as Record<string, BusinessOperations>;

    return all[businessId];
  } catch {
    return undefined;
  }
}

export function saveBusinessOperations(
  operations: BusinessOperations
): void {
  if (typeof window === "undefined") return;

  const all = (() => {
    try {
      return JSON.parse(
        localStorage.getItem(KEY) ?? "{}"
      ) as Record<string, BusinessOperations>;
    } catch {
      return {} as Record<string, BusinessOperations>;
    }
  })();

  all[operations.businessId] = {
    ...operations,
    updatedAt: new Date().toISOString(),
  };

  localStorage.setItem(KEY, JSON.stringify(all));
}
