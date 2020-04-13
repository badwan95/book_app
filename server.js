'use strict';
// Load Environment Variables from the .env file
require('dotenv').config();

// Setting up dependencies
const express = require('express');
const superagent = require('superagent');
const PORT = process.env.PORT || 4000;
const app = express();
const pg = require('pg');
const client = new pg.Client(process.env.DATABASE_URL);
client.on('error', (err) => console.log(err));

// Setting up the view engine and the pages
app.set('view engine','ejs');
app.use(express.urlencoded({ extended: true }));

// To get the CSS files
app.use(express.static('./public'))

// To get links and paths
app.get('/',homeHandler);
app.get('/books/:id',bookDetails)

app.get('/test',(req,res)=>{
  res.render('./pages/searches/new');
})

app.get('/searches/new',(req,res)=>{
  res.render('./pages/searches/new')
})

app.post('/booksearch',bookRetriever)


// Functions for the paths

function bookDetails(req,res){
  const SQL = 'SELECT * FROM tasks WHERE id=$1;';
  const values = [req.params.id]
  client.query(SQL,values).then(results=>{
    res.render('')
  })
}

function homeHandler(req,res){
  const SQL = 'SELECT * FROM books';
  client.query(SQL)
  .then(results=>{
    console.log(results.rows);
    res.render('./pages/index',{bookResults: results.rows});
  })
}





function bookRetriever(req,res){
  console.log('this is what we are getting', req.body);
  if(req.body.condition === 'title'){
    console.log('search by title')
    let URL = `https://www.googleapis.com/books/v1/volumes?q=${req.body.search}&intitle=${req.body.search}`;
    superagent(URL)
    .then(result=>{
      let bookResults = result.body.items;
      let theList = bookResults.map(value=>{
        console.log(value)
        return new BookList(value);
      });
      res.render('./pages/searches/search',{theList: theList});
    })
    .catch(err=>errorHandler(err,request,response));
  } else if (req.body.condition === 'author'){
    console.log('search by author')
    let URL = `https://www.googleapis.com/books/v1/volumes?q=${req.body.search}&inauthor=${req.body.search}`;
    superagent(URL)
    .then(result=>{
      let bookResults = result.body.items;
      let theList = bookResults.map(value=>{
        console.log(value)
        return new BookList(value);
      });
      res.render('./pages/searches/search',{theList: theList});
    })
    .catch(error=>errorHandler(error,req,res));
  }
}


function errorHandler (error,request,response){
  response.render('./pages/error',{error: error});
}

app.get('*',(req,res)=>{
  res.status(404).send('Error 404: URL Not found.')
})
// Constructor Function

function BookList (data){
  if (data.volumeInfo.title === undefined){
    data.volumeInfo.title = 'No Title Available';
  }
  this.title = data.volumeInfo.title;

  if (data.volumeInfo.imageLinks === undefined){
    data.volumeInfo = {imageLinks:'https://upload.wikimedia.org/wikipedia/commons/thumb/7/72/Placeholder_book.svg/792px-Placeholder_book.svg.png'};;
  }
  this.pic = data.volumeInfo.imageLinks.thumbnail;

  if (data.volumeInfo.authors === undefined){

    data.volumeInfo.authors = ['No Author name Available'];
  }
  this.author = data.volumeInfo.authors[0];

  if (data.volumeInfo.description === undefined){
    data.volumeInfo.description = 'No Description Available';
  }
  this.description = data.volumeInfo.description;
}

app.use(errorHandler);


client.connect().then(() => {
  app.listen(PORT, () => console.log(`Server is up and running on port ${PORT}`));
}).catch(err=> errorHandler(err,request,response));