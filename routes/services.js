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

router.get('/get-list', (req, res) => {

    let sql = "SELECT id, name, description, icon FROM services ORDER BY weeklyOrderCount DESC";
    prometheusDatabase.query(sql, (error, result) => {
        if(error) throw error;
        console.log(result);
        res.send(result);
    })
})

router.post('/get-service-specific-users', (req, res) => {

    const {serviceId} = req.body;

    let selectUsersSql = "SELECT * FROM users WHERE id IN (SELECT providerId FROM serviceProviderRelationship WHERE serviceId = ?)";

    prometheusDatabase.query(selectUsersSql, [serviceId], (error, result) => {
        if(error) throw error;
        console.log(result);

        res.send(result);
    })
})

router.post('/get-service-provider-count', (req, res) => {

    const {serviceId} = req.body

    let sql = "SELECT COUNT(providerId) FROM serviceProviderRelationship WHERE serviceId = ?";
    prometheusDatabase.query(sql, [serviceId], (error, result) => {
        if(error) throw error;
        console.log(Object.values(result[0])[0]);

        let countedValue = Object.values(result[0])[0];

        res.send({providerCount: countedValue});
    })
})

router.get('/get-all-services', (req, res) => {

    let sql = "SELECT * FROM services ORDER BY weeklyOrderCount DESC";
    prometheusDatabase.query(sql, (error, result) => {
        if(error) throw error;
        console.log(result);
        res.send(result);
    })
})

router.post('/add-service-to-user-services', (req, res) => {

    const { userId, serviceId } = req.body;

    let sql = "INSERT INTO serviceProviderRelationship (providerId, serviceId) VALUES (?, ?)";

    prometheusDatabase.query(sql, [userId, serviceId], (error, result) => {
        if(error) throw error;
        console.log('user specific services' + result);
        res.send(result);
    })
})

router.post('/get-service/:serviceId', (req, res) => {

    const {serviceId} = req.body

    let sql = "SELECT * FROM services WHERE id = ?";
    prometheusDatabase.query(sql, [serviceId],(error, result) => {
        if(error) throw error;
        console.log(result[0]);
        res.send(result[0]);
    })
})

router.get('/get-trending-services', (req, res) => {

    let sql = "SELECT * FROM services ORDER BY weeklyOrderCount DESC LIMIT 3";
    prometheusDatabase.query(sql, (error, result) => {
        if(error) throw error;
        console.log(result);
        res.send(result);
    })
})

//UPDATE


router.post('/update-user-specific-services', (req, res) => {

    const {userId, serviceIdsToBeAdded, serviceIdsToBeRemoved} = req.body;

    let postNewServiceSql = "INSERT INTO serviceProviderRelationship (providerId, serviceId) VALUES (?, ?)"

    let deleteOldServiceSql = "DELETE FROM serviceProviderRelationship WHERE providerId = ? AND serviceId = ?"

    serviceIdsToBeAdded.forEach(id => {
        prometheusDatabase.query(postNewServiceSql, [userId, id], (error, result) => {
            if(error) throw error;
            console.log(result);
        })
    })

    serviceIdsToBeRemoved.forEach(id => {
        prometheusDatabase.query(deleteOldServiceSql, [userId, id], (error, result) => {
            if(error) throw error;
            console.log(result);
        })
    })

    res.send('Services Successfully Updated!')
})

module.exports = router;