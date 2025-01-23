// Main Code is from FortiusANT project and modified to suit Zwack
// https://github.com/WouterJD/FortiusANT/tree/master/node
const debugFTMS = require('debug')('ftms');
const bleno = require('bleno');

const FitnessMachineStatus = '2ADA';
const CharacteristicUserDescription = '2901';

const Reset = 0x01;
const FitnessMachineStoppedOrPausedByUser = 0x02;
const FitnessMachineStartedOrResumedByUser = 0x04;
const TargetResistanceLevelChanged = 0x07;
const TargetPowerChanged = 0x08;
const IndoorBikeSimulationParametersChanged = 0x12;

class FitnessMachineStatusCharacteristic extends  bleno.Characteristic {
  constructor() {
    debugFTMS('[FitnessMachineStatusCharacteristic] constructor');
    super({
      uuid: FitnessMachineStatus,
      properties: ['notify'],
      descriptors: [
        new bleno.Descriptor({
          uuid: CharacteristicUserDescription,
          value: 'Fitness Machine Status'
        })
      ]
    });
    this.updateValueCallback = null;  
  }

  onSubscribe(maxValueSize, updateValueCallback) {
    debugFTMS('[' + FitnessMachineStatus + '][FitnessMachineStatusCharacteristic] onSubscribe');
    this.updateValueCallback = updateValueCallback;
    return this.RESULT_SUCCESS;
  };

  onUnsubscribe() {
    debugFTMS('[' + FitnessMachineStatus + '][FitnessMachineStatusCharacteristic] onUnsubscribe');
    this.updateValueCallback = null;
    return this.RESULT_UNLIKELY_ERROR;
  };

  notifyReset() {
    debugFTMS('[' + FitnessMachineStatus + '][FitnessMachineStatusCharacteristic] notifyReset');
    let buffer = new Buffer.alloc(1);
    buffer.writeUInt8(Reset)
    this.notify(buffer);
  }

  notifySetTargetPower(targetPower) {
    debugFTMS('[' + FitnessMachineStatus + '][FitnessMachineStatusCharacteristic] notifySetTargetPower');
    let buffer = new Buffer.alloc(3);
    buffer.writeUInt8(TargetPowerChanged)
    buffer.writeInt16LE(targetPower, 1);
    this.notify(buffer);
  }

  notifySetTargetResistance(resistanceLevel) {
    debugFTMS('[' + FitnessMachineStatus + '][FitnessMachineStatusCharacteristic] notifySetTargetResistance');
    let buffer = new Buffer.alloc(2);
    buffer.writeUInt8(TargetResistanceLevelChanged)
    buffer.writeUInt8(resistanceLevel, 1);
    this.notify(buffer);
  }

  notifyStartOrResume() {
    debugFTMS('[' + FitnessMachineStatus + '][FitnessMachineStatusCharacteristic] notifyStartOrResume');
    let buffer = new Buffer.alloc(1);
    buffer.writeUInt8(FitnessMachineStartedOrResumedByUser)
    this.notify(buffer);
  }

  notifyStopOrPause() {
    debugFTMS('[' + FitnessMachineStatus + '][FitnessMachineStatusCharacteristic] notifyStopOrPause');
    let buffer = new Buffer.alloc(1);
    buffer.writeUInt8(FitnessMachineStoppedOrPausedByUser)
    this.notify(buffer);
  }

  notifySetIndoorBikeSimulation(windSpeed, grade, crr, cw) {
    debugFTMS('[' + FitnessMachineStatus + '][FitnessMachineStatusCharacteristic] notifySetIndoorBikeSimulation');
    let buffer = new Buffer.alloc(7);
    let offset = 0;
    buffer.writeUInt8(IndoorBikeSimulationParametersChanged, offset);
    offset += 1;
    buffer.writeInt16LE(windSpeed, offset);
    offset += 2;
    buffer.writeInt16LE(grade, offset);
    offset += 2;
    buffer.writeUInt8(crr, offset);
    offset += 1;
    buffer.writeUInt8(cw, offset);
    offset += 1;
    this.notify(buffer);
  }

  notify(buffer) {
    debugFTMS('[' + FitnessMachineStatus + '][FitnessMachineStatusCharacteristic] notify');
    if (this.updateValueCallback) {
      this.updateValueCallback(buffer);
    }
    return this.RESULT_SUCCESS;
  }
};

module.exports = FitnessMachineStatusCharacteristic;
