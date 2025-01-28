// npm install @apollo/server express graphql cors
import { ApolloServer } from "@apollo/server";
import pg from "pg";
import { expressMiddleware } from "@apollo/server/express4";
import { ApolloServerPluginDrainHttpServer } from "@apollo/server/plugin/drainHttpServer";
import express from "express";
import session from "express-session";
import passport from "passport";
import http from "http";
import { router as login, router } from "./auth/login.js";
import cors from "cors";
import { typeDefs } from "./graphql/schema.js";
import { resolvers } from "./graphql/resolver.js";
import { initializePassport, isAuthenticated } from "./auth/passport.js";
import { pool } from "./database/postgres-config.js";
import { config } from 'dotenv';
import https from "https";
import fs from 'fs';
config({ path: `.env.${process.env.CURRENT_MODE}` });

import connectPgSimple from "connect-pg-simple";

const pgSession = connectPgSimple(session);

interface MyContext {
  token?: string;
}


const apolloPlugins = []
// Required logic for integrating with Express
const app = express();

if (process.env.CURRENT_MODE != "selfhost") {
  const privateKey = fs.readFileSync("/etc/letsencrypt/live/reportji.zapto.org/privkey.pem", 'utf8')
  const certificate = fs.readFileSync("/etc/letsencrypt/live/reportji.zapto.org/cert.pem", 'utf8')
  const ca = fs.readFileSync("/etc/letsencrypt/live/reportji.zapto.org/chain.pem", 'utf8')
  const credentials = { key: privateKey, cert: certificate, ca: ca };

  // Our httpServer handles incoming requests to our Express app.
  // Below, we tell Apollo Server to "drain" this httpServer,
  // enabling our servers to shut down gracefully.
  const httpsServer = https.createServer(credentials, app);

  // Same ApolloServer initialization as before, plus the drain plugin
  // for our httpServer.
  if (process.env.CURRENT_MODE != "selfhost") {
    apolloPlugins.push(ApolloServerPluginDrainHttpServer({ httpServer: httpsServer }))
  }

  // Modified server startup
  await new Promise<void>((resolve) =>
    httpsServer.listen({ port: process.env.PORT }, resolve)
  );
}

const server = new ApolloServer<MyContext>({
  typeDefs,
  resolvers,
  plugins: apolloPlugins,
});

// Ensure we wait for our server to start
await server.start();


// Set up our Express middleware to handle CORS, body parsing,
// and our expressMiddleware function.
initializePassport();

app.use(express.json());
app.use(
  session({
    cookie: {
      secure: true,
      sameSite: 'None',
      maxAge: 1000 * 60 * 60 * 24 * 30 // Cookie expiry time in milliseconds
    },
    store: new pgSession({
      pool: pool,
    }),
    secret: process.env.EXPRESS_SESSION_PASSWORD,
    resave: false,
    saveUninitialized: true,
  })
);
app.use(passport.initialize());
app.use(passport.session());

app.use(
  cors<cors.CorsRequest>({
    origin: [process.env.CLIENT_URL, "http://localhost:3000"],
    credentials: true,
  })
);

app.use("/auth", login);

// All protected routes start from here
// app.use(isAuthenticated);
// 

app.use(
  "/graphql",
  isAuthenticated,
  expressMiddleware(server, {
    context: async ({ req }) => ({ user: req.user }),
  })
);

console.log(`Serving host ${process.env.CLIENT_URL}`);
