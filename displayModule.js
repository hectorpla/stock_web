(function () {
    'use strict';
    var app = angular.module('stockApp', ['ngMessages', 'ngMaterial', 'material.svgAssetsCache']);
    
    app.controller('dispCtrl', function($http, $log) {
        var self = this;
        self.getNewsFeeds = getNewsFeeds;
        self.loadNews = loadNews;
        self.news = [];
        
        function loadNews(data) {
//            console.log(Array.isArray(data));
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
                self.loadNews(obj.data);
                return obj.data;
            });
        }
    });
    // bad practice, couple html and js
    angular.bootstrap(document.getElementById("stockframe"), ['stockApp']);
    console.log('Stock App loaded');
})();