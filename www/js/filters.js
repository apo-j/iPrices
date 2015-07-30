/**
 * Created by chenglian on 15/4/18.
 */
angular.module('iPrices.filters', [])
 .filter('trustedUrl', ['$sce', function ($sce) {
    return function(url) {
        return $sce.trustAsResourceUrl(url);
    };
}])
    .filter('stringNotEmpty', [function () {
        return function(str) {
            if(str){
                return str;
            }
            return '暂无';
        };
    }]);
