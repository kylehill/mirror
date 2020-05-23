const channels = require("./channels");

module.exports = (socket) => {
  socket.on("create_channel", async (data, callback) => {
    const channel = await channels.createChannel(data);
    if (channel === false) {
      return callback && callback({ created: false });
    }

    socket.join(`c:${channel.publicKey}`);
    socket.to("_firehose").emit("create", {
      publicKey: channel.publicKey,
      shortCode: channel.shortCode,
      state: channel.state,
    });

    return callback && callback({ ...channel, created: true });
  });

  socket.on("create_short", async (data, callback) => {
    const created = await channels.createShort(data);
    callback && callback({ created });
  });

  socket.on("update_channel", async (data, callback) => {
    const updated = await channels.updateChannel(data);

    if (updated === false) {
      return callback && callback({ updated: false });
    }

    socket.to(`c:${data.publicKey}`).to("_firehose").emit("update", {
      publicKey: data.publicKey,
      state: data.state,
    });

    return callback && callback({ updated: true });
  });

  socket.on("validate_short", async (shortCode, callback) => {
    const publicKey = await channels.validateShort(shortCode);
    callback({ shortCode: publicKey });
  });

  socket.on("validate_private", async (data, callback) => {
    const validated = await channels.validatePrivate(data);
    callback({ validated });
  });

  const joinChannel = async (publicKey, callback) => {
    const state = await channels.readPublic(publicKey);
    if (state === null) {
      return callback && callback({ joined: false });
    }

    socket.join(`c:${publicKey}`);
    callback && callback({ joined: true, publicKey, state });
  };

  socket.on("join_channel", joinChannel);
  socket.on("join_short", async (shortCode, callback) => {
    const publicKey = await channels.validateShort(shortCode);
    if (publicKey === null) {
      return callback && callback({ joined: false });
    }

    joinChannel(publicKey, callback);
  });

  const leaveChannel = (publicKey, callback) => {
    socket.leave(`c:${publicKey}`);
    callback && callback({ left: true });
  };

  socket.on("leave_channel", leaveChannel);
  socket.on("leave_short", async (shortCode, callback) => {
    const publicKey = await channels.validateShort(shortCode);
    if (publicKey === null) {
      return callback && callback({ left: false });
    }

    leaveChannel(publicKey, callback);
  });

  socket.on("join_firehose", () => {
    socket.join("_firehose");
  });

  socket.on("leave_firehose", () => {
    socket.join("_firehose");
  });
};
