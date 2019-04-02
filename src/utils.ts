export function sleep(ms: number): any {
    return function(callback: Function) {
        setTimeout(callback, ms);
    };
}
