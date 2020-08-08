import fetch from 'node-fetch';
import {Call} from 'simple-fake-server';

export type MockOptions = {
    method?: 'get' | 'post' | 'put' | 'patch' | 'delete';
    url: string;
    body?: any;
    query?: Record<string, any>;
    response?: any;
    respondAsJson?: boolean;
    statusCode?: number;
    respondAsStream?: boolean;
    responseHeaders?: Record<string, string>;
    respondAsBuffer?: boolean;
    allowSupersetOfBody?: boolean;
};

export type ConnectionOptions = {
    port?: number;
    baseUrl?: string;
};

export default class Server {
    private readonly _url: string;

    constructor(connectionOptions: ConnectionOptions = {}) {
        this._url = `${connectionOptions.baseUrl || 'http://localhost'}:${connectionOptions.port || 3000}`;
    }

    private buildUrl(path: string) {
        return `${this._url}/fake_server_admin/${path}`;
    }

    async mock({
        method,
        url,
        body,
        query,
        response,
        respondAsJson,
        statusCode,
        respondAsStream,
        respondAsBuffer,
        responseHeaders,
        allowSupersetOfBody,
    }: MockOptions): Promise<string> {
        const res = await fetch(this.buildUrl('calls'), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                method: method || 'get',
                url,
                ...(query && {query: JSON.stringify(query)}),
                ...(body && {body: JSON.stringify(body)}),
                ...(response && {response}),
                respondAsJson: respondAsJson || false,
                statusCode: statusCode || 200,
                respondAsStream: respondAsStream || false,
                respondAsBuffer: respondAsBuffer || false,
                responseHeaders,
                allowSupersetOfBody,
            }),
        });

        const {callId} = await res.json();

        return callId;
    }

    async getCalls(): Promise<Call[]> {
        const res = await fetch(this.buildUrl('calls'));

        const {calls} = await res.json();

        return calls;
    }

    async getCall(callId: string): Promise<{hasBeenMade: boolean; madeCalls: Call[]}> {
        const res = await fetch(this.buildUrl(`calls?callId=${callId}`));

        return res.json();
    }

    async clear() {
        await fetch(this.buildUrl('clear'), {method: 'POST'});
    }
}
