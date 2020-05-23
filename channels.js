const uuid = require("uuid");
const db = require("./redis_sync");

const validateShort = (exports.validateShort = async (shortCode) => {
  return await db.get(`s:${shortCode}`);
});

const validatePrivate = (exports.validatePrivate = async ({ publicKey, privateKey }) => {
  const protection = await db.hash_get(`p:${publicKey}`, "protected");
  return protection === "false" || protection === privateKey;
});

const readPublic = (exports.readPublic = async (publicKey) => {
  const state = await db.hash_get(`p:${publicKey}`, "state");
  if (state) {
    return JSON.parse(state);
  }

  return null;
});

exports.readShort = async (shortCode) => {
  const publicKey = await db.get(`s:${shortCode}`);
  if (publicKey) {
    return await readPublic(publicKey);
  }
  return null;
};

const createShort = (exports.createShort = async ({ shortCode, publicKey }) => {
  if ((await validateShort(shortCode)) !== null) {
    return false;
  }

  db.set_expire(`s:${shortCode}`, 60 * 60 * 24, publicKey);
  return true;
});

exports.createChannel = async ({ state, shortCode, protected, incremental }) => {
  const publicKey = uuid.v4();
  const privateKey = !!protected && uuid.v4();

  if (shortCode) {
    if (createShort({ shortCode, publicKey }) === false) {
      return false;
    }
  }

  await db.hash_set(`p:${publicKey}`, {
    protected: privateKey,
    tx: !!incremental ? state.tx || 0 : false,
    state: JSON.stringify(state),
  });

  return { privateKey, publicKey, shortCode, state };
};

exports.updateChannel = async ({ state, publicKey, privateKey }) => {
  if ((await validatePrivate({ publicKey, privateKey })) === false) {
    return false;
  }

  // check for incremental update
  const tx = await db.hash_get(`p:${publicKey}`, "tx");
  if (tx !== "false") {
    if (state.tx > tx) {
      db.hash_set(`p:${publicKey}`, { tx: state.tx, state: JSON.stringify(state) });
      return true;
    }
    return false;
  }

  db.hash_set(`p:${publicKey}`, { state: JSON.stringify(state) });
  return true;
};
