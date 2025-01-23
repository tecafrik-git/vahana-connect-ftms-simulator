// Main Code is from FortiusANT project and modified to suit Zwack
// https://github.com/WouterJD/FortiusANT/tree/master/node
const bleno = require('bleno');
const debugFTMS = require('debug')('ftms');

const FitnessMachineFeatureCharacteristic = require('./fitness-machine-feature-characteristic');
const IndoorBikeDataCharacteristic = require('./fitness-machine-indoor-bike-data-characteristic');
const FitnessMachineControlPointCharacteristic = require('./fitness-machine-control-point-characteristic');
const SupportedPowerRangeCharacteristic = require('./supported-power-range-characteristic');
const FitnessMachineStatusCharacteristic = require('./fitness-machine-status-characteristic');
const RowerDataCharacteristic = require('./rower-data-characteristic');


const FitnessMachine = '1826'

class FitnessMachineService extends bleno.PrimaryService {
  constructor(messages) {
    debugFTMS('[FitnessMachineService] constructor');
    let fmfc = new FitnessMachineFeatureCharacteristic();
    let ibdc = new IndoorBikeDataCharacteristic();
    let rdc = new RowerDataCharacteristic();
    let fmsc = new FitnessMachineStatusCharacteristic();
    let fmcpc = new FitnessMachineControlPointCharacteristic(messages, fmsc);
    let sprc = new SupportedPowerRangeCharacteristic();
    super({
      uuid: FitnessMachine,
      characteristics: [
        fmfc,
        ibdc,
        rdc,
        fmsc,
        fmcpc,
        sprc
      ]
    });

    this.fmfc = fmfc;
    this.ibdc = ibdc;
    this.rdc = rdc;
    this.fmsc = fmsc;
    this.fmcpc = fmcpc;
    this.sprc = sprc;
  }

  notify(event) {
    debugFTMS('[' + FitnessMachine + '][FitnessMachineService] notify')
    if (event.watts) {
      this.ibdc.notify(event);
    } else if (event.strokeRate) {
      this.rdc.notify(event);
    }
    return this.RESULT_SUCCESS;
  };
}

module.exports = FitnessMachineService;
