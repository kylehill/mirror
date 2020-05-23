const { promisify } = require("util");
const env = require("./env");
const redis = require("redis");
const client = redis.createClient(env.redis_cx, {
  retry_unfulfilled_commands: true,
  retry_strategy(options) {
    if (options.error && options.error.code === "ECONNREFUSED") {
      // End reconnecting on a specific error and flush all commands with
      // a individual error
      return new Error("The server refused the connection");
    }
    if (options.total_retry_time > 1000 * 60 * 60) {
      // End reconnecting after a specific timeout and flush all commands
      // with a individual error
      return new Error("Retry time exhausted");
    }
    if (options.attempt > 10) {
      // End reconnecting with built in error
      return undefined;
    }
    // reconnect after
    return Math.min(options.attempt * 100, 3000);
  },
});

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
