import bcrypt from 'bcryptjs'
import User from '../models/user.js'
import generateToken from '../utils/generateToken.js'

// @desc   Register new user
// @route  POST /api/auth/register
export const registerUser = async (req, res) => {
  try {
    const { name, number, password, role } = req.body

    if (!name || !number || !password) {
      return res.status(400).json({ success: false, message: 'All fields are required' })
    }

    const existingUser = await User.findOne({ number })
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'User already exists' })
    }

    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash(password, salt)

    // Only allow "owner" role to be set explicitly if you want strict control,
    // otherwise default schema value ("staff") kicks in.
    const user = await User.create({
      name,
      number,
      password: hashedPassword,
      role: role === 'owner' ? 'owner' : 'staff'
    })

    const token = generateToken(user._id, user.role)

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        number: user.number,
        role: user.role
      }
    })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

// @desc   Login user
// @route  POST /api/auth/login
export const loginUser = async (req, res) => {
  try {
    const { number, password } = req.body

    if (!number || !password) {
      return res.status(400).json({ success: false, message: 'Number and password required' })
    }

    const user = await User.findOne({ number })
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' })
    }

    const isMatch = await bcrypt.compare(password, user.password)
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' })
    }

    const token = generateToken(user._id, user.role)

    res.status(200).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        number: user.number,
        role: user.role
      }
    })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

// @desc   Get logged-in user profile
// @route  GET /api/auth/me
export const getMe = async (req, res) => {
  res.status(200).json({ success: true, user: req.user })
}