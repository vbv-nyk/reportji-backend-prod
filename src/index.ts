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
config({ path: `.env.${process.env.CURRENT_MODE}` });
/* const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const multer = require('multer');

// Set up AWS credentials
const s3Client = new S3Client({
  region: 'YOUR_AWS_REGION',
  credentials: {
    accessKeyId: 'YOUR_ACCESS_KEY',
    secretAccessKey: 'YOUR_SECRET_ACCESS_KEY',
  },
} ); */

import connectPgSimple from "connect-pg-simple";

const pgSession = connectPgSimple(session);

interface MyContext {
  token?: string;
}

// Required logic for integrating with Express
const app = express();
// Our httpServer handles incoming requests to our Express app.
// Below, we tell Apollo Server to "drain" this httpServer,
// enabling our servers to shut down gracefully.
const httpServer = http.createServer(app);

// Same ApolloServer initialization as before, plus the drain plugin
// for our httpServer.
const server = new ApolloServer<MyContext>({
  typeDefs,
  resolvers,
  plugins: [ApolloServerPluginDrainHttpServer({ httpServer })],
});
// Ensure we wait for our server to start
await server.start();

// Set up our Express middleware to handle CORS, body parsing,
// and our expressMiddleware function.
initializePassport();

app.use(express.json());
app.use(
  session({
    store: new pgSession({
      pool: pool,
    }),
    secret: process.env.EXPRESS_SESSION_PASSWORD,
    resave: false,
    saveUninitialized: true,
    maxAge: 1000 * 60 * 60 * 24 * 30,
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

// Modified server startup
await new Promise<void>((resolve) =>
  httpServer.listen({ port: process.env.PORT }, resolve)
);
console.log(`Serving host ${process.env.CLIENT_URL}`);
