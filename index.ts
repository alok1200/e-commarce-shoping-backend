import dotenv from "dotenv";
dotenv.config();

import express, { Request, Response, Application } from "express";
import cors from "cors";
import bodyParser from "body-parser";
import connectToMongo from "./db"; // assume db.ts exports a default async function
import order from "./models/order"; // assuming you use it somewhere later

// ROUTES (update .ts extensions if needed)
import authRoutes from "./routes/auth";
import userRoutes from "./routes/user";
import productRoutes from "./routes/product";
import cartRoutes from "./routes/cart";
import orderRoutes from "./routes/order";
import stripeRoutes from "./routes/stripe";
import announcementRoutes from "./routes/announcment";
import paymentRoutes from "./routes/paymentRout";
import reviewRoutes from "./routes/Reviews";
import addressRoutes from "./routes/address";
import analyticsRoutes from "./routes/analytics";

const app: Application = express();
connectToMongo();

const appPort: number = Number(process.env.PORT) || 5000;

// Middleware
app.use(express.json({ limit: "50mb" }));
app.use(cors());
app.use(bodyParser.urlencoded({ extended: true, limit: "50mb" }));

// Routes
app.get("/", async (_req: Request, res: Response) => {
  res.send("HELLO WORLD");
});

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/products", productRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/checkout", stripeRoutes);
app.use("/api/announcment", announcementRoutes);
app.use("/api/buy", paymentRoutes);
app.use("/api/review", reviewRoutes);
app.use("/api/user/address", addressRoutes);
app.use("/api/analytics", analyticsRoutes);

// Server start
const server = app.listen(appPort, () => {
  console.log(`Backend server is up on port ${appPort}`);
});

// Unexpected error handler
process.on("uncaughtException", (err: Error) => {
  console.error(`Logged Error from index.ts: ${err.stack}`);
  server.close(() => process.exit(1));
});
