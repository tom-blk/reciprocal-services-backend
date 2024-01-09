const express = require('express');
const fs = require('fs');
const multer = require('multer');
const router = express.Router();

const storageProfilePicture = multer.diskStorage({
    destination: function (req, file, cb){ 
        console.log(file);
        cb(null, 'uploads/user-pictures');
    },
    filename: function (req, file, cb){
        console.log(file);
        cb(null, 'picture.png');
    }
})

const storageServicePicture = multer.diskStorage({
    destination: function (req, file, cb){ 
        console.log(file);
        cb(null, 'uploads/service-pictures');
    },
    filename: function (req, file, cb){
        console.log(file);
        cb(null, 'picture.png');
    }
})

const uploadProfilePicture = multer({storage: storageProfilePicture})

const uploadServicePicture = multer({storage: storageServicePicture})


router.post('/upload-user-picture', uploadProfilePicture.single('picture'), (req, res) => {
    
    fs.rename('uploads/user-pictures/picture.png', `uploads/user-pictures/user-${req.body.userId}-user-picture.png`, (error) => {
        if(error){
            //fs.unlink('uploads/profile-pictures/picture.png', (error) => {console.log(error)})
            console.log(error);
            res.status(500).send("Error updating your profile picture.");
        }else{
            res.status(200).send("Profile picture successfully updated.");
        }
    })
})

router.post('/upload-service-picture', uploadServicePicture.single('picture'), (req, res) => {
    
    fs.rename('uploads/service-pictures/picture.png', `uploads/service-pictures/service-${req.body.serviceId}-service-picture.png`, (error) => {
        if(error){
            fs.unlink('uploads/service-pictures/picture.png', (error) => {console.log(error)})
            console.log(error);
            res.status(500).send("Error updating the service picture.")
        }
    })
})

module.exports = router;

//! fix: form data must be solo, the back end code is okay.