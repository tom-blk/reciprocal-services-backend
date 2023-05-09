const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const cors = require('cors');

const reciprocalServicesDatabase = mysql.createConnection({
    host     : 'localhost',
    user     : 'reciprocal-services-access',
    password : '724805',
    database : 'reciprocal-services-db',
    multipleStatements: true
});

reciprocalServicesDatabase.connect(error => {
    if(error){
        throw(error);
    }
    console.log('connected');
});

const app = express();

app.use(bodyParser.urlencoded({ extended: true }))

app.use(bodyParser.json());

app.use(
    cors({
      origin: "http://localhost:3000",
      credentials: true,
    })
  );


const resetWeeeklyOrderCount = () => {
    let sql = "UPDATE services SET weeklyOrderCount = 0";

    reciprocalServicesDatabase.query(sql, (error, result) => {
        if(error) throw error;
        console.log(result);
    })
}
  
setInterval(resetWeeeklyOrderCount, 60000); //604800000 for a week

//USER ENDPOINTS

//creation endpoints

app.get('/create-user', (req, res) => {

    let sql = "INSERT INTO users (firstName, lastName, email) VALUES ('TestDude', 'TestDudenson', 'testdude@mail.com')";
    reciprocalServicesDatabase.query(sql, (error, result) => {
        if(error) throw error;
        console.log(result);
        res.send(result);
    })
})


//fetching endpoints

app.get('/get-superficial-user-details', (req, res) => {

    let sql = "SELECT id, firstName, lastName, profilePicture, rating FROM users";
    reciprocalServicesDatabase.query(sql, (error, result) => {
        if(error) throw error;
        console.log(result);
        res.send(result);
    })
})

app.post('/get-full-user-details/:userId', (req, res) => {

    const {userId} = req.body;

    let sql = 'SELECT * FROM users WHERE id = ?';
    reciprocalServicesDatabase.query(sql, [userId], (error, result) => {
        if(error) throw error;
        console.log(result[0]);
        res.send(result[0]);
    })
})

app.post('/get-service-specific-users', (req, res) => {

    const {serviceId} = req.body;

    let selectUsersSql = "SELECT * FROM users WHERE id IN (SELECT providerId FROM serviceProviderRelationship WHERE serviceId = ?)";

    reciprocalServicesDatabase.query(selectUsersSql, [serviceId], (error, result) => {
        if(error) throw error;
        console.log(result);

        res.send(result);
    })
})




//updating endpoints

app.put('/update-user', (req, res) => {

    const { userId, firstName, lastName, description } = req.body;

    let sql = "UPDATE users SET firstName = ?, lastName = ?, profileDescription = ? WHERE id = ?";
    reciprocalServicesDatabase.query(sql, [firstName, lastName, description, userId], (error, result) => {
        if(error) throw error;
        console.log(result);
        res.send(result);
    })
})

app.put('/update-user-profile-picture', (req, res) => {

    const { userId, profilePicture } = req.body;

    let sql = "UPDATE users SET profilePicture = ? WHERE id = ?";
    reciprocalServicesDatabase.query(sql, [profilePicture, userId], (error, result) => {
        if(error) throw error;
        console.log(result);
        res.send(result);
    })
})

app.put('/rate-user', (req, res) => {

    const {userId, rating} = req.body;

    let getSql = 'SELECT rating, ratingCount FROM users WHERE id = ?';

    let updateSql = 'UPDATE users SET rating = ?, ratingCount = ? WHERE id = ?'; 

    reciprocalServicesDatabase.query(getSql, [userId], (error, result) => {
        if(error) throw error;
        console.log(result);
        const newRatingCount = result[0].ratingCount+1;
        const newRating = (result[0].rating * result[0].ratingCount + rating) / newRatingCount;
        reciprocalServicesDatabase.query(updateSql, [newRating, newRatingCount, userId], (error, result) => {
            if(error) throw error;
            console.log(result);
            res.send(result);
        })
    })

})





// OUTGOING ORDER ENDPONTS

//creation endpoints

app.post('/create-order', (req, res) => {

    const {serviceId, providingUserId, receivingUserId, dateIssued, message} = req.body;

    console.log(`Request Body: ${serviceId, providingUserId, receivingUserId}`);

    let sqlCreateOrder = "INSERT INTO orders (serviceId, providingUserId, receivingUserId, dateIssued, message, status) VALUES (?, ?, ?, ?, ?, 1)";

    let sqlUpdateWeeklyOrderCount = "UPDATE services SET weeklyOrderCount = weeklyOrderCount + 1 WHERE id = ?";

    reciprocalServicesDatabase.query(sqlCreateOrder, [serviceId, providingUserId, receivingUserId, dateIssued, message], (error, result) => {
        if(error) throw error;
        console.log(`Result: ${result}`);
    })

    reciprocalServicesDatabase.query(sqlUpdateWeeklyOrderCount, [serviceId], (error, result) => {
        if(error) throw error;
        console.log(`Result: ${result}`);
        res.send(result);
    })
})

