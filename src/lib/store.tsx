import { createContext, useContext, useState, type ReactNode } from "react";

// ---------- Types ----------
export type Status = "Confirmed" | "Pending" | "In Progress" | "Completed" | "Cancelled";
export type PaymentStatus = "Paid" | "Pending" | "Refunded";
export type VoucherStatus = "Generated" | "Pending";

export interface Tour {
  id: string;
  name: string;
  description: string;
  duration: string;
  destination: string;
  basePrice: number;
  included: string;
  notes?: string;
  archived?: boolean;
}

export interface TransferTemplate {
  id: string;
  name: string;
  pickup: string;
  dropoff: string;
  basePrice: number;
  notes?: string;
}

export interface Customer {
  id: string;
  scheduleId: string;
  fullName: string;
  email: string;
  phone: string;
  seats: number;
  bookingRef: string;
  specialRequests?: string;
  paymentStatus: PaymentStatus;
  voucherStatus: VoucherStatus;
  // Transfer-specific
  flightNumber?: string;
  flightTime?: string;
  luggage?: number;
}

export interface Schedule {
  id: string;
  kind: "tour" | "transfer";
  parentId: string; // tour id or transfer id
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  driverId?: string;
  vehicleId?: string;
  capacity: number;
  notes?: string;
  status: Status;
}

export interface Driver {
  id: string;
  name: string;
  phone: string;
  license: string;
  status: "Available" | "On Trip" | "Off Duty";
  assignedVehicleId?: string;
}

export interface Vehicle {
  id: string;
  name: string;
  type: "Van" | "Bus" | "Sedan";
  plate: string;
  capacity: number;
  status: "Available" | "On Trip" | "Maintenance";
  assignedDriverId?: string;
}

export interface Transaction {
  id: string;
  date: string;
  service: string;
  customer: string;
  amount: number;
  method: "Cash" | "Card" | "Bank Transfer";
  status: PaymentStatus;
}

// ---------- Seed data ----------
const today = new Date();
const offset = (d: number) => {
  const x = new Date(today);
  x.setDate(today.getDate() + d);
  return x.toISOString().slice(0, 10);
};

const tours: Tour[] = [
  {
    id: "t1",
    name: "Yerevan City Tour",
    description: "Half-day walking tour through the historic heart of Yerevan, including Republic Square, Cascade, and the Opera House.",
    duration: "4 hours",
    destination: "Yerevan",
    basePrice: 45,
    included: "Guide, water, museum entry",
  },
  {
    id: "t2",
    name: "Geghard & Garni Monastery Tour",
    description: "Full-day excursion to the UNESCO-listed Geghard monastery and the Hellenistic Garni temple.",
    duration: "8 hours",
    destination: "Kotayk Province",
    basePrice: 75,
    included: "Transport, guide, lunch",
  },
  {
    id: "t3",
    name: "Areni Wine Country Day Trip",
    description: "Visit Armenia's oldest winery region with tastings at Areni and a stop at Noravank.",
    duration: "10 hours",
    destination: "Vayots Dzor",
    basePrice: 95,
    included: "Transport, guide, 3 tastings, lunch",
  },
];

const transfers: TransferTemplate[] = [
  {
    id: "tr1",
    name: "Zvartnots Airport → Yerevan City Center",
    pickup: "Zvartnots International Airport (EVN)",
    dropoff: "Yerevan City Center hotels",
    basePrice: 25,
  },
  {
    id: "tr2",
    name: "Yerevan City Center → Zvartnots Airport",
    pickup: "Yerevan hotel pickup",
    dropoff: "Zvartnots International Airport (EVN)",
    basePrice: 25,
  },
];

const drivers: Driver[] = [
  { id: "d1", name: "Aram Petrosyan", phone: "+374 91 12 34 56", license: "Cat. D", status: "On Trip", assignedVehicleId: "v1" },
  { id: "d2", name: "Narek Hovhannisyan", phone: "+374 99 88 77 66", license: "Cat. C", status: "Available", assignedVehicleId: "v2" },
];

