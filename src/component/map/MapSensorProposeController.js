/**
 * Created by bdraper on 3/9/2016.
 */
(function () {
    'use strict';
    var STNControllers = angular.module('STNControllers');

    STNControllers.controller('MapSensorProposeController', ['$scope', '$http', '$timeout', '$rootScope', '$cookies', '$location', 'SITE', 'INSTRUMENT', 'INSTRUMENT_STATUS', 'allDeployTypes', 'allSensDeps', 'leafletMarkerEvents', 'leafletBoundsHelpers', '$state',
        function ($scope, $http, $timeout, $rootScope, $cookies, $location, SITE, INSTRUMENT, INSTRUMENT_STATUS, allDeployTypes, allSensDeps, leafletMarkerEvents, leafletBoundsHelpers, $state) {
            //when a site is  clicked, this will be triggered from service to let this controller know about it
            $rootScope.$on('mapSiteClick', function (event, siteParts) {
                $scope.thisSite = siteParts[0];
                var allSiteSensors = siteParts[2];
                $scope.ProposedSensors4Site = allSiteSensors.filter(function (ss) { return ss.InstrumentStats[0].STATUS_TYPE_ID == 4; });
                $scope.showProposed = false;
            });
            //all deployment types
            $scope.deployTypeList = angular.copy(allDeployTypes);
            var tempDepTypeID = 0;
            //fix deployment types so that "Temperature" becomes 2 : Temperature (Met sensor)-SensorType:2 and Temperature (pressure transducer)-SensorType:1 -- just for proposed
            for (var d = 0; d < $scope.deployTypeList.length; d++) {
                if ($scope.deployTypeList[d].METHOD === "Temperature") {
                    tempDepTypeID = $scope.deployTypeList[d].DEPLOYMENT_TYPE_ID;
                    $scope.deployTypeList[d].METHOD = "Temperature (Met sensor)";
                }
            }
            $scope.deployTypeList.push({ DEPLOYMENT_TYPE_ID: tempDepTypeID, METHOD: "Temperature (Pressure Transducer)" });

            //all sensor deployments (relationship table)
            $scope.sensDepTypes = allSensDeps;
            $scope.showProposed = false; //they want to add a proposed sensor, open options (boolean toggle)

            //show/hide proposed sensors to add
            $scope.showHideProposed = function () {
                $scope.showProposed = !$scope.showProposed;
            };
            //cancel proposing a sensor, close the list
            $scope.cancelProposing = function () {
                $scope.showProposed = false;
            };
            //add these checked Proposed sensors to this site
            $scope.AddProposed = function () {
                var Time_STAMP = new Date();
                for (var dt = 0; dt < $scope.deployTypeList.length; dt++) {
                    if ($scope.deployTypeList[dt].selected === true) {
                        var proposedToAdd = {}; var propStatToAdd = {};
                        if ($scope.deployTypeList[dt].METHOD.substring(0, 4) == "Temp") {
                            //temperature proposed sensor
                            proposedToAdd = {
                                DEPLOYMENT_TYPE_ID: $scope.deployTypeList[dt].DEPLOYMENT_TYPE_ID,
                                SITE_ID: $scope.thisSite.SITE_ID,
                                SENSOR_TYPE_ID: $scope.deployTypeList[dt].METHOD == "Temperature (Pressure Transducer)" ? 1 : 2,
                            };
                        } else {
                            //any other type
                            proposedToAdd = {
                                DEPLOYMENT_TYPE_ID: $scope.deployTypeList[dt].DEPLOYMENT_TYPE_ID,
                                SITE_ID: $scope.thisSite.SITE_ID,
                                SENSOR_TYPE_ID: $scope.sensDepTypes.filter(function (sdt) { return sdt.DEPLOYMENT_TYPE_ID == $scope.deployTypeList[dt].DEPLOYMENT_TYPE_ID; })[0].SENSOR_TYPE_ID,
                            };
                        }
                        //now post it (Instrument first, then Instrument Status
                        $http.defaults.headers.common.Authorization = 'Basic ' + $cookies.get('STNCreds');
                        $http.defaults.headers.common.Accept = 'application/json';

                        INSTRUMENT.save(proposedToAdd).$promise.then(function (response) {
                            var createdPropSensor = {
                                DEPLOYMENT_TYPE_ID: response.DEPLOYMENT_TYPE_ID,
                                SITE_ID: response.SITE_ID,
                                SENSOR_TYPE_ID: response.SENSOR_TYPE_ID,
                                INSTRUMENT_ID: response.INSTRUMENT_ID,
                                Deployment_Type: $scope.deployTypeList.filter(function (dtl) { return dtl.DEPLOYMENT_TYPE_ID == response.DEPLOYMENT_TYPE_ID; })[0].METHOD
                            };
                            propStatToAdd = { INSTRUMENT_ID: response.INSTRUMENT_ID, STATUS_TYPE_ID: 4, MEMBER_ID: $cookies.get('mID'), TIME_STAMP: Time_STAMP, TIME_ZONE: 'UTC', };

                            INSTRUMENT_STATUS.save(propStatToAdd).$promise.then(function (statResponse) {
                                propStatToAdd.Status = 'Proposed'; propStatToAdd.INSTRUMENT_STATUS_ID = statResponse.INSTRUMENT_STATUS_ID;
                                //statResponse.Status = 'Proposed';
                                var instToPushToList = {
                                    Instrument: createdPropSensor,
                                    InstrumentStats: [propStatToAdd]
                                };
                                $scope.ProposedSensors4Site.push(instToPushToList);
                                
                                //clean up ...all unchecked and then hide
                                for (var dep = 0; dep < $scope.deployTypeList.length; dep++) {
                                    $scope.deployTypeList[dep].selected = false;
                                }
                                $timeout(function () {
                                    // anything you want can go here and will safely be run on the next digest.
                                    $scope.showProposed = false;
                                    toastr.success("Proposed sensor created");
                                });

                            });//end INSTRUMENT_STATUS.save
                        }); //end INSTRUMENT.save
                    }//end if selected == true
                }//end foreach deployTypeList
            };//end AddProposed()

        }]);//end controller function
})();