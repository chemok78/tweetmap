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

/*PubNub*/

var parseData = function(message){
//callback function for twitter-pubnub subscribe
        
        if(message.message.place !== null){
        //country is a sub property of message.place. Place is null when it's not provided
        
            console.log(message.message.place.country);
            console.log(message.message.place.country_code);
            console.log(message.message.text);
        
        } else {
            
            return;
            
        }
        
    };//parseData



var geoData = "https://raw.githubusercontent.com/johan/world.geo.json/master/countries.geo.json";

d3.json(geoData, function(data){
    
    var geo = data.features;
    
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
       .attr("class", function(d){ return d.properties.name})
       .attr("d", path);
  
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