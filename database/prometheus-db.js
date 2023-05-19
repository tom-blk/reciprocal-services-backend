const mysql = require('mysql2');
const dotenv = require('dotenv');

dotenv.config({ path:'./.env' })

const prometheusDatabase = mysql.createConnection({
    host     : process.env.HOST,
    user     : process.env.DATABASE_USERNAME,
    password : process.env.DATABASE_PASSWORD,
    database : process.env.DATABASE,
    multipleStatements: true
});

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