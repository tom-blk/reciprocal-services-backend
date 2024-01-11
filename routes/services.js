const express = require('express');
const prometheusDatabase = require('../database/prometheus-db');
const router = express.Router();
const fs = require('fs');
const multer = require('multer');

//CREATE
const storageServicePicture = multer.diskStorage({
    destination: function (req, file, cb){ 
        cb(null, 'uploads/service-pictures');
    },
    filename: function (req, file, cb){
        cb(null, `service-picture${new Date().getTime()}.png`);
    }
})

const uploadServicePicture = multer({storage: storageServicePicture})

router.post('/create-service', uploadServicePicture.single('picture'), (req, res) => {

    const {name, description, userId, creditsPerHour} = req.body;

    let imgError = false;

    //!Check if all needed data is there
    for (const entry in req.body){
        if(req.body[entry] === 'undefined'){ //!See lower comment for information on why this is a string
            console.log(`Optional parameter ${entry} is missing in req.body in '/create-service`)
        }
    }

    const returnConditionalSqlBasedOnIcon = () => {
        if(req.file){
            return 'INSERT INTO services (name, description, icon, recommendedCreditsPerHour, weeklyOrderCount) VALUES (?, ?, 1, 0, 0); SELECT LAST_INSERT_ID() AS serviceId';
        }else{
            return 'INSERT INTO services (name, description, recommendedCreditsPerHour, weeklyOrderCount) VALUES (?, ?, 0, 0); SELECT LAST_INSERT_ID() AS serviceId';
        }
    }

    const assertIcon = () => {
        if(req.file){
            return [name, description, 1]
        }else{
            return [name, description]
        }
    }

    const addToUserServicesSql = "INSERT INTO serviceProviderRelationship (providerId, serviceId, creditsPerHour) VALUES (?, ?, ?)";

    prometheusDatabase.query(returnConditionalSqlBasedOnIcon(), assertIcon(), (error, result) => {
        if(error){
            console.log(error)
            res.status(500).send("Error creating service, please try again later.")
            return
        } else {

            const serviceId = result[1][0].serviceId;

            const removeServiceInCaseOfImageErrorSql = `DELETE FROM services WHERE id=?;`

            if(req.file){
                fs.rename(req.file.path, `uploads/service-pictures/service-${serviceId}-service-picture.png`, (error) => {
                    if(error){
                        console.log(error);
                        imgError = true;
                        fs.unlink(req.file.path, (error) => {console.log(error)})
                        prometheusDatabase.query(removeServiceInCaseOfImageErrorSql, [ serviceId], (error2, result2) => {
                            if(error2)
                                console.log(error2)
                        })
                        res.status(500).send("Error uploading the service picture, please try creating the service again.")
                    }
                }    
            )}

            if(imgError)
            return
    
            if(userId === "undefined" || creditsPerHour === "undefined"){ //! The req.body originally transported formData to Multer, which apparently forces the original undefined to become 'undefined', resulting in equation to true
                res.send({successMessage: `Service ${name} Successfully Created!`})
            } else {
                prometheusDatabase.query(addToUserServicesSql, [userId, serviceId, creditsPerHour], (error3, result3) => {
                    if(error3){
                        console.log(error3)
                        res.status(500).send('Error adding the service to your services, please do it manually by editing your profile.')
                    } else {
                        res.send({successMessage: `Service ${name} Successfully Created and Added to Your Services!`})
                    }
                })
            }
        }     
    })
})

//READ

router.post('/get-service', (req, res) => {

    const {serviceId} = req.body;

    let sql = "SELECT * FROM services WHERE id = ?";
    prometheusDatabase.query(sql, [serviceId],(error, result) => {
        if(error){
            console.log(error)
            res.status(404).send(`Error while getting service ${serviceId}.`)
        } else {
            res.send(result[0]);
        }
    })
})

router.post('/get-average-credits-per-hour', (req, res) => {

    const {serviceId, country, postCode} = req.body;

    let sql = "SELECT AVG(creditsPerHour) FROM (SELECT * FROM users LEFT JOIN serviceProviderRelationship ON users.id = serviceProviderRelationship.providerId UNION SELECT * FROM users RIGHT JOIN serviceProviderRelationship ON users.id = serviceProviderRelationship.providerId) serviceProviders WHERE serviceId = ? AND country = ? AND postCode = ?";
    prometheusDatabase.query(sql, [serviceId, country, postCode],(error, result) => {
        if(error){
            console.log(error)
            res.status(404).send(`Error while getting the average embers per hour for service ${serviceId}.`)
        } else {
            res.send(Object.values(result[0])[0]);
        }   
    })
})

