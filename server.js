'use strict';
// Setting up dependencies
require('dotenv').config();
const express = require('express');
const superagent = require('superagent');
const PORT = process.env.PORT || 4000;
const app = express();

// Setting up the view engine and the pages
app.set('view engine','ejs');
// To get the CSS files
app.use(express.static('./public'))
app.get('/',(req,res)=>{
  res.render('./pages/index');
});





app.listen(PORT,()=>{console.log(`Server is up and running on port ${PORT}`)});
