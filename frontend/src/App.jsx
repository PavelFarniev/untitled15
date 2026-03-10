import { useEffect, useState } from "react";
import apiClient from "./apiClient";

function AuthSection({ onAuthSuccess }) {
  const [mode, setMode] = useState("login"); // "login" | "register"
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function handleRegister(e) {
    e.preventDefault();
    setError("");
    try {
      await apiClient.post("/api/auth/register", {
        email,
        first_name: firstName,
        last_name: lastName,
        password,
      });
      setMode("login");
    } catch (err) {
      setError(err.response?.data?.error || "Registration failed");
    }
  }

  async function handleLogin(e) {
    e.preventDefault();
    setError("");
    try {
      const resp = await apiClient.post("/api/auth/login", {
        email,
        password,
      });
      const { accessToken, refreshToken } = resp.data;
      localStorage.setItem("accessToken", accessToken);
      localStorage.setItem("refreshToken", refreshToken);

      const meResp = await apiClient.get("/api/auth/me");
      onAuthSuccess(meResp.data);
    } catch (err) {
      setError(err.response?.data?.error || "Login failed");
    }
  }

  return (
    <div style={{ border: "1px solid #ccc", padding: 16, borderRadius: 8, marginBottom: 24 }}>
      <h2>{mode === "login" ? "Вход" : "Регистрация"}</h2>
      <div style={{ marginBottom: 8 }}>
        <button
          onClick={() => setMode("login")}
          style={{ marginRight: 8, fontWeight: mode === "login" ? "bold" : "normal" }}
        >
          Вход
        </button>
        <button
          onClick={() => setMode("register")}
          style={{ fontWeight: mode === "register" ? "bold" : "normal" }}
        >
          Регистрация
        </button>
      </div>
      <form onSubmit={mode === "login" ? handleLogin : handleRegister}>
        <div style={{ marginBottom: 8 }}>
          <label>
            Email:&nbsp;
            <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required />
          </label>
        </div>
        {mode === "register" && (
          <>
            <div style={{ marginBottom: 8 }}>
              <label>
                Имя:&nbsp;
                <input value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
              </label>
            </div>
            <div style={{ marginBottom: 8 }}>
              <label>
                Фамилия:&nbsp;
                <input value={lastName} onChange={(e) => setLastName(e.target.value)} required />
              </label>
            </div>
          </>
        )}
        <div style={{ marginBottom: 8 }}>
          <label>
            Пароль:&nbsp;
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              required
            />
          </label>
        </div>
        <button type="submit">{mode === "login" ? "Войти" : "Зарегистрироваться"}</button>
      </form>
      {error && <p style={{ color: "red", marginTop: 8 }}>{error}</p>}
    </div>
  );
}

