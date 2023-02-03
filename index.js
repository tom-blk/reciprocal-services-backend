const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const cors = require('cors');

const reciprocalServicesDatabase = mysql.createConnection({
    host     : 'localhost',
    user     : 'reciprocal-services-access',
    password : '724805',
    database : 'reciprocal-services-db'
});

reciprocalServicesDatabase.connect(error => {
    if(error){
        throw(error);
    }
    console.log('connected');
});

const app = express();

app.use(bodyParser.urlencoded({ extended: true }))

app.use(bodyParser.json());

app.use(
    cors({
      origin: "http://localhost:3000",
      credentials: true,
    })
  );

//USER ENDPOINTS

//creation endpoints

app.get('/create-user', (req, res) => {

    let sql = "INSERT INTO users (firstName, lastName, email) VALUES ('TestDude', 'TestDudenson', 'testdude@mail.com')";
    reciprocalServicesDatabase.query(sql, (error, result) => {
        if(error) throw error;
        console.log(result);
        res.send(result);
    })
})





//fetching endpoints

app.get('/get-superficial-user-details', (req, res) => {

    let sql = "SELECT id, firstName, lastName, profilePicture FROM users";
    reciprocalServicesDatabase.query(sql, (error, result) => {
        if(error) throw error;
        console.log(result);
        res.send(result);
    })
})

app.post('/get-full-user-details/:userId', (req, res) => {

    const {userId} = req.body;

    let sql = 'SELECT * FROM users WHERE id = ?';
    reciprocalServicesDatabase.query(sql, [userId], (error, result) => {
        if(error) throw error;
        console.log(result[0]);
        res.send(result[0]);
    })
})

app.post('/get-service-specific-users/:serviceId', (req, res) => {

    const {userId} = req.body;

    let sql = "SELECT * FROM users;";

    reciprocalServicesDatabase.query(sql, [userId], (error, result) => {
        if(error) throw error;
        console.log('user specific services' + result);
        res.send(result);
    })
})




//updating endpoints

app.put('/update-user', (req, res) => {

    const {
        firstName
    } = req.body;

    let sql = "INSERT INTO users (firstName, lastName, email) VALUES ('TestDude', 'TestDudenson', 'testdude@mail.com')";
    reciprocalServicesDatabase.query(sql, (error, result) => {
        if(error) throw error;
        console.log(result);
        res.send(result);
    })
})





// OUTGOING ORDER ENDPONTS

//creation endpoints

app.post('/create-transaction', (req, res) => {

    const {serviceId, providingUserId, receivingUserId, dateIssued} = req.body;

    console.log(`Request Body: ${serviceId, providingUserId, receivingUserId}`);

    let sql = "INSERT INTO transactions (serviceId, providingUserId, receivingUserId, dateIssued, transactionOrdered, orderConfirmed, orderCompleted, completionConfirmed, orderDenied) VALUES (?, ?, ?, ?, 1, 0, 0, 0, 0)";
    reciprocalServicesDatabase.query(sql, [serviceId, providingUserId, receivingUserId, dateIssued], (error, result) => {
        if(error) throw error;
        console.log(`Result: ${result}`);
        res.send(result);
    })
})

//read endpoints

app.post('/get-actionable-outgoing-orders/:userId', (req, res) => {

    const {receivingUserId} = req.body;

    let sql = 'SELECT * FROM transactions WHERE receivingUserId = ? AND (orderConfirmed = 1 OR orderCompleted = 1 OR orderDenied = 1) AND completionConfirmed = 0';
    reciprocalServicesDatabase.query(sql, [receivingUserId], (error, result) => {
        if(error) throw error;
        console.log("actionable outgoing orders" + result);
        res.send(result);
    })
})

app.post('/get-user-specific-open-transactions/:userId', (req, res) => {

    const {userId} = req.body;

    let sql = 'SELECT * FROM transactions WHERE receivingUserId = ? AND (completionConfirmed = 0 AND orderDenied = 0)';
    reciprocalServicesDatabase.query(sql, [userId], (error, result) => {
        if(error) throw error;
        console.log("open transactions" + result);
        res.send(result);
    })
})

app.post('/get-user-specific-completed-transactions/:userId', (req, res) => {

    const {userId} = req.body;

    let sql = 'SELECT * FROM transactions WHERE receivingUserId = ? AND (completionConfirmed = 1 OR orderDenied = 1)';
    reciprocalServicesDatabase.query(sql, [userId], (error, result) => {
        if(error) throw error;
        console.log(result);
        res.send(result);
    })
})

//update endpoints

