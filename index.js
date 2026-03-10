const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { nanoid } = require("nanoid");

const app = express();
const PORT = 3000;

app.use(express.json());

app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  console.log("BODY:", req.body);
  next();
});

const JWT_SECRET = "access_secret";
const ACCESS_EXPIRES_IN = "15m";

/** @type {{ id: string, email: string, first_name: string, last_name: string, passwordHash: string }[]} */
const users = [];

/** @type {{ id: string, title: string, category: string, description: string, price: number }[]} */
const products = [];

function authMiddleware(req, res, next) {
  const header = req.headers.authorization || "";
  const [scheme, token] = header.split(" ");

  if (scheme !== "Bearer" || !token) {
    return res.status(401).json({
      error: "Missing or invalid Authorization header",
    });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload; // { sub, email, iat, exp }
    next();
  } catch (err) {
    return res.status(401).json({
      error: "Invalid or expired token",
    });
  }
}

app.post("/api/auth/register", async (req, res) => {
  try {
    console.log("REGISTER BODY:", req.body);
    const { email, first_name, last_name, password } = req.body || {};

    if (!email || !first_name || !last_name || !password) {
      return res.status(400).json({
        error: "email, first_name, last_name and password are required",
      });
    }

    const existing = users.find((u) => u.email === email);
    if (existing) {
      return res.status(400).json({
        error: "User with this email already exists",
      });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = {
      id: nanoid(),
      email,
      first_name,
      last_name,
      passwordHash,
    };

    users.push(user);

    return res.status(201).json({
      id: user.id,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Internal server error" });
  }
});

app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body || {};

    if (!email || !password) {
      return res.status(400).json({
        error: "email and password are required",
      });
    }

    const user = users.find((u) => u.email === email);
    if (!user) {
      return res.status(401).json({
        error: "Invalid credentials",
      });
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      return res.status(401).json({
        error: "Invalid credentials",
      });
    }

    const accessToken = jwt.sign(
      {
        sub: user.id,
        email: user.email,
      },
      JWT_SECRET,
      {
        expiresIn: ACCESS_EXPIRES_IN,
      }
    );

    return res.json({
      accessToken,
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/api/auth/me", authMiddleware, (req, res) => {
  const userId = req.user.sub;
  const user = users.find((u) => u.id === userId);

  if (!user) {
    return res.status(404).json({
      error: "User not found",
    });
  }

  return res.json({
    id: user.id,
    email: user.email,
    first_name: user.first_name,
    last_name: user.last_name,
  });
});

app.post("/api/products", (req, res) => {
  const { title, category, description, price } = req.body || {};

  if (!title || !category || !description || price === undefined) {
    return res.status(400).json({
      error: "title, category, description and price are required",
    });
  }

  const numericPrice = Number(price);
  if (Number.isNaN(numericPrice)) {
    return res.status(400).json({
      error: "price must be a number",
    });
  }

  const product = {
    id: nanoid(),
    title,
    category,
    description,
    price: numericPrice,
  };

  products.push(product);

  return res.status(201).json(product);
});

app.get("/api/products", (req, res) => {
  return res.json(products);
});

app.get("/api/products/:id", authMiddleware, (req, res) => {
  const { id } = req.params;
  const product = products.find((p) => p.id === id);

  if (!product) {
    return res.status(404).json({ error: "Product not found" });
  }

  return res.json(product);
});

app.put("/api/products/:id", authMiddleware, (req, res) => {
  const { id } = req.params;
  const product = products.find((p) => p.id === id);

  if (!product) {
    return res.status(404).json({ error: "Product not found" });
  }

  const { title, category, description, price } = req.body || {};

  if (title !== undefined) product.title = title;
  if (category !== undefined) product.category = category;
  if (description !== undefined) product.description = description;
  if (price !== undefined) {
    const numericPrice = Number(price);
    if (Number.isNaN(numericPrice)) {
      return res.status(400).json({ error: "price must be a number" });
    }
    product.price = numericPrice;
  }

  return res.json(product);
});

app.delete("/api/products/:id", authMiddleware, (req, res) => {
  const { id } = req.params;
  const index = products.findIndex((p) => p.id === id);

  if (index === -1) {
    return res.status(404).json({ error: "Product not found" });
  }

  products.splice(index, 1);
  return res.status(204).send();
});

app.listen(PORT, () => {
  console.log(`Сервер запущен на http://localhost:${PORT}`);
  console.log(`Доступные маршруты:
  POST   /api/auth/register
  POST   /api/auth/login
  GET    /api/auth/me        (JWT Bearer <token>)
  POST   /api/products
  GET    /api/products
  GET    /api/products/:id   (JWT Bearer <token>)
  PUT    /api/products/:id   (JWT Bearer <token>)
  DELETE /api/products/:id   (JWT Bearer <token>)`);
});
