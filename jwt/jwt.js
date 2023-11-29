const {sign, verify} = require('jsonwebtoken');
const environment = require('../environment.config');

const createJWT = (id, username) => {
    const userAuthenticationToken = sign(
        {id: id, username: username}, 
        environment.JWT_SECRET
    );

    return userAuthenticationToken;
};

const verifyJWT = (jwt) => {
    if(!jwt) return new Error('No Authentication Token, Please Log In!');

    try{
        const correctToken = verify(jwt, environment.JWT_SECRET);
        return correctToken;
    } catch(error){
        return new Error('Wrong Authentication Token, Please Log In Again.')
    }
}

module.exports = { createJWT, verifyJWT };
