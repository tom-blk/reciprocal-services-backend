const {sign, verify} = require('jsonwebtoken');
const dotenv = require('dotenv');

dotenv.config({ path:'./.env' })

const createJWT = (id, username) => {
    const userAuthenticationToken = sign(
        {id: id, username: username}, 
        'secret'
    );

    return userAuthenticationToken;
};

const verifyJWT = (jwt) => {
    if(!jwt) return new Error('No Authentication Token, Please Log In!');

    try{
        const correctToken = verify(jwt, 'secret');
        return correctToken;
    } catch(error){
        return new Error('Wrong Authentication Token, Please Log In Again.')
    }
}

module.exports = { createJWT, verifyJWT };
