const express = require('express');
const prometheusDatabase = require('../database/prometheus-db');
const router = express.Router();


//CREATE 


router.get('/create-user', (req, res) => {

    const { firstName, lastName, email } = req.body;

    let sql = "INSERT INTO users (firstName, lastName, email, credits, rating, travellingForOrders) VALUES (?, ?, ?, 100, 0, 0)";
    prometheusDatabase.query(sql, [firstName, lastName, email], (error, result) => {
        if(error) throw error;
        console.log(result);
        res.status(200).send({successMessage: 'Account Successfully Created'});
    })
})


//READ

router.post('/get-list', (req, res) => {

    const { userId } = req.body;

    let sql = "SELECT id, firstName, lastName, userName, profilePicture, rating, ratingCount, country, postCode, city, travellingForOrders FROM users WHERE id NOT LIKE ?";

    prometheusDatabase.query(sql, [userId], (error, result) => {
        if(error) throw error;
        console.log(result);
        res.send(result);
    })
})

router.post('/get-users-in-location', (req, res) => {

    const { userId, countryId, postCode } = req.body;

    let sql = "SELECT id, firstName, lastName, userName, profilePicture, rating, ratingCount, country, postCode, city, travellingForOrders FROM users WHERE id NOT LIKE ? AND country = ? AND postCode = ?";

    prometheusDatabase.query(sql, [userId, countryId, postCode], (error, result) => {
        if(error) throw error;
        console.log(result);
        res.send(result);
    })
})

router.post('/get-single-user', (req, res) => {

    const { userId } = req.body;

    let sql = "SELECT id, firstName, lastName, userName, profilePicture, profileDescription, rating, ratingCount, country, postCode, city, travellingForOrders FROM users WHERE id = ?";

    prometheusDatabase.query(sql, [userId], (error, result) => {
        if(error) throw error;
        console.log(result[0]);
        res.send(result[0]);
    })
})

router.post('/get-user-country', (req, res) => {

    const { countryId } = req.body;

    let sql = "SELECT name FROM countries WHERE id = ?";

    prometheusDatabase.query(sql, [countryId], (error, result) => {
        if(error) throw error;
        console.log(result[0]);
        res.send(result[0]);
    })
})

router.post('/get-user-specific-services', (req, res) => {

    const {userId} = req.body;

    let sql = "SELECT * FROM (SELECT * FROM services LEFT JOIN serviceProviderRelationship ON services.id = serviceProviderRelationship.serviceId UNION SELECT * FROM services RIGHT JOIN serviceProviderRelationship ON services.id = serviceProviderRelationship.serviceId) userServices WHERE providerId = ? ORDER BY name ASC";

    prometheusDatabase.query(sql, [userId, userId], (error, result) => {
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

    const { userId, firstName, lastName, description, country, postCode, city, travellingForOrders } = req.body;

    let sql = "UPDATE users SET firstName = ?, lastName = ?, profileDescription = ?, country = ?, postCode = ?, city = ?, travellingForOrders = ? WHERE id = ?";
    prometheusDatabase.query(sql, [firstName, lastName, description, country, postCode, city, travellingForOrders, userId], (error, result) => {
        if(error) throw error;
        console.log(result);
        res.status(200).send({successMessage: 'Profile Successfully Updated!'});
    })
})

router.put('/transfer-credits', (req, res) => {

    const { amount, debitorId, creditorId } = req.body;

    let sql = "UPDATE users SET credits = credits - ? WHERE id = ?; UPDATE users SET credits = credits + ? WHERE id = ?";
    prometheusDatabase.query(sql, [amount, debitorId, amount, creditorId], (error, result) => {
        if(error) throw error;
        console.log(result);
        res.status(200).send({successMessage: 'Embers Successfully Transferred!'});
    })
})

router.put('/update-profile-picture', (req, res) => {

    const { userId, profilePicture } = req.body;

    let sql = "UPDATE users SET profilePicture = ? WHERE id = ?";
    prometheusDatabase.query(sql, [profilePicture, userId], (error, result) => {
        if(error) throw error;
        console.log(result);
        res.status(200).send({successMessage: 'Profile Picture Successfully Updated!'});
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
            res.status(200).send({successMessage: 'User Successfully Rated!'});
        })
    })

})

router.post('/add-service-to-user-services', (req, res) => {

    const { userId, serviceId, creditsPerHour } = req.body;

    let sql = "INSERT INTO serviceProviderRelationship (providerId, serviceId, creditsPerHour) VALUES (?, ?, ?)";

    prometheusDatabase.query(sql, [userId, serviceId, creditsPerHour], (error, result) => {
        if(error) throw error;
        console.log('user specific services' + result);
        res.status(200).send({successMessage: 'Service Successfully Added!'});
    })
})

router.post('/update-user-services', (req, res) => {

    const {userId, servicesToBeChanged} = req.body;

    let postNewServiceSql = "INSERT INTO serviceProviderRelationship (providerId, serviceId) VALUES (?, ?)"

    let deleteOldServiceSql = "DELETE FROM serviceProviderRelationship WHERE providerId = ? AND serviceId = ?"

    let updateEmbersPerHourSql = "UPDATE serviceProviderRelationship SET creditsPerHour = ? WHERE providerId = ? AND serviceId = ?"

    if(servicesToBeChanged)
    servicesToBeChanged.forEach(service => {
        if(service.isSelected)
        prometheusDatabase.query(postNewServiceSql, [userId, service.id], (error, result) => {
            if(error) throw error;
            console.log(result);
        })

        if(!service.isSelected)
        prometheusDatabase.query(deleteOldServiceSql, [userId, service.id], (error, result) => {
            if(error) throw error;
            console.log(result);
        })

        if(service.embersPerHourChanged)
        prometheusDatabase.query(updateEmbersPerHourSql, [service.embersPerHour, userId, service.id], (error, result) => {
            if(error) throw error;
            console.log(result);
        })
    })

    res.status(200).send({successMessage: 'Services Successfully Updated!'});
})

router.put('/update-embers-per-hour', (req, res) => {

    const {userId, serviceId, embersPerHour} = req.body;

    let postNewServiceSql = "UPDATE serviceProviderRelationship SET creditsPerHour = ? WHERE providerId = ? AND serviceId = ?"

    prometheusDatabase.query(postNewServiceSql, [embersPerHour, userId, serviceId], (error, result) => {
        if(error) throw error;
        console.log(result);
        res.status(200).send({successMessage: 'Embers Per Hour Successfully Updated!'});
    })
})

//DELETE

router.post('/remove-service-from-user-services', (req, res) => {

    const { userId, serviceId } = req.body;

    let sql = "DELETE FROM serviceProviderRelationship WHERE providerId = ? AND serviceId = ?";

    prometheusDatabase.query(sql, [userId, serviceId], (error, result) => {
        if(error) throw error;
        console.log('user specific services' + result);
        res.status(200).send({successMessage: 'Service Successfully Updated!'});
    })
})

module.exports = router;