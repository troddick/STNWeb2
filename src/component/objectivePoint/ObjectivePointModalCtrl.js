﻿(function () {
    /* controllers.js, 'leaflet-directive''ui.unique','ngTagsInput',*/
    'use strict';

    var ModalControllers = angular.module('ModalControllers');
  ModalControllers.controller('OPmodalCtrl', ['$scope', '$cookies', '$http', '$uibModalInstance', '$uibModal', 'allDropdowns', 'thisOP', 'thisOPControls', 'opSite', 'OBJECTIVE_POINT', 'OP_CONTROL_IDENTIFIER', OPmodalCtrl]);
    function OPmodalCtrl($scope, $cookies, $http, $uibModalInstance, $uibModal, allDropdowns, thisOP, thisOPControls, opSite, OBJECTIVE_POINT, OP_CONTROL_IDENTIFIER) {
        //defaults for radio buttons
        //dropdowns
        $scope.OPTypeList = allDropdowns[0];
        $scope.HDList = allDropdowns[1];
        $scope.HCollectMethodList = allDropdowns[2];
        $scope.VDatumList = allDropdowns[3];
        $scope.VCollectMethodList = allDropdowns[4];
        $scope.OPQualityList = allDropdowns[5];
        $scope.OP = {};
        $scope.removeOPCarray = []; //holder if they remove any OP controls
        $scope.thisOPsite = opSite; //this OP's SITE
        $scope.addedIdentifiers = []; //holder for added Identifiers
        $scope.showControlIDinput = false; //initially hide the area containing added control Identifiers
        $scope.DMS = {}; //object for Deg Min Sec values
        $scope.OPFiles = []; //holder for op files added
        $scope.photoFiles = [];
        //make uncertainty cleared and disabled when 'unquantified' is checked
        $scope.UnquantChecked = function () {
            if ($scope.OP.UNQUANTIFIED == 1)
                $scope.OP.UNCERTAINTY = "";
        }

        //called a few times to format just the date (no time)
        var makeAdate = function (d) {
            var aDate = new Date();
            if (d != "") {
                //provided date
                aDate = new Date(d);
            }

            var year = aDate.getFullYear();
            var month = aDate.getMonth();
            var day = ('0' + aDate.getDate()).slice(-2);
            var monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
            var dateWOtime = new Date(monthNames[month] + " " + day + ", " + year);
            return dateWOtime;
        }

        if (thisOP != "empty") {
            //#region existing OP
            $scope.OP = angular.copy(thisOP); //set a copy so list view doesnt change if they cancel from here after making changes
            //formatted as date for datepicker
            $scope.OP.DATE_ESTABLISHED = makeAdate($scope.OP.DATE_ESTABLISHED);

            if ($scope.OP.DATE_RECOVERED != null)
                $scope.OP.DATE_RECOVERED = makeAdate($scope.OP.DATE_RECOVERED);

            if (thisOPControls.length > 0) {
                $scope.addedIdentifiers = thisOPControls;
                $scope.showControlIDinput = true;
            }
            //see if there's any OPFiles
            OBJECTIVE_POINT.getOPFiles({ id: $scope.OP.OBJECTIVE_POINT_ID }, function success(response) {
                $scope.OPFiles = response;
            }, function error(errorResponse) {
                toastr.error("Error getting OP files: " + errorResponse.statusText);
            });

            /*carousel TODO
            $scope.myInterval = 5000;
            $scope.noWrapSlides = false;
            var slides = $scope.slides = [];
            $scope.addSlide = function () {
                var newWidth = 600 + slides.length + 1;
                slides.push({
                    image: '//placekitten.com/' + newWidth + '/300',
                    text: ['More', 'Extra', 'Lots of', 'Surplus'][slides.length % 4] + ' ' +
                      ['Cats', 'Kittys', 'Felines', 'Cutes'][slides.length % 4]
                });
            };
            for (var i = 0; i < 4; i++) {
                $scope.addSlide();
            }*/

            //#endregion 
        } else {
            //#region new OP 
            $scope.OP.LATITUDE_DD = opSite.LATITUDE_DD;
            $scope.OP.LONGITUDE_DD = opSite.LONGITUDE_DD;
            $scope.OP.HDATUM_ID = opSite.HDATUM_ID;
            //default today for establised date
            $scope.OP.DATE_ESTABLISHED = makeAdate("");
            //#endregion
        }

        //default radios (has to come after OP is set one way or another)
        $scope.OP.decDegORdms = 'dd';
        $scope.OP.FTorMETER = 'ft';
        $scope.OP.FTorCM = 'ft';

        //want to add identifier
        $scope.addNewIdentifier = function () {
            $scope.addedIdentifiers.push({ OBJECTIVE_POINT_ID: $scope.OP.OBJECTIVE_POINT_ID, IDENTIFIER: "", IDENTIFIER_TYPE: "" });
            $scope.showControlIDinput = true;
        }

        //Datepicker
        $scope.datepickrs = {};
        $scope.open = function ($event, which) {
            $event.preventDefault();
            $event.stopPropagation();

            $scope.datepickrs[which] = true;
        };

        //lat/long =is number
        $scope.isNum = function (evt) {
            var theEvent = evt || window.event;
            var key = theEvent.keyCode || theEvent.which;
            if (key != 46 && key != 45 && key > 31 && (key < 48 || key > 57)) {
                theEvent.returnValue = false;
                if (theEvent.preventDefault) theEvent.preventDefault();
            }
        };

        //convert deg min sec to dec degrees
        var azimuth = function (deg, min, sec) {
            var azi = 0;
            if (deg < 0) {
                azi = -1.0 * deg + 1.0 * min / 60.0 + 1.0 * sec / 3600.0;
                return (-1.0 * azi).toFixed(5);
            }
            else {
                azi = 1.0 * deg + 1.0 * min / 60.0 + 1.0 * sec / 3600.0;
                return (azi).toFixed(5);
            }
        }

        //convert dec degrees to dms
        var deg_to_dms = function (deg) {
            if (deg < 0) {
                deg = deg.toString();

                //longitude, remove the - sign
                deg = deg.substring(1);
            }
            var d = Math.floor(deg);
            var minfloat = (deg - d) * 60;
            var m = Math.floor(minfloat);
            var s = ((minfloat - m) * 60).toFixed(3);

            return ("" + d + ":" + m + ":" + s);
        }

        //they changed radio button for dms dec deg
        $scope.latLongChange = function () {
            if ($scope.OP.decDegORdms == "dd") {
                //they clicked Dec Deg..
                if ($scope.DMS.LADeg != undefined) {
                    //convert what's here for each lat and long
                    $scope.OP.LATITUDE_DD = azimuth($scope.DMS.LADeg, $scope.DMS.LAMin, $scope.DMS.LASec);
                    $scope.OP.LONGITUDE_DD = azimuth($scope.DMS.LODeg, $scope.DMS.LOMin, $scope.DMS.LOSec);
                    //clear
                    $scope.DMS = {};
                }
            } else {
                //they clicked dms (convert lat/long to dms)
                if ($scope.OP.LATITUDE_DD != undefined) {
                    var latDMS = (deg_to_dms($scope.OP.LATITUDE_DD)).toString();
                    var ladDMSarray = latDMS.split(':');
                    $scope.DMS.LADeg = ladDMSarray[0];
                    $scope.DMS.LAMin = ladDMSarray[1];
                    $scope.DMS.LASec = ladDMSarray[2];

                    var longDMS = deg_to_dms($scope.OP.LONGITUDE_DD);
                    var longDMSarray = longDMS.split(':');
                    $scope.DMS.LODeg = longDMSarray[0] * -1;
                    $scope.DMS.LOMin = longDMSarray[1];
                    $scope.DMS.LOSec = longDMSarray[2];
                    //clear
                    $scope.OP.LATITUDE_DD = undefined; $scope.OP.LONGITUDE_DD = undefined;
                }
            }
        }

        //just need an OBJECTIVE_POINT object to post/put
        var trimOP = function (op) {
            var OBJ_PT = {
                OBJECTIVE_POINT_ID: op.OBJECTIVE_POINT_ID != undefined ? op.OBJECTIVE_POINT_ID : 0,
                NAME: op.NAME,
                DESCRIPTION: op.DESCRIPTION,
                ELEV_FT: op.ELEV_FT != undefined ? op.ELEV_FT : null,
                DATE_ESTABLISHED: op.DATE_ESTABLISHED,
                OP_IS_DESTROYED: op.OP_IS_DESTROYED != undefined ? op.OP_IS_DESTROYED : 0,
                OP_NOTES: op.OP_NOTES != undefined ? op.OP_NOTES : null,
                SITE_ID: op.SITE_ID,
                VDATUM_ID: op.VDATUM_ID != undefined ? op.VDATUM_ID : 0,
                LATITUDE_DD: op.LATITUDE_DD,
                LONGITUDE_DD: op.LONGITUDE_DD,
                HDATUM_ID: op.HDATUM_ID != undefined ? op.HDATUM_ID : 0,
                HCOLLECT_METHOD_ID: op.HCOLLECT_METHOD_ID != undefined ? op.HCOLLECT_METHOD_ID : 0,
                VCOLLECT_METHOD_ID: op.VCOLLECT_METHOD_ID != undefined ? op.VCOLLECT_METHOD_ID : 0,
                OP_TYPE_ID: op.OP_TYPE_ID,
                DATE_RECOVERED: op.DATE_RECOVERED != undefined ? op.DATE_RECOVERED : null,
                UNCERTAINTY: op.UNCERTAINTY != undefined ? op.UNCERTAINTY : null,
                UNQUANTIFIED: op.UNQUANTIFIED != undefined ? op.UNQUANTIFIED : null,
                OP_QUALITY_ID: op.OP_QUALITY_ID != undefined ? op.OP_QUALITY_ID : null,
            }
            return OBJ_PT;
        }

        //cancel modal
        $scope.cancel = function () {
            $uibModalInstance.dismiss('cancel');
        };

        //fix default radios and lat/long
        var formatDefaults = function (theOP) {
            //$scope.OP.FTorMETER needs to be 'ft'. if 'meter' ==convert value to ft 
            if (theOP.FTorMETER == "meter") {
                $scope.OP.FTorMETER = 'ft';
                $scope.OP.ELEV_FT = $scope.OP.ELEV_FT * 3.2808;
            }
            //$scope.OP.FTorCM needs to be 'ft'. if 'cm' ==convert value to ft 
            if (theOP.FTorCM == "cm") {
                $scope.OP.FTorCM = 'ft'
                $scope.OP.UNCERTAINTY = $scope.OP.UNCERTAINTY / 30.48;
            }
            //$scope.OP.decDegORdms needs to be 'dd'. if 'dms' ==convert $scope.DMS values to dd
            if (theOP.decDegORdms == "dms") {
                $scope.OP.decDegORdms = 'dd';
                $scope.OP.LATITUDE_DD = azimuth($scope.DMS.LADeg, $scope.DMS.LAMin, $scope.DMS.LASec);
                $scope.OP.LONGITUDE_DD = azimuth($scope.DMS.LODeg, $scope.DMS.LOMin, $scope.DMS.LOSec);
                $scope.DMS = {};
                $scope.OP.SITE_ID = $scope.thisOPsite.SITE_ID;
            }
        }

        //Create this OP
        $scope.create = function () {
            if (this.OPForm.$valid) {
                $http.defaults.headers.common['Authorization'] = 'Basic ' + $cookies.get('STNCreds');
                $http.defaults.headers.common['Accept'] = 'application/json';
                var createdOP = {};
                //post
                formatDefaults($scope.OP); //$scope.OP.FTorMETER, FTorCM, decDegORdms                               
                var OPtoPOST = trimOP($scope.OP); //make it an OBJECTIVE_POINT for saving

                OBJECTIVE_POINT.save(OPtoPOST, function success(response) {
                    toastr.success("Objective Point created");
                    createdOP = response;
                    if ($scope.addedIdentifiers.length > 0) {
                        //post each one
                        for (var opc = 0; opc < $scope.addedIdentifiers.length; opc++)
                            OBJECTIVE_POINT.createOPControlID({ id: response.OBJECTIVE_POINT_ID }, $scope.addedIdentifiers[opc]).$promise;
                    }
                }).$promise.then(function () {
                    var sendBack = [createdOP, 'created'];
                    $uibModalInstance.close(sendBack);
                });
            }
        } //end Create

        //X was clicked next to existing Control Identifier to have it removed, store in remove array for Save()
        $scope.RemoveID = function (opControl) {
            //only add to remove list if it's an existing one to DELETE
            var i = $scope.addedIdentifiers.indexOf(opControl);
            if (opControl.OP_CONTROL_IDENTIFIER_ID != undefined) {
                $scope.removeOPCarray.push(opControl);
                $scope.addedIdentifiers.splice(i, 1);
            } else {
                $scope.addedIdentifiers.splice(i, 1);
            }
        }

        //Save this OP
        $scope.save = function () {
            if ($scope.OPForm.$valid) {
                $http.defaults.headers.common['Authorization'] = 'Basic ' + $cookies.get('STNCreds');
                $http.defaults.headers.common['Accept'] = 'application/json';

                var updatedOP = {};
                //if there's an OP_CONTROL_IDENTIFIER_ID, PUT .. else POST
                if ($scope.addedIdentifiers.length > 0) {
                    for (var i = 0; i < $scope.addedIdentifiers.length; i++) {
                        if ($scope.addedIdentifiers[i].OP_CONTROL_IDENTIFIER_ID != undefined) {
                            //existing: PUT
                            OP_CONTROL_IDENTIFIER.update({ id: $scope.addedIdentifiers[i].OP_CONTROL_IDENTIFIER_ID }, $scope.addedIdentifiers[i]).$promise;
                        } else {
                            //post each one
                            OBJECTIVE_POINT.createOPControlID({ id: $scope.OP.OBJECTIVE_POINT_ID }, $scope.addedIdentifiers[i]).$promise;
                        }
                    }//end foreach addedIdentifier
                }//end if there's addedidentifiers

                //if there's any in removeOPCarray, DELETE those
                if ($scope.removeOPCarray.length > 0) {
                    for (var r = 0; r < $scope.removeOPCarray.length; r++) {
                        OP_CONTROL_IDENTIFIER.delete({ id: $scope.removeOPCarray[r].OP_CONTROL_IDENTIFIER_ID }).$promise;
                    }//end foreach removeOPCarray
                }//end if there's removeOPCs

                //look at OP.FTorMETER ("ft"), OP.FTorCM ("ft"), and OP.decDegORdms ("dd"), make sure site_ID is on there and send it to trim before PUT                
                formatDefaults($scope.OP); //$scope.OP.FTorMETER, FTorCM, decDegORdms
                var OPtoPOST = trimOP($scope.OP);
                //$http.defaults.headers.common['X-HTTP-Method-Override'] = 'PUT';
                OBJECTIVE_POINT.update({ id: OPtoPOST.OBJECTIVE_POINT_ID }, OPtoPOST, function success(response) {
                    toastr.success("Objective Point updated");
                    updatedOP = response;
                    //    delete $http.defaults.headers.common['X-HTTP-Method-Override'];
                }).$promise.then(function () {
                    var sendBack = [updatedOP, 'updated'];
                    $uibModalInstance.close(sendBack);
                });
            }
        } //end Save

        //delete this OP from the SITE
        $scope.deleteOP = function () {
            //TODO:: Delete the files for this OP too or reassign to the Site?? Services or client handling?
            var DeleteModalInstance = $uibModal.open({
                templateUrl: 'removemodal.html',
                controller: 'ConfirmModalCtrl',
                size: 'sm',
                resolve: {
                    nameToRemove: function () {
                        return $scope.OP;
                    },
                    what: function () {
                        return "Objective Point";
                    }
                }
            });

            DeleteModalInstance.result.then(function (opToRemove) {
                $http.defaults.headers.common['Authorization'] = 'Basic ' + $cookies.get('STNCreds');
                OBJECTIVE_POINT.delete({ id: opToRemove.OBJECTIVE_POINT_ID }, opToRemove).$promise.then(function () {
                    toastr.success("Objective Point Removed");
                    var sendBack = ["de", 'deleted'];
                    $uibModalInstance.close(sendBack);
                }, function error(errorResponse) {
                    toastr.error("Error: " + errorResponse.statusText);
                });
            }, function () {
                //logic for cancel
            });//end modal
        }
    }//end OPmodalCtrl

})();