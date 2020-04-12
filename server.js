'use strict';
// Load Environment Variables from the .env file
require('dotenv').config();

// Setting up dependencies
const express = require('express');
const superagent = require('superagent');
const PORT = process.env.PORT || 4000;
const app = express();

// Setting up the view engine and the pages
app.set('view engine','ejs');
app.use(express.urlencoded({ extended: true }));

// To get the CSS files
app.use(express.static('./public'))

// To get links and paths
app.get('/',(req,res)=>{
  res.render('./pages/index');
});

app.get('/')


app.get('/test',(req,res)=>{
  res.render('./pages/searches/new');
})

app.get('/book',(req,res)=>{
  res.render('./pages/searches/new')
})

app.post('/booksearch',bookRetriever)


// Functions for the paths
function bookRetriever(req,res){
  console.log('this is what we are getting', req.body);
  if(req.body.condition === 'title'){
    console.log('search by title')
    let URL = `https://www.googleapis.com/books/v1/volumes?q=${req.body.search}&intitle=${req.body.search}`;
    superagent(URL)
    .then(result=>{
      console.log(result.body.items[1]);
    });
    res.render('./pages/searches/show');
  } else if (req.body.condition === 'author'){
    console.log('search by author')
    let URL = `https://www.googleapis.com/books/v1/volumes?q=${req.body.search}&inauthor=${req.body.search}`;
    superagent(URL)
    .then(result=>{
      let bookResults = result.body.items;
      let theList = bookResults.map(value=>{
        if (value.volumeInfo.description === undefined){
          value.volumeInfo.description = 'No Description Available';
        }
        return new BookList(value);
      })

      console.log(theList);

    });
    res.render('./pages/searches/show');
  }
}


// Constructor Function
/* 
we need picture of book, book title, author name and description
picture book is bookresult.volumeInfo.imageLinks.thumbnail
book title is bookresults.volumeInfo.title
author name bookresults.volumeInfo.authors[0]
*/
function BookList (data){
  this.title = data.volumeInfo.title;
  this.pic = data.volumeInfo.imageLinks.thumbnail;
  this.author = data.volumeInfo.authors[0];
  this.description = data.volumeInfo.description;
}


app.listen(PORT,()=>{console.log(`Server is up and running on port ${PORT}`)});