const vehicles: Vehicle[] = [
  { id: "v1", name: "Mercedes Sprinter", type: "Van", plate: "12 AB 345", capacity: 16, status: "On Trip", assignedDriverId: "d1" },
  { id: "v2", name: "Toyota Hiace", type: "Van", plate: "55 CD 678", capacity: 12, status: "Available", assignedDriverId: "d2" },
  { id: "v3", name: "Hyundai Elantra", type: "Sedan", plate: "78 EF 901", capacity: 3, status: "Maintenance" },
];

const schedules: Schedule[] = [
  { id: "s1", kind: "tour", parentId: "t1", date: offset(0), time: "09:00", driverId: "d1", vehicleId: "v1", capacity: 16, status: "In Progress" },
  { id: "s2", kind: "tour", parentId: "t2", date: offset(1), time: "08:00", driverId: "d2", vehicleId: "v2", capacity: 12, status: "Confirmed" },
  { id: "s3", kind: "tour", parentId: "t3", date: offset(3), time: "07:30", driverId: "d2", vehicleId: "v2", capacity: 12, status: "Pending" },
  { id: "s4", kind: "tour", parentId: "t1", date: offset(5), time: "14:00", capacity: 16, status: "Confirmed" },
  { id: "s5", kind: "transfer", parentId: "tr1", date: offset(0), time: "14:30", driverId: "d2", vehicleId: "v2", capacity: 3, status: "Confirmed" },
  { id: "s6", kind: "transfer", parentId: "tr2", date: offset(2), time: "05:00", capacity: 3, status: "Pending" },
];

const customers: Customer[] = [
  { id: "c1", scheduleId: "s1", fullName: "Emma Larsson", email: "emma.l@example.com", phone: "+46 70 123 4567", seats: 2, bookingRef: "BK-1001", paymentStatus: "Paid", voucherStatus: "Generated" },
  { id: "c2", scheduleId: "s1", fullName: "James Whitfield", email: "j.whitfield@example.com", phone: "+44 7700 900123", seats: 1, bookingRef: "BK-1002", paymentStatus: "Paid", voucherStatus: "Generated", specialRequests: "Vegetarian lunch" },
  { id: "c3", scheduleId: "s2", fullName: "Marie Dubois", email: "marie.d@example.com", phone: "+33 6 12 34 56 78", seats: 4, bookingRef: "BK-1003", paymentStatus: "Pending", voucherStatus: "Pending" },
  { id: "c4", scheduleId: "s3", fullName: "Thomas Müller", email: "tmuller@example.com", phone: "+49 151 2345 6789", seats: 2, bookingRef: "BK-1004", paymentStatus: "Paid", voucherStatus: "Pending" },
  { id: "c5", scheduleId: "s5", fullName: "Sofia Romano", email: "sofia.r@example.com", phone: "+39 333 1234567", seats: 2, bookingRef: "BK-1005", paymentStatus: "Paid", voucherStatus: "Generated", flightNumber: "AF1854", flightTime: "13:45", luggage: 2 },
  { id: "c6", scheduleId: "s6", fullName: "David Chen", email: "d.chen@example.com", phone: "+1 415 555 0199", seats: 3, bookingRef: "BK-1006", paymentStatus: "Pending", voucherStatus: "Pending", flightNumber: "LH600", flightTime: "06:30", luggage: 4 },
  { id: "c7", scheduleId: "s4", fullName: "Olivia Brown", email: "o.brown@example.com", phone: "+1 212 555 0188", seats: 2, bookingRef: "BK-1007", paymentStatus: "Pending", voucherStatus: "Pending" },
];

