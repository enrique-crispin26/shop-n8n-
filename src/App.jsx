import { useEffect, useMemo, useState } from "react";
import {
  BarChart3,
  CheckCircle2,
  ClipboardList,
  CreditCard,
  Filter,
  LayoutDashboard,
  Minus,
  Package,
  Plus,
  Save,
  Search,
  ShieldCheck,
  ShoppingCart,
  Smartphone,
  Trash2,
  Truck,
  UserPlus,
  Users,
} from "lucide-react";
import {
  deliveryTypes,
  formatCurrency,
  initialCustomers,
  initialOrders,
  initialProducts,
  paymentMethods,
} from "./data.js";

const navItems = [
  { id: "tienda", label: "Tienda", icon: Smartphone },
  { id: "clientes", label: "Clientes", icon: Users },
  { id: "pedidos", label: "Pedidos", icon: ClipboardList },
  { id: "pagos", label: "Pagos", icon: CreditCard },
  { id: "delivery", label: "Delivery", icon: Truck },
  { id: "admin", label: "Administrador", icon: ShieldCheck },
  { id: "reportes", label: "Reportes", icon: BarChart3 },
];

const emptyCustomer = {
  name: "",
  phone: "",
  email: "",
  type: "Nuevo",
};

const emptyCheckout = {
  customer: "",
  phone: "",
  address: "",
  paymentMethod: "QR",
  deliveryType: "Delivery urbano",
  paymentStatus: "Pendiente",
};

const emptyProduct = {
  name: "",
  brand: "",
  category: "Gama media",
  price: "",
  stock: "",
  storage: "128 GB",
  color: "",
  camera: "64 MP",
  battery: "5000 mAh",
  image: "",
  accent: "#2563eb",
};

function useLocalState(key, initialValue) {
  const [value, setValue] = useState(() => {
    try {
      const savedValue = localStorage.getItem(key);
      return savedValue ? JSON.parse(savedValue) : initialValue;
    } catch {
      return initialValue;
    }
  });

  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(value));
  }, [key, value]);

  return [value, setValue];
}

function classNames(...values) {
  return values.filter(Boolean).join(" ");
}

function getOrderTotal(order) {
  const productsTotal = order.items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );
  const delivery = deliveryTypes.find((type) => type.name === order.deliveryType);
  return productsTotal + (delivery?.price ?? 0);
}

function getProductUnits(order) {
  return order.items.reduce((sum, item) => sum + item.quantity, 0);
}

