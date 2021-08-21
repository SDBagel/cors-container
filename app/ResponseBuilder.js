'use strict';

class ResponseBuilder {
    constructor(response) {
        this.response = response;
        this.headers = {};
    }
    addHeaderByKeyValue(key, value) {
        this.headers[key] = value;
        return this;
    }
    build(headers) {
        return headers ? this.response.header(Object.assign(headers, this.headers)) : this;
    }
}

module.exports = ResponseBuilder;