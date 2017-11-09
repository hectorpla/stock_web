(function () {
    'use strict';
    var app = angular.module('stockApp', ['ngMessages', 'ngMaterial', 'material.svgAssetsCache']);
    
    app.controller('myCtrl', function($http, $window, $interval, $log) {
        $log.info('Stock App loading:', $window.localStorage);

        var self = this;
        
        self.plotObj = $window.stockPlotOjbect;
        // auto-complete
        self.searchQuery = searchQuery;
        self.selectedItemChange = selectedItemChange;
        self.searchTextChange = searchTextChange;
        self.showStockInfo = showStockInfo;
        
        // intermediate
        self.getQuote = getQuote;
        
        // display
        self.detailDisabled = true;
        self.favDetToggle = false;
        self.progressShow = {
            infotab: true,
            Price: true,
            histchart: true,
            newsfeed: true
        }
        self.alertMessageShow = {
            infotab: false,
            Price: false,
            histchart: false,
            newsfeed: false
        };
        self.news = [];
        self.table = [];

        self.getHistChart = getHistChart;
        self.getNewsFeeds = getNewsFeeds;
        self.tabFields = ["Stock Ticker", "Last Price", "Change", "TimeStamp", "Open", "prevPrice", "Day's Range", "Volume"];
        self.indicators = ['SMA', 'EMA', 'STOCH', 'RSI', 'ADX', 'CCI', 'BBANDS', 'MACD'];
        self.loadIndicator = loadIndicator;
        self.clear = clear;

        // share
        self.curPlotIndicator = 'Price';
        self.sharePlot = sharePlot;

        // favorite
        self.addFav = addFavorite;
        self.removeFav = removeFavorite;
        self.getFavs = getFavorites;
        self.loadFavList = loadFavList;
        self.refreshFavList = refreshFavList;

        self.sortFields = ['Default', 'Symbol', 'Price', 'Change', 'Change Percent', 'Volume']
        self.sortOrders = ['Ascending', 'Descending'];
        self.mySortKey = mySortKey;

        self.autoRefreshEnabled = false;
        self.favStored = false;
        self.favList = []; // [{"price":1120.66,"change":"9.06 (0.82%)","volume":"2,311,272"}];
        self.autoRefreshToggle = autoRefreshToggle;

        loadFavList();

        for (const indicator of self.indicators) {
            self.progressShow[indicator] = true;
            self.alertMessageShow[indicator] = false;
        }


        /* ------------ Modules Functions ----------- */
            /* Autocomplete */
        function searchQuery(query) {
            if (query === '') { return []; }
            // make the input Red if all spaces
            return $http.get('autocomplete.php?search=' + query)
            .then(function(obj){
                if (!(obj.data instanceof Array)) { return []; }
                return obj.data.map(function(record) {
                    return {
                        symbol: record.Symbol,
                        display: record.Symbol + ' - ' + record.Name + ' (' + record.Exchange + ')'
                    };
                });
            });
        }

        function selectedItemChange(item) {
            $log.info('Item changed to ' + JSON.stringify(item));
            if (item && item.symbol) {
                $window.selectedText = item.symbol;
                $log.info('global searchText changed to ' + $window.selectedText);
            }
            return;
        }

        function searchTextChange(text) {
            $log.info('Text changed to ' + text);
            $window.selectedText = text;
        }

        function showStockInfo(searchText) {
            $log.info('search symbol ' + searchText);
            return searchText;
        }
        
            /* Display */
        function dismissProgress(block) {
            self.progressShow[block] = false;
            self.alertMessageShow[block] = false;
        }
        function showAlert(block) {
            self.progressShow[block] = false;
            self.alertMessageShow[block] = true;
        }
        
        function clear() {
            cleanup();
            self.searchText = '';
            self.favDetToggle = false;
            self.detailDisabled = true;
            $log.info("CLEAR DATA");
        }

        // TODO: check all previous display is clear
        function cleanup() {
            $window.resetActiveTab();
            $window.initCache();
            self.news = [];
            self.table = [];
            // set all progress to true
            for (var block in self.progressShow) {
                self.alertMessageShow[block] = false;
                self.progressShow[block] = true;
            }
            self.curPlotIndicator = 'Price';
            $window.stockPlotOjbect = null;
        }
        
        function setInfoTable(obj) {
            function nameOf(field) {
                if (field == "Stock Ticker") { return "Stock Ticker Symbol"; }
                if (field == "TimeStamp") { return "Timestamp"; }
                if (field == "Change") { return "Change (Change Percent)"; }
                if (field == "prevPrice") { return "Previous Close"; }
                return field;
            }

            self.table = self.tabFields.map(function(head) {
                    return {head: nameOf(head), data: obj[head]}
            });
        }

        /*
        * lazy evaluation, only update the stock chart
        */
        function getQuote(symbol=null) {
            if (!symbol) { symbol = self.searchText; }
            $log.info('GET QUOTE executes: ' + symbol);
            $log.info(self.progressShow);
            // TODO: clean-up previous display
            cleanup();
            self.favDetToggle = true;
            self.favStored = false;
            $http.get("stockQuote.php?symbol=" + symbol)
            .then(function(response) {
                self.detailDisabled = false;                
                dismissProgress('infotab');
                dismissProgress('Price');
                
                setInfoTable(response.data);
                $window.stockPlotOjbect = response.data;
                var key = $window.stockPlotOjbect['Stock Ticker'];
                self.favStored = 
                    $window.localStorage.getItem(key.toUpperCase()) !== null;
                $window.plotStockPrice();
            },
                function(response) {
                // error callback
                $log.info('error call-back!');
                showAlert('infotab');
                showAlert('Price');
                $window.stockPlotOjbect = null;
            });
        }
        
        function loadIndicator(indicator) {
            if ($window.stockPlotOjbect === null) { // check validility first
                dismissProgress(indicator);
                showAlert(indicator);
                return;
            }
            if (indicator === 'Price') { return; }
            if (!self.alertMessageShow[indicator] && !self.progressShow[indicator]) {
                console.log('loadIndicator: already loaded');
                return;
            }
            self.curPlotIndicator = indicator;
            console.log('processing ' + indicator);
            $http.get("indicatorQuery.php?indicator=" + indicator + '&' + "symbol=" + $window.stockPlotOjbect['Stock Ticker'])
            .then(function(response) {
                dismissProgress(indicator);
                $log.info(response.data);
                $window.processIndicator(indicator, response.data);
            },
                function(response) {
                showAlert(indicator);
            });
        }

        function getHistChart() {
            $log.info($window.stockPlotOjbect);
            if (!$window.stockPlotOjbect) {
                showAlert('histchart');
                return;
            }
            dismissProgress('histchart');
            $window.plotHistChart();
        }
        
        function loadNews(data) {
            if (Array.isArray(data)) {
                $log.info('load news successfully');
                self.news = data;
            }
            // TODO: error handling
        }
        
        function getNewsFeeds() {
            if (!$window.stockPlotOjbect) {
                showAlert('newsfeed');
                return;
            }
            return $http.get('newsfeed.php?symbol=' + stockPlotOjbect['Stock Ticker'])
            .then(function(obj) {
                $log.info(obj.data);
                loadNews(obj.data);
                dismissProgress('newsfeed');
                return obj.data;
            });
        }
        
            /* Favorite List */
        function addFavorite() {
            console.log('addFavorite: called');
            if (typeof(Storage) !== "undefined") {
                var curObj = $window.stockPlotOjbect
                var symbol = curObj['Stock Ticker'].toUpperCase();

                var storeObj = {
                    symbol: symbol,
                    price: curObj['Last Price'],
                    change: curObj['Change'],
                    volume: curObj['Volume'],
                    prevPrice: curObj['prevPrice'],
                    addedOrder: $window.localStorage.length
                };
                $window.localStorage.setItem(symbol, 
                    JSON.stringify(storeObj));
                self.favStored = true;
                console.log('addFavorite: success');
                console.log($window.localStorage);
                loadFavList();
            }
        }

        function mySortKey(stock) {
            var key = self.sortType;
            if (key === 'Default') { 
                self.sortOrder = self.sortOrders[0]; 
                return stock.addedOrder;
            }
            if (key === 'Symbol') {return stock.symbol;}
            if (key === 'Price') {return stock.price;}
            if (key === 'Change') {return parseFloat(stock.change);}
            if (key === 'Change Percent') {
                return parseFloat(stock.change.split(" ")[1].slice(1, -2));
            }
            if (key === 'Volume') {
                return parseInt(stock.volume.replace(/,/g, ''))
            }
            return stock;
        }

        function removeFavorite(symbol=null) {
            if (typeof(Storage) !== "undefined") {
                var curObj = $window.stockPlotOjbect
                if (symbol === null) { symbol = curObj['Stock Ticker']; }
                $window.localStorage.removeItem(symbol);
                self.favStored = false;
                loadFavList();
            }
        }

        function getFavorites(storage) {
            var items = Array();
            for (var key in storage) {
                // console.log(key, storage.getItem(key));
                if (storage.getItem(key) === null) { continue; }
                items.push(JSON.parse(storage.getItem(key)));
            }
            // console.log(items);
            return items;
        }

        function loadFavList() {
            var storage = $window.localStorage;
            for (var key in storage) {
                var symbol = null;
                try {
                    symbol = JSON.parse(storage.getItem(key)).symbol;
                }
                catch (e) {
                    continue;
                }
                if (key !== symbol) {
                    storage.removeItem(key); 
                }
            }
            self.favList = getFavorites($window.localStorage);
            $log.info('favorite list loaded');
        }

        function refreshFavList() {
            var storage = $window.localStorage;
            for (var key in storage) {
                $http.get("stockQuote.php?realtime=true&symbol=" + key)
                .then(function(response){
                    $log.info(response.data);
                    if (typeof(response.data) !== 'object') {
                        $log.info('fetching latest data failed:', key);
                        return;
                    }
                    var symbol = response.data['Stock Ticker'];
                    var obj = JSON.parse(storage.getItem(symbol));
                    obj.price = response.data['Last Price'];

                    var change = obj.price - obj.prevPrice;
                    var changePer = change / obj.prevPrice * 100;

                    var changStr = change.toFixed(2) + ' (' + 
                        changePer.toFixed(2) + '%)';
                    obj.change = changStr;
                    if (self.refreshVolume) {
                        obj.volume = response.data['Volume'];
                    }
                    storage.setItem(symbol, JSON.stringify(obj));
                    loadFavList();
                },
                    function (response) {
                        $log.info('refresh failed for ' + key);
                });
            }
        }

        var promise;
        function autoRefreshToggle() {
            $log.info('auto-refresh toggle');
            if (!self.autoRefreshEnabled) {
                $log.info('auto-refreshing stock info');
                promise = $interval(refreshFavList, 5000);
                self.refreshVolume = true;
            }
            else {
                $interval.cancel(promise)
                self.refreshVolume = false;
            }
            self.autoRefreshEnabled ^= true;
            console.log(self.autoRefreshEnabled);
        }
        // jquery in angularjs
        // can access self
        $(function() {
            $('#refresh-tog').change(function() {
                // console.log('JQuery', self.autoRefreshEnabled);
                autoRefreshToggle();
            })
        })

        // facebook share
        function sharePlot() {
            var toPlot = $window.exportObjects[self.curPlotIndicator];
            if (self.curPlotIndicator === undefined) {
                $window.alert(self.curPlotIndicator + 'data not ready');
                return;
            }
            $log.info('going to export:', toPlot);
            var exportUrl = 'http://export.highcharts.com/';
            var data = {
                async: true,
                type: 'jpeg',
                width: 500,
                options: toPlot
            }
            $http.post(exportUrl, data)
            .then(function (response) {
                // $log.info(response.data);
                var picUrl = exportUrl + response.data;
                $log.info('get the file from url: ', picUrl);
                FB.ui({
                    app_id: '126883171316784', 
                    method: 'feed',
                    picture: picUrl
                }, (response) => {
                    if (response && !response.error_message) {
                        $log.info('Facebook share succeeded');
                        alert("posted successfully");
                    }
                    else {
                        $log.info('Facebook share failed');
                        alert("not posted");
                    }
                });
            },
                function(response) {
                $log.info('failed to get plot picture'); 
            })
        }

        self.stockUp = stockUp;
        function stockUp(valueStr) {
            return parseFloat(valueStr) >= 0;
        }
        self.isChangeField = isChangeField;
        function isChangeField(valueStr) {
            // $log.info(typeof(valueStr));
            if (typeof(valueStr) !== 'string') { return false; }
            return valueStr.includes('%');
        }
    });
})();
