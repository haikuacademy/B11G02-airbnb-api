import { Router } from 'express'
import db from '../db.js'

const router = Router()

// create Post request

router.post('/houses', async (req, res) => {
  const { location, price_per_night, bedroom, bathroom, description, user_id } =
    req.body
  const postQueryString = `
  INSERT INTO houses (location, price_per_night, bedroom, bathroom, description, user_id)
  VALUES ('${location}', ${price_per_night}, ${bedroom}, ${bathroom}, '${description}', ${user_id})
  RETURNING * `
  console.log(postQueryString)
  try {
    const { rows } = await db.query(postQueryString)
    res.json(rows)
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

export default router
