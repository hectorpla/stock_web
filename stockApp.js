(function () {
    'use strict';
    var app = angular.module('stockApp', ['ngMessages', 'ngMaterial', 'material.svgAssetsCache']);
    
    app.controller('myCtrl', function($http, $window, $log) {
//        console.log($window);
        
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
        self.getNewsFeeds = getNewsFeeds;
        self.news = [];
        self.progressShow = {
            infotab: false,
            stockchart: false
        }
        self.alertMessageShow = {
            infotab: false,
            stockchart: false
            
        };

        
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
        
        
        /*
        * lazy evaluation, only update the stock chart
        */
        function getQuote() {
            $log.info('GET QUOTE executes: ' + self.searchText);
            // TODO: clean-up previous display
            self.favDetToggle = true;
            self.progressShow.infotab = true;
            self.progressShow.stockchart = true;
            $http.get("stockQuote.php?symbol=" + self.searchText)
            .then(function(response) {
                self.progressShow.infotab = false;
                self.progressShow.stockchart = false;
                self.alertMessageShow.infotab = false;
                self.alertMessageShow.stockchart = false;
                self.detailDisabled = false;
                $window.showStockDetails(response.data, 'infotab', 'stockchart');
            },
                function(obj) {
                    // error callback
                $log.info('error call-back!');
                self.alertMessageShow.infotab = true;
                self.alertMessageShow.stockchart = true;
                self.progressShow.infotab = false;
                self.progressShow.stockchart = false;
                $log.info(self.alertMessageShow);
            });
        }
        
        function loadNews(data) {
            if (Array.isArray(data)) {
                $log.info('load news successfully');
                self.news = data;
            }
            // TODO: error handling
        }
        
        function getNewsFeeds() {
            // selectedText is a global variable
            if (selectedText == null) return;
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
        
        
    });
    console.log('Stock App loaded');
})();
