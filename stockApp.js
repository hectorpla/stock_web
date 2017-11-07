(function () {
    'use strict';
    var app = angular.module('stockApp', ['ngMessages', 'ngMaterial', 'material.svgAssetsCache']);
    
    app.controller('myCtrl', function($http, $window, $log) {
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
        self.tabFields = ["Stock Ticker", "Last Price", "Change", "TimeStamp", "Open", "Day's Range", "Volume"];
        self.indicators = ['SMA', 'EMA', 'STOCH', 'RSI', 'ADX', 'CCI', 'BBANDS', 'MACD'];
        self.loadIndicator = loadIndicator;

        // favorite
        self.addFav = addFavorite;
        self.removeFav = removeFavorite;
        self.getFavs = getFavorites;
        self.loadFavList = loadFavList;

        self.sortFields = ['Default', 'Symbol', 'Price', 'Change', 'Change Percent', 'Volume']
        self.sortOrders = ['Ascending', 'Descending'];

        self.favStored = false;
        self.favList = []; // [{"price":1120.66,"change":"9.06 (0.82%)","volume":"2,311,272"}];

        loadFavList();

        for (const indicator of self.indicators) {
            self.progressShow[indicator] = true;
            self.alertMessageShow[indicator] = false;
        }


        /* Modules Functions */
        function searchQuery(query) {
            if (query === '') { return []; }
            // make the input Red if all spaces
            return $http.get('autocomplete.php?search=' + query)
            .then(function(obj){
                if (!(obj.data instanceof Array)) { return []; }
                return obj.data.map(function(record) {
                    return {
                        sym: record.Symbol,
                        display: record.Symbol + ' - ' + record.Name + ' (' + record.Exchange + ')'
                    };
                });
            });
        }

        function selectedItemChange(item) {
            $log.info('Item changed to ' + JSON.stringify(item));
            if (item.sym !== undefined) {
                self.searchText = item.sym;
                $window.selectedText = item.sym;
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
        
        
        function dismissProgress(block) {
            self.progressShow[block] = false;
            self.alertMessageShow[block] = false;
        }
        function showAlert(block) {
            self.progressShow[block] = false;
            self.alertMessageShow[block] = true;
        }
        /*
        * lazy evaluation, only update the stock chart
        */
        function cleanup() {
            $window.resetActiveTab();
            $window.initCache();
            // set all progress to true
            for (var block in self.progressShow) {
                self.alertMessageShow[block] = false;
                self.progressShow[block] = true;
                self.table = [];
            }
        }
        
        function setInfoTable(obj) {
            self.table = self.tabFields.map(function(head) {
                    return {head: head, data: obj[head]}
                });
        }

        function getQuote() {
            $log.info('GET QUOTE executes: ' + self.searchText);
            // TODO: clean-up previous display
            cleanup();
            self.favDetToggle = true;
            self.favStored = false;
            $http.get("stockQuote.php?symbol=" + self.searchText)
            .then(function(response) {
                self.detailDisabled = false;                
                dismissProgress('infotab');
                dismissProgress('Price');
                
                setInfoTable(response.data);
                $window.stockPlotOjbect = response.data;
                self.favStored = 
                    $window.localStorage.getItem($window.stockPlotOjbect['Stock Ticker']) !== null;
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
            if (!$window.stockPlotOjbect) {
                showAlert('histchart');
                return;
            }
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
            return $http.get('newsfeed.php?symbol=' + selectedText)
            .then(function(obj){
                $log.info(obj.data);
                loadNews(obj.data);
                return obj.data;
            });
        }
        
        function checkDetailsAvail() {
            $log.info('check detail: symbol' + $window.selectedText);
            return $window.stockPlotOjbect !== null;
        }
        
        function addFavorite() {
            console.log('addFavorite: called');
            if (typeof(Storage) !== "undefined") {
                var curObj = $window.stockPlotOjbect

                var storeObj = {
                    symbol: curObj['Stock Ticker'],
                    price: curObj['Last Price'],
                    change: curObj['Change'],
                    volume: curObj['Volume']
                };
                $window.localStorage.setItem(curObj['Stock Ticker'], 
                    JSON.stringify(storeObj));
                self.favStored = true;
                console.log('addFavorite: success');
                console.log($window.localStorage);
                loadFavList();
            }
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
                // console.log(storage.getItem(key));
                items.push(JSON.parse(storage.getItem(key)));
            }
            console.log(items);
            return items;
        }

        function loadFavList() {
            self.favList = getFavorites($window.localStorage);
            $log.info('favorite list loaded');
        }
    });
    // console.log('Stock App loaded');
})();
