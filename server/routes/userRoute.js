import express from 'express'
import userControll from '../controllers/userControll.js'
const router=express.Router()
router.post("/register",userControll.createUser)
export default router