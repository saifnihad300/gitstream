const isAuthorized = (req, res, next)=>{
  if(req.user?.isAdmin){
    next();
  }else{
    res.status(403).json({
        message: 'Access denied. You are not an admin'
    });
  }
}

module.exports = {isAuthorized}