const bleno = require('bleno');
const debugFTMS = require('debug')('ftms');
const util = require('util');

const CharacteristicUserDescription = '2901';

function bit(nr) {
  return (1 << nr);
}

const BidirectionalRowerData = '3812978b-1985-45b7-8902-ec2566d93d8b';

const LeftStrokeRatePresent = bit(0);
const RightStrokeRatePresent = bit(1);
const LeftInstantaneousPowerPresent = bit(2);
const RightInstantaneousPowerPresent = bit(3);
const LeftFlexionResistanceLevelPresent = bit(4);
const LeftExtensionResistanceLevelPresent = bit(5);
const RightFlexionResistanceLevelPresent = bit(6);
const RightExtensionResistanceLevelPresent = bit(7);

class BidirectionalRowerDataCharacteristic extends bleno.Characteristic {
  constructor() {
    debugFTMS('[BidirectionalRowerDataCharacteristic] constructor');
    super({
      uuid: BidirectionalRowerData,
      properties: ['notify'],
      descriptors: [
        new bleno.Descriptor({
          uuid: CharacteristicUserDescription,
          value: 'Bidirectional Rower Data'
        })
      ]
    });
    this.updateValueCallback = null;
  }

  onSubscribe(maxValueSize, updateValueCallback) {
    debugFTMS('[BidirectionalRowerDataCharacteristic] onSubscribe');
    this.updateValueCallback = updateValueCallback;
    return this.RESULT_SUCCESS;
  }

  onUnsubscribe() {
    debugFTMS('[BidirectionalRowerDataCharacteristic] onUnsubscribe');
    this.updateValueCallback = null;
    return this.RESULT_UNLIKELY_ERROR;
  }

  notify(event) {
    debugFTMS('[' + BidirectionalRowerData + '][BidirectionalRowerDataCharacteristic] notify');

    let flags = 0;
    let offset = 0;
    let buffer = Buffer.alloc(30);

    offset += 2;
    let flagField = buffer.slice(0, offset);

    if ('leftStrokeRate' in event) {
      flags |= LeftStrokeRatePresent;
      let leftStrokeRate = event.leftStrokeRate;
      debugFTMS('[' + BidirectionalRowerData + '][BidirectionalRowerDataCharacteristic] leftStrokeRate: ' + leftStrokeRate);
      buffer.writeUInt8(leftStrokeRate, offset);
      offset += 1;
    }

    if ('rightStrokeRate' in event) {
      flags |= RightStrokeRatePresent;
      let rightStrokeRate = event.rightStrokeRate;
      debugFTMS('[' + BidirectionalRowerData + '][BidirectionalRowerDataCharacteristic] rightStrokeRate: ' + rightStrokeRate);
      buffer.writeUInt8(rightStrokeRate, offset);
      offset += 1;
    }

    if ('leftInstantaneousPower' in event) {
      flags |= LeftInstantaneousPowerPresent;
      let leftInstantaneousPower = event.leftInstantaneousPower;
      debugFTMS('[' + BidirectionalRowerData + '][BidirectionalRowerDataCharacteristic] leftInstantaneousPower: ' + leftInstantaneousPower);
      buffer.writeInt16LE(leftInstantaneousPower, offset);
      offset += 2;
    }

    if ('rightInstantaneousPower' in event) {
      flags |= RightInstantaneousPowerPresent;
      let rightInstantaneousPower = event.rightInstantaneousPower;
      debugFTMS('[' + BidirectionalRowerData + '][BidirectionalRowerDataCharacteristic] rightInstantaneousPower: ' + rightInstantaneousPower);
      buffer.writeInt16LE(rightInstantaneousPower, offset);
      offset += 2;
    }

    if ('leftFlexionResistanceLevel' in event) {
      flags |= LeftFlexionResistanceLevelPresent;
      let leftFlexionResistanceLevel = event.leftFlexionResistanceLevel;
      debugFTMS('[' + BidirectionalRowerData + '][BidirectionalRowerDataCharacteristic] leftFlexionResistanceLevel: ' + leftFlexionResistanceLevel);
      buffer.writeInt16LE(leftFlexionResistanceLevel, offset);
      offset += 2;
    }

    if ('leftExtensionResistanceLevel' in event) {
      flags |= LeftExtensionResistanceLevelPresent;
      let leftExtensionResistanceLevel = event.leftExtensionResistanceLevel;
      debugFTMS('[' + BidirectionalRowerData + '][BidirectionalRowerDataCharacteristic] leftExtensionResistanceLevel: ' + leftExtensionResistanceLevel);
      buffer.writeInt16LE(leftExtensionResistanceLevel, offset);
      offset += 2;
    }

    if ('rightFlexionResistanceLevel' in event) {
      flags |= RightFlexionResistanceLevelPresent;
      let rightFlexionResistanceLevel = event.rightFlexionResistanceLevel;
      debugFTMS('[' + BidirectionalRowerData + '][BidirectionalRowerDataCharacteristic] rightFlexionResistanceLevel: ' + rightFlexionResistanceLevel);
      buffer.writeInt16LE(rightFlexionResistanceLevel, offset);
      offset += 2;
    }

    if ('rightExtensionResistanceLevel' in event) {
      flags |= RightExtensionResistanceLevelPresent;
      let rightExtensionResistanceLevel = event.rightExtensionResistanceLevel;
      debugFTMS('[' + BidirectionalRowerData + '][BidirectionalRowerDataCharacteristic] rightExtensionResistanceLevel: ' + rightExtensionResistanceLevel);
      buffer.writeInt16LE(rightExtensionResistanceLevel, offset);
      offset += 2;
    }

    flagField.writeUInt16LE(flags);

    let finalBuffer = buffer.slice(0, offset);
    debugFTMS('[' + BidirectionalRowerData + '][BidirectionalRowerDataCharacteristic] ' + util.inspect(finalBuffer));
    if (this.updateValueCallback) {
      this.updateValueCallback(finalBuffer);
    }

    return this.RESULT_SUCCESS;
  }
}

module.exports = BidirectionalRowerDataCharacteristic;
