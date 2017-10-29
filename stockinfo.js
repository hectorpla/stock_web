// cached data
function initCache() {
    stockPlotOjbect = null;
    indPlotObjects = {};
}
initCache();


function createRow(header, data, imgSrc=null) {
        var row = document.createElement('tr');
        var head = document.createElement('th');
        var cell = document.createElement('td');

        head.appendChild(document.createTextNode(header));
        cell.appendChild(document.createTextNode(data));
        if (imgSrc) {
            var img = document.createElement('img');
            img.setAttribute('src', imgSrc);
            data.appendChild(img);
        }
        row.appendChild(head);
        row.appendChild(cell);
        return row;
}

function drawTable(containerId, info) {
    var container = document.getElementById(containerId);
    var prevTables = container.getElementsByTagName('table');
    var table = document.createElement('table');
    var heads = ['Stock Ticker', "Last Price"];
    
    console.log(prevTables);
    for (prev of prevTables) {
        container.removeChild(prev);
    }
    for (head of heads) {
        table.appendChild(createRow(head, info[head]));
    }
    container.appendChild(table);
    console.log('table trawn!');
}

function drawStockChart(symbol, data) {
    
}

function showProgressBar(container) {
    var container = document.getElementById(container);
    var prog = document.createElement('div');
    var progbar = document.createElement('div');
    
    prog.class = 'progress';
    progbar.class = "progress-bar progress-bar-striped active";
    progbar.role = "progressbar";
    progbar['aria-valuenow'] = "50";
    progbar.style="width:50%";
}

function showProgress(container) {
    progdiv = container.getElementsByClassName('progress')[0];
    console.log(progdiv);
    progdiv.style.display = "inline";
}

function dismissProgress(container) {
    progdiv = container.getElementsByClassName('progress')[0];
    progdiv.style.display = "none";
}

function showStockDetails(symbol, table, chart) {
    var tabcontainer = document.getElementById(table);
    var chartcontainer = document.getElementById(chart);
    var xhr = new XMLHttpRequest();
    var URL = "stockQuote.php?symbol=" + symbol;
    
    console.log(tabcontainer.childNodes);
    showProgress(tabcontainer);
    
    console.log(URL);
    xhr.open("GET", URL, true);
    xhr.onreadystatechange = function () {
        if(this.readyState === XMLHttpRequest.DONE && this.status === 200) {
            var string = xhr.responseText;
            var obj = JSON.parse(string);
            console.log(obj);
            progdiv.style.display = "none";
            dismissProgress(tabcontainer);
            stockPlotOjbect = obj;
            drawTable(table, obj);
            plotStockPrice();
        }
    };
    xhr.send();
}

function zip(arr1, arr2) {
    return arr1.map(function (d, i) {return [d, arr2[i]];})
}


function plotStockPrice() {
    var dates = null;
    var prices = stockPlotOjbect.prices;
    var volumes = stockPlotOjbect.volumes;
    
    if (stockPlotOjbect.compressedDates === undefined) {
        dates = stockPlotOjbect.dates;
        dates = dates.map(function (d) {return              d.slice(5).replace(/-/, '/')});
    }
    else {
        dates = stockPlotOjbect.compressedDates;
    }
    
    console.log(dates);

    var SYMBOL = stockPlotOjbect['Stock Ticker'];
    var YEAR = dates[dates.length - 1].slice(0, 4);
    var maxVolume = Math.max.apply(null, volumes);
    var maxPrice = Math.max.apply(null, prices);
    var lastDate = dates[dates.length - 1].replace(/-/, '/');
    
    Highcharts.chart('stockchart', {
        chart: {
            zoomType: 'x',
            marginTop: 20,
        },
        title: {
            text: 'Stock Price(' + lastDate + '/' + YEAR + ')'
        },
        subtitle: {
            useHTML: true,
            text: "<a href='https://www.alphavantage.co/'> Source: Alpha Vantage </a>"
        },
        xAxis: {
            categories: dates,
            tickLength: 0,
            showEmpty: false,
            labels: {
                step: 5,
                rotation: -30
            }
        },
        yAxis: [
        {
            title: {
                text: 'Stock Price',
            },
            max: Math.ceil(maxPrice)
        },
        {	
            title: {
                text: 'Volume'
            },
            gridLineWidth: 0,
            min: 0,
            max: Math.ceil(maxVolume * 5.2),
            endOnTick: false,
            opposite: true
        }],
        tooltip: {
            shared: false
        },
        legend: {
            layout: 'vertical',
            align: 'right',
            verticalAlign: 'middle'
        },
        plotOptions: {
            area: {
                threshold: null,
                tooltip: {
                    valueDecimals: 2
                }
            },
            column: {
                pointPadding: 0.5,
                borderWidth: 0,
                groupPadding: 0,
                shadow: false,
                threshold: null
            }
        },
        series: [{
            yAxis: 0,
            type: 'area',
            name: SYMBOL,
            data: prices
        },
        {
            yAxis: 1,
            type: 'column',
            name: SYMBOL + ' Volume',
            data: volumes,
            color: 'red',
            maxPointWidth: 3
        }]
    });
}