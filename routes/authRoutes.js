import { Router } from 'express'
import db from '../db.js'
import jwt from 'jsonwebtoken'
import { jwtSecret } from '../secrets.js'
import bcrypt from 'bcrypt'

const router = Router()

//Signup POST or create a new user
router.post('/signup', async (req, res) => {
  try {
    const newUser = req.body

    // check if user email exists
    const queryResult = await db.query(`
    SELECT * FROM users 
    WHERE email ='${newUser.email}'
    `)

    if (queryResult.rowCount) {
      throw new Error('Email already exists')
    }

    //hash the password
    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash(newUser.password, salt)

    //create the user
    const queryString = `INSERT INTO users (first_name, last_name, email, password)
    VALUES ('${newUser.first_name}', '${newUser.last_name}', '${newUser.email}', '${hashedPassword}')
    RETURNING user_id, email`

    const insertion = await db.query(queryString)

    //creating the token
    let payload = {
      email: newUser.email,
      user_id: newUser.user_id
    }
    let token = jwt.sign(payload, jwtSecret)

    // creating the cookie
    res.cookie('jwt', token)
    res.json(insertion.rows[0])
  } catch (err) {
    res.json({ error: err.message })
  }
})

//LOGIN POST user already in DB
router.post('/login', async (req, res) => {
  try {
    // tell where the info is coming from
    const { password, email } = req.body

    //storing the query as a string
    const queryString = `SELECT * FROM users WHERE users.email = '${email}'`
    //querying the data base and getting data in the form of rows
    const { rows } = await db.query(queryString)

    //checking if rows are empty
    if (rows.length === 0) {
      throw new Error('User not found or password incorrect')
    }
    //comparing passwords
    const isPasswordValid = await bcrypt.compare(password, rows[0].password)
    if (isPasswordValid) {
      //returning a message confirmation

      //create token
      let payload = {
        email: rows[0].email,
        user_id: rows[0].user_id
      }
      let token = jwt.sign(payload, jwtSecret)
      res.cookie('jwt', token)
      res.json(`Hi ${rows[0].first_name} your are now logged in`)
    }
  } catch (err) {
    res.json({ error: err.message })
  }
})

app.get('/logout', (req, res) => {
  res.clearCookie('jwt')
  res.send('You are logged out')
})

export default router
