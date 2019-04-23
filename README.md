## Gateway nodeJS Sample Code

This application using the Gateway Node SDK.

## Steps for running locally
1. Download code
2. npm install
3. Set the following ENV variables using:

 TEST_GATEWAY_URL= *INSERT_YOUR_GATEWAY_URL_HERE* 
 API_VERSION= *INSERT_YOUR_GATEWAY_API_VERSION* 
 USERNAME= *INSERT_YOUR_GATEWAY_MERCHANT_ID_HERE* 
 PASSWORD= *INSERT_YOUR_GATEWAY_API_PASSWORD_HERE* 
 CURRENCY_LABEL= *INSERT_TYPE_OF_CURRENCY*
 
4. npm start

NOTE:Make sure that your flag (IS_CERT_AUTH_ENABLED)should be "false" while running TEST_GATEWAY

5. Navigate to *http://localhost:3001* to test locally

## Endpoints

1. GET /route/payload - get payload data 
    Responses JSON:
        orderId, orderAmount, orderCurrency, orderDescription, session

2. POST route/pay - pay order
    Parametrs :
        JSON in first endpoint.
    Responses :
        "status": true or false
        
        if status = false :
        cause , explanation