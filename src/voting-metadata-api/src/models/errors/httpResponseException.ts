export interface Exception extends Error {
    status: number;
}

export class HTTPResponseException extends Error implements Exception {
    status: number;
    constructor(status: number, message: string) {
        super(message);
        this.status = status;
    }
}

export class NotFoundException extends HTTPResponseException {
    constructor(message: string) {
        super(404, message);
    }
}