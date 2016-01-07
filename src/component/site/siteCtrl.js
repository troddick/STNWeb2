﻿(function () {
    /* controllers.js, 'leaflet-directive''ui.unique','ngTagsInput',*/
    'use strict';

    var STNControllers = angular.module('STNControllers');
    //#region SITE
    STNControllers.controller('SiteCtrl', ['$scope', '$rootScope', '$cookies', '$location', '$state', '$http', '$uibModal', '$filter', '$timeout',
        'thisSite', 'thisSiteNetworkNames', 'thisSiteNetworkTypes', 'thisSiteHousings', 'thisSiteOPs', 'thisSiteSensors', 'thisSiteHWMs', 'thisSiteFiles', 'thisSitePeaks',
        'SITE', 'LANDOWNER_CONTACT', 'MEMBER', 'DEPLOYMENT_TYPE', 'INSTRUMENT', 'INSTRUMENT_STATUS', 'SITE_HOUSING', 'NETWORK_NAME',
        'allHorDatums', 'allHorCollMethods', 'allStates', 'allCounties', 'allDeployPriorities', 'allHousingTypes', 'allNetworkNames', 'allNetworkTypes', 'allDeployTypes', 'allSensDeps', SiteCtrl]);
        function SiteCtrl($scope, $rootScope, $cookies, $location, $state, $http, $uibModal, $filter, $timeout,
        thisSite, thisSiteNetworkNames, thisSiteNetworkTypes, thisSiteHousings, thisSiteOPs, thisSiteSensors, thisSiteHWMs, thisSiteFiles, thisSitePeaks,
        SITE, LANDOWNER_CONTACT, MEMBER, DEPLOYMENT_TYPE, INSTRUMENT, INSTRUMENT_STATUS, SITE_HOUSING, NETWORK_NAME,
        allHorDatums, allHorCollMethods, allStates, allCounties, allDeployPriorities, allHousingTypes, allNetworkNames, allNetworkTypes, allDeployTypes, allSensDeps) {
        if ($cookies.get('STNCreds') == undefined || $cookies.get('STNCreds') == "") {
            $scope.auth = false;
            $location.path('/login');
        } else {
            $rootScope.thisPage = "Site Dashboard";
            $scope.aSite = {};
            $scope.status = {
                mapOpen: false, siteOpen: true, opOpen: false, sensorOpen: false, hwmOpen: false, filesOpen: false, peakOpen: false
            };
            $scope.addedHouseType = []; //holder for when adding housing type to page from multiselect
            
            //open modal to edit or create a site
            $scope.openSiteCreate = function () {
                var dropdownParts =[allHorDatums, allHorCollMethods, allStates, allCounties, allHousingTypes, allDeployPriorities,
                    allNetworkNames, allNetworkTypes, allDeployTypes, allSensDeps];
                //modal
                var modalInstance = $uibModal.open({
                        templateUrl: 'SITEmodal.html',
                        controller: 'SITEmodalCtrl',
                        size: 'lg',
                        backdrop: 'static',
                        windowClass: 'rep-dialog',
                        resolve: {
                            allDropDownParts: function () {
                                return dropdownParts;
                            },
                            thisSiteStuff: function () {
                                if ($scope.aSite.SITE_ID != undefined) {
                                    var origSiteHouses = $scope.originalSiteHousings != undefined ? $scope.originalSiteHousings : [];
                                    var addedHouses = $scope.addedHouseType != undefined ? $scope.addedHouseType : [];
                                    var sNetNames = thisSiteNetworkNames != undefined ? thisSiteNetworkNames : [];
                                    var sNetTypes = thisSiteNetworkTypes != undefined ? thisSiteNetworkTypes : [];
                                    var lo = $scope.landowner != undefined ? $scope.landowner : {
                                };
                                var siteRelatedStuff = [$scope.aSite, origSiteHouses, addedHouses, sNetNames, sNetTypes, lo];
                                return siteRelatedStuff;
                            }
                        }
                    }
                });
                modalInstance.result.then(function (r) {
                    //nothing to do here
                    $scope.aSite = r;
                });
            };

            // is this create new site or view existing??            
            if (thisSite != undefined) {
                //#region existingSite
                if (thisSite.SITE_ID != undefined) {
                    $scope.aSite = thisSite;                  

                    $scope.aSite.decDegORdms = 'dd';
                    $scope.aSite.HorizontalDatum = $scope.aSite.HDATUM_ID > 0 ? allHorDatums.filter(function (hd) { return hd.DATUM_ID == $scope.aSite.HDATUM_ID; })[0].DATUM_NAME : "---";
                    $scope.aSite.HorizontalCollectMethod = $scope.aSite.HCOLLECT_METHOD_ID != undefined && $scope.aSite.HCOLLECT_METHOD_ID > 0 ? allHorCollMethods.filter(function (hc) { return hc.HCOLLECT_METHOD_ID == $scope.aSite.HCOLLECT_METHOD_ID; })[0].HCOLLECT_METHOD : "---";
                    $scope.aSite.PriorityName = $scope.aSite.PRIORITY_ID != undefined && $scope.aSite.PRIORITY_ID > 0 ? allDeployPriorities.filter(function (dp) { return dp.PRIORITY_ID == $scope.aSite.PRIORITY_ID; })[0].PRIORITY_NAME: "---";
                   
                    //apply any site housings
                    if (thisSiteHousings.length > 0) {
                        $scope.originalSiteHousings = thisSiteHousings;
                        $scope.showSiteHouseTable = true;

                        for (var z = 0; z < $scope.originalSiteHousings.length; z++) {
                                //for each housingtypelist..make selected = true for these                       
                            var houseTypeName = allHousingTypes.filter(function (h) {
                                return h.HOUSING_TYPE_ID == $scope.originalSiteHousings[z].HOUSING_TYPE_ID;
                            })[0].TYPE_NAME;
                            var houseT = {
                                TYPE_NAME: houseTypeName,
                                HOUSING_TYPE_ID : $scope.originalSiteHousings[z].HOUSING_TYPE_ID,
                                SITE_HOUSING_ID: $scope.originalSiteHousings[z].SITE_HOUSING_ID,
                                LENGTH: $scope.originalSiteHousings[z].LENGTH,
                                MATERIAL: $scope.originalSiteHousings[z].MATERIAL,
                                NOTES: $scope.originalSiteHousings[z].NOTES,
                                AMOUNT: $scope.originalSiteHousings[z].AMOUNT
                            };
                            $scope.addedHouseType.push(houseT);
                        }
                    }//end if thisSiteHousings != undefined

                    //apply any site network names or types
                    $scope.siteNetworkNames = [];
                    if (thisSiteNetworkNames.length > 0) {
                        for (var a = 0; a < thisSiteNetworkNames.length; a++) {
                            var nn = allNetworkNames.filter(function (n) { return n.NETWORK_NAME_ID == thisSiteNetworkNames[a].NETWORK_NAME_ID; })[0];
                            $scope.siteNetworkNames.push(nn.NAME);
                        }
                    }
                    //apply any site network names or types
                    $scope.siteNetworkTypes = [];
                    if (thisSiteNetworkTypes.length > 0) {
                        for (var b = 0; b < thisSiteNetworkTypes.length; b++) {
                            var nt = allNetworkTypes.filter(function (nt) { return nt.NETWORK_TYPE_ID == thisSiteNetworkTypes[b].NETWORK_TYPE_ID; })[0];
                            $scope.siteNetworkTypes.push(nt.NETWORK_TYPE_NAME);
                        }
                    }
                    if ($scope.aSite.SENSOR_NOT_APPROPRIATE != null || $scope.aSite.SENSOR_NOT_APPROPRIATE > 0)
                        $scope.sensorNotAppr = "Yes";
                    else
                        $scope.sensorNotAppr = "No";


                    //get member name for display
                    if ($scope.aSite.MEMBER_ID != null) {
                        $http.defaults.headers.common['Authorization'] = 'Basic ' + $cookies.get('STNCreds');
                        $http.defaults.headers.common['Accept'] = 'application/json';
                        MEMBER.query({ id: $scope.aSite.MEMBER_ID }).$promise.then(function (response) {
                            $scope.aSite.Creator = response.FNAME + " " + response.LNAME;
                        }, function (error) {
                            $scope.aSite.Creator = "Not recorded";
                        }).$promise;
                    }

                    //get the landownerCOntact with getCreds
                    if ($scope.aSite.LANDOWNERCONTACT_ID != null) {
                        $http.defaults.headers.common['Authorization'] = 'Basic ' + $cookies.get('STNCreds');
                        $http.defaults.headers.common['Accept'] = 'application/json';
                        SITE.getSiteLandOwner({ id: $scope.aSite.SITE_ID }, function success(response) {
                            $scope.landowner = response;
                            $scope.addLandowner = true;
                        }, function error(errorResponse) {
                            toastr.error("Error: " + errorResponse.statusText);
                        }).$promise;
                    }//end if site has landownercontact id

                } else {
                    //site != undefined but the site.SITE_ID is == this site doesn't exist
                    toastr.error("This site does not exist");
                    $(".page-loading").addClass("hidden");
                    $location.path('/Home').replace();//.notify(false);
                    $scope.apply;
                }
                    //#endregion existingSite
            } else {
                //open modal if new site for create
                $scope.openSiteCreate();
            }
        }//end else checkCreds is good
    }

    //#endregion SITE
})();