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

app.post('/books',addingBook)

app.post('/search',bookRetriever)


// Functions for the paths

function addingBook(req,res){
  const SQL = 'INSERT INTO books (title,author,thumbnail,description,isbn,bookshelf) VALUES ($1,$2,$3,$4,$5,$6)';
  const {title,author,pic,description,isbn,bookshelf} = req.body;
  const values = [title,author,pic,description,isbn,bookshelf];
  client.query(SQL,values)
  .then(results=>{
    res.redirect('/');
  }).catch(err=>errorHandler(err,req,res))
}

function bookDetails(req,res){
  const SQL = 'SELECT * FROM books WHERE id=$1;';
  const values = [req.params.id]
  client.query(SQL,values).then(results=>{
    res.render('pages/books/show',{result:results.rows[0]})
  })
  .catch(error=>errorHandler(error,req,res))
}

function homeHandler(req,res){
  const SQL = 'SELECT * FROM books';
  client.query(SQL)
  .then(results=>{
    res.render('./pages/index',{bookResults: results.rows});
  })
  .catch(error=>errorHandler(error,req,res))
}





function bookRetriever(req,res){
  if(req.body.condition === 'title'){
    let URL = `https://www.googleapis.com/books/v1/volumes?q=${req.body.search}&intitle=${req.body.search}`;
    superagent(URL)
    .then(result=>{
      let bookResults = result.body.items;
      let theList = bookResults.map((value)=>{
        return new BookList(value);
      });
      res.render('./pages/searches/search',{theList: theList});
    })
    .catch(err=>errorHandler(err,request,response));
  } else if (req.body.condition === 'author'){
    let URL = `https://www.googleapis.com/books/v1/volumes?q=${req.body.search}&inauthor=${req.body.search}`;
    superagent(URL)
    .then(result=>{
      let bookResults = result.body.items;
      let theList = bookResults.map(value=>{
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
    this.pic = 'https://i.imgur.com/uSgLt7D.png';
  } else {this.pic = data.volumeInfo.imageLinks.thumbnail;}
  
  if (data.volumeInfo.authors === undefined){

    data.volumeInfo.authors = ['No Author name Available'];
  }
  this.author = data.volumeInfo.authors[0];

  if (data.volumeInfo.description === undefined){
    data.volumeInfo.description = 'No Description Available';
  }
  this.description = data.volumeInfo.description;

  if (data.volumeInfo.industryIdentifiers === undefined){
    this.isbn ='No ISBN available.';
  }else {
    this.isbn = data.volumeInfo.industryIdentifiers[0].identifier
  }


}

app.use(errorHandler);


client.connect().then(() => {
  app.listen(PORT, () => console.log(`Server is up and running on port ${PORT}`));
}).catch(err=> errorHandler(err,request,response));