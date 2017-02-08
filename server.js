var express = require("express");

require("dotenv").config({
    
    silent:true
    
});

var path = require("path");

var bodyParser = require("body-parser");

var app = express();

app.use(express.static(__dirname + "/public"));
//serve static files from public folder
//serve index.html from this folder

app.use(bodyParser.json());

var server = app.listen(process.env.PORT || 8080, function(){
    
    var port = server.address().port;
    
    console.log("App is now running on port ", port);
    
});

function handleError(res,reason,message,code){
    
    console.log("ERROR: " + reason);
    
    res.status(code || 500).json({
        
       "error": message 
        
    });
    
};

