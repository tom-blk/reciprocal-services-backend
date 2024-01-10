const express = require('express');
const router = express.Router();
const prometheusDatabase = require('../database/prometheus-db');

router.get('/get-all-countries', (req, res) => {

    let sql = 'SELECT * FROM countries';
    prometheusDatabase.query(sql, [], (error, result) => {
    if(error){
        console.log(error)
        res.status(500).send('Something went wrong when fetching list of countries, please try again later.')
    } else{
        res.send(result);
    }
    })

})



module.exports = router;