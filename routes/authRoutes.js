import { Router } from 'express'
import bcrypt from 'bcrypt'
import db from '../db.js'

const router = Router()

//Signup or create a new user
router.post('/signup', async (req, res) => {
  const newUser = req.body

  const newPassword = newUser.password
  // // System to hash the password
  const salt = await bcrypt.genSalt(10)
  const hashedPassword = await bcrypt.hash(newPassword, salt)
  console.log(hashedPassword)

  const queryString = `INSERT INTO users (first_name, last_name, email, password)
  VALUES ('${newUser.first_name}', '${newUser.last_name}', '${newUser.email}', '${hashedPassword}')
  RETURNING first_name, last_name, email`

  try {
    const insertion = await db.query(queryString)

    res.json(insertion.rows[0])
  } catch (err) {
    res.json({ error: err.message })
  }
})

router.post('/login', async (req, res) => {
  const { password, email } = req.body
  console.log(email)
  console.log(password)

  const queryString = `SELECT * FROM users WHERE users.email = '${email}' AND users.password = '${password}'`

  try {
    const { rows } = await db.query(queryString)
    if (rows.length === 0) {
      throw new Error('User not found or password incorrect')
    }
    res.json({ rows }.rows[0])
  } catch (err) {
    res.json({ error: err.message })
  }
})

router.get('/logout', (req, res) => {
  res.send('log out')
})

export default router
