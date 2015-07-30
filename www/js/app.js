// Ionic Starter App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
// 'starter.services' is found in services.js
// 'starter.controllers' is found in controllers.js
angular.module('iPrices', ['ionic', 'angular-storage', 'ngCordova', 'iPrices.controllers', 'iPrices.services', 'iPrices.filters', 'lokijs'])
    .constant('afConfig', config)

    .run(function($ionicPlatform, $ionicPopup, $rootScope, afConfig, DataSvc, $state, $cordovaGoogleAnalytics, $cordovaNetwork, $cordovaStatusbar) {

        //var outOfDateShown = false;
        //$rootScope.$on("VERSION.OUT.DATE", function(){
        //
        //    if(!outOfDateShown){
        //        $ionicPopup.alert({
        //            title: '提示',
        //            template: '<div style="text-align:center">有新版本请更新</div>'
        //        }).then(function() {
        //        });
        //    }
        //    outOfDateShown = true;
        //});

      //init $rootScope utilities
      $state.go('loading');

      $rootScope.config = afConfig;
      DataSvc.dataReady.then(function(){
        $state.go('home.news');
      }, function(){});

      $ionicPlatform.ready(function() {

          // listen for Online event
          //$rootScope.$on('$cordovaNetwork:online', function(event, networkState){
          //
          //})

          // listen for Offline event
          $rootScope.$on('$cordovaNetwork:offline', function(event, networkState){
              $ionicPopup.alert({
                  title: '提示',
                  template: '<div style="text-align:center">当前网络未连接，请检查网络设置</div>'
              }).then(function() {
              });
          })


          //google analytics
          if (typeof analytics !== 'undefined'){
              $cordovaGoogleAnalytics.startTrackerWithId(afConfig.analyticsUA);
          }
          else
          {
              console.log("Google Analytics plugin could not be loaded.")
          }
        //admob configuration
        if(window.AdMob) {
          var admobId;

          if ( /(android)/i.test(navigator.userAgent) ) {
            admobId = {
              banner:"ANDROID_PUBLISHER_KEY",
              intersitial:"ANDROID_PUBLISHER_KEY"
            };
          } else if( /(ipod|iphone|ipad)/i.test(navigator.userAgent) ) {
            admobId = {
              banner: "ca-app-pub-3349787729360682/6269030859",//"ca-app-pub-3349787729360682/9138553652",
              intersitial: "ca-app-pub-3349787729360682/3092020058"
            };
          }


            //AdMob.createBanner({
            //  adId: admobId.banner,
            //  adSize:AdMob.SMART_BANNER,
            //  position: AdMob.AD_POSITION.BOTTOM_CENTER,
            //  //overlap:true,
            //  autoShow: true
            //});

            //AdMob.prepareInterstitial( {adId:admobId.intersitial, autoShow:false} );

            //document.addEventListener('onAdLoaded', AdMob.showInterstitial);

        }
        // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
        // for form inputs)
        if (window.cordova && window.cordova.plugins && window.cordova.plugins.Keyboard) {
          cordova.plugins.Keyboard.hideKeyboardAccessoryBar(false);
        }


        $cordovaStatusbar.style(0);
        $cordovaStatusbar.overlaysWebView(true);

          $ionicPlatform.on('resume', function(){
              if(Math.random() < 0.36){//50% to show pub on resume
                  AdMob.prepareInterstitial( {adId:admobId.intersitial, autoShow:false} );
              }
          });
      });
    })

