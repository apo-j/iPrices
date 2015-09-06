angular.module('iPrices.controllers', [])
    .controller('NewsCtrl', ['$scope', 'NewsSvc', function ($scope, NewsSvc) {
        $scope.$on('$ionicView.enter', function () {
            $scope.$hasHeader = true;
        });

        $scope.news = [];
        $scope.currentPage = 0;

        $scope.doRefresh = function () {
            var version = !!$scope.news[0] ? $scope.news[0].version : '';
            var param = {page: $scope.currentPage, version: version};
            NewsSvc.fetch(param).then(function (data) {
                    $scope.news.unshiftRange(data.data);
                }
            ).finally(function () {
                    $scope.$broadcast('scroll.refreshComplete');
                });

        }

        $scope.loadHistoryItems = function () {
            $scope.currentPage++;
            if ($scope.currentPage > ($scope.news.length / 3)) {
                $scope.currentPage = Math.floor($scope.news.length / 3);
                $scope.$broadcast('scroll.infiniteScrollComplete');
            } else {
                NewsSvc.fetch({page: $scope.currentPage, version: ''}).then(function (data) {
                        $scope.news.pushRange(data.data);
                    }
                ).finally(function () {
                        $scope.$broadcast('scroll.infiniteScrollComplete');
                    });
            }
        }

        NewsSvc.fetch({page: 0, version: ''}).then(function (data) {
            $scope.news.unshiftRange(data.data);
        });
    }])
    .controller('NewsDetailCtrl', ['$cordovaGoogleAnalytics', '$scope', '$stateParams', 'NewsSvc', '$ionicActionSheet','WeChatSvc','afConfig', function ($cordovaGoogleAnalytics, $scope, $stateParams, NewsSvc, $ionicActionSheet, WeChatSvc, afConfig) {
        $scope.loading = true;

        $scope.share = function(){
            var shareSheet = $ionicActionSheet.show({
                buttons: [
                    {text: '<b>分享至微信朋友圈<b>'},
                    {text: '分享给微信好友'}
                ],
                titleText:'分享',
                cancelText: '取消',
                cancel: function () {
                    // add cancel code..
                },
                buttonClicked: function (index) {
                    var msg = {
                        title: $scope.news.title || afConfig.appName,
                        description: $scope.news.author || '',
                        url: afConfig.shareRootUrl + '/#/news?id=' +$scope.news.id,
                        thumb: null
                    }
                    if (index == 0) {//timeline
                        WeChatSvc.share(msg, WeChat.Scene.timeline);
                    } else {//session
                        WeChatSvc.share(msg, WeChat.Scene.session);
                    }
                    shareSheet();
                    return true;
                }
            });
        }

        NewsSvc.get($stateParams.id).then(function (data) {
            $scope.news = data.data;
            $scope.loading = false;
            $cordovaGoogleAnalytics.trackEvent('News', 'View', $stateParams.id);
        }, function (reason) {
        });


    }])

    .controller('RubricsCtrl', ['$scope', '$stateParams', 'RubricsSvc', function ($scope, $stateParams, RubricsSvc) {
        RubricsSvc.all($stateParams.id).then(function (data) {
            $scope.rubrics = data.data;
        });
    }])

    .controller('ProductListCtrl', ['$cordovaGoogleAnalytics', '$scope', '$stateParams', 'ProductsSvc', '_', '$state', function ($cordovaGoogleAnalytics, $scope, $stateParams, ProductsSvc, _, $state) {
        $scope.category = $state.current.data.category;
        $scope.detailUrl = '';

        //$cordovaGoogleAnalytics.trackEvent('Product', 'Category', $scope.category);
        ProductsSvc.getByCategory($scope.category, $stateParams.id).then(function (data) {
            $scope.products = _.sortBy(data.data, function (product) {
                return -product.priority;
            });

            if (data.data instanceof Array && data.data[0]) {
                $scope.title = data.data[0][$scope.category + "Label"];
                if ($state.current.data.category == 'rubric') {
                    $scope.detailUrl = "#/home/rubrics-products/";
                } else {
                    $scope.detailUrl = "#/home/brands-products/";
                }
            } else {
                $scope.title = undefined;
            }
        });
    }])
    .controller('FavorisCtrl', ['$scope', 'FavorisSvc', '$rootScope', '$state', function ($scope, FavorisSvc, $rootScope, $state) {
        $scope.favoris = [];

        $scope.remove = function (product) {
            FavorisSvc.remove(product).then(function (data) {
                getFavoris();
            })
        }

        $rootScope.$on("favoris.updated", function () {
            getFavoris();
        })

        function getFavoris() {
            FavorisSvc.all().then(function (data) {
                $scope.favoris = data.data;
            }, function () {
                $scope.favoris = [];
            })
        }

        getFavoris();

    }])

    .controller('ProductDetailCtrl', ['$cordovaGoogleAnalytics', '$scope', '$rootScope', '$stateParams', 'ProductsSvc', '$ionicSlideBoxDelegate', 'FavorisSvc', '$ionicPopup', '$state','$ionicActionSheet', 'WeChatSvc', 'afConfig', function ($cordovaGoogleAnalytics, $scope, $rootScope, $stateParams, ProductsSvc, $ionicSlideBoxDelegate, FavorisSvc, $ionicPopup, $state, $ionicActionSheet, WeChatSvc, afConfig) {
        $scope.share = function(){
            var shareSheet = $ionicActionSheet.show({
                buttons: [
                    {text: '<b>分享至微信朋友圈<b>'},
                    {text: '分享给微信好友'}
                ],
                titleText:'分享',
                cancelText: '取消',
                cancel: function () {
                    // add cancel code..
                },
                buttonClicked: function (index) {
                    var msg = {
                        title: $scope.product.title || afConfig.appName,
                        description: "编号：" + $scope.product.reference,
                        url: afConfig.shareRootUrl + '/#/product?id=' +$scope.product.id,
                        thumb: null
                    }
                    if (index == 0) {//timeline
                        WeChatSvc.share(msg, WeChat.Scene.timeline);
                    } else {//session
                        WeChatSvc.share(msg, WeChat.Scene.session);
                    }
                    shareSheet();
                    return true;
                }
            });
        }

        ProductsSvc.get($stateParams.id).then(function (data) {
            $scope.product = data.data;
            $scope.prices = data.data.prices || [];
            $ionicSlideBoxDelegate.update();
            $cordovaGoogleAnalytics.trackEvent('Product', 'View', $stateParams.id);
        });

        $scope.like = function () {
            ProductsSvc.addLike($scope.product).then(function (data) {
                $scope.product.likeNumber = data.data;
                ProductsSvc.updateLocal($scope.product);
                $cordovaGoogleAnalytics.trackEvent('Product', 'Like', $scope.product.id);
            })
        }

        $scope.addFavoris = function () {
            //$cordovaGoogleAnalytics.trackEvent('Product', 'Favoris', $stateParams.id);
            FavorisSvc.add($scope.product).then(function (data) {
                if (data.data === true) {
                    $ionicPopup.alert({
                        title: '提示',
                        template: '<div style="text-align:center">此产品已收藏</div>'
                    }).then(function (res) {
                    });
                } else {
                    $ionicPopup.alert({
                        title: '提示',
                        template: '<div style="text-align:center">收藏成功</div>'
                    }).then(function (res) {
                    });
                    $rootScope.$broadcast("favoris.updated");
                }
            }, function (reason) {
                if (reason.status === 401) {
                    $ionicPopup.confirm({
                        title: '提示',
                        template: '<div style="text-align:center">登录以后才可以收藏哦</div>',
                        cancelText: '取消',
                        okText: '确定'
                    }).then(function (res) {
                        if (res) {//confirmed
                            $state.go('home.account-login');
                        }
                    });
                }
            });
        }
    }])
    .controller('ProductCreateCtrl', ['$ionicPlatform', '$ionicPopup', '$ionicActionSheet', '$cordovaCamera', '$cordovaImagePicker', '$scope', '$rootScope', 'ProductsSvc', 'DataSvc', '$state', function ($ionicPlatform, $ionicPopup, $ionicActionSheet, $cordovaCamera, $cordovaImagePicker, $scope, $rootScope, ProductsSvc, DataSvc, $state) {
        $scope.product = {
            title: undefined,
            brandLabel: undefined,
            brand: undefined,
            reference: undefined,
            collectionLabel: undefined,
            description: undefined,
            images: [],
            prices: []
        };

        $scope.images = [[]];

        $scope.allBrands = DataSvc.getCollection('brand').data;
        $scope.addPrice = function () {
            $scope.product.prices.push({country: undefined, price: undefined});
        }


        $scope.currentStep = 1;
        $scope.nextStep = function () {
            if ($scope.currentStep < 3) {
                $scope.currentStep++;
            }
        }

        $scope.prevStep = function () {
            if ($scope.currentStep > 1) {
                $scope.currentStep--;
            }
        }

        $scope.selectImageSource = function () {
            // Show the action sheet
            $ionicActionSheet.show({
                buttons: [
                    {text: '拍照'},
                    {text: '从手机相册选择'}
                ],
                cancelText: '取消',
                cancel: function () {
                    // add cancel code..
                },
                buttonClicked: function (index) {
                    if (index == 0) {//camera
                        $scope.selectImagesFromCamera();
                    } else {//gallery
                        $scope.selectImagesFromGallery();
                    }
                    return true;
                }
            });
        }

        $scope.upload = function () {
            ProductsSvc.add($scope.product).then(function () {
                $ionicPopup.alert({
                    title: '恭喜',
                    template: '<div style="text-align:center">您的产品已成功上传，点击确认返回</div>'
                }).then(function (res) {
                    $rootScope.$broadcast("my.products.updated");
                    $state.go('home.account');
                });
            });
        };

        $ionicPlatform.ready(function () {

            //function selectImage(options){
            //    $cordovaCamera.getPicture(options).then(function(imageData) {
            //        if($scope.product.images.length < 7){
            //            $scope.product.images.push(imageData);
            //        }else{
            //            $ionicPopup.alert({
            //                title: '提示',
            //                template: '<div style="text-align:center">最多可选择6涨图片</div>'
            //            })
            //        }
            //    }, function(err) {
            //        // error
            //    });
            //}
            ////camera
            //var options = {
            //    quality: 100,
            //    destinationType: Camera.DestinationType.DATA_URL,
            //    sourceType: Camera.PictureSourceType.CAMERA,
            //    allowEdit: true,
            //    encodingType: Camera.EncodingType.JPEG,
            //    targetWidth: 100,
            //    targetHeight: 100,
            //    popoverOptions: CameraPopoverOptions,
            //    saveToPhotoAlbum: false
            //};
            //$scope.selectImagesFromCamera = function(){
            //    options.sourceType = Camera.PictureSourceType.CAMERA;
            //    selectImage(options);
            //}
            //
            //
            //
            //$scope.selectImagesFromGallery = function(){
            //    options.sourceType = Camera.PictureSourceType.PHOTOLIBRARY;
            //    selectImage(options);
            //}

            //
            //    //todo change to imagePicker
            //gallery
            //var imagePickerOptions = {
            //    maximumImagesCount: 6,
            //    width: 800,
            //    height: 800,
            //    quality: 80
            //};
            //    //$cordovaImagePicker.getPictures(imagePickerOptions)
            //    //    .then(function (results) {
            //    //        for(var i = 0; i < results.length; i++){
            //    //            console.log(results[i]);
            //    //            $scope.product.images.push(encodeImageUri(results[i]));
            //    //        }
            //    //        if(!$scope.$$phase) {
            //    //            $scope.$apply();
            //    //        }
            //    //    }, function(error) {
            //    //        // error getting photos
            //    //    });

        })
    }])
    .controller('MyProductsCtrl', ['$ionicPopup', '$rootScope', '$scope', 'ProductsSvc', 'DataSvc', '$state', function ($ionicPopup, $rootScope, $scope, ProductsSvc, DataSvc, $state) {
        $scope.products = [];
        function getProducts() {
            ProductsSvc.getMyProducts().then(function (data) {
                if (data.data.length > 0) {
                    $scope.products = data.data;
                } else {
                    $ionicPopup.alert({
                        title: '提示',
                        template: '<div style="text-align:center">您尚未上传产品，点击确认返回</div>'
                    }).then(function (res) {
                        $state.go('home.account');
                    });
                }

            }, function () {
                $scope.products = [];
            })
        }

        $rootScope.$on('my.products.updated', function () {
            getProducts();
        })
        getProducts();
    }])
    .controller('AuthCtrl', ['$scope', '$rootScope', 'AuthSvc', 'UserSvc', '$state', '$ionicPopup', function ($scope, $rootScope, AuthSvc, UserSvc, $state, $ionicPopup) {
        $scope.signIn = function (user) {
            AuthSvc.login(user)
                .then(function (response) {
                    user.role = response.data.role;
                    login(user, response.data.token);
                }, function (reason) {
                    showAlert();
                });
        }

        function login(user, token, naviateTo) {
            user.accessToken = token;
            delete user.password;
            UserSvc.setCurrentUser(user);
            $rootScope.$broadcast('authorized');
            $state.go(naviateTo || 'home.account');
        }

        $scope.register = function (user) {
            if (user.password !== user.passwordConfirmation) {
                $ionicPopup.alert({
                    title: '错误',
                    template: '<div style="text-align:center">密码输入不一致</div>'
                }).then(function (res) {
                });
            } else {
                AuthSvc.register(user)
                    .then(function (response) {
                        user.role = response.data.role;
                        login(user, response.data.token, "home.account-registersuccess");
                    }, function (reason) {
                        $ionicPopup.alert({
                            title: '错误',
                            template: '<div style="text-align:center">您所输入的用户名已存在，请重试</div>'
                        });
                    });
            }
        }

        $scope.resetPassword = function (user) {
            if (!user.verifyCode) {
                $ionicPopup.alert({
                    title: '错误',
                    template: '<div style="text-align:center">请输入确认码</div>'
                });
            } else {
                if (user.password && user.password === user.passwordConfirmation) {
                    AuthSvc.resetPassword({
                        verifyCode: user.verifyCode,
                        password: user.password
                    }).then(function (response) {
                        if (response.data.token) {
                            login(user, response.data.token);
                        }
                    }, function (reason) {
                        $ionicPopup.alert({
                            title: '错误',
                            template: '<div style="text-align:center">您所输入的确认码不正确</div>'
                        });
                    });
                } else {
                    $ionicPopup.alert({
                        title: '错误',
                        template: '<div style="text-align:center">新密码不一致</div>'
                    });
                }
            }

        };

        $scope.isSending = false;
        $scope.fetchPassword = function (user) {
            $scope.isSending = true;
            AuthSvc.fetchPassword(user.email)
                .then(function (response) {
                    $scope.isSending = false;
                    $state.go('home.account-resetpassword');
                }, function (reason) {
                    $scope.isSending = false;
                    var alertPopup = $ionicPopup.alert({
                        title: '失败',
                        template: '<div style="text-align:center">用户名不存在</div>'
                    });
                    alertPopup.then(function (res) {

                    });
                });
        }

        function showAlert() {
            var alertPopup = $ionicPopup.alert({
                title: '登录失败',
                cssClass: 'popup-dark dark',
                template: '<div style="text-align:center">用户名或密码错误，请重新输入</div>'
            });
            alertPopup.then(function (res) {

            });
        };

    }])
    .controller('AccountCtrl', ['$scope', '$rootScope', 'UserSvc', '$state', 'AuthSvc', function ($scope, $rootScope, UserSvc, $state, AuthSvc) {
        $scope.currentUser = UserSvc.getCurrentUser();

        $scope.canAddProduct = function () {
            if ($scope.currentUser) {
                return /(admin)|(premium)/ig.test($scope.currentUser.role.code);
            }
        }

        $scope.canAdmin = function () {
            if ($scope.currentUser) {
                return /(admin)/ig.test($scope.currentUser.role.code);
            }
        }

        if (!$scope.currentUser) {
            $state.go('home.account-login');
        }

        $rootScope.$on('authorized', function () {
            $scope.currentUser = UserSvc.getCurrentUser();
        });

        $rootScope.$on('unauthorized', function () {
            $scope.currentUser = UserSvc.setCurrentUser(null);
            $state.go('home.account-login');
        });

        $scope.logout = function () {
            AuthSvc.logout()
                .then(function (response) {
                    $scope.currentUser = UserSvc.setCurrentUser(null);
                    $state.go('home.account-login');
                }, function (error) {
                    console.log(error);
                });
        }

    }])
    .controller("SearchResultCtrl", ['$scope', '$stateParams', 'BrandsSvc', function ($scope, $stateParams, BrandsSvc) {
        $scope.$hasHeader = true;
        $scope.title = $stateParams.term;
        $scope.detailUrl = "#/home/brands-products/";
        var begin = new Date();
        BrandsSvc.search($stateParams.term).then(function (data) {
            //console.log((new Date()) - begin);
            if(data.length <= 0){
                $scope.searchNoResults = true;
            }
            $scope.products = data;
        });
    }])
    .controller('BrandsCtrl', ['$cordovaGoogleAnalytics', '$scope', '$state', 'BrandsSvc', function ($cordovaGoogleAnalytics, $scope, $state, BrandsSvc) {

        $scope.$on('$ionicView.enter', function () {
            $scope.$hasHeader = true;
        });

        BrandsSvc.all().then(function (data) {
            $scope.brands = data.data;
        });

        $scope.products = [];

        $scope.query = {term: undefined};

        $scope.search = function () {
            $cordovaGoogleAnalytics.trackEvent('Product', 'Search', $scope.query.term);
            $state.go('home.brands-searchresult', {term: $scope.query.term});
        }

        $scope.clearQuery = function () {
            $scope.query.term = undefined;
        }
    }]);

