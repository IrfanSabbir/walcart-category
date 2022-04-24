import http from "http";
import dotenv from "dotenv";

import express, { Application, Request, Response, NextFunction } from "express";
import mongoose from "mongoose";
import { ApolloServer } from "apollo-server-express";
import { ApolloServerPluginLandingPageGraphQLPlayground } from "apollo-server-core";

import categorytypeDefs from "./typeDefs/category";
import categoryresolvers from "./resolvers/category";
import { redis, categoryCacheKey } from "./config/redisConfig";

dotenv.config();

const app: Application = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.json({ limit: "50mb" }));

// you can also use process.env.DATABSE_URI
const URI: string = `${process.env.DATABSE_URI_SRV}`;

const db = async () => {
  try {
    await mongoose.connect(URI);

    await redis.del(categoryCacheKey);

    console.log("Mongoose is connected");
  } catch (error) {
    console.log("mongoose: " + error);
  }
};
db();

(async () => {
  const apolloServer = new ApolloServer({
    typeDefs: [categorytypeDefs],
    resolvers: [categoryresolvers],
    plugins: [ApolloServerPluginLandingPageGraphQLPlayground()],
  });

  await apolloServer.start();

  apolloServer.applyMiddleware({ app });
  const httpServer = http.createServer(app);

  app.use("/", (req: Request, res: Response, next: NextFunction) => {
    res.send("running");
  });

  httpServer.listen(process.env.PORT, () => {
    console.log(`Running on port ${process.env.PORT}`);
  });
})();
