const express = require('express');
const router = express.Router();
const prometheusDatabase = require('../database/prometheus-db');
const { createJWT, verifyJWT } = require('../jwt/jwt');
const bcrypt = require('bcryptjs');

//CREATE

router.post('/register', async (req, res) => {

    const {username, email, password } = req.body;

    let hashedPassword = await bcrypt.hash(password, 8);

    let sql = 'INSERT INTO users (username, email, password, credits, rating, ratingCount) VALUES (?,?,?,0,0,0)';

    prometheusDatabase.query(sql, [username, email, hashedPassword], (error, result) => {
        if(error) throw error;
        console.log(result[0]);
        res.send(result[0]);
    })
})

//READ

router.post('/log-in', async (req, res) => {

    const { email, password } = req.body;

    let sql = 'SELECT * FROM users WHERE email = ?';

    prometheusDatabase.query(sql, [email], (error, result) => {
        if(error) throw error;
        console.log(result[0]);
        if(result.length<1){
            res.send('No User Found.');
        } else if(result.length>1){
            res.send('Something went wrong.');
        } else {
            bcrypt.compare(password, result[0].password).then(match => {
                if(!match){
                    res.send(new Error('Wrong Password'))
                } else {
                    const userAuthenticationToken = createJWT(result[0].id, result[0].username);
                    console.log(userAuthenticationToken);
                    res.send(userAuthenticationToken);
                }
            }) 
        }
    })
})

router.post('/get-user', (req, res) => {

    console.log(req.headers.authorization)
    if (
        req.headers.authorization &&
        req.headers.authorization.split("=")[0] === "prometheusUserAuthenticationToken"
      ) {
        userId = verifyJWT(req.headers.authorization.split("=")[1]).id;

        let sql = 'SELECT id, firstName, lastName, userName, email, profilePicture, credits, rating, profileDescription FROM users WHERE id = ?';

        prometheusDatabase.query(sql, [userId], (error, result) => {
            if(error) throw error;
            console.log(result[0]);
            res.send(result[0]);
        })
      } else {
        res.send(undefined);
      }  
})

module.exports = router;