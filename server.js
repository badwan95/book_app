'use strict';
// Load Environment Variables from the .env file
require('dotenv').config();

// Setting up dependencies
const express = require('express');
const superagent = require('superagent');
const PORT = process.env.PORT || 4000;
const app = express();
const pg = require('pg');
const methodOverride = require('method-override');
const client = new pg.Client(process.env.DATABASE_URL);
client.on('error', (err) => console.log(err));

// Setting up the view engine and the pages
app.set('view engine','ejs');
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method'));

// To get the CSS files
app.use(express.static('./public'))

// To get links and paths
app.get('/',homeHandler);
app.get('/books/:id',bookDetails)
app.put('/update/:id',updateBook)
app.delete('/delete/:id',deleteBook)

app.get('/test',(req,res)=>{
  res.render('./pages/searches/new');
})

app.get('/searches/new',(req,res)=>{
  res.render('./pages/searches/new')
})

app.post('/books',addingBook)

app.post('/search',bookRetriever)


// Functions for the paths

function deleteBook(req,res){
  const SQL = 'DELETE FROM books WHERE id=$1'
  const values = [req.params.id]
  client.query(SQL,values).then(results=>res.redirect('/')).catch(err=>errorHandler(err,req,res))
}

function updateBook(req,res){
  const {title,author,pic,description,isbn,bookshelf} = req.body;
  const SQL = 'UPDATE books SET title=$1,author=$2,thumbnail=$3,description=$4,isbn=$5,bookshelf=$6 WHERE id=$7'
  const values = [title,author,pic,description,isbn,bookshelf,req.params.id];
  client.query(SQL,values).then(result=>{
    res.redirect(`/books/${req.params.id}`)
  }).catch(err=>errorHandler(err,req,res))
}

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
    console.log(results.rows);
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