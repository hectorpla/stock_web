// cached data
function initCache() {
    stockPlotOjbect = null;
    indPlotObjects = {};
}
initCache();

var CHARTLENGTH = 100;

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
    var table = document.createElement('table');
    var heads = ["Stock Ticker", "Last Price", "Change", "TimeStamp", "Open", "Day's Range", "Volume"];
    
    for (head of heads) {
        table.appendChild(createRow(head, info[head]));
    }
    container.appendChild(table);
    console.log('table trawn!');
}

function showStockDetails(obj, table, chart) {
    console.log(obj);
    stockPlotOjbect = obj;
    drawTable(table, obj);
    plotStockPrice();
}

function zip(arr1, arr2) {
    return arr1.map(function (d, i) {return [d, arr2[i]];})
}

function compressedDates() {
    var dates = null;
    if (stockPlotOjbect.compressedDates === undefined) {
        dates = stockPlotOjbect.dates;
        dates = dates.slice(0,  CHARTLENGTH).map(function (d) {return        d.slice(5).replace(/-/, '/')});
        stockPlotOjbect.compressedDates = dates;
    }
    else {
        dates = stockPlotOjbect.compressedDates;
    }
    return dates;
}

function plotStockPrice() {
    var YEAR = stockPlotOjbect.dates[0].slice(0, 4);
    var dates = compressedDates();
    var prices = stockPlotOjbect.prices.slice(0, CHARTLENGTH);
    var volumes = stockPlotOjbect.volumes.slice(0, CHARTLENGTH);
    console.log(dates);

    var SYMBOL = stockPlotOjbect['Stock Ticker'];
    var maxVolume = Math.max.apply(null, volumes);
    var maxPrice = Math.max.apply(null, prices);
    var lastDate = dates[0].replace(/-/, '/');
    
    Highcharts.chart('stockchart', {
        chart: {
            zoomType: 'x',
            marginTop: 60,
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
            reversed: true,
            labels: {
                step: 5,
                rotation: -60
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
            max: Math.ceil(maxVolume * 1.5),
            endOnTick: false,
            opposite: true
        }],
        tooltip: {
            shared: false
        },
        legend: {
            layout: 'horizontal',
            align: 'center',
            verticalAlign: 'bottom'
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
            maxPointWidth: 5
        }]
    });
}

function plotHistChart() {
    var dates = null;
    var prices = stockPlotOjbect.prices;
    
    if (stockPlotOjbect.utcDates === undefined) {
        dates = stockPlotOjbect.dates;
        dates = dates.map(function (date) {
            return Math.round(new Date(date).getTime())
        });
        stockPlotOjbect.utcDates = dates;
    }
    else {
        dates = stockPlotOjbect.utcDates;
    }
    
    var data = zip(dates, prices);
    data.reverse();
    console.log(data);
    
    Highcharts.stockChart('histchart', {
        chart: {
            zoomType: 'x'
        },
        rangeSelector: {
            buttons: [{
                type: 'week',
                count: 1,
                text: '1w'
            }, {
                type: 'month',
                count: 1,
                text: '1m'
            }, {
                type: 'month',
                count: 3,
                text: '3m'
            },{
                type: 'month',
                count: 6,
                text: '6m'
            }, {
                type: 'year',
                count: 1,
                text: '1y'
            }, {
                type: 'all',
                text: 'All'
            }],
            selected: 3
        },
        yAxis: {
            title: {
                text: 'Historical Prcies'
            }
        },
        title: {
            text: stockPlotOjbect["Stock Ticker"] + ' Stock Value'
        },
        subtitle: {
            useHTML: true,
            text: "<a href='https://www.alphavantage.co/'> Source: Alpha Vantage </a>"
        },
        series: [{
            name: 'Price',
            type: 'area',
            data: data
        }]

    });
}

function plotLineChart(title, dates, seriesData) {
//    console.log(title);
//    console.log(dates);
//    console.log(JSON.stringify(seriesData));
    var symbol = stockPlotOjbect['Stock Ticker'];
    var acroynim = title.split(' ').slice(-1)[0].slice(1,-1);
    
    Highcharts.chart(acroynim.toUpperCase(), {
        chart: {
            width: null,
            zoomType: "x"
        },
        title: {
            text: title
        },
        subtitle: {
            useHTML: true,
            text: "<a href='https://www.alphavantage.co/'> Source: Alpha Vantage </a>"
        },
        xAxis: {
            categories: dates,
            tickLength: 0,
            reversed: true, // reverse the x-aix
            labels: {
                step: 5,
                rotation: -60
            }
        },
        yAxis: {
            title: {
                text: acroynim
            }
        },
        legend: {
            layout: 'horizontal',
            align: 'center',
            verticalAlign: 'bottom'
        },
        plotOptions: {
            series: {
                marker: {
                    radius: 2
                }
            }
        },
        series: seriesData
    });
}

function processIndicator(indicator) {
    var indicator = indicator.toUpperCase();
    function plot(obj) {
        var symbol = obj.symbol;
        var dates = null;
        var fullName = obj.fullIndicator;
        var subIndicators = obj['sub-indicators'];
        var seriesObjs = Array();
        
        // cache dates
        if (stockPlotOjbect.dates === undefined) {
            stockPlotOjbect.dates = obj.dates.slice(0, CHARTLENGTH);
        }
        dates = compressedDates();
        for (subIndicator of subIndicators) {
//            console.log(obj[subIndicator])
            seriesObjs.push({
                name: symbol + ' ' + subIndicator,
                data: obj[subIndicator].slice(0, CHARTLENGTH)
            });
        }
        indPlotObject = {
            fullName: fullName,
            dates: dates,
            seriesObjs: seriesObjs
        };
        indPlotObjects[indicator] = indPlotObject;
        plotLineChart(fullName, dates, seriesObjs);
    }

    var indicator = indicator.toUpperCase();
    console.log(indPlotObjects);
    // use cached data
    if (indPlotObjects[indicator] !== undefined) {
        obj = indPlotObjects[indicator];
        plotLineChart(obj.fullName, compressedDates(), obj.seriesObjs);
        return;
    }
    
    var drawbox = document.getElementById(indicator);
    showProgress(drawbox);
    
    var xhr = new XMLHttpRequest();
    var URL = "indicatorQuery.php?indicator=" + indicator + '&' + "symbol=" + stockPlotOjbect['Stock Ticker'];
    console.log(URL);
    xhr.open("GET", URL, true);
    xhr.onreadystatechange = function () {
        if(this.readyState === XMLHttpRequest.DONE && this.status === 200) {
            var string = xhr.responseText;
            var obj = JSON.parse(string);
            console.log(obj);
            dismissProgress(drawbox);
            plot(obj);
        }
    };
    xhr.send();
}
