const express = require('express');
const router = express.Router();
const _ = require('lodash');
const async = require('async');
const [ BusService,BusStation ] = require('./../models/bus');
const request = require('request-promise');
const cron = require('node-cron');

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

async function prepareBusArrivalData (ServiceNo,resArray = {},busArrArray) {
  try {
    let busArrivalData = {};
    busArrivalData['ServiceNo'] = ServiceNo;
    busArrivalData['Operator'] = resArray['Operator'];
    if(!(_.isEmpty(resArray['NextBus']))) {
      busArrivalData['OriginCode'] = resArray['NextBus']['OriginCode'];
      busArrivalData['DestinationCode'] = resArray['NextBus']['DestinationCode'];
      busArrivalData['EstimatedArrival'] = resArray['NextBus']['EstimatedArrival'];
      busArrivalData['Latitude'] = resArray['NextBus']['Latitude'];
      busArrivalData['Longitude'] = resArray['NextBus']['Longitude'];
      busArrivalData['VisitNumber'] = resArray['NextBus']['VisitNumber'];
      busArrivalData['Load'] = resArray['NextBus']['Load'];
      busArrivalData['Feature'] = resArray['NextBus']['Feature'];
      busArrivalData['Type'] = resArray['NextBus']['Type'];
    }
    await busArrArray.push(busArrivalData);
    return busArrArray;
  } catch(error) {
    throw error;
  }
}

async function updateArrivalDataInMongo(BusStopCode,busArrivalServicesArray) {
  console.log("updateArrivalDataInMongo START===");	
  try {
    if(busArrivalServicesArray.length>0) {
      let result = await BusStation.findOne({BusStopCode: BusStopCode}).exec();
      for(let i=0; i<busArrivalServicesArray.length; i++) {
        if(result.BusArrivalInfo.length>0) {
          let count = 0;
          let match = 0;
          for(j=0; j<result.BusArrivalInfo.length; j++) {
            count++;
            if(result.BusArrivalInfo[j]['ServiceNo'] === busArrivalServicesArray[i]['ServiceNo']) {
              match++;
              break;
            } 
          }
          if((count === result.BusArrivalInfo.length) && (match ===0 )) {
            let busInfo = await prepareBusArrivalData(busArrivalServicesArray[i]['ServiceNo'],busArrivalServicesArray[i],result.BusArrivalInfo)
            await BusStation.collection.findOneAndUpdate({BusStopCode: BusStopCode}, {$set: {BusArrivalInfo: busInfo}}, {upsert: true});
          }
        } else {
          let busInfo = await prepareBusArrivalData(busArrivalServicesArray[i]['ServiceNo'],busArrivalServicesArray[i],result.BusArrivalInfo)
          await BusStation.collection.findOneAndUpdate({BusStopCode: BusStopCode}, {$set: {BusArrivalInfo: busInfo}}, {upsert: true});
        }
      }
    }
  } catch(error) {
    throw error;
  }
}

async function scheDuleCronJobForSGBusArrival() {
  try {
    let getAllSGBusStations = await BusStation.find({}).exec();
    for(let i=0; i<getAllSGBusStations.length; i++) {   
      let BusStopCode = getAllSGBusStations[i]['BusStopCode'];
      let ServiceNos = getAllSGBusStations[i]['ServiceNo'].split(",");
      let thisStopServicesRes = [];
      for(let j=0; j<ServiceNos.length; j++) {
        let ServiceNo = ServiceNos[j];
        const options = {
          method: "GET",
          uri: "http://datamall2.mytransport.sg/ltaodataservice/BusArrivalv2?BusStopCode="+BusStopCode+"&ServiceNo="+ServiceNo,
          headers: {
            AccountKey: "QzIx70beSP2BW7lPYDkPkg==",
            Accept: "application/json"
          },
          json: true 
        };
        let response = await request(options);
        if(response.Services.length>0) {
          thisStopServicesRes.push(response.Services[0]);
        }
      }
      await updateArrivalDataInMongo(BusStopCode,thisStopServicesRes);
    }
  } catch(error) {
    throw error;
  }
}

// cache bus arrival data for singapore
cron.schedule('*/5 * * * *', () => {
  console.log('running a task 5 minute');
  scheDuleCronJobForSGBusArrival();
});

module.exports = router;
