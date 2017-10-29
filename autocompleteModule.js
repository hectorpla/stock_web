var selectedText;

(function () {
  'use strict';
var app = angular.module('MyApp', ['ngMessages', 'ngMaterial', 'material.svgAssetsCache']);
app.controller('myCtrl', function($http, $log) {
    var self = this;
    self.searchQuery = searchQuery;
    self.selectedItemChange = selectedItemChange;
    self.searchTextChange = searchTextChange;
    self.showStockInfo = showStockInfo;
    
    function searchQuery(query) {
            if (query === '') { query = 'a'; }
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
//        console.log(item);
        if (item.sym !== undefined) {
            selectedText = item.sym;
            self.searchText = item.sym;
        }
//        $log.info(self.searchText);
    }

    function searchTextChange(text) {
        $log.info('Text changed to ' + text);
        selectedText = text;
    }
    
    function showStockInfo(searchText) {
        console.log('aaa');
        $log.info('search symbol ' + searchText);
        return searchText;
    }
});
})();
