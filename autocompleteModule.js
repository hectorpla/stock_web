var app = angular.module('MyApp', ['ngMessages', 'ngMaterial', 'material.svgAssetsCache']);
app.controller('myCtrl', function($scope, $http) {
    $scope.searchQuery = 
    function searchQuery(query) {
            if (query == '') query = 'a';
            // make the input Red if all spaces
            return $http.get('autocomplete.php?search=' + query)
            .then(function(obj){
                console.log(obj);
                results = Array();
                for (record of obj['data']) {
                    results.push(record['Symbol'] + ' - ' + record['Name'] + ' (' + record['Exchange'] + ')')
                }
                return results;
        });
    };

    $scope.searchTextChange = function(text) {
        console.log('changed to ' + text);
    }
});
