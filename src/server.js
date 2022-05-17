import express from 'express'
import bodyParser from 'body-parser'
import {MongoClient} from 'mongodb'
import path from 'path'
// import cors from 'cors'

 


const app = express()
const port = process.env.PORT || 4001;

// app.use(cors())
app.use(express.static(path.join(__dirname,'/build')))
app.use(bodyParser.json())
// app.use(bodyParser.urlencoded({extended:true}))

const withDB = async (operation,res) => {
    try {
        const client = await MongoClient.connect('mongodb://localhost:27017')
        const db= client.db('my-blog');
       await operation(db)
        client.close() 
    } catch (error) {
        res.send(error)
    }

}

app.get('/api/article/:name', async (req,res)=>{
        
       await withDB( async(db)=> {
            const articleName = req.params.name
            const articles = await db.collection('articles').findOne({name:articleName});
            console.log(articles)
            res.status(200).json(articles)   
        },res)
})

app.post('/api/article/:name/upvote', async(req,res)=>{
    
   await withDB( async(db) => {
        const articleName = req.params.name
    
        const articleInfo = await db.collection('articles').findOne({name:articleName})
        await db.collection('articles').updateOne({name:articleName},{$set:{
            upvotes:articleInfo.upvotes+1
        }})
        const modifiedArticle = await db.collection('articles').findOne({name:articleName})
        res.status(201).json(modifiedArticle)    
    },res)
})

app.post('/api/article/:name/add-comment', async (req,res)=>{
    console.log('body',req.body)  
   await withDB(async (db) => {
        const articleName = req.params.name;
        await db.collection('articles').updateOne({name:articleName},{
            $push:{
                comments:req.body
            }
        })
        const articleInfo = await db.collection('articles').findOne({name:articleName})

        res.json(articleInfo)
    },res)
})

app.get('*',(req,res)=>{
    res.sendFile(path.join(__dirname+'/build/index.html'))
})


app.listen(port, ()=>{
    console.log(`Server connected at port ${port}`)
})