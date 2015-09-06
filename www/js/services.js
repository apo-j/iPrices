angular.module('iPrices.services', [])
    .factory('_', function () {
        return window._; // assumes underscore has already been loaded on the page
    })
    .service('AuthSvc', function (afConfig, $http) {
        var service = this;

        service.login = function (credentials) {
            return $http.post(afConfig.apiRootUrl + 'auth/login', credentials);
        }

        service.register = function (user) {
            return $http.post(afConfig.apiRootUrl + 'auth/register', user);
        }


        service.logout = function () {
            return $http.post(afConfig.apiRootUrl + 'auth/logout');
        };

        service.fetchPassword = function(email){
            return $http.post(afConfig.apiRootUrl + 'auth/fetch-verify-code', {email: email});
        };

        service.resetPassword = function(param){
            return $http.post(afConfig.apiRootUrl + 'auth/reset-password', param);
        }

    })
    .service('UsersSvc', function ($http, afConfig) {//because of dependency problems about $http, can not reuse UserSvc
        var service = this;

        service.all = function(criteria){
            var req = {
                method: 'POST',
                url: afConfig.apiRootUrl + "secure/users",
                headers: {
                    'api': 'Users'
                },
                data:criteria
            };
            return $http(req);
        }

        service.update = function(user){
            var req = {
                method: 'PUT',
                url: afConfig.apiRootUrl + "secure/users",
                headers: {
                    'api': 'Users'
                },
                data:user
            };
            return $http(req);
        }
    })
    .service('UserSvc', function (store) {
        var service = this,
            currentUser = null;

        service.setCurrentUser = function (user) {
            currentUser = user;
            store.set('user', user);
            return currentUser;
        };

        service.getCurrentUser = function () {
            if (!currentUser) {
                currentUser = store.get('user');
            }
            return currentUser;
        };

        service.all = function(criteria){
            var req = {
                method: 'POST',
                url: afConfig.apiRootUrl + "secure/users",
                headers: {
                    'api': 'Users'
                }
            };
            return $http(req);
        }
    })
    .service('APIInterceptorSvc', function ($rootScope, UserSvc, $q, afConfig) {
        var service = this;

        service.request = function (config) {
            var currentUser = UserSvc.getCurrentUser(),
                accessToken = currentUser ? currentUser.accessToken : null;

            if (accessToken) {
                config.headers.authorization = accessToken;
            }
            return config;
        };

        service.response = function (response) {
            //if (response.config && response.headers['Current-Version'] !== afConfig.version){
            //    $rootScope.$broadcast("VERSION.OUT.DATE");
            //}

            return response;
        };

        service.responseError = function (response) {
            if (response.status === 401) {
                $rootScope.$broadcast('unauthorized');
                return $q.reject(response);
            }
            if (response.status === 400 || response.status === 500) {
                return $q.reject(response);
            }
            //no need to process 403
            return response;
        };
    })
    .factory('DataSvc', ['$http', '$q', 'Loki', 'afConfig', '_', function ($http, $q, Loki, afConfig, _) {
        var _deferredProducts = $q.defer(),
            _deferredAuxiliary = $q.defer(),
            _deferredNews = $q.defer(),
            _deferred = $q.defer();

        var _db = new Loki('data');
        var res = {
            dataReady: _deferred.promise
        };

        _db.addCollection('products', {indices: ['searchText', 'id'], unique: ['id']});
        _db.addCollection('rubric', {indices: ['keywords', 'id']});
        _db.addCollection('brand', {indices: ['keywords', 'id']});
        _db.addCollection('role', {indices: ['keywords', 'id']});

        _db.addCollection('news', {indices: ['id'], unique: ['id']});

        //subset of products
        _db.addCollection('favoris', {indices: ['brand', 'rubric', 'reference', 'collection', 'id'], unique: ['id']});

        _db.addCollection('myProducts', {indices: ['brand', 'rubric', 'reference', 'collection', 'id'], unique: ['id']});


        res.getCollection = function (collection) {
            return _db.getCollection(collection);
        };

        $http.get(afConfig.apiRootUrl + "news/3/0").then(function (data) {
            if (data.data.dataStatus === 1) {//no data
                _deferredNews.reject({data: 'No new data', status: 304});
            } else {
                _deferredNews.resolve({data: data.data.data, status: 200});
            }
        }, function (e) {
            _deferredNews.reject({data: 'News unavailable', status: 404});
        });

        //JSONP example, do not delete
        //$.ajax({
        //  type: 'GET',
        //  url: afConfig.apiRootUrl + "news-jsonp/3/0",
        //  jsonpCallback: 'NEWS_CALLBACK',
        //  dataType: 'jsonp',
        //  success: function(data) {
        //    if(data.dataStatus === 1){//no data
        //      _deferredNews.reject({data:'No new data', status:304});
        //    }else{
        //      _deferredNews.resolve({data: data.data, status:200});
        //    }
        //  },
        //  error: function(e) {
        //    _deferredNews.reject({data:'News unavailable', status:404});
        //  }
        //});

        $http.get(afConfig.apiRootUrl + "auxiliary").then(function (data) {
            _deferredAuxiliary.resolve({data: data.data.data, status: 200});
        }, function (e) {
            _deferredAuxiliary.reject({data: 'Products unavailable', status: 404});
        });

        $http.get(afConfig.apiRootUrl + "products").then(function (data) {
            _deferredProducts.resolve({data: data.data.data, status: 200});
        }, function (e) {
            _deferredProducts.reject({data: 'Products unavailable', status: 404});
        });

        _deferredProducts.promise.then(function (data) {
            for(var i = 0; i < data.data.length; i++){
                var item = data.data[i];
                item.searchText = (item.brandLabel + item.title + item.reference + item.description).replace(/[ ]+/g, ' ').replace(/_|-|\.+/g, '').toLowerCase();
            }

            res.getCollection('products').insert(data.data);
        });

        $q.all([
            _deferredAuxiliary.promise.then(function (data) {
                //var rubrics = res.getCollection('rubric');
                var brands = res.getCollection('brand');
                var roles = res.getCollection('role');
                //var collections = res.getCollection('collection');

                var auxiliaryData = _.groupBy(data.data, function (item) {
                    return item.type;
                })
                //rubrics.insert(auxiliaryData['rubric']);
                brands.insert(auxiliaryData['brand']);
                roles.insert(auxiliaryData['role']);
                //collections.insert(auxiliaryData['collection']);

            }), _deferredNews.promise.then(function (data) {
                res.getCollection('news').insert(data.data);
            })])
            .then(function (data) {
                _deferred.resolve();
            }, function (data) {
                _deferred.reject();
            });

        return res;
    }])
    .factory('FavorisSvc', ['$http', '$q', 'DataSvc', 'afConfig','UserSvc', function ($http, $q, DataSvc, afConfig, UserSvc) {
        var res = {};

        res.all = function () {
            var deferred = $q.defer();
            if(UserSvc.getCurrentUser()){
                $http.get(afConfig.apiRootUrl + "secure/favoris", {headers:{api:'Favoris'}}).then(function(data){
                    DataSvc.getCollection('favoris').removeWhere(function(obj){
                        return !data.data.data.some(function(f){
                            return f.productId === obj.id;
                        })
                    });

                    for(var i=0; i < data.data.data.length; i++){
                        var match = DataSvc.getCollection('favoris').find({id:data.data.data[i].productId});
                        if(match.length == 0){
                            var products = DataSvc.getCollection('products').find({id: data.data.data[i].productId});
                            if(products.length > 0){
                                var favoris = angular.extend({}, products[0]);
                                delete favoris.$loki;
                                DataSvc.getCollection('favoris').insert(favoris)
                            }
                        }
                    }

                    deferred.resolve({data: DataSvc.getCollection('favoris').data, status: 200});
                }, function(reason){
                    deferred.reject({data: reason, status: 400});
                });
            }else{
                deferred.reject({data: 'Unauthorized', status: 401});
            }

            return deferred.promise;
        };

        res.add = function (product) {
            var deferred = $q.defer();
            if(UserSvc.getCurrentUser()) {
                var req = {
                    method: 'POST',
                    url: afConfig.apiRootUrl + "secure/favoris/" + product.id,
                    headers: {
                        'api': 'Favoris'
                    }
                };
                $http(req).then(function (data) {
                    var alreadyInFavoris = false;
                    if(data.data.data === true){//just created
                        delete product.$loki;
                        DataSvc.getCollection('favoris').insert(product);
                    }else{//already exist
                        alreadyInFavoris = true;
                    }

                    deferred.resolve({data: alreadyInFavoris, status: 200});
                }, function (reason) {
                    deferred.reject({data: reason, status: 400});
                })
            }else{
                deferred.reject({data: undefined, status: 401});
            }
            return deferred.promise;
        }

        res.remove = function (product) {
            id = angular.isNumber(product.id) ? product.id : parseInt(product.id, 10);
            var deferred = $q.defer();
            if(UserSvc.getCurrentUser()) {
                $http.delete(afConfig.apiRootUrl + "secure/favoris/" + product.id, {headers:{api:'Favoris'}}).then(function (data) {
                    DataSvc.getCollection('favoris').remove(product);
                    deferred.resolve({data: "", status: 200});
                }, function (reason) {
                    deferred.reject({data: reason, status: 400});
                })
            }else{
                deferred.reject({data: 'Unauthorized', status: 401});
            }
            return deferred.promise;
        }
        return res;
    }])
    .factory('WeChatSvc', ['$ionicPopup', function($ionicPopup){
        var res = {};

        res.share = function(msg, scene){
            WeChat.share(msg, scene, function() {
                //$ionicPopup.alert({
                //    title: '分享成功',
                //    template: '感谢您的支持！',
                //    okText: '关闭'
                //});
            }, function(res) {
                $ionicPopup.alert({
                    title: '分享失败',
                    template: '错误原因：' + res + '。',
                    okText: '我知道了'
                });
            });
        }

        return res;
    }])
    .factory('NewsSvc', ['$http', '$q', 'DataSvc', 'afConfig', function ($http, $q, DataSvc, afConfig) {
        var res = {};

        res.fetch = function (param) {
            var deferred = $q.defer();
            if (param.version || DataSvc.getCollection('news').data.length == 0 || param.page > 0) {

                $http.get(afConfig.apiRootUrl + "news/3/" + param.page + "?version=" + param.version).then(function (data) {
                    if (data.dataStatus === 1) {//no data
                        deferred.reject({data: 'No new data', status: 304});
                    } else {
                        DataSvc.getCollection('news').insert(data.data.data);
                        deferred.resolve({data: data.data.data, status: 200});
                    }
                }, function (e) {
                    deferred.reject({data: 'News unavailable', status: 404})
                });
            } else {
                deferred.resolve({data: DataSvc.getCollection('news').data, status: 200});
            }


            return deferred.promise;
        };

        res.get = function (id) {
            id = angular.isNumber(id) ? id : parseInt(id, 10);
            var deferred = $q.defer();

            var _res = DataSvc.getCollection('news').findOne({id: id});
            if (_res) {
                if(_res.content){
                    deferred.resolve({data: _res, status: 200});
                }else{
                    $http.get(config.apiRootUrl + "news/" + id).then(function (data) {
                        _res.content = data.data.data.content;
                        DataSvc.getCollection('news').update(_res);
                        deferred.resolve({data: _res, status: 200});
                    }, function (e) {
                        deferred.reject({data: 'News unavailable', status: 404});
                    });
                }

            } else {
                deferred.reject({data: 'Not found', status: 404});
            }

            return deferred.promise;
        }

        //res.get = function (id) {
        //    id = angular.isNumber(id) ? id : parseInt(id, 10);
        //    var deferred = $q.defer();
        //
        //    $http.get(config.apiRootUrl + "news/" + id).then(function (data) {
        //        deferred.resolve({data: data.data.data, status: 200});
        //    }, function (e) {
        //        deferred.reject({data: 'News unavailable', status: 404});
        //    });
        //
        //    return deferred.promise;
        //}
        return res;
    }])
    .factory('RubricsSvc', ['$http', '$q', 'DataSvc', function ($http, $q, DataSvc) {
        var res = {};

        res.all = function () {
            var deferred = $q.defer();

            deferred.resolve({data: DataSvc.getCollection('rubric').data, status: 200});
            return deferred.promise;
        };

        res.get = function (id) {
            id = angular.isNumber(id) ? id : parseInt(id, 10);
            var deferred = $q.defer();

            deferred.resolve({data: DataSvc.products['rubric'][_category.title].data(), status: 200});

            return deferred.promise;
        }
        return res;
    }])

    .factory('ProductsSvc', ['$http', '$q', 'afConfig', 'DataSvc', 'UserSvc', function ($http, $q, afConfig, DataSvc, UserSvc) {
        var res = {};

        res.addLike = function(product){
            var deferred = $q.defer();
            $http.get(afConfig.apiRootUrl + "products/" + product.id + "/like").then(function(data){
                deferred.resolve({data: data.data.data, status:200});
            }, function(){

            })

            return deferred.promise;
        }

        res.getByCategory = function (category, id) {//category can be brands or rubrics here
            id = angular.isNumber(id) ? id : parseInt(id, 10);
            var deferred = $q.defer();
            var _category = DataSvc.getCollection(category).findOne({id: id});
            if (_category) {
                var criteria = {};
                criteria[category + 'Id'] = _category.id;
                deferred.resolve({data: DataSvc.getCollection('products').find(criteria), status: 200});
            } else {
                deferred.reject({data: [], status: 404});
            }

            return deferred.promise;
        }
        res.get = function (id) {
            id = angular.isNumber(id) ? id : parseInt(id);
            var deferred = $q.defer();
            var _res = DataSvc.getCollection('products').findOne({id: id});
            if (_res) {
                deferred.resolve({data: _res, status: 200});
            } else {
                $http.get(afConfig.apiRootUrl + "products/" + id).then(function(data){
                    if(data.data.data){
                        DataSvc.getCollection('products').insert(data.data.data);
                        deferred.resolve({data: data.data.data, status: 200});
                    }else{
                        deferred.reject({data: 'Not found', status: 404});
                    }
                });
            }

            return deferred.promise;
        }

        res.getMyProducts = function(){
            var deferred = $q.defer();
            if(UserSvc.getCurrentUser()) {
                $http.get(afConfig.apiRootUrl + "secure/products", {headers:{api: 'UserProducts'}}).then(function(data){
                    deferred.resolve({data: data.data.data, status: 200});
                });
            }else{
                deferred.reject({data: 'Unauthorized', status: 401});
            }
            return deferred.promise;
        }
        function getFromServer(productId){
            return $http.get(afConfig.apiRootUrl + "products/" + productId);
        }

        res.updateLocal = function(product){
            DataSvc.getCollection('products').update(product);
        }

        res.add = function (product) {
            var deferred = $q.defer();
            if(UserSvc.getCurrentUser()) {
                if(product.images.length > 0){
                    product.images = new FormData();
                    for(var i = 0; i < product.images.length; i++){
                        product.images.append('img' + i, product.images[i]);
                    }
                }

                var req = {
                    method: 'POST',
                    url: afConfig.apiRootUrl + "secure/products",
                    headers: {
                        'api': 'Products',
                        'Content-Type': undefined
                    },
                    transformRequest: angular.identity,
                    data:product
                };
                $http(req).then(function (data) {
                    getFromServer(data.data.data).then(function(data){
                        DataSvc.getCollection('products').insert(data.data);
                        deferred.resolve({data: '', status: 200});
                    })
                }, function (reason) {
                    deferred.reject({data: reason, status: 400});
                })
            }else{
                deferred.reject({data: 'Unauthorized', status: 401});
            }
            return deferred.promise;
        }
        return res;
    }])
    .factory('BrandsSvc', ['$http', '$q', 'DataSvc', '$timeout', function ($http, $q, DataSvc, $timeout) {
        var res = {};

        res.all = function () {
            var deferred = $q.defer();

            deferred.resolve({data: DataSvc.getCollection('brand').data, status: 200});
            return deferred.promise;
        };

        res.search = function (query) {
            var deferred = $q.defer();
            $timeout(function(){
                if (query) {
                    var terms = query.trim().replace(/_|-|\.+/g, '').replace(/[ ]+/g, ' ').toLowerCase().split(' ');
                    var length = terms.length;

                    var res = DataSvc.getCollection("products").where(function(obj){
                        var match = true;
                        for(var i=0; i < length; i++){
                            match = match && obj.searchText.indexOf(terms[i]) != -1;
                            if(!match){
                                break;
                            }
                        }
                        return match;
                    });

                    deferred.resolve(res);//this algorithm is much faster than regex solution
                } else {
                    deferred.resolve([]);
                }
            }, 0);

            return deferred.promise;
        }

        return res;
    }]);