router.get('/get-list', (req, res) => {

    let sql = "SELECT id, name, description, icon FROM services ORDER BY weeklyOrderCount DESC";

    prometheusDatabase.query(sql, (error, result) => {
        if(error){
            console.log(error)
            res.status(500).send(`Error while getting all services.`)
        } else {
            res.send(result);
        }   
    })
})

router.get('/get-trending-services', (req, res) => {

    let sql = "SELECT id, name, description, icon FROM services ORDER BY weeklyOrderCount DESC LIMIT 3";
    prometheusDatabase.query(sql, (error, result) => {
        if(error){
            console.log(error)
            res.status(500).send(`Error while getting trending services.`)
        } else {
            res.send(result);
        }
    })
})

router.post('/get-service-specific-users', (req, res) => {

    const {serviceId} = req.body;

    let selectUsersSql = "SELECT id, userName, firstName, lastName, email, profileDescription, profilePicture, rating, ratingCount, serviceId, creditsPerHour FROM (SELECT * FROM users LEFT JOIN serviceProviderRelationship ON users.id = serviceProviderRelationship.providerId UNION SELECT * FROM users RIGHT JOIN serviceProviderRelationship ON users.id = serviceProviderRelationship.providerId) serviceProviders WHERE serviceId = ? ORDER BY rating DESC";

    prometheusDatabase.query(selectUsersSql, [serviceId], (error, result) => {
        if(error){
            console.log(error)
            res.status(500).send(`Error while getting users that offer this service.`)
        } else {
            res.send(result);
        }
    })
})

router.post('/get-local-service-specific-users', (req, res) => {

    const { serviceId, country, postCode, userId } = req.body;

    let selectUsersSql = "SELECT id, userName, firstName, lastName, email, profileDescription, profilePicture, rating, ratingCount, serviceId, creditsPerHour FROM (SELECT * FROM users LEFT JOIN serviceProviderRelationship ON users.id = serviceProviderRelationship.providerId UNION SELECT * FROM users RIGHT JOIN serviceProviderRelationship ON users.id = serviceProviderRelationship.providerId) serviceProviders WHERE serviceId = ? AND country = ? AND postCode = ? AND id NOT LIKE ? ORDER BY rating DESC";

    prometheusDatabase.query(selectUsersSql, [serviceId, country, postCode, userId], (error, result) => {
        if(error){
            console.log(error)
            res.status(500).send(`Error while getting users that offer this service in this area.`)
        } else {
            res.send(result);
        }
    })
})

router.post('/get-service-provider-count', (req, res) => {

    const {serviceId} = req.body;

    let sql = "SELECT COUNT(providerId) FROM serviceProviderRelationship WHERE serviceId = ?";
    prometheusDatabase.query(sql, [serviceId], (error, result) => {
        if(error){
            console.log(error)
            res.status(500).send(`Error while getting number users that offer service ${serviceId}.`)
        } else {
            let countedValue = Object.values(result[0])[0];
            res.send({providerCount: countedValue});
        }   
    })
})

router.post('/get-local-service-provider-count', (req, res) => {

    const {serviceId, country, postCode, userId} = req.body;

    let sql = "SELECT COUNT(providerId) FROM (SELECT * FROM users LEFT JOIN serviceProviderRelationship ON users.id = serviceProviderRelationship.providerId UNION SELECT * FROM users RIGHT JOIN serviceProviderRelationship ON users.id = serviceProviderRelationship.providerId) serviceProviders WHERE serviceId = ? AND country = ? AND postCode = ? AND id NOT LIKE ?";

    prometheusDatabase.query(sql, [serviceId, country, postCode, userId], (error, result) => {
        if(error){
            console.log(error)
            res.status(500).send(`Error while getting users that offer service ${serviceId} in this area.`)
        } else {
            let countedValue = Object.values(result[0])[0];
            res.send({providerCount: countedValue});
        }
    })
})

module.exports = router;