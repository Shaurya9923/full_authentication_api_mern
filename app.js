import dotenv from 'dotenv'
dotenv.config()
import express from 'express'
import cors from 'cors'
import connectDb from './config/connectdb.js'
import userRoutes from './routes/userRoutes.js'

const app = express()
const port = process.env.PORT
const DATABASE_URL = process.env.DATABASE_URL

app.use(cors())
connectDb(DATABASE_URL)
app.use(express.json())
app.use('/api/user', userRoutes)

app.listen(port, ()=>{
    console.log(`Server listening on port ${port} at http://localhost:${port}`)
})