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


//TRANSACTION ENDPONTS

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

//fetching endpoints

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

app.get('/complete-transaction', (req, res) => {

    const transactionId = req.params.id; 

    let sql = "UPDATE transactions SET completed=1 WHERE id=?";
    reciprocalServicesDatabase.query(sql, transactionId, (error, result) => {
        if(error) throw error;
        console.log(result);
        res.send(result);
    })
})

//SERVICE ENDPOINTS

//creation endpoints

app.get('/create-service', (req, res) => {

    let sql = "INSERT INTO services (name, description, recommendedCreditsPerHour) VALUES ('Electronics', 'Designing and implementing electrical circuits.', '18')";
    reciprocalServicesDatabase.query(sql, (error, result) => {
        if(error) throw error;
        console.log(result);
        res.send(result);
    })
})

//fetching endpoints

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

