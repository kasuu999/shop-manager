import User from "../models/user.js";
const createUser=async(req,res)=>{
    try{
        const user=await User.create(req.body)
        res.status(201).json(user)
    }catch(error){
        res.status(500).json({
            message:error.message
        })
    }
}
const userController={createUser}
export default userController