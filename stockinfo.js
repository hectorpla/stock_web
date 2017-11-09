// cached data
function initCache() {
    stockPlotOjbect = null;
    indPlotObjects = {};
    exportObjects = {};
}
initCache();

var CHARTLENGTH = 128;


function resetActiveTab() {
    function reset(containerClassName, classes, 
                    firstValidChild) {
        var containers = document.getElementsByClassName(containerClassName);
        for (let container of Array.from(containers)) {
    //        console.log(container);
    //        console.log(container.childNodes);
            for (let child of container.childNodes) {
                if (child.classList === undefined) {
                    continue;
                }

                for (const cl of classes) {
                    child.classList.remove(cl);
                }
            }
            var first = firstValidChild(container);
            if (!first) { continue; }
            for (const cl of classes) {
                first.classList.add(cl);
            }
        }
    }

    reset('tab-content', ['in', 'active'], function (container) { 
        return container.getElementsByClassName('tab-pane')[0];
    });
    
    reset('nav', ['active'], function (container) {
        return container.getElementsByTagName('li')[0];
    });
}


function zip(arr1, arr2) {
    return arr1.map(function (d, i) {return [d, arr2[i]];})
}

function compressedDates() {
    var dates = null;
    if (stockPlotOjbect.compressedDates === undefined) {
        dates = stockPlotOjbect.dates;
        var end = Math.min(CHARTLENGTH, dates.length);
        dates = dates.slice(0, end).map(function (d) {return d.slice(5).replace(/-/, '/')});
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
    var end = Math.min(CHARTLENGTH, dates.length);
    var prices = stockPlotOjbect.prices.slice(0, end);
    var volumes = stockPlotOjbect.volumes.slice(0, end);
    console.log(dates);

    var SYMBOL = stockPlotOjbect['Stock Ticker'];
    var maxVolume = Math.max.apply(null, volumes);
    var maxPrice = Math.max.apply(null, prices);
    var lastDate = dates[0].replace(/-/, '/');
    
    var obj = {
        chart: {
            zoomType: 'x',
            marginTop: 80,
        },
        title: {
            text: SYMBOL + ' Stock Price(' + lastDate + '/' + YEAR + ')'
        },
        subtitle: {
            useHTML: true,
            text: "<a target='_blank' href='https://www.alphavantage.co/'> Source: Alpha Vantage </a>"
        },
        xAxis: {
            categories: dates,
            tickLength: 0,
            showEmpty: false,
            reversed: true,
            labels: {
//                step: 5, // give up the 7-day interval
                autoRotation: [-10, -20, -30, -40, -50, -60, -70]
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
            maxPointWidth: 6
        }]
    }
    exportObjects.Price = obj;
    Highcharts.chart('Price-plot', obj);
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
    data.slice(0, Math.min(1000, data.length));
    data.reverse();
    console.log(data);
    
    Highcharts.stockChart('histchartplot', {
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
                type: 'ytd',
                text: 'YTD'
            }, {
                type: 'year',
                count: 1,
                text: '1y'
            }, {
                type: 'all',
                text: 'All'
            }],
            selected: 1
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
        plotOptions: {
            area: {
                threshold: null,
                tooltip: {
                    valueDecimals: 2
                }
            }
        },
        tooltip: {
            shared: true,
            split: false
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
    
    var containerId = acroynim.toUpperCase() + '-plot';
    var obj = {
        chart: {
            width: null,
            zoomType: "x"
        },
        title: {
            text: title
        },
        subtitle: {
            useHTML: true,
            text: "<a target='_blank' href='https://www.alphavantage.co/'> Source: Alpha Vantage </a>"
        },
        xAxis: {
            categories: dates,
            tickLength: 0,
            reversed: true, // reverse the x-aix
            labels: {
//                step: 5,
                autoRotation: [-10, -20, -30, -40, -50, -60, -70]
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
    };
    exportObjects[acroynim] = obj;
    Highcharts.chart(containerId, obj);
}

function processIndicator(indicator, obj) {
    var indicator = indicator.toUpperCase();
    function plot(obj) {
        var symbol = obj.symbol;
        var dates = null;
        var fullName = obj.fullIndicator;
        var subIndicators = obj['sub-indicators'];
        var seriesObjs = Array();
        
        // cache dates
        if (stockPlotOjbect.dates === undefined) {
            var end = Math.min(CHARTLENGTH, obj.dates.length);
            stockPlotOjbect.dates = obj.dates.slice(0, end);
        }
        dates = compressedDates();
        for (subIndicator of subIndicators) {
            seriesObjs.push({
                name: symbol + ' ' + subIndicator,
                data: obj[subIndicator].slice(0, Math.min(CHARTLENGTH, dates.length))
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
    
    plot(obj);
}
