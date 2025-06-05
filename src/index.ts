import express from "express";
import path from "path";
import bodyParser from "body-parser";
import session from "express-session";
import cors from "cors";
import MongoStore from "connect-mongo";
import mongoose from "../src/db/mongoose";
import { Request, Response, NextFunction } from "express";
import { get, has } from "lodash";
require("dotenv").config();

const app = express();
const log = console.log;

// Middlewares
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "../client/build")));
app.use(
  cors({
    origin: "http://localhost:8081",
  })
);

// Session setup
app.use(
  session({
    secret: "a hardcoded secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      expires: new Date(Date.now() + 36000000),
      sameSite: "strict",
      httpOnly: true,
    },
    store: new MongoStore({ client: mongoose.connection.getClient() }),
    unset: "destroy",
  })
);

// Routes
app.use(require("./routes/api"));

app.get("/logout", (req: Request, res: Response) => {
  if (has(req, "session")) {
    get(req, "session").destroy((err: unknown) => {
      console.log(err);
    });
  }
  res.status(301).redirect("/");
});

const validUrls = ["/", "/calendar", "/login", "/signup", "/profile"];
const authUrls = ["/calendar", "/profile"];
const unAuthUrls = ["/login", "/signup"];

const authenticate = (req: Request, res: Response, next: NextFunction) => {
  if (!has(req, ["session", "user"]) && authUrls.includes(req.url)) {
    res.status(301).redirect("/signup");
  } else {
    next();
  }
};

const unauthenticate = (req: Request, res: Response, next: NextFunction) => {
  if (has(req, ["session", "user"]) && unAuthUrls.includes(req.url)) {
    res.status(301).redirect("/calendar");
  } else {
    next();
  }
};

function requireHTTPS(req: Request, res: Response, next: NextFunction) {
  if (
    !req.secure &&
    req.get("x-forwarded-proto") !== "https" &&
    process.env.NODE_ENV !== "development"
  ) {
    return res.redirect("https://" + req.get("host") + req.url);
  }
  next();
}

app.get(
  "*",
  requireHTTPS,
  authenticate,
  unauthenticate,
  (req: Request, res: Response) => {
    if (!validUrls.includes(req.url)) {
      return res.status(404).send("404 not found :(");
    }
    res.sendFile(path.join(__dirname, "../client/build/index.html"));
  }
);

// ✅ WAIT for MongoDB before starting server
mongoose.connection.once("open", () => {
  console.log("✅ MongoDB fully connected");
  const port = process.env.PORT || 6054;
  app.listen(port, () => {
    log(`🚀 Server listening on port ${port}`);
  });
});
