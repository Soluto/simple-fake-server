export type Call = {
    method: string;
    path: string;
    headers: any;
    body: any;
};

export default class CallHistory {
    calls: Call[];

    constructor() {
        this.calls = [];
    }

    get() {
        return this.calls;
    }

    push(call: Call) {
        this.calls.push(call);
    }

    clear() {
        this.calls = [];
    }
}
