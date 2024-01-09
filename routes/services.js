const express = require('express');
const prometheusDatabase = require('../database/prometheus-db');
const router = express.Router();
const fs = require('fs');
const multer = require('multer');

//CREATE
let multerFileNamePlaceholder = undefined;

const storageServicePicture = multer.diskStorage({
    destination: function (req, file, cb){ 
        console.log(file);
        cb(null, 'uploads/service-pictures');
    },
    filename: function (req, file, cb){
        
        multerFileNamePlaceholder = `service-picture-${new Date().getTime()}.png`

        cb(null, multerFileNamePlaceholder);
    }
})

const uploadServicePicture = multer({storage: storageServicePicture})

router.post('/create-service', uploadServicePicture.single('picture'), (req, res) => {

    console.log(req.body);

    const {name, description, userId, creditsPerHour} = req.body;

    const createServiceAndReturnServiceIdSql = "INSERT INTO services (name, description, recommendedCreditsPerHour, weeklyOrderCount) VALUES (?, ?, 0, 0); SELECT LAST_INSERT_ID() AS serviceId";

    const addToUserServicesSql = "INSERT INTO serviceProviderRelationship (providerId, serviceId, creditsPerHour) VALUES (?, ?, ?)";

    prometheusDatabase.query(createServiceAndReturnServiceIdSql, [name, description], (error, result) => {
        console.log(error);
        if(error) throw error;

        const serviceId = result[1][0].serviceId;

        if(fs.existsSync(`uploads/service-pictures/${multerFileNamePlaceholder}`)){
        fs.rename(`uploads/service-pictures/${multerFileNamePlaceholder}`, `uploads/service-pictures/service-${serviceId}-service-picture.png`, (error) => {
            if(error){
                fs.unlink('uploads/service-pictures/picture.png', (error) => {console.log(error)})
                console.log(error);
                res.status(500).send("Error updating the service picture.")
            }
        }) } else {
            console.log("Mf doesn't exist")
        }

        console.log(userId, creditsPerHour)

        if(userId === "undefined" || creditsPerHour === "undefined"){ //! The req.body originally transported formData to Multer, which apparently forces the original undefined to become 'undefined', resulting in equation to true
            res.status(200).send({successMessage: `Service ${name} Successfully Created!`})
        } else {
            console.log("sth wrong")
            prometheusDatabase.query(addToUserServicesSql, [userId, serviceId, creditsPerHour], (error2, result2) => {
                console.log(error2);
                if(error2) throw error2;
                console.log(result2);
                res.status(200).send({successMessage: `Service ${name} Successfully Created and Added to Your Services!`})
            })
        }
    })
})

router.post('/create-service-and-add-to-user-services', (req, res) => {

    const { name, description, userId, creditsPerHour } = req.body;

    console.log(`Credits per hour: ${creditsPerHour}`)

    let createServiceSql = "INSERT INTO services (name, description, recommendedCreditsPerHour, weeklyOrderCount) VALUES (?, ?, 0, 0)";

    let addToUserServicesSql = "INSERT INTO serviceProviderRelationship (providerId, serviceId, creditsPerHour) VALUES (?, ?, ?)";

    prometheusDatabase.query(createServiceSql, [name, description], (error, result) => {
        if(error) throw error;
        console.log(result);
        prometheusDatabase.query(addToUserServicesSql, [userId, result.insertId, creditsPerHour], (error2, result2) => {
            if(error2) throw error2;
            console.log(result2);
            res.status(200).send({successMessage: `Service ${name} Successfully Created and Added to Your Services !`});
        })
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

router.post('/get-average-credits-per-hour', (req, res) => {

    const {serviceId, country, postCode} = req.body;

    console.log('country: ' + country);

    let sql = "SELECT AVG(creditsPerHour) FROM (SELECT * FROM users LEFT JOIN serviceProviderRelationship ON users.id = serviceProviderRelationship.providerId UNION SELECT * FROM users RIGHT JOIN serviceProviderRelationship ON users.id = serviceProviderRelationship.providerId) serviceProviders WHERE serviceId = ? AND country = ? AND postCode = ?";
    prometheusDatabase.query(sql, [serviceId, country, postCode],(error, result) => {
        if(error) throw error;
        console.log(result[0]);
        res.send(Object.values(result[0])[0]);
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

router.post('/get-local-service-specific-users', (req, res) => {

    const { serviceId, country, postCode, userId } = req.body;

    let selectUsersSql = "SELECT id, userName, firstName, lastName, email, profileDescription, profilePicture, rating, ratingCount, serviceId, creditsPerHour FROM (SELECT * FROM users LEFT JOIN serviceProviderRelationship ON users.id = serviceProviderRelationship.providerId UNION SELECT * FROM users RIGHT JOIN serviceProviderRelationship ON users.id = serviceProviderRelationship.providerId) serviceProviders WHERE serviceId = ? AND country = ? AND postCode = ? AND id NOT LIKE ? ORDER BY rating DESC";

    prometheusDatabase.query(selectUsersSql, [serviceId, country, postCode, userId], (error, result) => {
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

router.post('/get-local-service-provider-count', (req, res) => {

    const {serviceId, country, postCode, userId} = req.body;

    let sql = "SELECT COUNT(providerId) FROM (SELECT * FROM users LEFT JOIN serviceProviderRelationship ON users.id = serviceProviderRelationship.providerId UNION SELECT * FROM users RIGHT JOIN serviceProviderRelationship ON users.id = serviceProviderRelationship.providerId) serviceProviders WHERE serviceId = ? AND country = ? AND postCode = ? AND id NOT LIKE ?";

    prometheusDatabase.query(sql, [serviceId, country, postCode, userId], (error, result) => {
        if(error) throw error;
        console.log(Object.values(result[0])[0]);

        let countedValue = Object.values(result[0])[0];

        res.send({providerCount: countedValue});
    })
})

module.exports = router;