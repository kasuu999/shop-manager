import mongoose from 'mongoose'
const userSchema=new mongoose.Schema({
    name:{
        type:String,
        required: [true, "Please Enter Name"]
    },
    number:{
        type:String,
       required: [true, "Please Enter Number"]
    },
    password:{
        type:String,
       required: [true, "Please Enter Password"]
    },
        role: {
      type: String,
      enum: ["owner", "staff"],
      default: "staff",
    }
},{
    timestamps: true
})
const User = mongoose.model('User', userSchema)

export default User