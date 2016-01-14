(function () {
    /* controllers.js, 'leaflet-directive''ui.unique','ngTagsInput',*/
    'use strict';

    var STNControllers = angular.module('STNControllers');
   //#region INSTRUMENT
    STNControllers.controller('sensorCtrl', ['$scope', '$q', '$cookies', '$location', '$state', '$http', '$uibModal', '$filter', '$timeout', 'thisSite', 'thisSiteSensors', 'allSensorBrands', 'allStatusTypes', 'allDeployTypes', 'allSensorTypes', 'allSensDeps', 'allHousingTypes', 'allEvents', 'INSTRUMENT', 'INSTRUMENT_STATUS', 'SITE', 'MEMBER', 'DEPLOYMENT_TYPE', sensorCtrl]);
    function sensorCtrl($scope, $q, $cookies, $location, $state, $http, $uibModal, $filter, $timeout, thisSite, thisSiteSensors, allSensorBrands, allStatusTypes, allDeployTypes, allSensorTypes, allSensDeps, allHousingTypes, allEvents, INSTRUMENT, INSTRUMENT_STATUS, SITE, MEMBER, DEPLOYMENT_TYPE) {
        if ($cookies.get('STNCreds') == undefined || $cookies.get('STNCreds') == "") {
            $scope.auth = false;
            $location.path('/login');
        } else {
            //global vars
            $scope.sensorCount = { total: thisSiteSensors.length };           
            $scope.statusTypeList = allStatusTypes;
            $scope.deployTypeList = angular.copy(allDeployTypes);
            var tempDepTypeID = 0;
            //fix deployment types so that "Temperature" becomes 2 : Temperature (Met sensor)-SensorType:2 and Temperature (pressure transducer)-SensorType:1 -- just for proposed
            for (var d = 0; d < $scope.deployTypeList.length; d++) {
                if ($scope.deployTypeList[d].METHOD === "Temperature") {
                    tempDepTypeID = $scope.deployTypeList[d].DEPLOYMENT_TYPE_ID;
                    $scope.deployTypeList[d].METHOD = "Temperature (Met sensor)";
                }
            }
            $scope.deployTypeList.push({DEPLOYMENT_TYPE_ID: tempDepTypeID, METHOD: "Temperature (Pressure Transducer)" });

            $scope.sensDepTypes = allSensDeps;
            $scope.showProposed = false; //they want to add a proposed sensor, open options
            $scope.SiteSensors = thisSiteSensors;
            //show/hide proposed sensors to add
            $scope.showHideProposed = function () {
                $scope.showProposed = !$scope.showProposed;
            }
           
            //add these checked Proposed sensors to this site
            $scope.AddProposed = function () {
                var proposedToAdd = {}; var propStatToAdd = {};
                var Time_STAMP = new Date();
                for (var dt = 0; dt < $scope.deployTypeList.length; dt++) {
                    if ($scope.deployTypeList[dt].selected == true) {
                        if ($scope.deployTypeList[dt].METHOD.substring(0, 4) == "Temp") {
                            //temperature proposed sensor
                            proposedToAdd = {
                                DEPLOYMENT_TYPE_ID: $scope.deployTypeList[dt].DEPLOYMENT_TYPE_ID,
                                SITE_ID: thisSite.SITE_ID,
                                SENSOR_TYPE_ID: $scope.deployTypeList[dt].METHOD == "Temperature (Pressure Transducer)" ? 1 : 2,
                                EVENT_ID: $cookies.get('SessionEventID') != undefined ? $cookies.get('SessionEventID') : null,
                                Deployment_Type: $scope.deployTypeList[dt].METHOD
                            }
                        } else {
                            //any other type
                            proposedToAdd = {
                                DEPLOYMENT_TYPE_ID: $scope.deployTypeList[dt].DEPLOYMENT_TYPE_ID,
                                SITE_ID: thisSite.SITE_ID,
                                SENSOR_TYPE_ID: $scope.sensDepTypes.filter(function (sdt) { return sdt.DEPLOYMENT_TYPE_ID == $scope.deployTypeList[dt].DEPLOYMENT_TYPE_ID })[0].SENSOR_TYPE_ID,
                                EVENT_ID: $cookies.get('SessionEventID') != undefined ? $cookies.get('SessionEventID') : null,
                                Deployment_Type: $scope.deployTypeList[dt].METHOD
                            }
                        }
                        //now post it (Instrument first, then Instrument Status
                        $http.defaults.headers.common['Authorization'] = 'Basic ' + $cookies.get('STNCreds');
                        $http.defaults.headers.common['Accept'] = 'application/json';
                       
                        
                        INSTRUMENT.save(proposedToAdd).$promise.then(function (response) {
                            proposedToAdd.INSTRUMENT_ID = response.INSTRUMENT_ID;
                            var propStatToAdd = { INSTRUMENT_ID: response.INSTRUMENT_ID, STATUS_TYPE_ID: 4, COLLECTION_TEAM_ID: $cookies.get('mID'), TIME_STAMP: Time_STAMP, TIME_ZONE: 'UTC' };
                            
                            INSTRUMENT_STATUS.save(propStatToAdd).$promise.then(function (statResponse) {
                                statResponse.Status = 'Proposed';
                                var instToPushToList = {
                                    Instrument: proposedToAdd,
                                    InstrumentStats: [statResponse]
                                };
                                //clean up ...all unchecked and then hide
                                for (var dep = 0; dep < $scope.deployTypeList.length; dep++) {
                                    $scope.deployTypeList[dep].selected = false;
                                }                                

                                $timeout(function () {
                                    // anything you want can go here and will safely be run on the next digest.
                                    $scope.showProposed = false;
                                    $scope.SiteSensors.push(instToPushToList);
                                    $scope.sensorCount = { total: $scope.SiteSensors.length };
                                });

                            });//end INSTRUMENT_STATUS.save
                        }); //end INSTRUMENT.save
                    }//end if selected == true
                }//end foreach deployTypeList
            }//end AddProposed()

            //want to deploy/view a sensor, 
            /*which modal? 
             1: deploy proposed (sensor, 'depProp'), deploy new('0', 'deploy'), see deployed to view/edit(sensor, 'viewDep'). 
             2: retrieve deployed(sensor, 'retrieve'). 
             3: view/edit retrieved with deployed on top(sensor, 'viewRet')
             */
            $scope.showSensorModal = function (sensorClicked, modalNeeded) {
                var passAllLists = [allSensorTypes, allSensorBrands, allHousingTypes, allSensDeps, allEvents];
                var indexClicked = $scope.SiteSensors.indexOf(sensorClicked);
                $(".page-loading").removeClass("hidden"); //loading...
                //modal (dependent on 2nd param passed in here)
                
                var modalInstance = $uibModal.open({
                    templateUrl: 'Sensormodal.html',
                    controller: 'sensormodalCtrl',
                    size: 'lg',
                    backdrop: 'static',
                    windowClass: 'rep-dialog',
                    resolve: {
                        allDropdowns: function () {
                            return passAllLists;
                        },
                        allDepTypes: function () {
                            return DEPLOYMENT_TYPE.getAll().$promise;
                        },
                        thisSensor: function () {
                            return sensorClicked != 0 ? sensorClicked : "empty";
                        },
                        SensorSite: function () {
                            return thisSite;
                        },
                        siteOPs: function () {
                            return SITE.getSiteOPs({ id: thisSite.SITE_ID }).$promise;
                        },
                        allMembers: function () {
                            $http.defaults.headers.common['Authorization'] = 'Basic ' + $cookies.get('STNCreds');
                            $http.defaults.headers.common['Accept'] = 'application/json';
                            return MEMBER.getAll().$promise;
                        }
                    }
                });
                modalInstance.result.then(function (createdSensor) {
                    //'deployP' -> createdSensor[1] will be: 'proposedDeployed' deploy new -> createdSensor[1] will be: 'newDeployed';
                    if (createdSensor[1] == 'proposedDeployed') {
                        var test;
                        var indexClicked = $scope.SiteSensors.indexOf(sensorClicked);
                        $scope.SiteSensors[indexClicked] = createdSensor[0];
                    }
                    if (createdSensor[1] == 'newDeployed') {
                        $scope.SiteSensors.push(createdSensor[0]); thisSiteSensors.push(createdSensor[0]);
                        $scope.sensorCount.total = $scope.SiteSensors.length;
                    }
                    if (createdSensor[1] == 'updated') {
                        //this is from edit -- refresh page?
                        var indexClicked = $scope.SiteSensors.indexOf(sensorClicked);
                        $scope.SiteSensors[indexClicked] = createdSensor[0];
                    }
                    if (createdSensor[1] == 'deleted') {
                        var indexClicked1 = $scope.SiteSensors.indexOf(sensorClicked);
                        $scope.SiteSensors.splice(indexClicked1, 1);
                        $scope.sensorCount.total = $scope.SiteSensors.length;
                    }
                });
            };

            // watch for the session event to change and update
            $scope.$watch(function () { return $cookies.get('SessionEventName'); }, function (newValue) {
                $scope.sessionEventName = newValue != undefined ? newValue : "All Events";
                $scope.sessionEventExists = $scope.sessionEventName != "All Events" ? true : false;
                if (newValue != undefined) {
                    $scope.SiteSensors = thisSiteSensors.filter(function (h) { return (h.Instrument.EVENT_ID == $cookies.get('SessionEventID')) || h.InstrumentStats[0].STATUS_TYPE_ID == 4; });
                    $scope.sensorCount = { total: $scope.SiteSensors.length };
                } else {
                    $scope.SiteSensors = thisSiteSensors;
                    $scope.sensorCount = { total: $scope.SiteSensors.length };
                }
            });
        } //end else not auth
    }


})();