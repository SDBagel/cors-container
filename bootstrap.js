'use strict';

const request = require('request-promise');
const converter = require('rel-to-abs');
const fs = require('fs');
const index = fs.readFileSync('index.html', 'utf8');
const ResponseBuilder = require('./app/ResponseBuilder');

module.exports = app => {
    app.get('/https://mvla.instructure.com/*', proxyGet);
    app.post('/https://mvla.instructure.com/*', proxyPost);
    app.put('/https://mvla.instructure.com/*', proxyPut);
};

const proxyGet = function(req, res) {
    proxy(req, res, request.get);
}

const proxyPost = function(req, res) {
    proxy(req, res, request.post);
}

const proxyPut = function(req, res) {
    proxy(req, res, request.put);
}

const proxy = function(req, res, requestor) {
    const responseBuilder = new ResponseBuilder(res);
    
    const requestedUrl = req.url.slice(1);
    const corsBaseUrl = '//' + req.get('host');
    
    console.info(req.protocol + '://' + req.get('host') + req.url);
    
    if(requestedUrl == ''){
        res.send(index);
        return;
    }

    requestor({
        uri: requestedUrl,
        resolveWithFullResponse: true,
        headers: {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_10_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/48.0.2564.116 Safari/537.36'
        }
    })
    .then(originResponse => {            
        responseBuilder
            .addHeaderByKeyValue('Access-Control-Allow-Origin', '*')
            .addHeaderByKeyValue('Access-Control-Allow-Credentials', false)
            .addHeaderByKeyValue('Access-Control-Allow-Headers', 'Content-Type')
            .addHeaderByKeyValue('X-Frame-Options', 'LOL')
            .addHeaderByKeyValue('X-Proxied-By', 'cors-container')
            .build(originResponse.headers);
        if(req.headers['rewrite-urls']){
            res.send(
                converter
                    .convert(originResponse.body, requestedUrl)
                    .replace(requestedUrl, corsBaseUrl + '/' + requestedUrl)
            ); 
        }else{
            res.send(originResponse.body);                
        }
    })
    .catch(originResponse => {
        if (!originResponse.response) return res.sendStatus(500);
        responseBuilder
            .addHeaderByKeyValue('Access-Control-Allow-Origin', '*')
            .addHeaderByKeyValue('Access-Control-Allow-Credentials', false)
            .addHeaderByKeyValue('Access-Control-Allow-Headers', 'Content-Type')
            .addHeaderByKeyValue('X-Frame-Options', 'LOL')
            .addHeaderByKeyValue('X-Proxied-By', 'cors-containermeh')
            .build(originResponse.response.headers);

        res.status(originResponse.response.statusCode || 500);
        
        return res.send(originResponse.response.body);
    });
}