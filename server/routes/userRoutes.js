import express from 'express'
import { registerUser, loginUser, getMe } from '../controllers/userController.js'
import { protect, authorize } from '../middlewares/userMiddlware.js'

const router = express.Router()

router.post('/register', registerUser)
router.post('/login', loginUser)
router.get('/me', protect, getMe)

// Example: sirf "owner" access kar sakta hai
router.get('/owner-only', protect, authorize('owner'), (req, res) => {
  res.json({ success: true, message: 'Welcome Owner!' })
})

export default router