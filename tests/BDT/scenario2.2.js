//scenario2.1.js
//by Miguel Angel Terceros Caballero
var init = require('../../init');
var config = require(GLOBAL.initialDirectory+'/config/config.json');
var expect = require('chai').expect;
var tokenAPI = require(GLOBAL.initialDirectory+config.path.tokenAPI);
var roomManagerAPI = require(GLOBAL.initialDirectory+config.path.roomManagerAPI);
var endPoints = require(GLOBAL.initialDirectory+config.path.endPoints);
var util = require(GLOBAL.initialDirectory+config.path.util);
var mongodb = require(GLOBAL.initialDirectory+config.path.mongodb);
var roomTest = require(GLOBAL.initialDirectory+config.path.room);
var locationConfig = require(GLOBAL.initialDirectory+config.path.locationConfig);
var resourceConfig = require(GLOBAL.initialDirectory+config.path.resourceConfig);
var meetingConfig = require(GLOBAL.initialDirectory+config.path.meetingConfig);
//End Points
var url = config.url;
var servicesEndPoint = url + endPoints.services;
var roomsEndPoint = url + endPoints.rooms;
var resourceEndPoint = url + endPoints.resources;
var locationsEndPoint = url + endPoints.locations;
var locationsEndPointByID = url + endPoints.locationById;
var meetingsEndPoint = url + endPoints.meetings;
var servicesEndPoint = url + endPoints.services;
//end points netos
var resources = endPoints.resources;
var rooms = endPoints.rooms;
var locations = endPoints.locations;
var meetings = endPoints.meetings;
var basic = config.userBasicAccountJson;
// declare variables
var size = locationConfig.size;
var idRoom = null;
var idService = null;
var idResource = null;
var idLocation = null;
var idLocation2 = null;
var idOtherLocation = null;
var idMeeting = null;
var token = null;
var roomName = null;

/*
Locations
    Scenario 2.1: Change an location of a meeting
		Given I have a Room specified
			And a location assigned at to Room
			And a resource assigned at to Room
			And one meeting assigned at the Room
		When create a second location
			And change the location of the room into other location
			Then ensure that is possible change the location of a meeting to other location
 */
describe('Scenario 2.1 – We have a meeting in a room with a determinate location that is change', function () {
	this.timeout(config.timeOut);
	process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

	context('Given I have a Room specified',function(){
		before('Token',function (done) {
			tokenAPI
				.getToken(function(err,res){
					token = res.body.token;

					done();	
				});
		});

		before('room',function (done) {
			roomJSON = meetingConfig.displayName;
			mongodb
				.findDocument('rooms',roomJSON, function(res){
					idRoom = res._id;
					idService = res.serviceId;
					roomName = res.displayName;

					done();
				});
		});

		before('create a locations and associate to room', function (done) {
			var locationJson = util.generateLocationJson(size.nameSize,size.customNameSize,size.description);
			roomManagerAPI
				.post(token,locationsEndPoint,locationJson,function (err,res) {
					idLocation = res.body._id;
					endPointLocationById = util.stringReplace(locationsEndPointByID,locationConfig.locationIdReplace,idLocation);

					associateLocation = { "locationId" :idLocation};
					var associateEndPointL = url + '/rooms/'+idRoom;
					roomManagerAPI
						.put(token,associateEndPointL,associateLocation, function(err, res){
							console.log('\t\t And a location assigned at to Room');

							done();
						});
				});
		});

		after('delete a locations ', function (done) {
			roomManagerAPI
			  .del(token,endPointLocationById,function (err,res) {
			  	 	done();
			  });
		});

		before('create a metting', function (done) {
			var num = roomName.substring(10);
			var meetingJSon = util.generatemeetingJson(num);
			roomManagerAPI
				.postwithBasic(basic, servicesEndPoint + '/' + idService + '/' + rooms + '/' + idRoom + '/' + meetings, meetingJSon, function(err, res){
					console.log('\t\t And one meeting assigned at the Room');
					idMeeting = res.body._id;
					
					done();
				});
		});

		after('Deleting the meeting', function (done) {
			roomManagerAPI
				.delwithBasic(basic, servicesEndPoint + '/' + idService + '/' + rooms + '/' + idRoom + '/' + meetings + '/' + idMeeting, function(err, res){
					done();
				});
		});

		describe('When create a second location', function () {
			before('create a second location and associate to room', function (done) {
				var locationJson2 = util.generateLocationJson(size.nameSize,size.customNameSize,size.description);

				roomManagerAPI
					.post(token,locationsEndPoint,locationJson2,function (err,res) {
						idLocation2 = res.body._id;
						endPointLocationById2 = util.stringReplace(locationsEndPointByID,locationConfig.locationIdReplace,idLocation2);

						done();
					});
			});

			after('delete second locations', function (done) {
				roomManagerAPI
				  .del(token,endPointLocationById2,function (err,res) {
				  	 	done();
				  });
			});

			it('And change the location of the room into other location', function (done) {

				associateLocation2 = {'parentId' : idLocation};
				var associateEndPointL2 = locationsEndPoint +'/'+idLocation2;
				roomManagerAPI
					.put(token,associateEndPointL2,associateLocation2, function(err, res){
						
						associateLocation3 = { "locationId" :idLocation2};
						var associateEndPointL3 = url + '/rooms/'+idRoom;
						roomManagerAPI
							.put(token, associateEndPointL3, associateLocation3, function(err, re){

								roomManagerAPI
									.get(locationsEndPoint+'/'+idLocation, function(err, resp){
										expect(res.status).to.equal(config.httpStatus.Ok);

										expect(res.body).to.have.property("parent")
											.and.be.equal(resp.body._id);
										expect(resp.body).to.have.property("_id")
											.and.be.equal(res.body.parent);
										expect(res.body).to.have.property("name");
										expect(res.body).to.have.property("customName");
										expect(resp.body).to.have.property("name");
										expect(resp.body).to.have.property("customName");

										done();
									});
							});						
					});
			});

			it('Then ensure that is possible change the location of a meeting to other location', function (done) {
				meetingGet = servicesEndPoint +'/'+ idService + rooms +'/'+ idRoom + meetings;
				roomManagerAPI
					.get(meetingGet, function(err,res){
						
						meetingMongo = {"location" : roomName};
						mongodb
							.findDocument('meetings',meetingMongo, function(resp){
								tam = res.body.length;
								expect(res.status).to.equal(config.httpStatus.Ok);
								expect(res.body[tam-1]).to.have.property("location")
									.and.be.equal(resp.location);
								expect(res.body[tam-1]).to.have.property("roomEmail")
									.and.be.equal(resp.roomEmail);
								expect(res.body[tam-1]).to.have.property("roomId");
								expect((res.body[tam-1].roomId).toString()).to.equal((resp.roomId).toString());

								done();
							});
					});
			});
		});

	});
});
