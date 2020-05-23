const { promisify } = require("util");
const env = require("./env");
const redis = require("redis");
const client = redis.createClient(env.redis_cx);

client.on("error", (err) => {
  console.error("error", err.stack);
});

const c = {
  exists: promisify(client.exists).bind(client),
  get: promisify(client.get).bind(client),
  set: promisify(client.set).bind(client),
  hgetall: promisify(client.hgetall).bind(client),
  hget: promisify(client.hget).bind(client),
  hset: promisify(client.hset).bind(client),
  setex: promisify(client.setex).bind(client),
  flushdb: promisify(client.flushdb).bind(client),
};

exports.exists = async (key) => {
  return await c.exists(key);
};

exports.get = async (key) => {
  return await c.get(key);
};

exports.set = async (key, value) => {
  return await c.set(key, value);
};

exports.set_expire = async (key, seconds, value) => {
  return await c.setex(key, seconds, value);
};

exports.hash_set = async (key, data) => {
  const args = Object.entries(data).reduce((arr, entry) => arr.concat(entry), []);
  return await c.hset(key, ...args);
};

exports.hash_get = async (key, field) => {
  return await c.hget(key, field);
};

exports.hash_read = async (key, field) => {
  return await c.hgetall(key);
};

exports.clear = async () => {
  return await c.flushdb();
};