function App() {
  const [activeView, setActiveView] = useState("tienda");
  const [products, setProducts] = useLocalState(
    "celularia-products",
    initialProducts,
  );
  const [customers, setCustomers] = useLocalState(
    "celularia-customers",
    initialCustomers,
  );
  const [orders, setOrders] = useLocalState("celularia-orders", initialOrders);
  const [cart, setCart] = useLocalState("celularia-cart", {});
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("Todas");
  const [checkout, setCheckout] = useState(emptyCheckout);
  const [customerForm, setCustomerForm] = useState(emptyCustomer);
  const [productForm, setProductForm] = useState(emptyProduct);
  const [notice, setNotice] = useState("");

  const categories = useMemo(
    () => ["Todas", ...new Set(products.map((product) => product.category))],
    [products],
  );

  const filteredProducts = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return products.filter((product) => {
      const matchesCategory =
        category === "Todas" || product.category === category;
      const matchesQuery =
        product.name.toLowerCase().includes(normalizedQuery) ||
        product.brand.toLowerCase().includes(normalizedQuery) ||
        product.category.toLowerCase().includes(normalizedQuery);
      return matchesCategory && matchesQuery;
    });
  }, [category, products, query]);

  const cartItems = useMemo(
    () =>
      Object.entries(cart)
        .map(([productId, quantity]) => {
          const product = products.find((item) => item.id === productId);
          return product ? { ...product, quantity } : null;
        })
        .filter(Boolean),
    [cart, products],
  );

  const selectedDelivery = deliveryTypes.find(
    (type) => type.name === checkout.deliveryType,
  );

  const cartSubtotal = cartItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );
  const cartTotal = cartSubtotal + (selectedDelivery?.price ?? 0);
  const totalUnits = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  const stats = useMemo(() => {
    const revenue = orders.reduce((sum, order) => sum + getOrderTotal(order), 0);
    const pendingPayments = orders.filter(
      (order) => order.paymentStatus !== "Pagado",
    ).length;
    const lowStock = products.filter((product) => product.stock <= 5).length;
    const delivered = orders.filter(
      (order) => order.orderStatus === "Entregado",
    ).length;
    return { revenue, pendingPayments, lowStock, delivered };
  }, [orders, products]);

  function showNotice(message) {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 3200);
  }

  function addToCart(productId) {
    const product = products.find((item) => item.id === productId);
    const currentQuantity = cart[productId] ?? 0;

    if (!product || currentQuantity >= product.stock) {
      showNotice("No hay más stock disponible para ese modelo.");
      return;
    }

    setCart({ ...cart, [productId]: currentQuantity + 1 });
  }

  function updateCartQuantity(productId, quantity) {
    if (quantity <= 0) {
      const nextCart = { ...cart };
      delete nextCart[productId];
      setCart(nextCart);
      return;
    }

    const product = products.find((item) => item.id === productId);
    setCart({ ...cart, [productId]: Math.min(quantity, product?.stock ?? 0) });
  }

  function fillCheckoutWithCustomer(customer) {
    setCheckout((current) => ({
      ...current,
      customer: customer.name,
      phone: customer.phone,
    }));
    setActiveView("tienda");
    showNotice("Cliente seleccionado para el pedido.");
  }

  function createCustomer(event) {
    event.preventDefault();
    if (!customerForm.name.trim() || !customerForm.phone.trim()) {
      showNotice("Completa al menos nombre y teléfono del cliente.");
      return;
    }

    const newCustomer = {
      ...customerForm,
      id: `cli-${Date.now()}`,
      email: customerForm.email || "Sin correo",
    };
    setCustomers([newCustomer, ...customers]);
    setCustomerForm(emptyCustomer);
    showNotice("Cliente registrado correctamente.");
  }

  function createProduct(event) {
    event.preventDefault();
    if (!productForm.name.trim() || !productForm.brand.trim()) {
      showNotice("Completa nombre y marca del producto.");
      return;
    }

    const price = Number(productForm.price);
    const stock = Number(productForm.stock);
    if (!price || price <= 0 || Number.isNaN(stock) || stock < 0) {
      showNotice("Precio y stock deben ser valores válidos.");
      return;
    }

    setProducts([
      {
        ...productForm,
        id: `cel-${Date.now()}`,
        price,
        stock,
        image: productForm.image || initialProducts[0].image,
      },
      ...products,
    ]);
    setProductForm(emptyProduct);
    showNotice("Producto agregado al catálogo.");
  }

  function adjustStock(productId, amount) {
    setProducts((currentProducts) =>
      currentProducts.map((product) =>
        product.id === productId
          ? { ...product, stock: Math.max(0, product.stock + amount) }
          : product,
      ),
    );
  }

  function checkoutOrder(event) {
    event.preventDefault();
    if (cartItems.length === 0) {
      showNotice("Agrega productos al carrito antes de crear el pedido.");
      return;
    }
    if (
      !checkout.customer.trim() ||
      !checkout.phone.trim() ||
      !checkout.address.trim()
    ) {
      showNotice("Completa cliente, teléfono y dirección para continuar.");
      return;
    }

    const newOrder = {
      id: `PED-${Date.now().toString().slice(-6)}`,
      customer: checkout.customer,
      phone: checkout.phone,
      address: checkout.address,
      items: cartItems.map((item) => ({
        productId: item.id,
        name: item.name,
        quantity: item.quantity,
        price: item.price,
      })),
      paymentMethod: checkout.paymentMethod,
      paymentStatus: checkout.paymentStatus,
      deliveryType: checkout.deliveryType,
      orderStatus:
        checkout.deliveryType === "Recojo en tienda" ? "Listo" : "Preparando",
      createdAt: new Date().toISOString().slice(0, 10),
    };

    setOrders([newOrder, ...orders]);
    setProducts((currentProducts) =>
      currentProducts.map((product) => {
        const cartItem = cartItems.find((item) => item.id === product.id);
        return cartItem
          ? { ...product, stock: product.stock - cartItem.quantity }
          : product;
      }),
    );
    setCart({});
    setCheckout(emptyCheckout);
    setActiveView("pedidos");
    showNotice("Pedido creado. Ya aparece en el módulo de pedidos.");
  }

  function updateOrder(orderId, field, value) {
    setOrders((currentOrders) =>
      currentOrders.map((order) =>
        order.id === orderId ? { ...order, [field]: value } : order,
      ),
    );
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">
            <Smartphone size={24} strokeWidth={2.4} />
          </div>
          <div>
            <strong>Celularia Pro</strong>
            <span>Tienda web</span>
          </div>
        </div>

        <nav className="nav-list" aria-label="Módulos principales">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                className={classNames(
                  "nav-item",
                  activeView === item.id && "is-active",
                )}
                key={item.id}
                onClick={() => setActiveView(item.id)}
                type="button"
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="sidebar-card">
          <span className="eyebrow">Resumen</span>
          <strong>{formatCurrency(stats.revenue)}</strong>
          <small>Ventas registradas en pedidos</small>
        </div>
      </aside>

      <main className="main-panel">
        <header className="topbar">
          <div>
            <span className="eyebrow">Aplicación React</span>
            <h1>Tienda de celulares</h1>
          </div>
          <div className="topbar-actions">
            <Metric label="Productos" value={products.length} />
            <Metric label="Pedidos" value={orders.length} />
            <Metric label="Pendientes" value={stats.pendingPayments} />
          </div>
        </header>

        {notice && (
          <div className="notice" role="status">
            <CheckCircle2 size={18} />
            {notice}
          </div>
        )}

        {activeView === "tienda" && (
          <StoreView
            cartItems={cartItems}
            cartSubtotal={cartSubtotal}
            cartTotal={cartTotal}
            category={category}
            categories={categories}
            checkout={checkout}
            deliveryTypes={deliveryTypes}
            filteredProducts={filteredProducts}
            onAddToCart={addToCart}
            onCheckout={checkoutOrder}
            onCheckoutChange={setCheckout}
            onQueryChange={setQuery}
            onSetCategory={setCategory}
            onUpdateCartQuantity={updateCartQuantity}
            query={query}
            totalUnits={totalUnits}
          />
        )}

        {activeView === "clientes" && (
          <CustomersView
            customerForm={customerForm}
            customers={customers}
            onCreateCustomer={createCustomer}
            onFillCheckout={fillCheckoutWithCustomer}
            onFormChange={setCustomerForm}
          />
        )}

        {activeView === "pedidos" && (
          <OrdersView orders={orders} onUpdateOrder={updateOrder} />
        )}

        {activeView === "pagos" && (
          <PaymentsView orders={orders} onUpdateOrder={updateOrder} />
        )}

        {activeView === "delivery" && (
          <DeliveryView orders={orders} onUpdateOrder={updateOrder} />
        )}

        {activeView === "admin" && (
          <AdminView
            onAdjustStock={adjustStock}
            onCreateProduct={createProduct}
            onProductFormChange={setProductForm}
            productForm={productForm}
            products={products}
          />
        )}

        {activeView === "reportes" && (
          <ReportsView orders={orders} products={products} stats={stats} />
        )}
      </main>
    </div>
  );
}