.config(['$stateProvider', '$urlRouterProvider', '$httpProvider', 'afConfig','APIInterceptorSvcProvider', function($stateProvider, $urlRouterProvider, $httpProvider, afConfig, APIInterceptorSvcProvider) {

      $httpProvider.defaults.headers.common.apikey = afConfig.apiKey;
      // Ionic uses AngularUI Router which uses the concept of states
      // Learn more here: https://github.com/angular-ui/ui-router
      // Set up the various states which the app can be in.
      // Each state's controller can be found in controllers.js
      $stateProvider

          .state('loading', {
              url:'/loading',
              templateUrl:'templates/loading.html'
          })
        // setup an abstract state for the tabs directive
          .state('home', {
            url:'/home',
            abstract:true,
            templateUrl:'templates/home.html'
          })

        // Each tab has its own nav history stack:
          .state('home.news', {
            url:'/news',
            views:{
              'home-news':{
                templateUrl:'templates/home-news.html',
                controller:'NewsCtrl'
              }
            }
          })
          .state('home.news-detail', {
            url: '/news/:id',
            views: {
              'home-news': {
                templateUrl: 'templates/news-detail.html',
                controller: 'NewsDetailCtrl'
              }
            }
          })
          .state('home.rubrics', {
            url:'/rubrics',
            views:{
              'home-rubrics':{
                templateUrl:'templates/home-rubrics.html',
                controller:'RubricsCtrl'
              }
            }
          })
          .state('home.rubrics-products', {
            url: '/rubrics/:id',
            data:{
              category:'rubric'
            },
            views: {
              'home-rubrics': {
                templateUrl: 'templates/products-list.html',
                controller: 'ProductListCtrl'
              }
            }
          })
          .state('home.rubrics-product', {
            url: '/rubrics-products/:id',
            views: {
              'home-rubrics': {
                templateUrl: 'templates/product-detail.html',
                controller: 'ProductDetailCtrl'
              }
            }
          })
          .state('home.brands', {
            url: '/brands',
            views: {
              'home-brands': {
                templateUrl: 'templates/home-brands.html',
                controller: 'BrandsCtrl'
              }
            }
          })
          .state('home.brands-searchresult', {
              url: '/brands-search-result/:term',
              views: {
                  'home-brands': {
                      templateUrl: 'templates/products-list.html',
                      controller: 'SearchResultCtrl'
                  }
              }
          })

          .state('home.brands-products', {
            url: '/brands/:id',
            data:{
              category:'brand'
            },
            views: {
              'home-brands': {
                templateUrl: 'templates/products-list.html',
                controller: 'ProductListCtrl'
              }
            }
          })
          .state('home.brands-product', {
            url: '/brands-products/:id',
            views: {
              'home-brands': {
                templateUrl: 'templates/product-detail.html',
                controller: 'ProductDetailCtrl'
              }
            }
          })

          .state('home.account', {
            url: '/account',
            views: {
              'home-account': {
                templateUrl: 'templates/home-account.html',
                controller: 'AccountCtrl'
              }
            }
          })
          .state('home.account-login', {
              url: '/account-login',
              views: {
                  'home-account': {
                      templateUrl: 'templates/account-login.html',
                      controller: 'AuthCtrl'
                  }
              }
          })
          .state('home.account-register', {
              url: '/account-register',
              views: {
                  'home-account': {
                      templateUrl: 'templates/account-register.html',
                      controller: 'AuthCtrl'
                  }
              }
          })
          .state('home.account-lostpassword', {
              url: '/account-lost-password',
              views: {
                  'home-account': {
                      templateUrl: 'templates/account-lost-password.html',
                      controller: 'AuthCtrl'
                  }
              }
          })
          .state('home.account-resetpassword', {
              url: '/account-reset-password',
              views: {
                  'home-account': {
                      templateUrl: 'templates/account-reset-password.html',
                      controller: 'AuthCtrl'
                  }
              }
          })
          .state('home.account-registersuccess', {
              url: '/account-register-success',
              views: {
                  'home-account': {
                      templateUrl: 'templates/account-register-success.html',
                      controller: 'AuthCtrl'
                  }
              }
          })
          .state('home.account-favoris', {
              url: '/account-favoris',
              views: {
                  'home-account': {
                      templateUrl: 'templates/account-favoris.html',
                      controller: 'FavorisCtrl'
                  }
              }
          })
          .state('home.account-favorisdetails', {
              url: '/favoris-products/:id',
              views: {
                  'home-account': {
                      templateUrl: 'templates/product-detail.html',
                      controller: 'ProductDetailCtrl'
                  }
              }
          })
          .state('home.account-addproduct', {
              url: '/products-create/',
              views: {
                  'home-account': {
                      templateUrl: 'templates/product-create.html',
                      controller: 'ProductCreateCtrl'
                  }
              }
          })
          .state('home.account-productlist', {
              url: '/account-products',
              views: {
                  'home-account': {
                      templateUrl: 'templates/account-products.html',
                      controller: 'MyProductsCtrl'
                  }
              }
          })
          .state('home.account-productdetails', {
              url: '/account-products/:id',
              views: {
                  'home-account': {
                      templateUrl: 'templates/product-detail.html',
                      controller: 'ProductDetailCtrl'
                  }
              }
          })
          .state('home.account-adminproduct', {
              url: '/account-admin-product',
              views: {
                  'home-account': {
                      templateUrl: 'templates/products-list.html',
                      controller: 'AdminCtrl'
                  }
              }
          })
          .state('home.account-adminproductdetails', {
              url: '/account-admin-product/:id',
              views: {
                  'home-account': {
                      templateUrl: 'templates/product-detail.html',
                      controller: 'AdminCtrl'
                  }
              }
          })
          .state('home.account-adminuser', {
              url: '/account-admin-user',
              views: {
                  'home-account': {
                      templateUrl: 'templates/user-list.html',
                      controller: 'AdminUserCtrl'
                  }
              }
          });
      // if none of the above states are matched, use this as the fallback
      $urlRouterProvider.otherwise('/news');

      $httpProvider.interceptors.push('APIInterceptorSvc');

    }]);
