export type ClientStatus = "Activo" | "Inactivo";

export type Client = {
  id: string;
  name: string;
  phone: string;
  email: string;
  notes: string;
  visits: number;
  lastVisit: string;
  status: ClientStatus;
  createdAt: string;
};

export type ClientInput = {
  name: string;
  phone: string;
  email: string;
  notes: string;
  status: ClientStatus;
};
