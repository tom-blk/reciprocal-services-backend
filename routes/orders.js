const express = require('express');
const router = express.Router();
const prometheusDatabase = require('../database/prometheus-db');

//CREATE

router.post('/create-order', (req, res) => {

    const {serviceId, providingUserId, receivingUserId, dateIssued, message} = req.body;

    console.log(`Request Body: ${serviceId, providingUserId, receivingUserId}`);

    let sqlCreateOrder = "INSERT INTO orders (serviceId, providingUserId, receivingUserId, dateIssued, message, status) VALUES (?, ?, ?, ?, ?, 1)";

    let sqlUpdateWeeklyOrderCount = "UPDATE services SET weeklyOrderCount = weeklyOrderCount + 1 WHERE id = ?";

    prometheusDatabase.query(sqlCreateOrder, [serviceId, providingUserId, receivingUserId, dateIssued, message], (error, result) => {
        if(error) throw error;
        console.log(`Result: ${result}`);
    })

    prometheusDatabase.query(sqlUpdateWeeklyOrderCount, [serviceId], (error, result) => {
        if(error) throw error;
        console.log(`Result: ${result}`);
        res.send(result);
    })
})

//READ

router.post('/get-single-order', (req, res) => {

    const { orderId } = req.body;

    let sql = 'SELECT * FROM orders WHERE id = ?';
    prometheusDatabase.query(sql, [orderId], (error, result) => {
    if(error) throw error;
    console.log(result);
    res.send(result[0]);
    })

})

router.post('/get-all-orders', async (req, res) => {

    const { orderDirection, userId } = req.body;

    const allOrders = {
        new: [],
        accepted: [],
        fulfilled: [],
        completed: [],
        denied: []
    }

    if(orderDirection === 'outgoing'){
        let sql = 'SELECT * FROM orders WHERE receivingUserId = ? AND status = 1; SELECT * FROM orders WHERE receivingUserId = ? AND status = 2; SELECT * FROM orders WHERE receivingUserId = ? AND status = 3; SELECT * FROM orders WHERE receivingUserId = ? AND status = 4; SELECT * FROM orders WHERE receivingUserId = ? AND status = 5;';

        prometheusDatabase.query(sql, [userId, userId, userId, userId, userId], (error, result) => {
            if(error) throw error;
            console.log("order outgoing" + result);
            allOrders.new = result[0];
            allOrders.accepted = result[1];
            allOrders.fulfilled = result[2];
            allOrders.completed = result[3];
            allOrders.denied = result[4];
            res.send(allOrders);
        })
    }

    if(orderDirection === 'incoming'){
        let sql = 'SELECT * FROM orders WHERE providingUserId = ? AND status = 1; SELECT * FROM orders WHERE providingUserId = ? AND status = 2; SELECT * FROM orders WHERE providingUserId = ? AND status = 3; SELECT * FROM orders WHERE providingUserId = ? AND status = 4; SELECT * FROM orders WHERE providingUserId = ? AND status = 5;';

        prometheusDatabase.query(sql, [userId, userId, userId, userId, userId], (error, result) => {
            if(error) throw error;
            console.log("order incoming" + result);
            allOrders.new = result[0];
            allOrders.accepted = result[1];
            allOrders.fulfilled = result[2];
            allOrders.completed = result[3];
            allOrders.denied = result[4];
            res.send(allOrders);
        })
    }
})

router.post('/get-orders-with-specific-status-and-direction', (req, res) => {

    const {orderDirection, status, userId} = req.body;

    if(orderDirection === 'outgoing'){
        let sql = 'SELECT * FROM orders WHERE receivingUserId = ? AND status = ?';
        prometheusDatabase.query(sql, [userId, status], (error, result) => {
        if(error) throw error;
        console.log("actionable outgoing orders" + result);
        res.send(result);
        })
    }
    if(orderDirection === 'incoming'){
        let sql = 'SELECT * FROM orders WHERE providingUserId = ? AND status = ?';
        prometheusDatabase.query(sql, [userId, status], (error, result) => {
        if(error) throw error;
        console.log("actionable incoming orders" + result);
        res.send(result);
        })
    }
})

//UPDATE

router.put('/modify-order-status', (req, res) => {

    const {status, orderId } = req.body;

    console.log('Order status: ' + status + ', Order id: ' + orderId);

    let sql = "UPDATE orders SET status = ? WHERE id = ?";
    prometheusDatabase.query(sql, [status, orderId], (error, result) => {
        if(error) throw error;
        console.log(result);
        res.send(result);
    })
})

router.put('/transfer-credits', (req, res) => {

    const { numberOfCredits, senderId, recipientId } = req.body;

    let sql = 'SELECT credits FROM users WHERE id = ?';

    prometheusDatabase.query(sql, [recipientId], (error, result) => {
        if(error) throw error;
        if(result < 100){

            let newTotalCredits = result+numberOfCredits;
            let sql = 'UPDATE users SET credits = ? WHERE id = ?';

            prometheusDatabase.query(sql, [newTotalCredits, recipientId], (error, result) => {
                if(error) throw error;
                res.send(result);
            })
        }else{
            let sql = 'UPDATE users SET credits = credits - ? WHERE id = ?; UPDATE users SET credits = credits + ? WHERE id = ?';

            prometheusDatabase.query(sql, [numberOfCredits, senderId, numberOfCredits, recipientId], (error, result) => {
                if(error) throw error;
                res.send(result);
            })
        }
    })
})

router.put('/specify-hours-provided', (req, res) => {

    const { orderId, hoursProvided } = req.body;

    let sql = "UPDATE orders SET hoursProvided = ? WHERE id = ?";
    prometheusDatabase.query(sql, [hoursProvided, orderId], (error, result) => {
        if(error) throw error;
        console.log(result);
        res.send(result);
    })
})

//INCOMING

//READ

router.post('/get-incoming-orders', (req, res) => {

    const { providingUserId } = req.body;

    let sql = 'SELECT * FROM orders WHERE providingUserId = ? AND (transactionOrdered = 1 AND orderConfirmed = 0 AND orderCompleted = 0 AND completionConfirmed = 0)';
    prometheusDatabase.query(sql, [providingUserId], (error, result) => {
        if(error) throw error;
        console.log("incoming orders" + result);
        res.send(result);
    })
})

router.post('/get-incoming-pending-orders', (req, res) => {

    const { providingUserId } = req.body;

    let sql = 'SELECT * FROM orders WHERE providingUserId = ? AND (transactionOrdered = 1 AND orderConfirmed = 1 AND completionConfirmed = 0)';
    prometheusDatabase.query(sql, [providingUserId], (error, result) => {
        if(error) throw error;
        console.log("pending orders" + result);
        res.send(result);
    })
})

router.post('/get-incoming-completed-orders', (req, res) => {

    const { providingUserId } = req.body;

    let sql = 'SELECT * FROM orders WHERE providingUserId = ? AND (transactionOrdered = 1 AND orderConfirmed = 1 AND orderCompleted = 1 AND completionConfirmed = 1)';
    prometheusDatabase.query(sql, [providingUserId], (error, result) => {
        if(error) throw error;
        console.log("completed orders" + result);
        res.send(result);
    })
})

module.exports = router;