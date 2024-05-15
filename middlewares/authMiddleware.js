import jwt from 'jsonwebtoken'
import UserModel from '../models/User.js'

var checkUserAuth = async (req, res, next) => {
    let token
    const {authorization} = req.headers
    if(authorization &&  authorization.startsWith('Bearer')){
        try{
            token = authorization.split(' ')[1]
            const {user_id} = jwt.verify(token, process.env.JWT_SECRET_KEY)
            req.user = await UserModel.findById(user_id).select('-password')
            next()

        }catch(err){
            res.send({"status": "failed", 'message' : 'Unauthorized User' })
        }
    }
    if(!token){
        res.status(401).send({"status": "failed", 'message' : 'Unautorized user. No Token!' })
    }
}

export default checkUserAuth