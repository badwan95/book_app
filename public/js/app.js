'use strict';
console.log('hi');
$(document).ready(function() {
    console.log('hi from jQuery');
    $('#updateButton').click(()=>{
        $('.updateForm').toggle();
    })
});