function Metric({ label, value }) {
  return (
    <div className="metric">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function StoreView({
  cartItems,
  cartSubtotal,
  cartTotal,
  category,
  categories,
  checkout,
  deliveryTypes: deliveryOptions,
  filteredProducts,
  onAddToCart,
  onCheckout,
  onCheckoutChange,
  onQueryChange,
  onSetCategory,
  onUpdateCartQuantity,
  query,
  totalUnits,
}) {
  return (
    <section className="store-grid">
      <div className="catalog-area">
        <div className="module-heading">
          <div>
            <span className="eyebrow">Productos</span>
            <h2>Catálogo disponible</h2>
          </div>
          <div className="search-row">
            <label className="input-with-icon">
              <Search size={18} />
              <input
                onChange={(event) => onQueryChange(event.target.value)}
                placeholder="Buscar modelo, marca o categoría"
                value={query}
              />
            </label>
            <label className="select-with-icon">
              <Filter size={18} />
              <select
                onChange={(event) => onSetCategory(event.target.value)}
                value={category}
              >
                {categories.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
            </label>
          </div>
        </div>

        <div className="product-grid">
          {filteredProducts.map((product) => (
            <ProductCard
              key={product.id}
              onAddToCart={onAddToCart}
              product={product}
            />
          ))}
        </div>
      </div>

      <aside className="checkout-panel">
        <div className="checkout-title">
          <div>
            <span className="eyebrow">Pedido</span>
            <h2>Carrito</h2>
          </div>
          <div className="cart-badge">
            <ShoppingCart size={18} />
            {totalUnits}
          </div>
        </div>

        <div className="cart-list">
          {cartItems.length === 0 ? (
            <p className="empty-state">El carrito está vacío.</p>
          ) : (
            cartItems.map((item) => (
              <div className="cart-item" key={item.id}>
                <div>
                  <strong>{item.name}</strong>
                  <span>{formatCurrency(item.price)}</span>
                </div>
                <div className="quantity-control">
                  <button
                    aria-label={`Quitar ${item.name}`}
                    onClick={() =>
                      onUpdateCartQuantity(item.id, item.quantity - 1)
                    }
                    type="button"
                  >
                    <Minus size={14} />
                  </button>
                  <span>{item.quantity}</span>
                  <button
                    aria-label={`Agregar ${item.name}`}
                    onClick={() =>
                      onUpdateCartQuantity(item.id, item.quantity + 1)
                    }
                    type="button"
                  >
                    <Plus size={14} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        <form className="checkout-form" onSubmit={onCheckout}>
          <label>
            Cliente
            <input
              onChange={(event) =>
                onCheckoutChange({ ...checkout, customer: event.target.value })
              }
              placeholder="Nombre del cliente"
              value={checkout.customer}
            />
          </label>
          <label>
            Teléfono
            <input
              onChange={(event) =>
                onCheckoutChange({ ...checkout, phone: event.target.value })
              }
              placeholder="Número de contacto"
              value={checkout.phone}
            />
          </label>
          <label>
            Dirección
            <input
              onChange={(event) =>
                onCheckoutChange({ ...checkout, address: event.target.value })
              }
              placeholder="Dirección o recojo en tienda"
              value={checkout.address}
            />
          </label>
          <div className="form-grid">
            <label>
              Pago
              <select
                onChange={(event) =>
                  onCheckoutChange({
                    ...checkout,
                    paymentMethod: event.target.value,
                  })
                }
                value={checkout.paymentMethod}
              >
                {paymentMethods.map((method) => (
                  <option key={method}>{method}</option>
                ))}
              </select>
            </label>
            <label>
              Estado
              <select
                onChange={(event) =>
                  onCheckoutChange({
                    ...checkout,
                    paymentStatus: event.target.value,
                  })
                }
                value={checkout.paymentStatus}
              >
                <option>Pendiente</option>
                <option>Pagado</option>
              </select>
            </label>
          </div>
          <label>
            Delivery
            <select
              onChange={(event) =>
                onCheckoutChange({
                  ...checkout,
                  deliveryType: event.target.value,
                })
              }
              value={checkout.deliveryType}
            >
              {deliveryOptions.map((type) => (
                <option key={type.id} value={type.name}>
                  {type.name} - {formatCurrency(type.price)} - {type.eta}
                </option>
              ))}
            </select>
          </label>

          <div className="total-box">
            <span>Subtotal</span>
            <strong>{formatCurrency(cartSubtotal)}</strong>
            <span>Total</span>
            <strong>{formatCurrency(cartTotal)}</strong>
          </div>

          <button className="primary-button" type="submit">
            <Save size={18} />
            Crear pedido
          </button>
        </form>
      </aside>
    </section>
  );
}

function ProductCard({ onAddToCart, product }) {
  const [imageFailed, setImageFailed] = useState(false);

  return (
    <article className="product-card">
      <div className="product-media" style={{ "--accent": product.accent }}>
        {!imageFailed && (
          <img
            alt={`Celular ${product.name}`}
            onError={() => setImageFailed(true)}
            src={product.image}
          />
        )}
        <div className="phone-fallback">
          <span />
          <i />
        </div>
      </div>
      <div className="product-content">
        <div className="product-topline">
          <span>{product.brand}</span>
          <b>{product.category}</b>
        </div>
        <h3>{product.name}</h3>
        <p>
          {product.storage} - {product.camera} - {product.battery}
        </p>
        <div className="product-footer">
          <div>
            <strong>{formatCurrency(product.price)}</strong>
            <span>{product.stock} unidades</span>
          </div>
          <button
            aria-label={`Agregar ${product.name} al carrito`}
            disabled={product.stock === 0}
            onClick={() => onAddToCart(product.id)}
            type="button"
          >
            <Plus size={18} />
          </button>
        </div>
      </div>
    </article>
  );
}

function CustomersView({
  customerForm,
  customers,
  onCreateCustomer,
  onFillCheckout,
  onFormChange,
}) {
  return (
    <section className="two-column">
      <div className="panel">
        <div className="module-heading">
          <div>
            <span className="eyebrow">Clientes</span>
            <h2>Registro de clientes</h2>
          </div>
          <UserPlus size={24} />
        </div>
        <form className="stack-form" onSubmit={onCreateCustomer}>
          <label>
            Nombre completo
            <input
              onChange={(event) =>
                onFormChange({ ...customerForm, name: event.target.value })
              }
              placeholder="Ej. Andrea López"
              value={customerForm.name}
            />
          </label>
          <label>
            Teléfono
            <input
              onChange={(event) =>
                onFormChange({ ...customerForm, phone: event.target.value })
              }
              placeholder="Ej. 70000000"
              value={customerForm.phone}
            />
          </label>
          <label>
            Correo
            <input
              onChange={(event) =>
                onFormChange({ ...customerForm, email: event.target.value })
              }
              placeholder="cliente@email.com"
              type="email"
              value={customerForm.email}
            />
          </label>
          <label>
            Tipo
            <select
              onChange={(event) =>
                onFormChange({ ...customerForm, type: event.target.value })
              }
              value={customerForm.type}
            >
              <option>Nuevo</option>
              <option>Frecuente</option>
              <option>Empresa</option>
            </select>
          </label>
          <button className="primary-button" type="submit">
            <Save size={18} />
            Guardar cliente
          </button>
        </form>
      </div>

      <div className="panel">
        <div className="module-heading">
          <div>
            <span className="eyebrow">Base de datos local</span>
            <h2>{customers.length} clientes</h2>
          </div>
        </div>
        <div className="customer-list">
          {customers.map((customer) => (
            <article className="row-card" key={customer.id}>
              <div>
                <strong>{customer.name}</strong>
                <span>
                  {customer.phone} - {customer.email}
                </span>
              </div>
              <div className="row-actions">
                <span className="status-pill">{customer.type}</span>
                <button
                  onClick={() => onFillCheckout(customer)}
                  title="Usar cliente en el pedido"
                  type="button"
                >
                  <ShoppingCart size={17} />
                </button>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function OrdersView({ orders, onUpdateOrder }) {
  return (
    <section className="panel">
      <div className="module-heading">
        <div>
          <span className="eyebrow">Pedidos</span>
          <h2>Seguimiento de ventas</h2>
        </div>
        <Package size={24} />
      </div>

      <div className="order-list">
        {orders.map((order) => (
          <article className="order-card" key={order.id}>
            <div className="order-main">
              <div>
                <span className="eyebrow">{order.id}</span>
                <h3>{order.customer}</h3>
                <p>
                  {order.items.map((item) => `${item.quantity}x ${item.name}`).join(", ")}
                </p>
              </div>
              <strong>{formatCurrency(getOrderTotal(order))}</strong>
            </div>
            <div className="order-controls">
              <label>
                Pedido
                <select
                  onChange={(event) =>
                    onUpdateOrder(order.id, "orderStatus", event.target.value)
                  }
                  value={order.orderStatus}
                >
                  <option>Preparando</option>
                  <option>Listo</option>
                  <option>En camino</option>
                  <option>Entregado</option>
                  <option>Cancelado</option>
                </select>
              </label>
              <label>
                Pago
                <select
                  onChange={(event) =>
                    onUpdateOrder(order.id, "paymentStatus", event.target.value)
                  }
                  value={order.paymentStatus}
                >
                  <option>Pendiente</option>
                  <option>Pagado</option>
                  <option>Rechazado</option>
                </select>
              </label>
              <span className="status-pill">{order.deliveryType}</span>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function PaymentsView({ orders, onUpdateOrder }) {
  return (
    <section className="panel">
      <div className="module-heading">
        <div>
          <span className="eyebrow">Pagos</span>
          <h2>Control de cobros</h2>
        </div>
        <CreditCard size={24} />
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Pedido</th>
              <th>Cliente</th>
              <th>Método</th>
              <th>Total</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id}>
                <td>{order.id}</td>
                <td>{order.customer}</td>
                <td>{order.paymentMethod}</td>
                <td>{formatCurrency(getOrderTotal(order))}</td>
                <td>
                  <select
                    onChange={(event) =>
                      onUpdateOrder(order.id, "paymentStatus", event.target.value)
                    }
                    value={order.paymentStatus}
                  >
                    <option>Pendiente</option>
                    <option>Pagado</option>
                    <option>Rechazado</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function DeliveryView({ orders, onUpdateOrder }) {
  const deliveryOrders = orders.filter(
    (order) => order.deliveryType !== "Recojo en tienda",
  );

  return (
    <section className="panel">
      <div className="module-heading">
        <div>
          <span className="eyebrow">Delivery</span>
          <h2>Despachos y entregas</h2>
        </div>
        <Truck size={24} />
      </div>

      <div className="delivery-grid">
        {deliveryOrders.map((order) => (
          <article className="delivery-card" key={order.id}>
            <div>
              <span className="eyebrow">{order.id}</span>
              <h3>{order.customer}</h3>
              <p>{order.address}</p>
            </div>
            <div className="route-line">
              {["Preparando", "En camino", "Entregado"].map((step) => (
                <span
                  className={classNames(
                    "route-step",
                    step === order.orderStatus && "is-current",
                    order.orderStatus === "Entregado" && "is-done",
                  )}
                  key={step}
                >
                  {step}
                </span>
              ))}
            </div>
            <label>
              Estado de entrega
              <select
                onChange={(event) =>
                  onUpdateOrder(order.id, "orderStatus", event.target.value)
                }
                value={order.orderStatus}
              >
                <option>Preparando</option>
                <option>En camino</option>
                <option>Entregado</option>
                <option>Cancelado</option>
              </select>
            </label>
          </article>
        ))}
      </div>
    </section>
  );
}

function AdminView({
  onAdjustStock,
  onCreateProduct,
  onProductFormChange,
  productForm,
  products,
}) {
  return (
    <section className="two-column wide-left">
      <div className="panel">
        <div className="module-heading">
          <div>
            <span className="eyebrow">Administrador</span>
            <h2>Inventario</h2>
          </div>
          <ShieldCheck size={24} />
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Producto</th>
                <th>Precio</th>
                <th>Stock</th>
                <th>Acción</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product.id}>
                  <td>
                    <strong>{product.name}</strong>
                    <span>{product.brand}</span>
                  </td>
                  <td>{formatCurrency(product.price)}</td>
                  <td>
                    <span
                      className={classNames(
                        "stock-chip",
                        product.stock <= 5 && "is-low",
                      )}
                    >
                      {product.stock}
                    </span>
                  </td>
                  <td>
                    <div className="table-actions">
                      <button
                        aria-label={`Restar stock a ${product.name}`}
                        onClick={() => onAdjustStock(product.id, -1)}
                        type="button"
                      >
                        <Minus size={15} />
                      </button>
                      <button
                        aria-label={`Sumar stock a ${product.name}`}
                        onClick={() => onAdjustStock(product.id, 1)}
                        type="button"
                      >
                        <Plus size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="panel">
        <div className="module-heading">
          <div>
            <span className="eyebrow">Nuevo producto</span>
            <h2>Alta rápida</h2>
          </div>
        </div>
        <form className="stack-form" onSubmit={onCreateProduct}>
          <label>
            Nombre
            <input
              onChange={(event) =>
                onProductFormChange({ ...productForm, name: event.target.value })
              }
              placeholder="Modelo del celular"
              value={productForm.name}
            />
          </label>
          <label>
            Marca
            <input
              onChange={(event) =>
                onProductFormChange({ ...productForm, brand: event.target.value })
              }
              placeholder="Marca"
              value={productForm.brand}
            />
          </label>
          <div className="form-grid">
            <label>
              Precio
              <input
                min="1"
                onChange={(event) =>
                  onProductFormChange({
                    ...productForm,
                    price: event.target.value,
                  })
                }
                placeholder="0"
                type="number"
                value={productForm.price}
              />
            </label>
            <label>
              Stock
              <input
                min="0"
                onChange={(event) =>
                  onProductFormChange({
                    ...productForm,
                    stock: event.target.value,
                  })
                }
                placeholder="0"
                type="number"
                value={productForm.stock}
              />
            </label>
          </div>
          <label>
            Categoría
            <select
              onChange={(event) =>
                onProductFormChange({
                  ...productForm,
                  category: event.target.value,
                })
              }
              value={productForm.category}
            >
              <option>Gama alta</option>
              <option>Gama media</option>
              <option>Fotografia</option>
              <option>Plegable</option>
              <option>Bateria</option>
              <option>Compacto</option>
            </select>
          </label>
          <label>
            URL de imagen
            <input
              onChange={(event) =>
                onProductFormChange({
                  ...productForm,
                  image: event.target.value,
                })
              }
              placeholder="https://..."
              value={productForm.image}
            />
          </label>
          <button className="primary-button" type="submit">
            <Save size={18} />
            Guardar producto
          </button>
        </form>
      </div>
    </section>
  );
}

function ReportsView({ orders, products, stats }) {
  const paymentSummary = paymentMethods.map((method) => ({
    label: method,
    value: orders.filter((order) => order.paymentMethod === method).length,
  }));
  const statusSummary = ["Preparando", "Listo", "En camino", "Entregado"].map(
    (status) => ({
      label: status,
      value: orders.filter((order) => order.orderStatus === status).length,
    }),
  );
  const topProducts = products
    .map((product) => {
      const sold = orders.reduce((sum, order) => {
        const item = order.items.find((orderItem) => orderItem.productId === product.id);
        return sum + (item?.quantity ?? 0);
      }, 0);
      return { label: product.name, value: sold };
    })
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);

  return (
    <section className="reports">
      <div className="report-metrics">
        <ReportMetric
          icon={BarChart3}
          label="Ventas"
          value={formatCurrency(stats.revenue)}
        />
        <ReportMetric
          icon={ClipboardList}
          label="Pedidos"
          value={orders.length}
        />
        <ReportMetric
          icon={CreditCard}
          label="Pagos pendientes"
          value={stats.pendingPayments}
        />
        <ReportMetric
          icon={Package}
          label="Stock bajo"
          value={stats.lowStock}
        />
      </div>

      <div className="report-grid">
        <ChartPanel data={paymentSummary} title="Pedidos por método de pago" />
        <ChartPanel data={statusSummary} title="Estado de pedidos" />
        <ChartPanel data={topProducts} title="Productos más vendidos" />
        <div className="panel learning-panel">
          <span className="eyebrow">Para tu informe</span>
          <h2>Qué demuestra esta app</h2>
          <p>
            Maneja estado con React, divide la tienda por módulos, guarda datos
            en el navegador y calcula reportes a partir de pedidos reales.
          </p>
        </div>
      </div>
    </section>
  );
}

function ReportMetric({ icon: Icon, label, value }) {
  return (
    <article className="report-card">
      <Icon size={20} />
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  );
}

function ChartPanel({ data, title }) {
  const max = Math.max(...data.map((item) => item.value), 1);

  return (
    <div className="panel chart-panel">
      <h2>{title}</h2>
      <div className="bar-list">
        {data.map((item) => (
          <div className="bar-row" key={item.label}>
            <span>{item.label}</span>
            <div className="bar-track">
              <i style={{ width: `${(item.value / max) * 100}%` }} />
            </div>
            <strong>{item.value}</strong>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;
