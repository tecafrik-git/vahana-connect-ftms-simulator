// Main Code is from FortiusANT project and modified to suit Zwack
// https://github.com/WouterJD/FortiusANT/tree/master/node
const bleno = require("bleno");
const debugFTMS = require("debug")("ftms");
const util = require("util");

const CharacteristicUserDescription = "2901";

function bit(nr) {
  return 1 << nr;
}

const RowerData = "2AD1";

const MoreDataPresent = bit(0);
const AverageStrokeRatePresent = bit(1);
const TotalDistancePresent = bit(2);
const InstantaneousPacePresent = bit(3);
const AveragePacePresent = bit(4);
const InstantaneousPowerPresent = bit(5);
const AveragePowerPresent = bit(6);
const ResistanceLevelPresent = bit(7);
const ExpendedEnergyPresent = bit(8);
const HeartRatePresent = bit(9);
const MetabolicEquivalentPresent = bit(10);
const ElapsedTimePresent = bit(11);
const RemainingTimePresent = bit(12);

class RowerDataCharacteristic extends bleno.Characteristic {
  constructor() {
    debugFTMS("[RowerDataCharacteristic] constructor");
    super({
      uuid: RowerData,
      properties: ["notify"],
      descriptors: [
        new bleno.Descriptor({
          uuid: CharacteristicUserDescription,
          value: "Rower Data",
        }),
      ],
    });
    this.updateValueCallback = null;
  }

  onSubscribe(maxValueSize, updateValueCallback) {
    debugFTMS("[RowerDataCharacteristic] onSubscribe");
    this.updateValueCallback = updateValueCallback;
    return this.RESULT_SUCCESS;
  }

  onUnsubscribe() {
    debugFTMS("[RowerDataCharacteristic] onUnsubscribe");
    this.updateValueCallback = null;
    return this.RESULT_UNLIKELY_ERROR;
  }

