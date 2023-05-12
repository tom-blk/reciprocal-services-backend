const {sign, verify} = require('jsonwebtoken');

const createJWT = (id, username) => {
    const userAuthenticationToken = sign(
        {id: id, username: username}, 
        'jwtsecret'
    );

    return userAuthenticationToken;
};

const verifyJWT = (jwt) => {
    if(!jwt) return new Error('Not logged in!');

    try{
        const correctToken = verify(jwt, 'jwtsecret');
        if(correctToken){
            return correctToken;
        }
    } catch(error){
            return(new Error('JWT is not correct!'));
    }
}

module.exports = { createJWT, verifyJWT };