function ProductsSection() {
  const [products, setProducts] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [current, setCurrent] = useState(null);
  const [form, setForm] = useState({
    title: "",
    category: "",
    description: "",
    price: "",
  });
  const [error, setError] = useState("");

  async function loadProducts() {
    try {
      const resp = await apiClient.get("/api/products");
      setProducts(resp.data);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to load products");
    }
  }

  useEffect(() => {
    loadProducts();
  }, []);

  async function handleCreate(e) {
    e.preventDefault();
    setError("");
    try {
      const resp = await apiClient.post("/api/products", {
        ...form,
        price: Number(form.price),
      });
      setForm({ title: "", category: "", description: "", price: "" });
      setProducts((prev) => [...prev, resp.data]);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to create product");
    }
  }

  async function loadProduct(id) {
    setError("");
    try {
      const resp = await apiClient.get(`/api/products/${id}`);
      setCurrent(resp.data);
      setSelectedId(id);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to load product");
    }
  }

  async function handleUpdate() {
    if (!selectedId) return;
    setError("");
    try {
      const resp = await apiClient.put(`/api/products/${selectedId}`, current);
      setCurrent(resp.data);
      setProducts((prev) =>
        prev.map((p) => (p.id === resp.data.id ? resp.data : p))
      );
    } catch (err) {
      setError(err.response?.data?.error || "Failed to update product");
    }
  }

  async function handleDelete() {
    if (!selectedId) return;
    setError("");
    try {
      await apiClient.delete(`/api/products/${selectedId}`);
      setProducts((prev) => prev.filter((p) => p.id !== selectedId));
      setSelectedId("");
      setCurrent(null);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to delete product");
    }
  }

  return (
    <div>
      <h2>Товары</h2>
      <div style={{ display: "flex", gap: 24, alignItems: "flex-start" }}>
        <div style={{ flex: 1 }}>
          <h3>Список товаров</h3>
          <button onClick={loadProducts} style={{ marginBottom: 8 }}>
            Обновить список
          </button>
          <ul>
            {products.map((p) => (
              <li key={p.id}>
                <button onClick={() => loadProduct(p.id)}>{p.title}</button>
              </li>
            ))}
          </ul>
        </div>
        <div style={{ flex: 1 }}>
          <h3>Создать товар</h3>
          <form onSubmit={handleCreate}>
            <div style={{ marginBottom: 4 }}>
              <input
                placeholder="Название"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                required
              />
            </div>
            <div style={{ marginBottom: 4 }}>
              <input
                placeholder="Категория"
                value={form.category}
                onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                required
              />
            </div>
            <div style={{ marginBottom: 4 }}>
              <input
                placeholder="Описание"
                value={form.description}
                onChange={(e) =>
                  setForm((f) => ({ ...f, description: e.target.value }))
                }
                required
              />
            </div>
            <div style={{ marginBottom: 4 }}>
              <input
                placeholder="Цена"
                type="number"
                value={form.price}
                onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                required
              />
            </div>
            <button type="submit">Создать</button>
          </form>
        </div>
        <div style={{ flex: 1 }}>
          <h3>Детали / Редактирование</h3>
          {current ? (
            <div>
              <div style={{ marginBottom: 4 }}>
                <label>
                  Название:&nbsp;
                  <input
                    value={current.title}
                    onChange={(e) =>
                      setCurrent((c) => ({ ...c, title: e.target.value }))
                    }
                  />
                </label>
              </div>
              <div style={{ marginBottom: 4 }}>
                <label>
                  Категория:&nbsp;
                  <input
                    value={current.category}
                    onChange={(e) =>
                      setCurrent((c) => ({ ...c, category: e.target.value }))
                    }
                  />
                </label>
              </div>
              <div style={{ marginBottom: 4 }}>
                <label>
                  Описание:&nbsp;
                  <input
                    value={current.description}
                    onChange={(e) =>
                      setCurrent((c) => ({ ...c, description: e.target.value }))
                    }
                  />
                </label>
              </div>
              <div style={{ marginBottom: 4 }}>
                <label>
                  Цена:&nbsp;
                  <input
                    type="number"
                    value={current.price}
                    onChange={(e) =>
                      setCurrent((c) => ({ ...c, price: Number(e.target.value) }))
                    }
                  />
                </label>
              </div>
              <button onClick={handleUpdate} style={{ marginRight: 8 }}>
                Сохранить
              </button>
              <button onClick={handleDelete}>Удалить</button>
            </div>
          ) : (
            <p>Выберите товар из списка, чтобы посмотреть детали.</p>
          )}
        </div>
      </div>
      {error && <p style={{ color: "red", marginTop: 8 }}>{error}</p>}
    </div>
  );
}

export default function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const accessToken = localStorage.getItem("accessToken");
    const refreshToken = localStorage.getItem("refreshToken");
    if (!accessToken || !refreshToken) return;

    apiClient
      .get("/api/auth/me")
      .then((resp) => setUser(resp.data))
      .catch(() => {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
      });
  }, []);

  function handleLogout() {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    setUser(null);
  }

  return (
    <div style={{ maxWidth: 1000, margin: "0 auto", padding: 24, fontFamily: "sans-serif" }}>
      <h1>Практики 9-10: Auth + Товары</h1>
      {user ? (
        <p>
          Вы вошли как <strong>{user.email}</strong>{" "}
          <button onClick={handleLogout} style={{ marginLeft: 8 }}>
            Выйти
          </button>
        </p>
      ) : (
        <p>Вы не авторизованы.</p>
      )}
      {!user && <AuthSection onAuthSuccess={setUser} />}
      {user && <ProductsSection />}
    </div>
  );
}