  notify(event) {
    debugFTMS("[" + RowerData + "][RowerDataCharacteristic] notify");

    let flags = 0;
    let offset = 0;
    let buffer = Buffer.alloc(30);

    offset += 2;
    let flagField = buffer.slice(0, offset);

    //Mandatory fields
    let strokeRate = event.strokeRate;
    debugFTMS(
      "[" + RowerData + "][RowerDataCharacteristic] strokeRate: " + strokeRate
    );
    buffer.writeUInt8(strokeRate, offset);
    offset += 1;

    let strokeCount = event.strokeCount;
    debugFTMS(
      "[" + RowerData + "][RowerDataCharacteristic] strokeCount: " + strokeCount
    );
    buffer.writeUInt16LE(strokeCount, offset);
    offset += 2;

    if ("averageStrokeRate" in event) {
      flags |= AverageStrokeRatePresent;
      let averageStrokeRate = event.averageStrokeRate;
      debugFTMS(
        "[" +
          RowerData +
          "][RowerDataCharacteristic] averageStrokeRate: " +
          averageStrokeRate
      );
      buffer.writeUInt8(averageStrokeRate, offset);
      offset += 1;
    }

    if ("totalDistance" in event) {
      let totalDistance = event.totalDistance;
      flags |= TotalDistancePresent;
      debugFTMS(
        "[" +
          RowerData +
          "][RowerDataCharacteristic] totalDistance: " +
          totalDistance
      );
      buffer.writeUInt8(totalDistance & 0xff, offset);
      buffer.writeUInt8((totalDistance >> 8) & 0xff, offset + 1);
      buffer.writeUInt8((totalDistance >> 16) & 0xff, offset + 2);
      offset += 3;
    }

    if ("instantaneousPace" in event) {
      let instantaneousPace = event.instantaneousPace;
      flags |= InstantaneousPacePresent;
      debugFTMS(
        "[" +
          RowerData +
          "][RowerDataCharacteristic] instantaneousPace: " +
          instantaneousPace
      );
      buffer.writeUInt16LE(instantaneousPace, offset);
      offset += 2;
    }

    if ("averagePace" in event) {
      flags |= AveragePacePresent;
      let averagePace = event.averagePace;
      debugFTMS(
        "[" +
          RowerData +
          "][RowerDataCharacteristic] averagePace: " +
          averagePace
      );
      buffer.writeUInt16LE(averagePace, offset);
      offset += 2;
    }

    if ("instantaneousPower" in event) {
      let instantaneousPower = event.instantaneousPower;
      flags |= InstantaneousPowerPresent;
      debugFTMS(
        "[" +
          RowerData +
          "][RowerDataCharacteristic] instantaneousPower: " +
          instantaneousPower
      );
      buffer.writeInt16LE(instantaneousPower, offset);
      offset += 2;
    }

    if ("averagePower" in event) {
      let averagePower = event.averagePower;
      flags |= AveragePowerPresent;
      debugFTMS(
        "[" +
          RowerData +
          "][RowerDataCharacteristic] averagePower: " +
          averagePower
      );
      buffer.writeInt16LE(averagePower, offset);
      offset += 2;
    }

    if ("resistanceLevel" in event) {
      flags |= ResistanceLevelPresent;
      let resistanceLevel = event.resistanceLevel;
      debugFTMS(
        "[" +
          RowerData +
          "][RowerDataCharacteristic] resistanceLevel: " +
          resistanceLevel
      );
      buffer.writeInt16LE(resistanceLevel, offset);
      offset += 2;
    }

    if ("expendedEnergy" in event) {
      let expendedEnergy = event.expendedEnergy;
      flags |= ExpendedEnergyPresent;
      debugFTMS(
        "[" +
          RowerData +
          "][RowerDataCharacteristic] expendedEnergy: " +
          expendedEnergy
      );
      buffer.writeUInt16LE(expendedEnergy, offset);
      offset += 2;
    }

    if ("energyPerHour" in event) {
      flags |= ExpendedEnergyPresent;
      let energyPerHour = event.energyPerHour;
      debugFTMS(
        "[" +
          RowerData +
          "][RowerDataCharacteristic] energyPerHour: " +
          energyPerHour
      );
      buffer.writeUInt16LE(energyPerHour, offset);
      offset += 2;
    }

    if ("energyPerMinute" in event) {
      flags |= ExpendedEnergyPresent;
      let energyPerMinute = event.energyPerMinute;
      debugFTMS(
        "[" +
          RowerData +
          "][RowerDataCharacteristic] energyPerMinute: " +
          energyPerMinute
      );
      buffer.writeUInt8(energyPerMinute, offset);
      offset += 1;
    }

    if ("heartRate" in event) {
      flags |= HeartRatePresent;
      let heartRate = event.heartRate;
      debugFTMS(
        "[" + RowerData + "][RowerDataCharacteristic] heartRate: " + heartRate
      );
      buffer.writeUInt8(heartRate, offset);
      offset += 1;
    }

    if ("metabolicEquivalent" in event) {
      flags |= MetabolicEquivalentPresent;
      let metabolicEquivalent = event.metabolicEquivalent;
      debugFTMS(
        "[" +
          RowerData +
          "][RowerDataCharacteristic] metabolicEquivalent: " +
          metabolicEquivalent
      );
      buffer.writeUInt8(metabolicEquivalent, offset);
      offset += 1;
    }

    if ("elapsedTime" in event) {
      let elapsedTime = event.elapsedTime;
      flags |= ElapsedTimePresent;
      debugFTMS(
        "[" +
          RowerData +
          "][RowerDataCharacteristic] elapsedTime: " +
          elapsedTime
      );
      buffer.writeUInt16LE(elapsedTime, offset);
      offset += 2;
    }

    if ("remainingTime" in event) {
      flags |= RemainingTimePresent;
      let remainingTime = event.remainingTime;
      debugFTMS(
        "[" +
          RowerData +
          "][RowerDataCharacteristic] remainingTime: " +
          remainingTime
      );
      buffer.writeUInt16LE(Math.max(remainingTime, 0), offset);
      offset += 2;
    }

    flagField.writeUInt16LE(flags);

    let finalBuffer = buffer.slice(0, offset);
    debugFTMS(
      "[" +
        RowerData +
        "][RowerDataCharacteristic] " +
        util.inspect(finalBuffer)
    );
    if (this.updateValueCallback) {
      this.updateValueCallback(finalBuffer);
    }

    return this.RESULT_SUCCESS;
  }
}

module.exports = RowerDataCharacteristic;
