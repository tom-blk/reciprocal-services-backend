const express = require('express');
const prometheusDatabase = require('../database/prometheus-db');
const router = express.Router();


//CREATE

router.get('/create-user', (req, res) => {

    const { firstName, lastName, email } = req.body;

    let sql = "INSERT INTO users (firstName, lastName, email, credits, rating) VALUES (?, ?, ?, 100, 0)";
    prometheusDatabase.query(sql, [firstName, lastName, email], (error, result) => {
        if(error) throw error;
        console.log(result);
        res.send(result);
    })
})


//READ

router.post('/get-list', (req, res) => {

    const { userId } = req.body.payload;

    let sql = "SELECT id, firstName, lastName, userName, profilePicture, rating FROM users WHERE id NOT LIKE ?";

    prometheusDatabase.query(sql, [userId], (error, result) => {
        if(error) throw error;
        console.log(result);
        res.send(result);
    })
})

router.post('/get-single-user', (req, res) => {

    const { userId } = req.body.payload;

    let sql = "SELECT firstName, lastName, userName, profilePicture, rating FROM users WHERE id = ?";

    prometheusDatabase.query(sql, [userId], (error, result) => {
        if(error) throw error;
        console.log(result[0]);
        res.send(result[0]);
    })
})

router.post('/get-user-specific-services', (req, res) => {

    const {userId} = req.body.payload;

    let sql = "SELECT * FROM services JOIN serviceProviderRelationship ON services.id = serviceProviderRelationship.serviceId WHERE providerId = ?";

    prometheusDatabase.query(sql, [userId], (error, result) => {
        if(error) throw error;
        console.log('user specific services' + result);
        res.send(result);
    })
})

router.post('/get-service-user-affiliation', (req, res) => {

    const { userId, serviceId } = req.body;

    let sql = "SELECT * FROM serviceProviderRelationship WHERE providerId = ? AND serviceId = ?";

    prometheusDatabase.query(sql, [userId, serviceId], (error, result) => {
        if(error) throw error;
        console.log(userId + ' ' + serviceId);
        if(result.length > 0){
            res.send(true); 
        } else {
            res.send(false); 
        }
    })
})

//UPDATE

router.put('/update-user', (req, res) => {

    const { userId, firstName, lastName, description } = req.body;

    let sql = "UPDATE users SET firstName = ?, lastName = ?, profileDescription = ? WHERE id = ?";
    prometheusDatabase.query(sql, [firstName, lastName, description, userId], (error, result) => {
        if(error) throw error;
        console.log(result);
        res.send(result);
    })
})

router.put('/transfer-credits', (req, res) => {

    const { amount, debitorId, creditorId } = req.body;

    let sql = "UPDATE users SET credits = credits - ? WHERE id = ?; UPDATE users SET credits = credits + ? WHERE id = ?";
    prometheusDatabase.query(sql, [amount, debitorId, amount, creditorId], (error, result) => {
        if(error) throw error;
        console.log(result);
        res.send(result);
    })
})

router.put('/update-user-profile-picture', (req, res) => {

    const { userId, profilePicture } = req.body;

    let sql = "UPDATE users SET profilePicture = ? WHERE id = ?";
    prometheusDatabase.query(sql, [profilePicture, userId], (error, result) => {
        if(error) throw error;
        console.log(result);
        res.send(result);
    })
})

router.put('/rate-user', (req, res) => {

    const {userId, rating} = req.body;

    let getSql = 'SELECT rating, ratingCount FROM users WHERE id = ?';

    let updateSql = 'UPDATE users SET rating = ?, ratingCount = ? WHERE id = ?'; 

    prometheusDatabase.query(getSql, [userId], (error, result) => {
        if(error) throw error;
        console.log(result);
        const newRatingCount = result[0].ratingCount+1;
        const newRating = (result[0].rating * result[0].ratingCount + rating) / newRatingCount;
        prometheusDatabase.query(updateSql, [newRating, newRatingCount, userId], (error, result) => {
            if(error) throw error;
            console.log(result);
            res.send(result);
        })
    })

})

//DELETE

router.post('/remove-service-from-user-services', (req, res) => {

    const { userId, serviceId } = req.body;

    let sql = "DELETE FROM serviceProviderRelationship WHERE providerId = ? AND serviceId = ?";

    prometheusDatabase.query(sql, [userId, serviceId], (error, result) => {
        if(error) throw error;
        console.log('user specific services' + result);
        res.send(result);
    })
})

module.exports = router;