import { Router } from 'express'
import db from '../db.js'
import { jwtSecret } from '../secrets.js'
import jwt from 'jsonwebtoken'

const router = Router()

router.post('/houses', async (req, res) => {
  try {
    const { location, price_per_night, bedroom, bathroom, description } =
      req.body

    //declare the token from the jwt property in the cookie
    let token = req.cookies.jwt

    // if token doesn't exist throw error
    if (!token) {
      throw new Error('Invalid authentication token')
    }

    //else if token does exist verify user_id from the token
    const decodedToken = jwt.verify(token, jwtSecret)

    if (!decodedToken) {
      throw new Error('Invalid quthentication token')
    }

    const { user_id } = jwt.verify(token, jwtSecret)

    const queryString = `INSERT INTO houses (location, price_per_night, bedroom, bathroom, description, user_id)
    VALUES (
      '${location}',
      ${price_per_night},
      ${bedroom},
      ${bathroom},
      '${description}',
      ${user_id}) 
      RETURNING *`

    const { rows } = await db.query(queryString)

    res.json(rows[0])
  } catch (err) {
    res.json({ error: err.message })
  }
})

// route gets all the houses and if there is a query it gives the results of the query

router.get('/houses', async (req, res) => {
  let queryString = 'SELECT * FROM houses WHERE TRUE'
  console.log(queryString)
  const { location, max_price, min_rooms, sort, search, order } = req.query
  try {
    if (location) {
      queryString += ` AND location = '${location}'`
    }
    if (max_price) {
      queryString += ` AND price_per_night <= ${max_price}`
    }
    if (min_rooms) {
      queryString += ` AND bedrooms <= ${min_rooms}`
    }
    if (search) {
      queryString += ` AND description LIKE '%${search}%'`
    }
    if (sort === 'price') {
      queryString += ` ORDER BY price_per_night ${order}'`
    }
    if (sort === 'bedrooms') {
      queryString += ` ORDER BY bedrooms ${order}`
    }
    console.log(queryString)
    const { rows } = await db.query(queryString)
    if (!rows.length) {
      throw new Error(`There is no house corresponding to this query.`)
    }
    res.json(rows)
  } catch (err) {
    console.log(err.message)
    res.json({ error: err.message })
  }
})

// this route gets a specific house ID based on the route parameter

router.get('/houses/:houseId', async (req, res) => {
  let houseId = req.params.houseId
  try {
    const { rows } = await db.query(
      `SELECT * FROM houses WHERE house_id = ${houseId}`
    )
    //if the array is empty throws a specific error
    if (!rows.length) {
      throw new Error(`The house Id number ${houseId} does not exist.`)
    }
    console.log(rows)
    res.json(rows)
  } catch (err) {
    console.log(err.message)
    res.json({ error: err.message })
  }
})

// patch houses route

router.patch('/houses/:houseId', async (req, res) => {
  try {
    const {
      location,
      price_per_night,
      bedroom,
      bathroom,
      description,
      user_id
    } = req.body

    let houseId = req.params.houseId

    //declare the token from the jwt property in the cookie
    let token = req.cookies.jwt

    // if token doesn't exist throw error
    if (!token) {
      throw new Error('Invalid authentication token')
    }

    //else if token does exist verify user_id from the token
    const decodedToken = jwt.verify(token, jwtSecret)

    if (!decodedToken) {
      throw new Error('Invalid authentication token')
    }

    console.log(decodedToken.user_id)

    const userId = decodedToken.user_id

    console.log('userId', userId)

    let patchQueryString = ` UPDATE houses`
    if (
      location ||
      price_per_night ||
      bedroom ||
      bathroom ||
      description ||
      user_id
    ) {
      patchQueryString += ` SET`
      if (location) {
        patchQueryString += ` location = '${location}',`
      }
      if (price_per_night) {
        patchQueryString += ` price_per_night = ${price_per_night},`
      }
      if (bedroom) {
        patchQueryString += ` bedroom = ${bedroom},`
      }
      if (bathroom) {
        patchQueryString += ` bathroom = ${bathroom},`
      }
      if (description) {
        patchQueryString += ` description = '${description}',`
      }
      if (user_id) {
        patchQueryString += ` user_id = ${user_id},`
      }

      patchQueryString = patchQueryString.slice(0, -1)
      patchQueryString += ` WHERE house_id = ${houseId} RETURNING *`
    }

    const resQuery = await db.query(patchQueryString)

    const { rowCount, rows } = resQuery

    if (rowCount === 0) {
      throw new Error(`There is no house corresponding to this query.`)
    }

    if (rows[0].user_id !== userId) {
      throw new Error('You are not authorized')
    }

    res.json(rows[0])
  } catch (err) {
    console.log(err.message)
    res.json({ error: err.message })
  }
})

export default router
