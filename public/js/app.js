/*global d3*/

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
  
  
/*var pubnub = new PubNub({
   
     subscribeKey : "sub-c-bfd05418-ed19-11e6-94bb-0619f8945a4f",
  
     ssl:true
   
   });
  
    pubnub.subscribe({
    
    channels:['pubnub-twitter'],
      
    withPresence: true

     });
  
   pubnub.addListener({
    
    message: function(m) {
      
        console.log(m);    
      
    },
     
   presence: function(p){

     
   },
     
   status: function(s){
     
   }
    
  })*/

  
})