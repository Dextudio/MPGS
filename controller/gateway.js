require('dotenv').config();
var express = require('express');
var router = express.Router();
var gatewayService = require('../service/gatewayService');
var utils = require('../scripts/utils/commonUtils');
var config = require('../scripts/config/config')

handleResponse = (result, request, response) => {
    var responseData = apiResponseBody(request, result);
    if (responseData.status) {
        response.json(responseData);
    } else {
        response.json(responseData);
    }
}

apiRequestBody = (apiOperation, request) => {
    var returnObj = {
        "apiOperation": apiOperation
    }
    switch (apiOperation) {
        case "PAY":
            returnObj.order = {
                "amount": request.body.orderAmount,
                "currency": request.body.orderCurrency
            };
            returnObj.session = {
                "id": request.body.session.id
            }
            break;
    }
    return returnObj;
}

apiResponseBody = (request, response) => {
    var status = (response.resbody.error) ? false : true;
    if (!status) {
        return {
            "cause": response.resbody.error.cause,
            "explanation": response.resbody.error.explanation,            
            "status": false
        };
    } else {
        return {
            "status": true
        };
    }
}

router.get('/payload', function (request, response) {

    var orderId = "order-" + utils.keyGen(10);
    var orderAmount = "20";
    var orderCurrency = utils.getCurrency();
    var orderDescription = 'Wonderful product that you should buy!';
    var transactionId = "trans-" + utils.keyGen(10);

    var baseUrl = config.TEST_GATEWAY.BASEURL;
    var merchant = config.TEST_GATEWAY.MERCHANTID;
    var apiVersion = config.TEST_GATEWAY.API_VERSION;

    var cardNum = 5123450000000008;
    var expiryMonth = 05;
    var expiryYear = 21;
    var secCode = 100;

    gatewayService.getSession({}, function (result) {
        let sessionId = result.session.id;
        let data = {
            "sourceOfFunds": {
                "type": "CARD",
                "provided": {
                    "card": {
                        "number": cardNum,
                        "securityCode": secCode,
                        "expiry": {
                            "month": expiryMonth,
                            "year": expiryYear
                        }
                    }
                }
            }
        }

        gatewayService.updateSession(sessionId, data, function (result) {
            response.send({
                "baseUrl": baseUrl,
                "merchant": merchant,
                "apiVersion": apiVersion,
                "orderId": orderId,
                "orderAmount": orderAmount,
                "orderCurrency": orderCurrency,
                "orderDescription": orderDescription,
                "session": result.session,
                "transactionId": transactionId
            });
        });
    });
})

router.post('/pay', function (request, response) {
    var requestData = apiRequestBody("PAY", request);
    var apiRequest = request.body;
    var requestUrl = gatewayService.getRequestUrl("REST", apiRequest);

    gatewayService.processPay(requestData, requestUrl, function (result) {
        handleResponse(result, request, response);
    });
});

module.exports = router;