//read endpoints

app.post('/get-all-orders/:userId', async (req, res) => {

    const { orderDirection, userId } = req.body;

    const allOrders = {
        new: [],
        accepted: [],
        fulfilled: [],
        completed: [],
        denied: []
    }

    if(orderDirection === 'outgoing'){
        let sql = 'SELECT * FROM orders WHERE receivingUserId = ? AND status = 1; SELECT * FROM orders WHERE receivingUserId = ? AND status = 2; SELECT * FROM orders WHERE receivingUserId = ? AND status = 3; SELECT * FROM orders WHERE receivingUserId = ? AND status = 4; SELECT * FROM orders WHERE receivingUserId = ? AND status = 5;';

        reciprocalServicesDatabase.query(sql, [userId, userId, userId, userId, userId], (error, result) => {
            if(error) throw error;
            console.log("order outgoing" + result);
            allOrders.new = result[0];
            allOrders.accepted = result[1];
            allOrders.fulfilled = result[2];
            allOrders.completed = result[3];
            allOrders.denied = result[4];
            res.send(allOrders);
        })
    }

    if(orderDirection === 'incoming'){
        let sql = 'SELECT * FROM orders WHERE providingUserId = ? AND status = 1; SELECT * FROM orders WHERE providingUserId = ? AND status = 2; SELECT * FROM orders WHERE providingUserId = ? AND status = 3; SELECT * FROM orders WHERE providingUserId = ? AND status = 4; SELECT * FROM orders WHERE providingUserId = ? AND status = 5;';

        reciprocalServicesDatabase.query(sql, [userId, userId, userId, userId, userId], (error, result) => {
            if(error) throw error;
            console.log("order incoming" + result);
            allOrders.new = result[0];
            allOrders.accepted = result[1];
            allOrders.fulfilled = result[2];
            allOrders.completed = result[3];
            allOrders.denied = result[4];
            res.send(allOrders);
        })
    }
})

app.post('/get-orders-with-specific-status-and-direction/:userId', (req, res) => {

    const {orderDirection, status, userId} = req.body;

    if(orderDirection === 'outgoing'){
        let sql = 'SELECT * FROM orders WHERE receivingUserId = ? AND status = ?';
        reciprocalServicesDatabase.query(sql, [userId, status], (error, result) => {
        if(error) throw error;
        console.log("actionable outgoing orders" + result);
        res.send(result);
        })
    }
    if(orderDirection === 'incoming'){
        let sql = 'SELECT * FROM orders WHERE providingUserId = ? AND status = ?';
        reciprocalServicesDatabase.query(sql, [userId, status], (error, result) => {
        if(error) throw error;
        console.log("actionable incoming orders" + result);
        res.send(result);
        })
    }
})

app.post('/get-single-order/:userId', (req, res) => {

    const { orderId } = req.body;

    let sql = 'SELECT * FROM orders WHERE id = ?';
    reciprocalServicesDatabase.query(sql, [orderId], (error, result) => {
    if(error) throw error;
    console.log(result);
    res.send(result[0]);
    })

})


//update endpoints

app.put('/modify-order-status/:orderId', (req, res) => {

    const {status, orderId } = req.body;

    let sql = "UPDATE orders SET status = ? WHERE id = ?";
    reciprocalServicesDatabase.query(sql, [status, orderId], (error, result) => {
        if(error) throw error;
        console.log(result);
        res.send(result);
    })
})







// INCOMING ORDER ENDPOINTS

//read endpoints

app.post('/get-incoming-orders/:userId', (req, res) => {

    const { providingUserId } = req.body;

    let sql = 'SELECT * FROM orders WHERE providingUserId = ? AND (transactionOrdered = 1 AND orderConfirmed = 0 AND orderCompleted = 0 AND completionConfirmed = 0)';
    reciprocalServicesDatabase.query(sql, [providingUserId], (error, result) => {
        if(error) throw error;
        console.log("incoming orders" + result);
        res.send(result);
    })
})

app.post('/get-incoming-pending-orders/:userId', (req, res) => {

    const { providingUserId } = req.body;

    let sql = 'SELECT * FROM orders WHERE providingUserId = ? AND (transactionOrdered = 1 AND orderConfirmed = 1 AND completionConfirmed = 0)';
    reciprocalServicesDatabase.query(sql, [providingUserId], (error, result) => {
        if(error) throw error;
        console.log("pending orders" + result);
        res.send(result);
    })
})

app.post('/get-incoming-completed-orders/:userId', (req, res) => {

    const { providingUserId } = req.body;

    let sql = 'SELECT * FROM orders WHERE providingUserId = ? AND (transactionOrdered = 1 AND orderConfirmed = 1 AND orderCompleted = 1 AND completionConfirmed = 1)';
    reciprocalServicesDatabase.query(sql, [providingUserId], (error, result) => {
        if(error) throw error;
        console.log("completed orders" + result);
        res.send(result);
    })
})

