const express = require('express');
const prometheusDatabase = require('../database/prometheus-db');
const router = express.Router();


//CREATE

router.post('/create-service', (req, res) => {

    const { name, description, icon } = req.body;

    let sql = "INSERT INTO services (name, description, icon, recommendedCreditsPerHour, weeklyOrderCount) VALUES (?, ?, ?, 0, 0)";
    prometheusDatabase.query(sql, [name, description, icon], (error, result) => {
        if(error) throw error;
        console.log(result);
        res.send(result);
    })
})

//READ

router.post('/get-service', (req, res) => {

    const {serviceId} = req.body;

    console.log('serviceId: ' + serviceId);

    let sql = "SELECT * FROM services WHERE id = ?";
    prometheusDatabase.query(sql, [serviceId],(error, result) => {
        if(error) throw error;
        console.log(result[0]);
        res.send(result[0]);
    })
})

router.get('/get-list', (req, res) => {

    let sql = "SELECT id, name, description, icon FROM services ORDER BY weeklyOrderCount DESC";

    prometheusDatabase.query(sql, (error, result) => {
        if(error) throw error;
        res.send(result);
    })
})

router.get('/get-trending-services', (req, res) => {

    let sql = "SELECT id, name, description, icon FROM services ORDER BY weeklyOrderCount DESC LIMIT 3";
    prometheusDatabase.query(sql, (error, result) => {
        if(error) throw error;
        console.log(result);
        res.send(result);
    })
})

router.post('/get-service-specific-users', (req, res) => {

    const {serviceId} = req.body;

    let selectUsersSql = "SELECT id, userName, firstName, lastName, email, profileDescription, profilePicture, rating, ratingCount, serviceId, creditsPerHour FROM (SELECT * FROM users LEFT JOIN serviceProviderRelationship ON users.id = serviceProviderRelationship.providerId UNION SELECT * FROM users RIGHT JOIN serviceProviderRelationship ON users.id = serviceProviderRelationship.providerId) serviceProviders WHERE serviceId = ? ORDER BY rating DESC";

    prometheusDatabase.query(selectUsersSql, [serviceId], (error, result) => {
        if(error) throw error;
        console.log(result);

        res.send(result);
    })
})

router.post('/get-service-provider-count', (req, res) => {

    const {serviceId} = req.body;

    let sql = "SELECT COUNT(providerId) FROM serviceProviderRelationship WHERE serviceId = ?";
    prometheusDatabase.query(sql, [serviceId], (error, result) => {
        if(error) throw error;
        console.log(Object.values(result[0])[0]);

        let countedValue = Object.values(result[0])[0];

        res.send({providerCount: countedValue});
    })
})

module.exports = router;