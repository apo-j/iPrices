/**
 * Created by chenglian on 15/6/28.
 */
angular.module('iPrices.controllers')
    .controller('AdminUserCtrl', ['$scope', 'UsersSvc', 'DataSvc', function($scope, UsersSvc, DataSvc) {
        $scope.users = [];
        $scope.roles = DataSvc.getCollection('role').data;
        $scope.search = function(criteria){
            UsersSvc.all(criteria).then(function(data){
                $scope.users = data.data.data;
            })
        }

        $scope.save = function(user){
            UsersSvc.update(user).then(function(){
                console.log('OK');
            },function(){
                console.log('KO');
            });
        }
    }])