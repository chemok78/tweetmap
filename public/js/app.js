/*global d3*/
/*global PubNub*/

//set margins for div container, SVG and chart area(g element)
var margin = {
  top: 20,
  right: 20,
  bottom: 20,
  left: 20
};

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

var geoData = "https://res.cloudinary.com/dettjqo9j/raw/upload/v1486657302/countries_njy53j.json";

var boxPosition = document.getElementById("area").getBoundingClientRect();

var boxHeight = 330;

d3.select("#chart").append("div")
  .attr("id", "tweetbox")
  .style("background-color", "#bdc3c7")
  .style("opacity", 1)
  .style("border-radius", "25px")
  .style("left", boxPosition.left - margin.right + "px")
  .style("top", boxPosition.top + (h - boxHeight) + "px")
  .style("width", "300px")
  .style("height", boxHeight + "px");

d3.json(geoData, function(data) {

  //raw data for drawing global map
  var geo = data.features;

  //remove antartica from map
  var antartica = geo.map(function(item) {

    return item.id;

  }).indexOf("AQ");

  geo.splice(antartica, 1);

  //parsed data for text mining and manipulating the map
  var geoParsed = [];

  geo.forEach(function(item) {

    var country = {

      id: item.properties.name,

      code: item.id,

      happy: 0,

      unhappy: 0
    };

    geoParsed.push(country);

  });

  //the max happiness counter can reach
  //for use in d3 scales
  //so counter starts at 0 for each country. 
  var maxCount = 100;

  var colorCodes = ["#f39c12", "#2c3e50", "#16a085", "#7F8C8D"];
  var colorLabels = ["Happy", "UnHappy", "Equal", "No Data"];

  //Scale to return color codes        
  var color = function(element) {

    if (element.happy > element.unhappy) {

      return colorCodes[0];

    } else if (element.happy < element.unhappy) {

      return colorCodes[1];

    } else if (element.happy === element.unhappy) {

      return colorCodes[2];

    }

  };

  //tooltip for displaying countries, fully opaque first and shown on mouse-over
  var tip = d3.select("#chart").append("div")
    .attr("class", "tooltip")
    .attr("opacity", 0);

  //tooltip for displaying tweets belonging to emoticon on map                            
  var emoticonTip = d3.select("#chart").append("div")
    .attr("class", "emoticonTip")
    .attr("opacity", 0);

  var projection = d3.geo.mercator()
    .scale(160)
    .translate([w / 2, h / 1.7]);

  //path generator for drawing map based on projection
  var path = d3.geo.path()
    .projection(projection);

  //draw map
  svg.selectAll("path")
    .data(geo)
    .enter()
    .append("path")
    .attr("fill", "#7f8c8d")
    .attr("stroke", "#34495e")
    .attr("stroke-width", 0.5)
    .attr("class", function(d) {
      return d.id
    })
    .attr("d", path)
    .on("mouseover", function(d) {

      tip.transition()
        .style("opacity", 0.7);
      tip.html("<strong>" + d.properties.name + "</strong>")
        .style("left", d3.event.pageX + "px")
        .style("top", d3.event.pageY - 70 + "px");

    })
    .on("mouseout", function(d) {

      tip.transition()
        .style("opacity", 0);

    });

  /*Legend*/

  var blockWidth = 90;
  var blockHeight = 15;

  //create and add a SVG group for the legend, no position yet
  var legend = svg.selectAll(".legend")
    //each block = circle + text in a g element and shifted to the right using the blockwidth
    .data(colorCodes)
    .enter()
    .append("g")
    .attr("class", "legend")
    .attr("font-size", "13px")
    .attr("font-style", "Work Sans")
    .attr("transform", function(d, i) {

      return ("translate(" + i * blockWidth + ",0)");

    });

  //append a circle to each g element   
  legend.append("rect")
    .attr("x", w - 340)
    .attr("y", 0)
    .attr("width", blockWidth)
    .attr("height", blockHeight)
    .style("fill", function(d, i) {

      return (colorCodes[i]);

    });

  //append legend text to each element      
  legend.append("text")
    .attr("x", (w - 340) + (blockWidth / 2))
    .attr("y", blockHeight + 15)
    .text(function(d, i) {

      return colorLabels[i];

    })
    .style("text-anchor", "middle");

  //create date function for use in displaying tweets
  var createDate = function() {


    var d = new Date();

    return d;

  };

  /*PubNub*/

  var happy = [
    'happy', 'lucky', 'awesome', 'excited', 'fun', 'amusing', 'amused', 'pleasant', 'pleasing', 'glad', 'enjoy',
    'jolly', 'delightful', 'joyful', 'joyous', ':-)', ':)', ':-D', ':D', '=)', '☺'
  ];

  var unhappy = [
    'sad', 'alone', 'disappointed', 'disappointing', 'sigh', 'sobbing', 'crying', 'cried',
    'dumped', 'heartbroken', 'helpless', 'hurt', 'miserable', 'misunderstood', ':('
  ];

  var parseData = function(message) {
    //callback function for twitter-pubnub subscribe

    if (message.message.place !== null) {
      //country is a sub property of message.place. Place is null when it's not provided
      //if no place is provided(null), no need to do stuffs below

      //extract data we use
      var data = {

        country: message.message.place.country,
        country_code: message.message.place.country_code,
        text: message.message.text.toLowerCase(),
        position: [],
        textRaw: message.message.text,
        place: message.message.place.full_name,
        timestamp: message.message.timestamp_ms,
        name: message.message.user.name,
        screenname: message.message.user.screen_name,
        profileImage: message.message.user.profile_image_url_https,
        url: message.message.user.url,

      };

      //sentiment analysis: check if message.message.text contains a keyword in happy or in unhappy

      var isHappy = happy.some(function(item) {

        return (data.text.indexOf(item) !== -1);
        //if item is not found in iteration, returns false
        //if item is found in iteration, it returns true and stops

      });

      var isUnhappy = unhappy.some(function(item) {

        return (data.text.indexOf(item) !== -1);

      });

      if (isHappy === true) {

        if (message.message.geo) {
          //if geo object exists        

          data.position = message.message.geo.coordinates;

          var emoticonPosition = projection([data.position[1], data.position[0]]);

          //add emoticon to the map   
          svg.append("svg:image")
            .attr("x", emoticonPosition[0])
            .attr("y", emoticonPosition[1])
            .attr("xlink:href", "https://res.cloudinary.com/dettjqo9j/image/upload/c_scale,h_16,w_16/v1486610569/smiling-face_tqhkre.png")
            .attr("width", 16)
            .attr("height", 16)
            .on("mouseover", function() {


              emoticonTip.transition()
                .duration(200)
                .style("opacity", 0.7);
              emoticonTip.html(data.screenname + ": " + data.textRaw)
                .style("left", d3.event.pageX + "px")
                .style("top", d3.event.pageY - 40 + "px");

            })
            .on("mouseout", function(d) {

              emoticonTip.transition()
                .duration(200)
                .style("opacity", 0);

            });

        }


        var elementPos = geoParsed.map(function(x) {
          //find the country position in the geoParsed array    

          return x.code;

        }).indexOf(data.country_code);

        //geoParsed is an array of country names from geojson data
        //compare with country names from Twitter data

        if (typeof geoParsed[elementPos] !== "undefined") {
          //only when elementPos is not -1 (not found), making geoParsed[elementPos] is undefined
          //some countries of the tweets are not on our ma

          if (geoParsed[elementPos].happy < maxCount) {
            //add to happiness count only when has not reached maxCount yet    

            geoParsed[elementPos].happy += 1;

          }

          //check and edit color of the country on the map
          d3.select("." + data.country_code)
            .attr("fill", function() {
              return color(geoParsed[elementPos])
            });

          //show tweet in box
          document.getElementById("tweetbox").innerHTML = "<img " + "src='" + data.profileImage + "' class='img-rounded profileimage'>" + "<strong class='name'>" + data.name + "</strong><br><p class='screenname'>@" + data.screenname + "</p><br><p class='textRaw'>" + data.textRaw + "</p><br><p class='time'>" + createDate() + "</p><br><p class='place'>" + data.country + " | " + data.place + "</p><br>" + "<img src='https://res.cloudinary.com/dettjqo9j/image/upload/c_scale,w_48/v1486610569/smiling-face_tqhkre.png' class='boxemoticon'>";


        }


      } else if (isUnhappy === true) {


        if (message.message.geo) {
          //if geo object exists        

          data.position = message.message.geo.coordinates;


          var emoticonPosition = projection([data.position[1], data.position[0]]);


          svg.append("svg:image")
            .attr("x", emoticonPosition[0])
            .attr("y", emoticonPosition[1])
            .attr("xlink:href", "https://res.cloudinary.com/dettjqo9j/image/upload/c_scale,w_16/v1486610562/pensive-face_mqp5ca.png")
            .attr("width", 16)
            .attr("height", 16)
            .on("mouseover", function() {


              emoticonTip.transition()
                .duration(200)
                .style("opacity", 0.7);
              emoticonTip.html(data.screenname + ": " + data.textRaw)
                .style("left", d3.event.pageX + "px")
                .style("top", d3.event.pageY - 40 + "px");

            })
            .on("mouseout", function(d) {

              emoticonTip.transition()
                .duration(200)
                .style("opacity", 0);

            });

        }

        var elementPos = geoParsed.map(function(x) {
          //find the country position in the geoParsed array    

          return x.code;

        }).indexOf(data.country_code);

        if (typeof geoParsed[elementPos] !== "undefined") {
          //error handling: only when elementPos is not -1 (not found), making geoParsed[elementPos] is undefined

          if (geoParsed[elementPos].unhappy < maxCount) {
            //add to happiness count only when has not reached twenty yet    

            geoParsed[elementPos].unhappy += 1;

          }

          d3.select("." + data.country_code)
            .attr("fill", function() {
              return color(geoParsed[elementPos])
            });

          document.getElementById("tweetbox").innerHTML = "<img " + "src='" + data.profileImage + "' class='img-rounded profileimage'>" + "<strong class='name'>" + data.name + "</strong><br><p class='screenname'>@" + data.screenname + "</p><br><p class='textRaw'>" + data.textRaw + "</p><br><p class='time'>" + createDate() + "</p><br><p class='place'>" + data.country + " | " + data.place + "</p><br>" + "<img src='https://res.cloudinary.com/dettjqo9j/image/upload/c_scale,w_48/v1486610562/pensive-face_mqp5ca.png' class='boxemoticon'>";

        }


      }


    } else {


      return;

    } //if message.message.place is null

  }; //parseData

  // Create PubNub Socket Handler
  const pubnub = new PubNub({
    publishKey: 'empty',
    ssl: true,
    subscribeKey: 'sub-c-78806dd4-42a6-11e4-aed8-02ee2ddab7fe'
  });


  // Subscribe to Twitter feed
  console.log("Subscribing to Live Twitter Stream.");
  pubnub.subscribe({
    channels: ['pubnub-twitter']
  });

  // Add Socket Event Function Handlers
  pubnub.addListener({

    message: function(message) {

      parseData(message);

    }

  }); //addListener

});