//





//SERVICE ENDPOINTS

//create endpoints

app.post('/create-service', (req, res) => {

    const { name, description, icon } = req.body;

    let sql = "INSERT INTO services (name, description, icon, recommendedCreditsPerHour, weeklyOrderCount) VALUES (?, ?, ?, 0, 0)";
    reciprocalServicesDatabase.query(sql, [name, description, icon], (error, result) => {
        if(error) throw error;
        console.log(result);
        res.send(result);
    })
})


//update endpoints


app.post('/update-user-specific-services', (req, res) => {

    const {userId, serviceIdsToBeAdded, serviceIdsToBeRemoved} = req.body;

    let postNewServiceSql = "INSERT INTO serviceProviderRelationship (providerId, serviceId) VALUES (?, ?)"

    let deleteOldServiceSql = "DELETE FROM serviceProviderRelationship WHERE providerId = ? AND serviceId = ?"

    serviceIdsToBeAdded.forEach(id => {
        reciprocalServicesDatabase.query(postNewServiceSql, [userId, id], (error, result) => {
            if(error) throw error;
            console.log(result);
        })
    })

    serviceIdsToBeRemoved.forEach(id => {
        reciprocalServicesDatabase.query(deleteOldServiceSql, [userId, id], (error, result) => {
            if(error) throw error;
            console.log(result);
        })
    })

    res.send('Services Successfully Updated!')
})
    


//read endpoints

app.get('/get-superficial-service-details', (req, res) => {

    let sql = "SELECT id, name, description, icon FROM services ORDER BY weeklyOrderCount DESC";
    reciprocalServicesDatabase.query(sql, (error, result) => {
        if(error) throw error;
        console.log(result);
        res.send(result);
    })
})

app.post('/get-service-provider-count', (req, res) => {

    const {serviceId} = req.body

    let sql = "SELECT COUNT(providerId) FROM serviceProviderRelationship WHERE serviceId = ?";
    reciprocalServicesDatabase.query(sql, [serviceId], (error, result) => {
        if(error) throw error;
        console.log(Object.values(result[0])[0]);

        let countedValue = Object.values(result[0])[0];

        res.send({providerCount: countedValue});
    })
})

app.get('/get-all-services', (req, res) => {

    let sql = "SELECT * FROM services ORDER BY weeklyOrderCount DESC";
    reciprocalServicesDatabase.query(sql, (error, result) => {
        if(error) throw error;
        console.log(result);
        res.send(result);
    })
})

app.post('/get-user-specific-services/:userId', (req, res) => {

    const {userId} = req.body;

    let sql = "SELECT * FROM services JOIN serviceProviderRelationship ON services.id = serviceProviderRelationship.serviceId WHERE providerId = ?";

    reciprocalServicesDatabase.query(sql, [userId], (error, result) => {
        if(error) throw error;
        console.log('user specific services' + result);
        res.send(result);
    })
})

app.post('/add-service-to-user-services', (req, res) => {

    const { userId, serviceId } = req.body;

    let sql = "INSERT INTO serviceProviderRelationship (providerId, serviceId) VALUES (?, ?)";

    reciprocalServicesDatabase.query(sql, [userId, serviceId], (error, result) => {
        if(error) throw error;
        console.log('user specific services' + result);
        res.send(result);
    })
})

app.post('/remove-service-from-user-services', (req, res) => {

    const { userId, serviceId } = req.body;

    let sql = "DELETE FROM serviceProviderRelationship WHERE providerId = ? AND serviceId = ?";

    reciprocalServicesDatabase.query(sql, [userId, serviceId], (error, result) => {
        if(error) throw error;
        console.log('user specific services' + result);
        res.send(result);
    })
})

app.post('/get-service-user-affiliation', (req, res) => {

    const { userId, serviceId } = req.body;

    let sql = "SELECT * FROM serviceProviderRelationship WHERE providerId = ? AND serviceId = ?";

    reciprocalServicesDatabase.query(sql, [userId, serviceId], (error, result) => {
        if(error) throw error;
        console.log(userId + ' ' + serviceId);
        if(result.length > 0){
            res.send(true); 
        } else {
            res.send(false); 
        }
    })
})

app.post('/get-full-service-details/:serviceId', (req, res) => {

    const {serviceId} = req.body

    let sql = "SELECT * FROM services WHERE id = ?";
    reciprocalServicesDatabase.query(sql, [serviceId],(error, result) => {
        if(error) throw error;
        console.log(result[0]);
        res.send(result[0]);
    })
})

app.get('/get-trending-services', (req, res) => {

    let sql = "SELECT * FROM services ORDER BY weeklyOrderCount DESC LIMIT 3";
    reciprocalServicesDatabase.query(sql, (error, result) => {
        if(error) throw error;
        console.log(result);
        res.send(result);
    })
})

app.listen('5000', () => {
    console.log('Server started on port 5000')
});