const transactions: Transaction[] = [
  { id: "tx1", date: offset(-1), service: "Yerevan City Tour", customer: "Emma Larsson", amount: 90, method: "Card", status: "Paid" },
  { id: "tx2", date: offset(-1), service: "Yerevan City Tour", customer: "James Whitfield", amount: 45, method: "Card", status: "Paid" },
  { id: "tx3", date: offset(-2), service: "Geghard & Garni Tour", customer: "Marie Dubois", amount: 300, method: "Bank Transfer", status: "Pending" },
  { id: "tx4", date: offset(-3), service: "Areni Wine Country", customer: "Thomas Müller", amount: 190, method: "Card", status: "Paid" },
  { id: "tx5", date: offset(-5), service: "Airport Transfer", customer: "Sofia Romano", amount: 50, method: "Cash", status: "Paid" },
  { id: "tx6", date: offset(-7), service: "Airport Transfer", customer: "David Chen", amount: 75, method: "Card", status: "Pending" },
  { id: "tx7", date: offset(-10), service: "Yerevan City Tour", customer: "Olivia Brown", amount: 90, method: "Card", status: "Refunded" },
];

// ---------- Store ----------
interface Store {
  tours: Tour[];
  transfers: TransferTemplate[];
  schedules: Schedule[];
  customers: Customer[];
  drivers: Driver[];
  vehicles: Vehicle[];
  transactions: Transaction[];

  addTour: (t: Omit<Tour, "id">) => void;
  updateTour: (id: string, t: Partial<Tour>) => void;
  addTransfer: (t: Omit<TransferTemplate, "id">) => void;
  updateTransfer: (id: string, t: Partial<TransferTemplate>) => void;
  addSchedule: (s: Omit<Schedule, "id">) => void;
  updateSchedule: (id: string, s: Partial<Schedule>) => void;
  addCustomer: (c: Omit<Customer, "id">) => void;
  updateCustomer: (id: string, c: Partial<Customer>) => void;
  removeCustomer: (id: string) => void;
  addDriver: (d: Omit<Driver, "id">) => void;
  updateDriver: (id: string, d: Partial<Driver>) => void;
  addVehicle: (v: Omit<Vehicle, "id">) => void;
  updateVehicle: (id: string, v: Partial<Vehicle>) => void;
}

const StoreContext = createContext<Store | null>(null);

const uid = () => Math.random().toString(36).slice(2, 10);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [tourList, setTours] = useState(tours);
  const [transferList, setTransfers] = useState(transfers);
  const [scheduleList, setSchedules] = useState(schedules);
  const [customerList, setCustomers] = useState(customers);
  const [driverList, setDrivers] = useState(drivers);
  const [vehicleList, setVehicles] = useState(vehicles);
  const [txList] = useState(transactions);

  const value: Store = {
    tours: tourList,
    transfers: transferList,
    schedules: scheduleList,
    customers: customerList,
    drivers: driverList,
    vehicles: vehicleList,
    transactions: txList,
    addTour: (t) => setTours((p) => [...p, { ...t, id: uid() }]),
    updateTour: (id, t) => setTours((p) => p.map((x) => (x.id === id ? { ...x, ...t } : x))),
    addTransfer: (t) => setTransfers((p) => [...p, { ...t, id: uid() }]),
    updateTransfer: (id, t) => setTransfers((p) => p.map((x) => (x.id === id ? { ...x, ...t } : x))),
    addSchedule: (s) => setSchedules((p) => [...p, { ...s, id: uid() }]),
    updateSchedule: (id, s) => setSchedules((p) => p.map((x) => (x.id === id ? { ...x, ...s } : x))),
    addCustomer: (c) => setCustomers((p) => [...p, { ...c, id: uid() }]),
    updateCustomer: (id, c) => setCustomers((p) => p.map((x) => (x.id === id ? { ...x, ...c } : x))),
    removeCustomer: (id) => setCustomers((p) => p.filter((x) => x.id !== id)),
    addDriver: (d) => setDrivers((p) => [...p, { ...d, id: uid() }]),
    updateDriver: (id, d) => setDrivers((p) => p.map((x) => (x.id === id ? { ...x, ...d } : x))),
    addVehicle: (v) => setVehicles((p) => [...p, { ...v, id: uid() }]),
    updateVehicle: (id, v) => setVehicles((p) => p.map((x) => (x.id === id ? { ...x, ...v } : x))),
  };

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used inside StoreProvider");
  return ctx;
}
