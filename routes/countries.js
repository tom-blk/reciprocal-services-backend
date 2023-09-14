const express = require('express');
const router = express.Router();
const prometheusDatabase = require('../database/prometheus-db');

router.get('/get-all-countries', (req, res) => {

    let sql = 'SELECT * FROM countries';
    prometheusDatabase.query(sql, [], (error, result) => {
    if(error) throw error;
    console.log(result);
    res.send(result);
    })

})



module.exports = router;