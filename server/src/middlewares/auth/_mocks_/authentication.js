const isAuthenticated = async (req, res, next) =>{
    const mockUserData = req.headers[x-mock-user] ;
    req.user = mockUserData;
    if(mockUserData){
        req.user = JSON.parse(mockUserData);
        next();
    }else{
        res.sendStatus(401);
    }
}

module.exports = {isAuthenticated}