import express from 'express'
import mongoose from 'mongoose'
import connectDB from './config/db.js'
import dotenv from 'dotenv'
import userRoutes from './routes/userRoutes.js'
import categoryRoute from './routes/catagoryRoute.js'
import productRoute from './routes/productRoute.js'
import supplierRoute from './routes/supplierRoute.js'
import customerRoute from './routes/customerRoute.js'
import purchaseRoute from './routes/purchaseRoute.js'
import saleRoute from './routes/saleRoute.js'
import stockHistoryRoute from './routes/stockHistoryRoute.js'
import dashboardRoute from './routes/dashboardRoute.js'
import reportRoute from './routes/reportRoute.js'
import shopRoute from './routes/shopRoute.js'
import cors from "cors";


const app=express()
dotenv.config()
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(cors({
  origin: [
    "http://localhost:5173",
    "https://moin-web.vercel.app/login",
  ],
  credentials: true
}));
const PORT = process.env.PORT || 3000;
connectDB()
app.get("/",(req,res)=>{
    res.send(" product ready")
})


app.use(cors({
  origin: [
    "http://localhost:5173",
    "https://YOUR-FRONTEND.vercel.app"
  ],
  credentials: true
}));
app.use("/api/categories",categoryRoute)
app.use("/api/users",userRoutes)
app.use("/api/products",productRoute)
app.use("/api/suppliers",supplierRoute)
app.use("/api/customers",customerRoute)
app.use("/api/purchase",purchaseRoute)
app.use("/api/sale",saleRoute)
app.use("/api/stock",stockHistoryRoute)
app.use("/api/dashboard",dashboardRoute)
app.use("/api/report",reportRoute)
app.use("/api/shop",shopRoute)
app.listen(PORT,()=>{
    console.log(`server yaha chal rha hai ${PORT}`)
})