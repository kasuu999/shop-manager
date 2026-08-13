import express from 'express'
import mongoose from 'mongoose'
import connectDB from './config/db.js'
import dotenv from 'dotenv'
import userRoute from './routes/userRoute.js'
const app=express()
dotenv.config()
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
const port=3000
connectDB()
app.get("/",(req,res)=>{
    res.send(" product ready")
})
app.use("/api/users",userRoute)
app.listen(port,()=>{
    console.log(`server yaha chal rha hai ${port}`)
})