// Main Code is from FortiusANT project and modified to suit Zwack
// https://github.com/WouterJD/FortiusANT/tree/master/node
const bleno = require("bleno");
const debugFTMS = require("debug")("ftms");

const BidirectionalRowerDataCharacteristic = require("./bidirectional-rower-data-characteristic");

const VahanaCrewServiceUUID = "cbcad1c5-f859-45bb-b3f0-1e74cdb0f66b";

class VahanaCrewService extends bleno.PrimaryService {
  constructor(messages) {
    debugFTMS("[VahanaRowerService] constructor");
    let bdrc = new BidirectionalRowerDataCharacteristic();
    super({
      uuid: VahanaCrewServiceUUID,
      characteristics: [bdrc],
    });

    this.bdrc = bdrc;
  }

  notify(event) {
    debugFTMS("[" + VahanaCrewServiceUUID + "][VahanaRowerService] notify");
    if (event.leftStrokeRate) {
      this.bdrc.notify(event);
    }
    return this.RESULT_SUCCESS;
  }
}

VahanaCrewService.VahanaCrewServiceUUID = VahanaCrewServiceUUID;

module.exports = VahanaCrewService;
