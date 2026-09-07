export const initialProducts = [
  {
    id: "cel-001",
    name: "Nova X Pro",
    brand: "NovaTech",
    category: "Gama alta",
    price: 5590,
    stock: 12,
    storage: "256 GB",
    color: "Grafito",
    camera: "108 MP",
    battery: "5000 mAh",
    image:
      "https://images.unsplash.com/photo-1592750475338-74b7b21085ab?auto=format&fit=crop&w=900&q=80",
    accent: "#2563eb",
  },
  {
    id: "cel-002",
    name: "Astra Lite 5G",
    brand: "Astra",
    category: "Gama media",
    price: 2890,
    stock: 20,
    storage: "128 GB",
    color: "Azul noche",
    camera: "64 MP",
    battery: "4800 mAh",
    image:
      "https://images.unsplash.com/photo-1616348436168-de43ad0db179?auto=format&fit=crop&w=900&q=80",
    accent: "#0f766e",
  },
  {
    id: "cel-003",
    name: "Pixelmax C12",
    brand: "Pixelmax",
    category: "Fotografia",
    price: 4190,
    stock: 7,
    storage: "256 GB",
    color: "Verde titanio",
    camera: "200 MP",
    battery: "5100 mAh",
    image:
      "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=900&q=80",
    accent: "#16a34a",
  },
  {
    id: "cel-004",
    name: "Orbit Fold Mini",
    brand: "Orbit",
    category: "Plegable",
    price: 7990,
    stock: 4,
    storage: "512 GB",
    color: "Plata",
    camera: "50 MP",
    battery: "4400 mAh",
    image:
      "https://images.unsplash.com/photo-1565849904461-04a58ad377e0?auto=format&fit=crop&w=900&q=80",
    accent: "#7c3aed",
  },
  {
    id: "cel-005",
    name: "Terra Max",
    brand: "Terra",
    category: "Bateria",
    price: 2390,
    stock: 18,
    storage: "128 GB",
    color: "Negro mate",
    camera: "48 MP",
    battery: "7000 mAh",
    image:
      "https://images.unsplash.com/photo-1556656793-08538906a9f8?auto=format&fit=crop&w=900&q=80",
    accent: "#ea580c",
  },
  {
    id: "cel-006",
    name: "Zen S Compact",
    brand: "Zen",
    category: "Compacto",
    price: 3190,
    stock: 9,
    storage: "128 GB",
    color: "Blanco perla",
    camera: "64 MP",
    battery: "4300 mAh",
    image:
      "https://images.unsplash.com/photo-1573920011462-eb3003086611?auto=format&fit=crop&w=900&q=80",
    accent: "#0891b2",
  },
];

export const initialCustomers = [
  {
    id: "cli-001",
    name: "Valeria Mendoza",
    phone: "71234567",
    email: "valeria@email.com",
    type: "Frecuente",
  },
  {
    id: "cli-002",
    name: "Marco Rojas",
    phone: "76543210",
    email: "marco@email.com",
    type: "Nuevo",
  },
  {
    id: "cli-003",
    name: "Camila Soria",
    phone: "79887766",
    email: "camila@email.com",
    type: "Empresa",
  },
];

export const initialOrders = [
  {
    id: "PED-1001",
    customer: "Valeria Mendoza",
    phone: "71234567",
    address: "Av. Siempre Viva 123",
    items: [
      {
        productId: "cel-002",
        name: "Astra Lite 5G",
        quantity: 1,
        price: 2890,
      },
    ],
    paymentMethod: "QR",
    paymentStatus: "Pagado",
    deliveryType: "Delivery urbano",
    orderStatus: "En camino",
    createdAt: "2026-04-24",
  },
  {
    id: "PED-1002",
    customer: "Marco Rojas",
    phone: "76543210",
    address: "Recojo en tienda",
    items: [
      {
        productId: "cel-005",
        name: "Terra Max",
        quantity: 2,
        price: 2390,
      },
    ],
    paymentMethod: "Tarjeta",
    paymentStatus: "Pendiente",
    deliveryType: "Recojo en tienda",
    orderStatus: "Preparando",
    createdAt: "2026-04-25",
  },
];

export const paymentMethods = ["QR", "Tarjeta", "Efectivo", "Transferencia"];

export const deliveryTypes = [
  {
    id: "pickup",
    name: "Recojo en tienda",
    price: 0,
    eta: "Hoy",
  },
  {
    id: "urban",
    name: "Delivery urbano",
    price: 25,
    eta: "2 a 4 horas",
  },
  {
    id: "express",
    name: "Delivery express",
    price: 45,
    eta: "60 a 90 min",
  },
];

export function formatCurrency(value) {
  return new Intl.NumberFormat("es-BO", {
    style: "currency",
    currency: "BOB",
    maximumFractionDigits: 0,
  }).format(value);
}
