import UserModel from '../models/User.js'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import transporter from '../config/emailConfig.js';

class UserController{
    static userRegistration = async(req,res)=>{
        const {name, email, password, password_confirmation, tc} = req.body;
        const user = await UserModel.findOne({email: email})
        if(user){
            res.send({"status": "failed", 'message' : 'email already exists' })
        }
        else{
            if(name && email && password && password_confirmation && tc){
                console.log("hello1");
                if(password === password_confirmation){
                    console.log("hello2");
                    try{
                        const salt = await bcrypt.genSalt(10)
                        const hashPassword = await bcrypt.hash(password, salt)
                        const doc = new UserModel({
                            name: name,
                            email: email,
                            password: hashPassword,
                            tc: tc
                        })
                        await doc.save()
                        const saved_user = await UserModel.findOne({email: email})
                        const token = jwt.sign({user_id : saved_user._id}, process.env.JWT_SECRET_KEY, {expiresIn: '5d'})
                        res.send({"status": "success", "message": "User Succeessfully Registered", "token": token})
                    }catch(err){
                        console.log(err)
                        res.send({"status": "failed", 'message' : 'error occured' })
                    }
                }else{
                    res.send({"status": "failed", 'message' : 'passwords do not match' })
                }
            }else{
                res.send({"status": "failed", 'message' : 'all fields are required' })
            }
        }
    }

    static userLogin = async(req, res)=>{
        try{
            const {email, password} = req.body;
            if(email && password){
                const user = await UserModel.findOne({email: email})
                if(user !=  null){
                    const isMatch = await bcrypt.compare(password, user.password)
                    if(user.email === email && isMatch){
                        const token = jwt.sign({user_id : user._id}, process.env.JWT_SECRET_KEY, {expiresIn: '5d'})
                        res.send({"status": "Success", 'message' : 'User Logged In', "token": token})
                    }else{
                        res.send({"status": "failed", 'message' : 'invalid credentials' })
                    }
                }else{
                    res.send({"status": "failed", 'message' : 'email does not exist' })
                }
            }else{
                res.send({"status": "failed", 'message' : 'all fields are required' })
            }
        }catch(err){
            console.log(err);
            res.send({"status": "failed", 'message' : 'unable to login, please try it again later' })
        }
    }
    static changeUserPassword = async(req,res)=>{
        const {password, password_confirmation} = req.body;
        if(password && password_confirmation){
            if(password === password_confirmation){
                const salt = await bcrypt.genSalt(10)
                const newPassword = await bcrypt.hash(password, salt)
                await UserModel.findByIdAndUpdate(req.user._id, {password: newPassword})
                res.send({"status": "success", 'message' : 'password changed successfully' })
            }else{
                res.send({"status": "failed", 'message' : 'passwords do not match' })
            }
        }else{
            res.send({"status": "failed", 'message' : 'all fields are required' })
        }
    }

    static loggedUser = async(req,res)=>{
        res.send({"user": req.user})
    }

    static sendUserPasswordResetEmail = async(req,res)=>{
        const {email} = req.body;
        if(email){
            const user = await UserModel.findOne({email: email})
            if(user === null || user === '' || user === 'undefined' || user === 'null'){
                res.send({"status": "failed", 'message' : 'email does not exist' })
            }else{
                const secret = user._id + process.env.JWT_SECRET_KEY
                const token = jwt.sign({user_id: user._id}, secret, {expiresIn: '15m'})
                const link = `http://localhost:3000/resetpassword/${user._id}/${token}`
                console.log(link)
                let info = await transporter.sendMail({
                    from: process.env.EMAIL_FROM,
                    to: user.email,
                    subject: 'Password Reset',
                    html: `<a href="${link}">Click Here</a> to reset your password`
                })
                res.send({"status": "success", 'message' : 'password reset link sent to email', 'info':info })
            }
        }else{
            res.send({"status": "failed", 'message' : 'email is required' })
        }
    }
    static userPasswordReset = async(req,res)=>{
        const {password, password_confirmation} = req.body;
        const {id, token} = req.params;
        const user = await UserModel.findById(id)
        const new_secret = user._id + process.env.JWT_SECRET_KEY
        try{
            jwt.verify(token, new_secret)
            if(password && password_confirmation){
                if(password === password_confirmation){
                    const salt = await bcrypt.genSalt(10)
                    const newPassword = await bcrypt.hash(password, salt)
                    await UserModel.findByIdAndUpdate(user._id, {$set: {password: newPassword}})
                    res.send({"status": "success", 'message' : 'password changed successfully' })
                    
                }else{
                    res.send({"status": "failed", 'message' : 'passwords do not match' })
                }
            }else{
                res.send({"status": "failed", 'message' : 'all fields are required' })
            }
        }catch(err){
            console.log(err)
        }
    }
}

export default UserController