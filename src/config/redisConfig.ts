import Redis from "ioredis";

export const redis = new Redis();

export const categoryCacheKey = "CategoryCache";
