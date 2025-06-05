import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const mongoURI = "mongodb://127.0.0.1:27017/mealplanner";

// Optional: remove deprecation warnings
mongoose.set("strictQuery", true);

mongoose.connect(mongoURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
} as any);

mongoose.connection.on("connected", () => {
  console.log("MongoDB connected");
});

mongoose.connection.on("error", (err) => {
  console.error("MongoDB connection error:", err);
});

mongoose.connection.on("disconnected", () => {
  console.warn("MongoDB disconnected");
});

export default mongoose;
