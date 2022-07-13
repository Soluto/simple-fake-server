export type Request = {
    method: string;
    path: string;
    headers: any;
    body: any;
};

export default class RequestsHistory {
    requests: Request[];

    constructor() {
        this.requests = [];
    }

    get() {
        return this.requests;
    }

    push(call: Request) {
        this.requests.push(call);
    }

    clear() {
        this.requests = [];
    }
}
