require('dotenv').config();
var express = require('express');
var router = express.Router();
var gatewayService = require('../service/gatewayService');
var utils = require('../scripts/utils/commonUtils');

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
        case "AUTHORIZE":
            returnObj = {
                "apiOperation": apiOperation,
                "3DSecureId": utils.getSecureId()
            };
            returnObj.order = {
                "amount": request.body.orderAmount,
                "currency": request.body.orderCurrency
            };
            returnObj.session = {
                "id": request.body.session.id
            };
            returnObj.sourceOfFunds = {
                "type": "CARD"
            }

            break;

        case "CAPTURE":
            returnObj.transaction = {
                "amount": request.body.orderAmount,
                "currency": request.body.orderCurrency
            };
            break;
    }
    return returnObj;
}

apiResponseBody = (request, response) => {
    return { "status": !response.resbody.error ? false : true };
}

router.post('/pay', function (request, response) {
    var requestData = apiRequestBody("PAY", request);
    var apiRequest = request.body;
    var requestUrl = gatewayService.getRequestUrl("REST", apiRequest);

    gatewayService.processPay(requestData, requestUrl, function (result) {
        handleResponse(result, request, response);
    });
});

router.get('/payload', function (request, response) {

    var orderId = "order-" + utils.keyGen(10);
    var orderAmount = "20";
    var orderCurrency = utils.getCurrency();
    var orderDescription = 'Wonderful product that you should buy!';

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
                "orderId": orderId,
                "orderAmount": orderAmount,
                "orderCurrency": orderCurrency,
                "orderDescription": orderDescription,
                "session": result.session,
            });
        });
    });
})


/**
* '/check3ds' - This method handles the response from the CHECK_3DS_ENROLLMENT operation. If the card is enrolled, the response htmlBodyContent.
* @param {*} redirectUrl
* @param {*} orderAmount
* @param {*} orderCurrency
* @param {*} redirectUrl
* @param {*} sessionId
*/

router.post('/check3ds', function (request, response, next) {
    var redirectUrl = 'http://localhost:3001/route/process3ds';
    var orderAmount = request.body.orderAmount;
    var orderCurrency = request.body.orderCurrency;
    var sessionId = request.body.session.id;

    var secureId = utils.getSecureId();
    var requestData = {
        "apiOperation": "CHECK_3DS_ENROLLMENT",
        "order": {
            "amount": orderAmount,
            "currency": orderCurrency
        },
        "session": {
            "id": sessionId
        },
        "3DSecure": {
            "authenticationRedirect": {
                "responseUrl": redirectUrl,
                "pageGenerationMode": "SIMPLE"
            }
        }
    };

    gatewayService.check3dsEnrollmentAccess(secureId, requestData, function (err, body) {
        if (!err || !body.error) {
            var secure = body['3DSecure'];
            if (secure.veResEnrolled === 'Y' && body.response.gatewayRecommendation === 'PROCEED') {
                var htmlcontent = secure.authenticationRedirect.simple.htmlBodyContent;
                response.send({ 'htmlBodyContent': htmlcontent });
                
            } else {
                response.send({ "status": "Error","Error": err });
            }
        } else {
            response.send({ "status": "Error","Error": err });
        }
    });
});



router.post('/process3ds', function (request, response, next) {
    var secureId = utils.getSecureId();
    var pares = request.body.pares;
    var requestData = {
        "apiOperation": "PROCESS_ACS_RESULT",
        "3DSecure": {
            "paRes": pares
        }
    }

    gatewayService.process3ds(requestData, secureId, function (result) {
        if (!result.error && result.response.gatewayRecommendation === "PROCEED") {
            var secure = result['3DSecure'];
            if (secure.paResStatus === 'Y') {
                response.send({ "status": "Success" })
            }
        } else {
            response.json({ "status": "Error" });
        }
    });
});

process3DS = (apiOperation, request, response) => {
    var orderId = request.body.orderId;
    var transactionId = utils.keyGen(20);
    var payload = apiRequestBody(apiOperation, request);

    gatewayService.process3dsResult(payload, orderId, transactionId, function (result) {
        var data = JSON.stringify(result.message);
        response.send({ status: result.error ? 'Error' : 'Success', responseData: data, transactionId: transactionId });
    });
}

router.post('/pay-with-3ds', function (request, response, next) {
    process3DS("PAY", request, response);
});

router.post('/authorize-with-3ds', function (request, response, next) {
    process3DS("AUTHORIZE", request, response);
});

router.post('/capture-with-3ds', function (request, response, next) {
    process3DS("CAPTURE", request, response);
});

module.exports = router;