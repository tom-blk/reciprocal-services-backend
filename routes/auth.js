const express = require('express');
const router = express.Router();
const prometheusDatabase = require('../database/prometheus-db');
const { createJWT, verifyJWT } = require('../jwt/jwt');
const bcrypt = require('bcryptjs');

//CREATE

router.post('/register', async (req, res) => {

    const {username, email, password } = req.body;

    let hashedPassword = await bcrypt.hash(password, 8);

    let sql = 'INSERT INTO users (username, email, password, credits, rating, ratingCount, profileDescription) VALUES (?,?,?,0,0,0, "")';

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
            if(error) res.status(401).send('Something Went Wrong, Please Try Again.')
            res.send(result[0]);
        })
      } else {
        res.status(401).send('No Authorization Token, Please Log In Again.')
      }  
})

module.exports = router;