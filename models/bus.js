const mongoose = require('mongoose'),
  schema = mongoose.Schema;

const busServiceSchema = new schema(
  {
    ServiceNo: { type: String }, //uuid of place in neo4j
    Operator: String,
    Direction: Number,
    Category: String,
    OriginCode: String,
    DestinationCode: String,
    AM_Peak_Freq: String,
    AM_Offpeak_Freq: String,
    PM_Peak_Freq: String,
    PM_Offpeak_Freq: String,
    LoopDesc: String,
    routes: [
      new schema({
        ServiceNo: { type: String},
        Operator: String,
        Direction: Number,
        StopSequence : Number,
        BusStopCode : String,
        Distance: Number,
        WD_FirstBus : String,
        WD_LastBus: String,
        SAT_FirstBus: String,
        SAT_LastBus: String,
        SUN_FirstBus: String,
        SUN_LastBus: String
      }, { _id: false })
    ],
  },  
  {
    versionKey: false
  }
);


const busStationSchema = new schema(
  { 
    guid: String,
    BusStopCode: { type: String }, //uuid of place in neo4j
    RoadName: String,
    Description: String,
    Latitude: Number,
    Longitude: Number/*,
    loc: {
        type: { type: String },
        coordinates: [Number],
    }*/,
    ServiceNo: { type: String, default: "" },
    BusArrivalInfo : [{
        ServiceNo: { type: String },
        Operator: { type: String },
        OriginCode : { type: String },
        DestinationCode: {type : String},
        EstimatedArrival: {type : String},
        Latitude: { type : String},
        Longitude: { type : String},
        VisitNumber: {type : Number},
        Load : {type : String},
        Feature: {type : String},
        Type: { type : String}
    }] 
  },  
  {
    versionKey: false
  }
);


let BusService = mongoose.model('BusService', busServiceSchema);
let BusStation = mongoose.model('BusStation', busStationSchema);

module.exports = [BusService,BusStation];
