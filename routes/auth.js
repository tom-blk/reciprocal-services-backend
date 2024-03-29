const express = require('express');
const router = express.Router();
const prometheusDatabase = require('../database/prometheus-db');
const { createJWT, verifyJWT } = require('../jwt/jwt');
const bcrypt = require('bcryptjs');

router.post('/register', async (req, res) => {

    const {username, email, password } = req.body;

    let hashedPassword = await bcrypt.hash(password, 8);

    let sql = 'INSERT INTO users (username, email, password, credits, rating, ratingCount, profileDescription) VALUES (?,?,?,100,0,0, "")';

    prometheusDatabase.query(sql, [username, email, hashedPassword], (error, result) => {
        if(error){
            console.log(error);
            res.status(500).send('Could not register, please try again later.')
        } else {
            res.send("Successfully registered!");
        }
    })
})

router.post('/log-in', async (req, res) => {

    const { email, password } = req.body;

    let sql = 'SELECT * FROM users WHERE email = ?';

    prometheusDatabase.query(sql, [email], (error, result) => {
        if(error){
            console.log(error);
            res.status(500).send('Something went wrong while logging in, please try again later.')
        }
        if(result.length<1){
            res.status(401).send('No User With That Email Found.');
        } else if(result.length>1){
            res.status(401).send('Something went wrong.');
        } else {
            bcrypt.compare(password, result[0].password).then(match => {
                if(!match){
                    res.status(401).send('Password does not match.')
                } else {
                    const userAuthenticationToken = createJWT(result[0].id, result[0].username);
                    res.cookie('prometheusUserAuthenticationToken', userAuthenticationToken, {maxAge: 1000*60*60*24*7, httpOnly: true, sameSite: 'None', secure: true, path:"/"}).send('Login Successful');
                }
            })
        }
    })
})

router.get('/log-out', async (req, res) => {
    res.cookie('prometheusUserAuthenticationToken', 0, {maxAge: 0, httpOnly: true}).send('User Was Logged Out.');
})

router.get('/get-user', (req, res) => {

    if(req.cookies.prometheusUserAuthenticationToken){
        userId = verifyJWT(req.cookies.prometheusUserAuthenticationToken).id;

        let sql = 'SELECT id, firstName, lastName, userName, email, profilePicture, credits, rating, ratingCount, profileDescription, country, postCode, city, travellingForOrders FROM users WHERE id = ?';

        prometheusDatabase.query(sql, [userId], (error, result) => {
            if(error){
                console.log(error)
                res.status(401).send('Something Went Wrong, Please Try Again.');
            } else {
                res.send(result[0]);
            }
            
        })
    }
})

module.exports = router;
