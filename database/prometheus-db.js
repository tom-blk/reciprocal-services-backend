const mysql = require('mysql2');
const environment = require('../environment.config');

const prometheusDatabase = mysql.createConnection({
    host     : environment.DATABASE_HOST,
    user     : environment.DATABASE_USERNAME,
    password : environment.DATABASE_PASSWORD,
    database : environment.DATABASE,
    multipleStatements: true
});

console.log(environment.DATABASE_HOST)

prometheusDatabase.connect(error => {
    if(error){
        throw(error);
    }
    console.log('Connected to reciprocal-services-database.');
});

const resetWeeeklyOrderCount = () => {
    let sql = "UPDATE services SET weeklyOrderCount = 0";

    prometheusDatabase.query(sql, (error, result) => {
        if(error) throw error;
        console.log(result);
    })
}
  
setInterval(resetWeeeklyOrderCount, 604800000); //Week

module.exports = prometheusDatabase;