app.put('/deny-order/:orderId', (req, res) => {

    const { orderId } = req.body;

    let sql = "UPDATE transactions SET orderDenied=1 WHERE id=?";
    reciprocalServicesDatabase.query(sql, [orderId], (error, result) => {
        if(error) throw error;
        console.log(result);
        res.send(result);
    })
})

app.put('/confirm-order/:orderId', (req, res) => {

    const { orderId } = req.body;

    let sql = "UPDATE transactions SET orderConfirmed=1 WHERE id=?";
    reciprocalServicesDatabase.query(sql, [orderId], (error, result) => {
        if(error) throw error;
        console.log(result);
        res.send(result);
    })
})

app.put('/complete-order/:orderId', (req, res) => {

    const { orderId } = req.body;

    let sql = "UPDATE transactions SET orderCompleted=1 WHERE id=?";
    reciprocalServicesDatabase.query(sql, [orderId], (error, result) => {
        if(error) throw error;
        console.log(result);
        res.send(result);
    })
})

app.put('/confirm-order-completion/:orderId', (req, res) => {

    const { orderId } = req.body;

    let sql = "UPDATE transactions SET completionConfirmed=1 WHERE id=?";
    reciprocalServicesDatabase.query(sql, [orderId], (error, result) => {
        if(error) throw error;
        console.log(result);
        res.send(result);
    })
})





// INCOMING ORDER ENDPOINTS

//read endpoints

app.post('/get-incoming-orders/:userId', (req, res) => {

    const { providingUserId } = req.body;

    let sql = 'SELECT * FROM transactions WHERE providingUserId = ? AND (transactionOrdered = 1 AND orderConfirmed = 0 AND orderCompleted = 0 AND completionConfirmed = 0)';
    reciprocalServicesDatabase.query(sql, [providingUserId], (error, result) => {
        if(error) throw error;
        console.log("incoming orders" + result);
        res.send(result);
    })
})

app.post('/get-incoming-pending-orders/:userId', (req, res) => {

    const { providingUserId } = req.body;

    let sql = 'SELECT * FROM transactions WHERE providingUserId = ? AND (transactionOrdered = 1 AND orderConfirmed = 1 AND completionConfirmed = 0)';
    reciprocalServicesDatabase.query(sql, [providingUserId], (error, result) => {
        if(error) throw error;
        console.log("pending orders" + result);
        res.send(result);
    })
})

app.post('/get-incoming-completed-orders/:userId', (req, res) => {

    const { providingUserId } = req.body;

    let sql = 'SELECT * FROM transactions WHERE providingUserId = ? AND (transactionOrdered = 1 AND orderConfirmed = 1 AND orderCompleted = 1 AND completionConfirmed = 1)';
    reciprocalServicesDatabase.query(sql, [providingUserId], (error, result) => {
        if(error) throw error;
        console.log("completed orders" + result);
        res.send(result);
    })
})

//





//SERVICE ENDPOINTS

//create endpoints

app.get('/create-service', (req, res) => {

    let sql = "INSERT INTO services (name, description, recommendedCreditsPerHour) VALUES ('Electronics', 'Designing and implementing electrical circuits.', '18')";
    reciprocalServicesDatabase.query(sql, (error, result) => {
        if(error) throw error;
        console.log(result);
        res.send(result);
    })
})

//read endpoints

app.get('/get-superficial-service-details', (req, res) => {

    let sql = "SELECT id, name, description, icon FROM services ORDER BY weeklyOrderCount DESC";
    reciprocalServicesDatabase.query(sql, (error, result) => {
        if(error) throw error;
        console.log(result);
        res.send(result);
    })
})

app.get('/get-all-services', (req, res) => {

    let sql = "SELECT * FROM services ORDER BY weeklyOrderCount DESC";
    reciprocalServicesDatabase.query(sql, (error, result) => {
        if(error) throw error;
        console.log(result);
        res.send(result);
    })
})

app.post('/get-user-specific-services/:userId', (req, res) => {

    const {userId} = req.body;

    let sql = "SELECT * FROM services JOIN serviceProviderRelationship ON services.id = serviceProviderRelationship.serviceId WHERE providerId = ?";

    reciprocalServicesDatabase.query(sql, [userId], (error, result) => {
        if(error) throw error;
        console.log('user specific services' + result);
        res.send(result);
    })
})

app.post('/get-full-service-details/:serviceId', (req, res) => {

    const {serviceId} = req.body

    let sql = "SELECT * FROM services WHERE id = ?";
    reciprocalServicesDatabase.query(sql, [serviceId],(error, result) => {
        if(error) throw error;
        console.log(result[0]);
        res.send(result[0]);
    })
})

app.listen('5000', () => {
    console.log('Server started on port 5000')
});

