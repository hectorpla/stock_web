var selectedText;

(function () {
  'use strict';
var app = angular.module('MyApp', ['ngMessages', 'ngMaterial', 'material.svgAssetsCache']);
app.controller('myCtrl', function($scope, $http, $log) {
    $scope.searchQuery = searchQuery;
    $scope.selectedItemChange = selectedItemChange;
    $scope.searchTextChange = searchTextChange();
    
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
        console.log(item);
        selectedText = item.sym;
    }

    function searchTextChange(text) {
        $log.info('Text changed to ' + text);
    }
});
})();
