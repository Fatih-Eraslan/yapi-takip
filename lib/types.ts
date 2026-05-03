export interface CustomerBasic {
  id: string;
  name: string;
  phone: string;
  email?: string | null;
  idNumber?: string | null;
  address?: string | null;
  saleDate?: string | null;
  salePrice: number;
  notes?: string | null;
}

export interface Payment {
  id: string;
  amount: number;
  type: string;
  date: string;
  note?: string | null;
}

export interface Apartment {
  id: string;
  number: string;
  floor: number;
  type: string;
  size?: number | null;
  price?: number | null;
  status: string;
  customer?: CustomerBasic | null;
  payments?: Payment[];
}

export interface Building {
  id: string;
  name: string;
  address: string;
  city: string;
  description?: string | null;
  image?: string | null;
  floorCount: number;
  aptPerFloor: number;
  apartments: Apartment[];
}
