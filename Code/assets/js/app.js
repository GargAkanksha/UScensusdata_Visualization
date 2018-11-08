d3.select(window).on("resize", makeResponsive);


makeResponsive();

function makeResponsive() {

    // if the SVG area isn't empty when the browser loads,
    // remove it and replace it with a resized version of the chart
    var svgArea = d3.select("body").select("svg");

    if (!svgArea.empty()) {
        svgArea.remove();
    }

        // svg params
    var svgHeight = window.innerHeight-150;
    var svgWidth = window.innerWidth-120;

        // margins
    var margin = {
        top: 60,
        right: 300,
        bottom: 100,
        left: 100
    };

        // chart area minus margins
    var height = svgHeight - margin.top - margin.bottom;
    var width = svgWidth - margin.left - margin.right;

    // Create an SVG wrapper, append an SVG group that will hold our chart,
    // and shift the latter by left and top margins.
    var svg = d3.select("#scatter")
    .append("svg")
    .attr("width",svgWidth)
    .attr("height",svgHeight);

    // Append an SVG group
    var chartGroup = svg.append("g")
            .attr("transform",`translate(${margin.left}, ${margin.top})`);

    // ===========================================================================

    // Initial x and y parameters
    var chosenXAxis = "poverty";
    var chosenYAxis = "healthcare";

    // function used for updating x-scale and y-scale variables upon click on axis label
    function xyScale(censusData, chosenXAxis, chosenYAxis) {
        // create x-scale
        if(chosenXAxis != "income"){
            var xLinearScale = d3.scaleLinear()
                    .domain([d3.min(censusData, d=>d[chosenXAxis])-1, d3.max(censusData, d=>d[chosenXAxis])])
                    .range([0, width]);
        }
        else{
            var xLinearScale = d3.scaleLinear()
                    .domain([d3.min(censusData, d=>d[chosenXAxis])-5000, d3.max(censusData, d=>d[chosenXAxis])])
                    .range([0, width]);
        }

        // create y-scale
        var yLinearScale = d3.scaleLinear()
                .domain([d3.min(censusData, d=>d[chosenYAxis])-1, d3.max(censusData, d=>d[chosenYAxis])])
                .range([height,0]);

        
        return [xLinearScale, yLinearScale];  
    };

    // ==============================================================================

    // function used for updating xAxis and yAxis variables upon click on axis label
    function renderAxes(newXScale,newYScale, xAxis, yAxis) {
        var bottomAxis = d3.axisBottom(newXScale);
    
        xAxis.transition()
            .duration(1000)
            .call(bottomAxis);

        var leftAxis = d3.axisLeft(newYScale);

        yAxis.transition()
            .duration(1000)
            .call(leftAxis);
    
        return [xAxis, yAxis];
    };

    // =============================================================================

    // function used for updating circles group with a transition to new circles
    function renderCircles(circlesGroup, newXScale, chosenXaxis, newYScale, chosenYAxis) {

        circlesGroup.transition()
        .duration(1000)
        .attr("cx", d => newXScale(d[chosenXAxis]))
        .attr("cy", d=>newYScale(d[chosenYAxis]));
    
        return circlesGroup;
    };

    function stateAbbrs(circleAbbr, newXScale, chosenXAxis, newYScale, chosenYAxis) {
        circleAbbr.transition()
        .duration(1000)
        .attr("dx", d=> newXScale(d[chosenXAxis]))
        .attr("dy", d=> newYScale(d[chosenYAxis])+5)
        return circleAbbr;
    };

    // ===============================================================================

    // function used for updating circles group with new tooltip
    function updateToolTip(chosenXAxis, chosenYAxis, circlesGroup) {

        if (chosenXAxis === "poverty") {
        var xlabel = "Poverty:";
        }
        else if (chosenXAxis === "age") {
        var xlabel = "Age:";
        }
        else{
            var xlabel = "Income:"
        };

        if (chosenYAxis === "healthcare") {
            var ylabel = "Healthcare:";
        }
        else if (chosenYAxis === "obesity") {
            var ylabel = "Obesity:";
        }
        else{
            var ylabel = "Smokes:"
        };
    
        var toolTip = d3.tip()
        .attr("class", "d3-tip")
        .html(function(d) {
            return (`${d.state}<br>${xlabel} ${d[chosenXAxis]}<hr>${ylabel} ${d[chosenYAxis]}`);
        });
    
        circlesGroup.call(toolTip);

        // mouseover and mouseout events
        circlesGroup
                .on("mouseover", function(data){
                    toolTip.show(data,this);
                })
                .on("mouseout", function(data, index){
                    toolTip.hide(data);
                });
        
        return circlesGroup;
        };

    // ===============================================================================

    // Retrive data from the csv file and plot the graph
    var file = "https://raw.githubusercontent.com/GargAkanksha/USCensusData-InteractivePlotting/master/data/data.csv";
    d3.csv(file).then(successHandle,errorHandle);

    function errorHandle(err){
        throw err;
    };

    function successHandle(censusData){
        //parse data
        censusData.forEach(function(d){
            d.poverty = +d.poverty;
            d.age = +d.age;
            d.income = +d.income;
            d.healthcare = +d.healthcare;
            d.obesity = +d.obesity;
            d.smokes = +d.smokes;
        });

        // create x-scale and y-scale
        var scale = xyScale(censusData, chosenXAxis, chosenYAxis);
        var xScale = scale[0];
        var yScale = scale[1];
        // console.log(xScale);
        // console.log(yScale);

        // create initial axis
        var bottomAxis = d3.axisBottom(xScale);
        var leftAxis = d3.axisLeft(yScale);

        // append x axis
        var xAxis = chartGroup.append("g")
            .classed("x-axis", true)
            .attr("transform", `translate(0, ${height})`)
            .call(bottomAxis);  
    
        
        // append y axis
        var yAxis = chartGroup.append("g")
            .call(leftAxis);


        // append initial circles
        var circlesGroup = chartGroup.selectAll("circle")
        .data(censusData)
        .enter()
        .append("circle")
        .attr("cx", d => xScale(d[chosenXAxis]))
        .attr("cy", d => yScale(d[chosenYAxis]))
        .attr("r", 13)
        .classed("stateCircle",true);

        // state abbr text on the circles
        var circleAbbr = chartGroup.append("g").selectAll("text")
        .data(censusData)
        .enter()
        .append("text")
        .classed("stateText",true)
        .text(d=>d.abbr)
        .attr("dx", d=> xScale(d[chosenXAxis]))
        .attr("dy", d=> yScale(d[chosenYAxis])+3)
        .style("font-size", "10px")
        .style("font-weight", "bold");

        // Create group for  3 x-axis labels
        var xlabelsGroup = chartGroup.append("g")
        .attr("transform", `translate(${width / 2}, ${height + 20})`);

        var povertyLabel = xlabelsGroup.append("text")
        .attr("x", 0)
        .attr("y", 20)
        .attr("value", "poverty") // value to grab for event listener
        .classed("active", true)
        .text("Poverty(%)");

        var ageLabel = xlabelsGroup.append("text")
        .attr("x", 0)
        .attr("y", 40)
        .attr("value", "age") // value to grab for event listener
        .classed("inactive", true)
        .text("Age(median)");

        var incomeLabel = xlabelsGroup.append("text")
        .attr("x", 0)
        .attr("y", 60)
        .attr("value", "income") // value to grab for event listener
        .classed("inactive", true)
        .text("Household income(median)");

        // Create group for  3 y-axis labels
        var ylabelsGroup = chartGroup.append("g")
        .attr("transform", "rotate(-90)");

        var healthcareLabel = ylabelsGroup.append("text")
        .attr("x",0 - (height/2))
        .attr("y", 0-margin.left+12)
        .attr("value", "healthcare") // value to grab for event listener
        .classed("active", true)
        .text("Lacks Healthcare(%)");

        var obesityLabel = ylabelsGroup.append("text")
        .attr("x", 0-(height/2))
        .attr("y", 0-margin.left+12+20)
        .attr("value", "obesity") // value to grab for event listener
        .classed("inactive", true)
        .text("Obesity(%)");

        var smokesLabel = ylabelsGroup.append("text")
        .attr("x", 0-(height/2))
        .attr("y", 0-margin.left+12+40)
        .attr("value", "smokes") // value to grab for event listener
        .classed("inactive", true)
        .text("Smokes(%)");

        // updateToolTip function above csv import
        var circlesGroup = updateToolTip(chosenXAxis, chosenYAxis, circlesGroup); 

        // x axis labels event listener
        xlabelsGroup.selectAll("text")
        .on("click", function() {
            // get value of selection
            var xvalue = d3.select(this).attr("value");
            if (xvalue !== chosenXAxis) {

                // replaces chosenXAxis with value
                chosenXAxis = xvalue;

                // console.log(chosenXAxis)

                // functions here found above csv import
                // updates x-scale, y-scale for new data
                var xScale = xyScale(censusData, chosenXAxis, chosenYAxis)[0];
                var yScale = xyScale(censusData, chosenXAxis, chosenYAxis)[1];

                // updates x-axis and y-axis with transition        
                xAxis = renderAxes(xScale,yScale, xAxis, yAxis)[0];
                yAxis = renderAxes(xScale,yScale, xAxis, yAxis)[1];
                
                // updates circles with new x values
                circlesGroup = renderCircles(circlesGroup, xScale, chosenXAxis, yScale, chosenYAxis);

                // updates tooltips with new info
                circlesGroup = updateToolTip(chosenXAxis, chosenYAxis, circlesGroup);
                
                //update state abbr.
                circleAbbr = stateAbbrs(circleAbbr,xScale,chosenXAxis,yScale,chosenYAxis);

                // changes classes to change bold text
                if (chosenXAxis === "age") {
                    ageLabel
                    .classed("active", true)
                    .classed("inactive", false);
                    incomeLabel
                    .classed("active",false)
                    .classed("inactive",true)
                    povertyLabel
                    .classed("active", false)
                    .classed("inactive", true);
                }
                else if(chosenXAxis === "income") {
                    incomeLabel
                    .classed("active", true)
                    .classed("inactive", false);
                    ageLabel
                    .classed("active", false)
                    .classed("inactive", true);
                    povertyLabel
                    .classed("active", false)
                    .classed("inactive",true);
                }
                else{
                    povertyLabel
                    .classed("active", true)
                    .classed("inactive", false);
                    ageLabel
                    .classed("active",false)
                    .classed("inactive",true);
                    incomeLabel
                    .classed("active",false)
                    .classed("inactive",true);
                }
            }
        });
        
        // y-axis labels event listener
        ylabelsGroup.selectAll("text")
        .on("click", function() {
            // get value of selection
            var yvalue = d3.select(this).attr("value");
            if (yvalue !== chosenYAxis) {

                // replaces chosenXAxis with value
                chosenYAxis = yvalue;

                // console.log(chosenXAxis)

                // functions here found above csv import
                // updates x-scale, y-scale for new data
                var xScale = xyScale(censusData, chosenXAxis, chosenYAxis)[0];
                var yScale = xyScale(censusData, chosenXAxis, chosenYAxis)[1];

                // updates x-axis and y-axis with transition        
                xAxis = renderAxes(xScale,yScale, xAxis, yAxis)[0];
                yAxis = renderAxes(xScale,yScale, xAxis, yAxis)[1];
                
                // updates circles with new x values
                circlesGroup = renderCircles(circlesGroup, xScale, chosenXAxis, yScale, chosenYAxis);
                
                //update state abbr.
                circleAbbr = stateAbbrs(circleAbbr,xScale,chosenXAxis,yScale,chosenYAxis);

                // updates tooltips with new info
                circlesGroup = updateToolTip(chosenXAxis, chosenYAxis, circlesGroup);

                // changes classes to change bold text
                if (chosenYAxis === "obesity") {
                    obesityLabel
                    .classed("active", true)
                    .classed("inactive", false);
                    smokesLabel
                    .classed("active",false)
                    .classed("inactive",true)
                    healthcareLabel
                    .classed("active", false)
                    .classed("inactive", true);
                }
                else if(chosenYAxis === "smokes") {
                    smokesLabel
                    .classed("active", true)
                    .classed("inactive", false);
                    obesityLabel
                    .classed("active", false)
                    .classed("inactive", true);
                    healthcareLabel
                    .classed("active", false)
                    .classed("inactive",true);
                }
                else{
                    healthcareLabel
                    .classed("active", true)
                    .classed("inactive", false);
                    obesityLabel
                    .classed("active",false)
                    .classed("inactive",true);
                    smokesLabel
                    .classed("active",false)
                    .classed("inactive",true);
                }
            }
        });
    };
};
