/*global d3*/
/*global PubNub*/

//set margins for div container, SVG and chart area(g element)
var margin = {top: 20, right: 20, bottom: 20, left: 20};

//width and height of chart, within SVG element
var w = 1100 - margin.left - margin.right,
    h = 900 - margin.top - margin.bottom;

//Create SVG element and append to #chart div container
var svg = d3.select("#chart")
            .append("svg")
              .attr("width", w + margin.left + margin.right)
              .attr("height", h + margin.top + margin.bottom)
            .append("g")
              .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

var geoData = "https://raw.githubusercontent.com/johan/world.geo.json/master/countries.geo.json";

d3.json(geoData, function(data){
    
    //raw data for drawing global map
    var geo = data.features;
    
    //parsed data for text mining and manipulating the map
    var geoParsed = [];
    
    geo.forEach(function(item){
        
        var country = {
            
            id: item.properties.name.toLowerCase(),
            
            count: 0
            //happyness index starting at 0
            
        };
        
        geoParsed.push(country);
        
    });
    
    console.log(geoParsed);
    
    
    var projection = d3.geo.mercator()
                       .scale(150)
                       .translate([w/2,h/2]);
    
    var path = d3.geo.path()
                     .projection(projection);
    
    svg.selectAll("path")
       .data(geo)
       .enter()
       .append("path")
       .attr("fill", "#95E1D3")
       .attr("stroke", "#34495e")
       .attr("stroke-width", 0.5)
       .attr("class", function(d){ return d.properties.name.toLowerCase()})
       //.attr("class", function(d){ return d.id})
       .attr("d", path);
       
    /*PubNub*/

    var happy = [
		'happy', 'lucky', 'awesome', 'excited', 'fun', 'amusing', 'amused', 'pleasant', 'pleasing', 'glad', 'enjoy',
		'jolly', 'delightful', 'joyful', 'joyous', ':-)', ':)', ':-D', ':D', '=)','☺'
    ];

    var unhappy = [
		'sad', 'alone', 'disappointed', 'disappointing', 'sigh', 'sobbing', 'crying', 'cried', 
'dumped', 'heartbroken', 'helpless', 'hurt', 'miserable', 'misunderstood', ':('];

    var parseData = function(message){
    //callback function for twitter-pubnub subscribe
        
        if(message.message.place !== null){
        //country is a sub property of message.place. Place is null when it's not provided
        
        //local variables in if statement
        var country = message.message.place.country.toLowerCase();
        var country_code = message.message.place.country_code;
        var text = message.message.text.toLowerCase();
   
             //check if message.message.text contains a keyword in happy or in unhappy
             
             var isHappy = happy.some(function(item){
            //some method loops through array and executes a function
            //some returns true if one item returns true and stops
            //if not it returns false

		        return(text.indexOf(item) !== -1)
                //if item is not found in iteration, returns false
                //if item is found in iteration, it returns true and stops

            });
            
            var isUnhappy = unhappy.some(function(item){
                
                return (text.indexOf(item) !== -1);
                
            });
            
            if(isHappy === true){
                
                //console.log("we found a happy user!");
                //console.log(message.message.text);
                
                var elementPos = geoParsed.map(function(x){
                //find the country position in the geoParsed array    
                    
                    return x.id;
                    
                }).indexOf(country);

                console.log(elementPos);
                
                if(typeof geoParsed[elementPos] !== "undefined"){
                //error handling: only when elementPos is not -1 (not found), making geoParsed[elementPos] is undefined
                    
                    //console.log(geoParsed[elementPos].count);
                    
                    geoParsed[elementPos].count += 1;
                    
                    //console.log(geoParsed[elementPos].count);
                    
                    d3.select("." + country )
                      .attr("fill", "#c0392b");
                    
                }    
                
            } else if (isUnhappy === true){
                
                
                //console.log("we found a unhappy user!");
                //console.log(message.message.text);
                
            }
                
            
            
        } else {
            
            
            return;
            
        }//if message.message.place is null
        
    };//parseData

    // Create PubNub Socket Handler
    const pubnub = new PubNub({
        publishKey   : 'empty',   
        ssl          : true,
        subscribeKey : 'sub-c-78806dd4-42a6-11e4-aed8-02ee2ddab7fe'
    });


    // Subscribe to Twitter feed
    console.log("Subscribing to Live Twitter Stream.");
    pubnub.subscribe({ channels: ['pubnub-twitter'] });
    

    // Add Socket Event Function Handlers
    pubnub.addListener({
    //status  : statusEvent => console.log(statusEvent),
    //message : message     => console.log(message.message.text, message.message.place.country)
    
    message: function(message){
        
        parseData(message);
        
    }
    
    });//addListener
  
});//d3.json