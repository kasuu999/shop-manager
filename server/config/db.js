import { urlencoded } from 'body-parser'
import mongoose from 'mongoose'
const connectDB=async ()=>{
    try{
        const conn=await mongoose.connect(process.env.MONGO_URI)
        console.log(`connection hogya ${conn.connection.name}`)
    }catch(error){
        console.log(`connection tuta shyad data connection nahi hua ${error.message}`)
    }

}
export default connectDB


