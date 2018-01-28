export default class CallHistory {
  constructor () {
    this.calls = [];
  }

  get () {
    return this.calls;
  }

  push (call) {
    this.calls.push(call);
  }

  clear () {
    this.calls = [];
  }
}
