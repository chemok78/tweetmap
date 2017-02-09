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
              .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
              .attr("id", "area");
              
//var geoData = "https://raw.githubusercontent.com/johan/world.geo.json/master/countries.geo.json";

var geoData = "https://res.cloudinary.com/dettjqo9j/raw/upload/v1486657302/countries_njy53j.json";

d3.json(geoData, function(data){
    
    //raw data for drawing global map
    var geo = data.features;
    
    //remove antartica from map
    /*var antartica = geo.map(function(item){
        
        return item.id;
        
    }).indexOf("ATA");
    
    geo.splice(antartica, 1);*/
    
    /*for(var i = 0; i < geo.length; i++){
        
        switch(geo[i].properties.name){
            
            case "United States of America":
                geo[i].properties.name = "united states";
        }
        
        
    }*/
    
    //parsed data for text mining and manipulating the map
    var geoParsed = [];
    
    geo.forEach(function(item){
        
        var country = {
            
            id: item.properties.name,
            
            code: item.id,
            
            happy: 0,
            //happyness index starting at 0
            
            unhappy: 0
        };
        
        geoParsed.push(country);
        
    });
    
    
    console.log(geoParsed);
    
    //the max happiness counter can reach
    //for use in d3 scales
    //so counter starts at 0 for each country. 
    //When found happy keyword +1, if unhappy keyword -1. Can go max up to 20
    var maxCount = 20;
    
    /*var color = d3.scale.linear()
            .domain([0,maxCount])
            .range(["#d35400","#f39c12"]);
            //going from dark color to bright orange*/
            
    var colorCodes = ["#f39c12", "#2c3e50", "#16a085", "#7F8C8D"]; 
    var colorLabels = ["Happy", "UnHappy", "Equal", "No Data"];
            
    var color = function(element){
        
        if (element.happy > element.unhappy){
            
             return colorCodes[0];            
            
        } else if (element.happy < element.unhappy){
            
             return colorCodes[1];
            
        } else if (element.happy === element.unhappy){
            
            return colorCodes[2];
            
        }
        
    };     
    
    var tip = d3.select("#chart").append("div")
                                 .attr("class","tooltip")
                                 .attr("opacity", 0);
                                 
    /*var emoticonTip = d3.select("#chart").append("div")
                                         .attr("class", "emoticonTip")
                                         .attr("opacity", 0);*/

    var projection = d3.geo.mercator()
                       .scale(150)
                       .translate([w/2,h/2]);
    
    var path = d3.geo.path()
                     .projection(projection);
    
    svg.selectAll("path")
       .data(geo)
       .enter()
       .append("path")
       .attr("fill", "#7f8c8d")
       .attr("stroke", "#34495e")
       .attr("stroke-width", 0.5)
       //.attr("class", function(d){ return d.properties.name.toLowerCase()})
       .attr("class", function(d){ return d.id})
       .attr("d", path)
       .on("mouseover", function(d){
           
           tip.transition()
              .style("opacity", 0.7);
           tip.html("<strong>" + d.properties.name + "</strong>")
              .style("left", d3.event.pageX + "px")
              .style("top", d3.event.pageY - 70 + "px");
           
       })
       .on("mouseout", function(d){
           
           tip.transition()
              .style("opacity", 0);
           
       });
       
    /*Legend*/
    
    var blockWidth = 90;
    var blockHeight = 15;
    var blockMargin = 10;
    
    var legend = svg.selectAll(".legend")
    //each block = circle + text in a g element and shifted to the right using the blockwidth
                   .data(colorCodes)
                   .enter()
                   .append("g")
                   .attr("class", "legend")
                   .attr("font-size", "13px")
                   .attr("font-style", "Work Sans")
                   .attr("transform", function(d,i){
                       
                       return ("translate(" + i * blockWidth + ",0)");
                       
                   });
       
    //append a circle to each g element   
    legend.append("rect")
          .attr("x", w - 340 )
          .attr("y", 0)
          .attr("width", blockWidth)
          .attr("height", blockHeight)
          .style("fill", function(d,i){
              
              return(colorCodes[i]);
              
          });
          
    legend.append("text")
          .attr("x", (w - 340) + (blockWidth/2))
          .attr("y", blockHeight + 15)
          .text(function(d,i){
              
              return colorLabels[i];
              
          })
          .style("text-anchor", "middle");
       
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
        //if no place is provided(null), no need to do things below
        
        //local variables in if statement
        var country = message.message.place.country;
        var country_code = message.message.place.country_code;
        var text = message.message.text.toLowerCase();
        var position = [];
   
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
                
                console.log(message.message);
                
                if(message.message.geo){
                //if geo object exists        
                    
                    position = message.message.geo.coordinates;
                    
                    var emoticonPosition = projection([position[1],position[0]]);
                       
                    svg.append("svg:image")
                       .attr("x", emoticonPosition[0])
                       .attr("y", emoticonPosition[1])
                       .attr("xlink:href", "https://res.cloudinary.com/dettjqo9j/image/upload/c_scale,h_16,w_16/v1486610569/smiling-face_tqhkre.png")
                       .attr("width", 16)
                       .attr("height", 16);
                    }
                    
                
                var elementPos = geoParsed.map(function(x){
                //find the country position in the geoParsed array    
                    
                    return x.code;
                    
                    
                }).indexOf(country_code);
                
                //geoParsed is an array of country names from geojson data
                //compare with country names from Twitter data
                
                console.log(country);
                console.log(country_code);
                console.log(geoParsed[elementPos]);
                
                
                if(typeof geoParsed[elementPos] !== "undefined"){
                //error handling: only when elementPos is not -1 (not found), making geoParsed[elementPos] is undefined
                    
                    if(geoParsed[elementPos].happy < maxCount){
                    //add to happiness count only when has not reached twenty yet    
                        
                        geoParsed[elementPos].happy += 1;
                        
                    }
                    
                    d3.select("." + country_code )
                      .attr("fill", function(){ return color(geoParsed[elementPos])});
                    
                }
                
                
            } else if (isUnhappy === true){
    
                
                 if(message.message.geo){
                //if geo object exists        
                    
                    position = message.message.geo.coordinates;
                    
                    
                    var emoticonPosition = projection([position[1],position[0]]);
    
                       
                    svg.append("svg:image")
                       .attr("x", emoticonPosition[0])
                       .attr("y", emoticonPosition[1])
                       .attr("xlink:href", "https://res.cloudinary.com/dettjqo9j/image/upload/c_scale,w_16/v1486610562/pensive-face_mqp5ca.png")
                       .attr("width", 16)
                       .attr("height", 16)
                       /*.on("mouseover", function(d){
                           
                           console.log(d);
                           
                           emoticonTip.transition()
                                      .style("opacity", 0.7);
                           emoticonTip.html(d.user.screen_name + ": " + d.message.text)
                                      .style("left", d3.event.pageX + "px")
                                      .style("top", d3.event.pageY - 40 + "px");
                           
                       })
                       .on("mouseout", function(d){
                           
                           emoticonTip.transition()
                                      .style("opacity", 0);
                           
                       });*/   
                    
                }
                
                var elementPos = geoParsed.map(function(x){
                //find the country position in the geoParsed array    
                    
                    return x.code;
                    
                }).indexOf(country_code);
                
                if(typeof geoParsed[elementPos] !== "undefined"){
                //error handling: only when elementPos is not -1 (not found), making geoParsed[elementPos] is undefined
                    
                    if(geoParsed[elementPos].unhappy < maxCount){
                    //add to happiness count only when has not reached twenty yet    
                        
                        geoParsed[elementPos].unhappy += 1;
                        
                    }
                    
                    d3.select("." + country_code )
                      .attr("fill", function(){return color(geoParsed[elementPos])});
                    
                }    
                
                
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
    
    message: function(message){
        
        parseData(message);
        
    }
    
    });//addListener
  
});//d3.json