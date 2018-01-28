let history = [];

export default {
  get () {
    return history;
  },

  push (serverCall) {
    history.push(serverCall);
  },

  clear () {
    history = [];
  }
};
