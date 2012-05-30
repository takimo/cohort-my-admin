var chart;

AmCharts.ready(function () {
    // SERIAL CHART
    chart = new AmCharts.AmSerialChart();
    chart.pathToImages = "amcharts/images/";
    chart.zoomOutButton = {
    backgroundColor: "#000000",
    backgroundAlpha: 0.15
    };
    chart.dataProvider = chartData;
    chart.categoryField = "date";

    chart.addTitle("service", 15);

    // AXES
    // Category
    var categoryAxis = chart.categoryAxis;
    categoryAxis.gridAlpha = 0.07;
    categoryAxis.axisColor = "#DADADA";
    categoryAxis.startOnAxis = true;

    // Value
    var valueAxis = new AmCharts.ValueAxis();
    valueAxis.title = "percent"; // this line makes the chart "stacked"
    valueAxis.stackType = "100%";
    valueAxis.gridAlpha = 0.07;
    chart.addValueAxis(valueAxis);

    // GRAPHS
    // first graph
    var graph = new AmCharts.AmGraph();
    graph.type = "line";
    graph.title = "Referral";
    graph.valueField = "referral";
    graph.balloonText = "[[value]] ([[percents]]%)";
    graph.lineAlpha = 0;
    graph.fillAlphas = 0.6;
    chart.addGraph(graph);

    // first graph
    var graph = new AmCharts.AmGraph();
    graph.type = "line";
    graph.title = "Revenue";
    graph.valueField = "revenue";
    graph.balloonText = "[[value]] ([[percents]]%)";
    graph.lineAlpha = 0;
    graph.fillAlphas = 0.6;
    chart.addGraph(graph);

    // second graph
    var graph = new AmCharts.AmGraph();
    graph.type = "line";
    graph.title = "Retention";
    graph.valueField = "retention";
    graph.balloonText = "[[value]] ([[percents]]%)";
    graph.lineAlpha = 0;
    graph.fillAlphas = 0.6;
    chart.addGraph(graph);

    // third graph
    var graph = new AmCharts.AmGraph();
    graph.type = "line";
    graph.title = "Activation";
    graph.valueField = "activation";
    graph.balloonText = "[[value]] ([[percents]]%)";
    graph.lineAlpha = 0;
    graph.fillAlphas = 0.6;
    chart.addGraph(graph);

    // fourth graph
    var graph = new AmCharts.AmGraph();
    graph.type = "line"; // it's simple line graph
    graph.title = "Acquisition";
    graph.valueField = "acquisition";
    graph.balloonText = "[[value]] ([[percents]]%)";
    graph.lineAlpha = 0;
    graph.fillAlphas = 0.6; // setting fillAlphas to > 0 value makes it area graph 
    chart.addGraph(graph);

    // LEGEND
    var legend = new AmCharts.AmLegend();
    legend.align = "center";
    chart.addLegend(legend);

    // CURSOR
    var chartCursor = new AmCharts.ChartCursor();
    chartCursor.zoomable = false; // as the chart displayes not too many values, we disabled zooming
    chartCursor.cursorAlpha = 0;
    chart.addChartCursor(chartCursor);

    // WRITE
    chart.write("chartdiv");
});
