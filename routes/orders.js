const express = require('express');
const router = express.Router();
const prometheusDatabase = require('../database/prometheus-db');

//CREATE

router.post('/create-order', (req, res) => {

    const {serviceId, providingUserId, receivingUserId, creditsPerHour, dateIssued, message} = req.body;


    console.log(`Request Body: ${serviceId, providingUserId, receivingUserId}`);

    let sqlCreateOrder = "INSERT INTO orders (serviceId, providingUserId, receivingUserId, dateIssued, message, status, creditsPerHour) VALUES (?, ?, ?, ?, ?, 1, ?)";

    let sqlUpdateWeeklyOrderCount = "UPDATE services SET weeklyOrderCount = weeklyOrderCount + 1 WHERE id = ?";

    prometheusDatabase.query(sqlCreateOrder, [serviceId, providingUserId, receivingUserId, dateIssued, message, creditsPerHour], (error, result) => {
        if(error){
            console.log(error)
            res.status(500).send(error)
            return
        }
        prometheusDatabase.query(sqlUpdateWeeklyOrderCount, [serviceId], (error, result) => {
            if(error){
                console.log(error)
                res.status(500).send(error)
            }else{
                res.status(200).send({message: 'Order Successfully Placed!'})
            }
        })
    })
})

//READ

router.post('/get-single-order', (req, res) => {

    const { orderId } = req.body;

    let sql = 'SELECT * FROM orders WHERE id = ?';
    prometheusDatabase.query(sql, [orderId], (error, result) => {
    if(error){
        console.log(error)
        res.status(500).send(`Error getting order ${orderId}.`)
    } else {
        res.send(result[0]);
    }
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
            if(error){
                console.log(error)
                res.status(500).send('Error getting outgoing orders.')
            } else {
                allOrders.new = result[0];
                allOrders.accepted = result[1];
                allOrders.fulfilled = result[2];
                allOrders.completed = result[3];
                allOrders.denied = result[4];
                res.send(allOrders);
            }
        })
    }

    if(orderDirection === 'incoming'){
        let sql = 'SELECT * FROM orders WHERE providingUserId = ? AND status = 1; SELECT * FROM orders WHERE providingUserId = ? AND status = 2; SELECT * FROM orders WHERE providingUserId = ? AND status = 3; SELECT * FROM orders WHERE providingUserId = ? AND status = 4; SELECT * FROM orders WHERE providingUserId = ? AND status = 5;';

        prometheusDatabase.query(sql, [userId, userId, userId, userId, userId], (error, result) => {
            if(error){
                console.log(error)
                res.status(500).send('Error getting incoming orders.')
            } else {
                allOrders.new = result[0];
                allOrders.accepted = result[1];
                allOrders.fulfilled = result[2];
                allOrders.completed = result[3];
                allOrders.denied = result[4];
                res.send(allOrders);
            }  
        })
    }
})

router.post('/get-orders-with-specific-status-and-direction', (req, res) => {

    const {orderDirection, status, userId} = req.body;

    if(orderDirection === 'outgoing'){
        let sql = 'SELECT * FROM orders WHERE receivingUserId = ? AND status = ?';
        prometheusDatabase.query(sql, [userId, status], (error, result) => {
            if(error){
                console.log(error)
                res.status(500).send('Error getting outgoing orders.')
            } else {
                res.send(result);
            }  
        })
    }
    if(orderDirection === 'incoming'){
        let sql = 'SELECT * FROM orders WHERE providingUserId = ? AND status = ?';
        prometheusDatabase.query(sql, [userId, status], (error, result) => {
            if(error){
                console.log(error)
                res.status(500).send('Error getting incoming orders.')
            } else {
                res.send(result);
            }
        })
    }
})

//UPDATE

router.put('/modify-order-status', (req, res) => {

    const {status, orderId } = req.body;

    console.log('Order status: ' + status + ', Order id: ' + orderId);

    let sql = "UPDATE orders SET status = ? WHERE id = ?";
    prometheusDatabase.query(sql, [status, orderId], (error) => {
        if(error){
            console.log(error)
            res.status(500).send(`Error updating order ${orderId}.`)
        } else {
            res.status(200).send({message: 'Order Successfully Updated!'});
        }
    })
})

router.put('/specify-provided-hours', (req, res) => {

    const { orderId, hoursProvided } = req.body;

    let sql = "UPDATE orders SET hoursProvided = ? WHERE id = ?";
    prometheusDatabase.query(sql, [hoursProvided, orderId], (error) => {
        if(error){
            console.log(error)
            res.status(500).send(`Error updating order ${orderId}.`)
        } else {
            res.status(200).send({message: 'Provided Hours Successfully Updated!'});
        }
    })
})

router.put('/confirm-order-completion-rate-user-and-transfer-credits', (req, res) => {

    const { dateCompleted, orderId, recipientId, senderId, numberOfCredits, rating } = req.body;

    console.log(rating);

    let sql = 'UPDATE orders SET status = 4, dateCompleted = ? WHERE id = ?; UPDATE users SET rating = (rating*ratingCount+?)/(ratingCount+1), ratingCount = ratingCount+1 WHERE id = ?; UPDATE users SET credits = credits - ? WHERE id = ?; UPDATE users SET credits = credits + ? WHERE id = ?';

    prometheusDatabase.query(sql, [dateCompleted, orderId, rating, recipientId, numberOfCredits, senderId, numberOfCredits, recipientId], (error, result) => {
        if(error){
            console.log(error)
            res.status(500).send(`Error updating order ${orderId}.`)
        } else {
            res.status(200).send({message: `The Provider Was Rated With ${rating} Stars And Paid ${numberOfCredits} Credits, The Order Is Now Complete!`});
        }
    })
})

module.exports = router;