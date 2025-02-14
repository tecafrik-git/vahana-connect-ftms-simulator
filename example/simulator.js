process.env.DEBUG = "*";
var ZwackBLE = require("../lib/zwack-ble-sensor");
const readline = require("readline");
const parseArgs = require("minimist");
var qrcode = require("qrcode-terminal");
const bleno = require("bleno");
const args = parseArgs(process.argv.slice(2));

var containsFTMS = true;
var containsRSC = false;
var containsCSP = false;
var containsSPD = false;
var containsPWR = false;
var containsCAD = false;

// containsFTMS = args.variable.includes("ftms");
containsRSC = args.variable?.includes("rsc");
containsCSP = args.variable?.includes("csp");
containsSPD = args.variable?.includes("speed");
containsPWR = args.variable?.includes("power");
containsCAD = args.variable?.includes("cadence");

// default parameters
var cadence = 90;
var power = 100;
var powerMeterSpeed = 18; // kmh
var powerMeterSpeedUnit = 2048; // Last Event time expressed in Unit of 1/2048 second
var runningCadence = 180;
var runningSpeed = 10; // 6:00 minute mile
var randomness = 5;
var sensorName = "Zwack";

var simulator = {};

var leftStrokeRate = 0;
var rightStrokeRate = 0;
var strokeCount = 0;
var averageStrokeRate = 0;
var instantaneousPace = 0;
var averagePace = 0;
var leftInstantaneousPower = 0;
var rightInstantaneousPower = 0;
var averagePower = 0;
var leftFlexionResistanceLevel = 1;
var leftExtensionResistanceLevel = 1;
var rightFlexionResistanceLevel = 1;
var rightExtensionResistanceLevel = 1;
var expendedEnergy = 0;
var energyPerHour = 0;
var energyPerMinute = 0;
var heartRate = 0;
var metabolicEquivalent = 0;
var elapsedTime = 0;
var remainingTime = 600;

simulator.startTime = new Date();
simulator.totalDistance = 0;
simulator.leftFlexionResistanceLevel = leftFlexionResistanceLevel;
simulator.leftExtensionResistanceLevel = leftExtensionResistanceLevel;
simulator.rightFlexionResistanceLevel = rightFlexionResistanceLevel;
simulator.rightExtensionResistanceLevel = rightExtensionResistanceLevel;

var incr = 10;
var runningIncr = 0.5;
var stroke_count = 0;
var wheel_count = 0;
var wheel_circumference = 2096; // milimeter
var notificationInterval = 500;
var watts = power;

var prevCadTime = 0;
var prevCadInt = 0;

readline.emitKeypressEvents(process.stdin);
process.stdin.setRawMode(true);

var zwackBLE = new ZwackBLE({
  name: sensorName,
  modelNumber: "ZW-101",
  serialNumber: "1",
});

process.stdin.on("keypress", (str, key) => {
  if (key.name === "x" || key.name == "q" || (key.ctrl && key.name == "c")) {
    process.exit(); // eslint-disable-line no-process-exit
  } else if (key.name === "l") {
    listKeys();
  } else {
    if (key.shift) {
      factor = incr;
      runFactor = runningIncr;
    } else {
      factor = -incr;
      runFactor = -runningIncr;
    }

    switch (key.name) {
      case "c":
        cadence += factor;
        if (cadence < 0) {
          cadence = 0;
        }
        if (cadence > 200) {
          cadence = 200;
        }
        break;
      case "p":
        power += factor;
        if (power < 0) {
          power = 0;
        }
        if (power > 2500) {
          power = 2500;
        }
        break;
      case "r":
        randomness += factor;
        if (randomness < 0) {
          randomness = 0;
        }
        break;
      case "s":
        runningSpeed += runFactor;
        if (runningSpeed < 0) {
          runningSpeed = 0;
        }

        powerMeterSpeed += runFactor;
        if (powerMeterSpeed < 0) {
          powerMeterSpeed = 0;
        }
        break;
      case "d":
        runningCadence += runFactor;
        if (runningCadence < 0) {
          runningCadence = 0;
        }
        break;
      case "i":
        incr += Math.abs(factor) / factor;
        if (incr < 1) {
          incr = 1;
        }
        break;
      case "m":
        notifyRowerDataFTMS();
        break;
      default:
        listKeys();
    }
    listParams();
  }
});

// Simulate Cycling Power - Broadcasting Power & Cadence
// var notifyPowerCPC = function() {
//   watts = Math.floor(Math.random() * randomness + power);
//
//   stroke_count += 1;
//   if( cadence <= 0) {
//     cadence = 0;
//     setTimeout(notifyPowerCPC, notificationInterval);
//     return;
//   }
//
//   try {
//     zwackBLE.notifyCSP({'watts': watts, 'rev_count': stroke_count });
//   }
//   catch( e ) {
//     console.error(e);
//   }
//
//   setTimeout(notifyPowerCPC, notificationInterval);
// };

// Simulate Cycling Power - Broadcasting Power ONLY
var notifyPowerCSP = function () {
  watts = Math.floor(Math.random() * randomness + power);

  try {
    zwackBLE.notifyCSP({ watts: watts });
  } catch (e) {
    console.error(e);
  }

  // setTimeout(notifyPowerCSP, notificationInterval);
};

// Simulate FTMS Smart Trainer - Broadcasting Power and Cadence
var notifyPowerFTMS = function () {
  if (!zwackBLE.ftms.fmcpc.isStarted) {
    // setTimeout(notifyPowerFTMS, notificationInterval);
    return;
  }
  watts = Math.floor(Math.random() * randomness + power);
  cadence = Math.floor(Math.random() + cadence);

  try {
    zwackBLE.notifyFTMS({ watts: watts, cadence: cadence });
  } catch (e) {
    console.error(e);
  }

  // setTimeout(notifyPowerFTMS, notificationInterval);
};

var notifyRowerDataFTMS = function () {
  if (!zwackBLE.ftms.fmcpc.isStarted) {
    // setTimeout(notifyRowerDataFTMS, notificationInterval);
    elapsedTime = 0;
    expendedEnergy = 0;
    simulator.totalDistance = 0;
    return;
  }

  elapsedTime = Math.floor(
    (new Date().getTime() - simulator.startTime.getTime()) / 1000
  );

  console.log(new Date(), simulator.startTime, elapsedTime);
  remainingTime = 600 - elapsedTime;
  leftStrokeRate = Math.floor(Math.random() * 60 + 20);
  rightStrokeRate = Math.floor(Math.random() * 60 + 20);
  strokeRate = Math.round((leftStrokeRate + rightStrokeRate) / 2);
  strokeCount = elapsedTime * 1.1;
  averageStrokeRate = Math.floor(Math.random() * 60 + 20);
  simulator.totalDistance =
    simulator.totalDistance + Math.floor(Math.random() * 10 + 1);
  instantaneousPace = Math.floor(Math.random() * 60 + 20);
  averagePace = Math.floor(Math.random() * 60 + 20);
  leftInstantaneousPower = Math.floor(Math.random() * 100 + 20);
  rightInstantaneousPower = Math.floor(Math.random() * 100 + 20);
  instantaneousPower = Math.round(
    (leftInstantaneousPower + rightInstantaneousPower) / 2
  );
  averagePower = Math.floor(Math.random() * 100 + 20);
  leftFlexionResistanceLevel = simulator.leftFlexionResistanceLevel;
  leftExtensionResistanceLevel = simulator.leftExtensionResistanceLevel;
  rightFlexionResistanceLevel = simulator.rightFlexionResistanceLevel;
  rightExtensionResistanceLevel = simulator.rightExtensionResistanceLevel;
  resistanceLevel = Math.floor(
    (leftFlexionResistanceLevel +
      leftExtensionResistanceLevel +
      rightFlexionResistanceLevel +
      rightExtensionResistanceLevel) /
      4
  );
  expendedEnergy = expendedEnergy + Math.floor(Math.random() * 10 + 1);
  energyPerHour = Math.floor(Math.random() * 100 + 20);
  energyPerMinute = Math.floor(Math.random() * 100 + 20);
  heartRate = Math.floor(Math.random() * 41 + 60);
  metabolicEquivalent = Math.floor(Math.random() * 10 + 1);

  try {
    zwackBLE.notifyFTMS({
      strokeRate,
      strokeCount,
      averageStrokeRate,
      totalDistance: simulator.totalDistance,
      instantaneousPace,
      averagePace,
      instantaneousPower,
      averagePower,
      resistanceLevel,
      expendedEnergy,
      heartRate,
      metabolicEquivalent,
      elapsedTime,
      remainingTime,
      energyPerHour,
      energyPerMinute,
    });
    setTimeout(() => {
      zwackBLE.notifyVCS({
        leftStrokeRate,
        rightStrokeRate,
        leftInstantaneousPower,
        rightInstantaneousPower,
        leftFlexionResistanceLevel,
        leftExtensionResistanceLevel,
        rightFlexionResistanceLevel,
        rightExtensionResistanceLevel,
      });
    }, 100);
  } catch (e) {
    console.error(e);
  }

  // setTimeout(notifyRowerDataFTMS, notificationInterval);
};

// Simulate Cycling Power - Broadcasting Power and Cadence
var notifyCadenceCSP = function () {
  stroke_count += 1;
  if (cadence <= 0) {
    cadence = 0;
    // setTimeout(notifyCadenceCSP, notificationInterval);
    return;
  }
  try {
    zwackBLE.notifyCSP({ watts: watts, rev_count: stroke_count });
  } catch (e) {
    console.error(e);
  }

  // setTimeout(
  //   notifyCadenceCSP,
  //   (60 * 1000) / (Math.random() * randomness + cadence)
  // );
};

// Simulate Cycling Power - Broadcasting Power and Cadence & Speed
// This setup is NOT ideal. Cadence and Speed changes will be erratic
//   - takes ~2 sec to stabilize and be reflected in output
//   - will be unable to inject randomness into the output
//   - will need help on how to improve it
var notifyCPCS = function () {
  // https://www.hackster.io/neal_markham/ble-bicycle-speed-sensor-f60b80
  var spd_int = Math.round(
    (wheel_circumference * powerMeterSpeedUnit * 60 * 60) /
      (1000 * 1000 * powerMeterSpeed)
  );
  watts = Math.floor(Math.random() * randomness + power);

  //   var cad_int = Math.round(60 * 1024/(Math.random() * randomness + cadence));
  var cad_int = Math.round((60 * 1024) / cadence);
  var now = Date.now();
  var cad_time = 0;

  wheel_count += 1;
  if (powerMeterSpeed <= 0) {
    powerMeterSpeed = 0;
    // setTimeout(notifyCPCS, notificationInterval);
    return;
  }

  if (cad_int != prevCadInt) {
    cad_time = (stroke_count * cad_int) % 65536;
    var deltaCadTime = cad_time - prevCadTime;
    var ratioCadTime = deltaCadTime / cad_int;
    if (ratioCadTime > 1) {
      stroke_count = stroke_count + Math.round(ratioCadTime);
      cad_time = (cad_time + cad_int) % 65536;
      prevCadTime = cad_time;
    }
  } else {
    stroke_count += 1;
    cad_time = (stroke_count * cad_int) % 65536;
  }

  prevCadTime = cad_time;
  prevCadInt = cad_int;

  if (cadence <= 0) {
    cadence = 0;
    // setTimeout(notifyCPCS, notificationInterval);
    return;
  }

  try {
    zwackBLE.notifyCSP({
      watts: watts,
      rev_count: stroke_count,
      wheel_count: wheel_count,
      spd_int: spd_int,
      cad_int: cad_int,
      cad_time: cad_time,
      cadence: cadence,
      powerMeterSpeed: powerMeterSpeed,
    });
  } catch (e) {
    console.error(e);
  }

  // setTimeout(notifyCPCS, notificationInterval);
  //   setTimeout(notifyCPCS, spd_int);
};

// Simulate Running Speed and Cadence - Broadcasting Speed and Cadence
var notifyRSC = function () {
  try {
    zwackBLE.notifyRSC({
      speed: toMs(Math.random() + runningSpeed),
      cadence: Math.floor(Math.random() * 2 + runningCadence),
    });
  } catch (e) {
    console.error(e);
  }

  // setTimeout(notifvyRSC, notificationInterval);
};

function listParams() {
  console.log(`\nBLE Sensor parameters:`);
  console.log(`\nCycling:`);
  console.log(`    Cadence: ${cadence} RPM`);
  console.log(`      Power: ${power} W`);
  console.log(`      Speed: ${powerMeterSpeed} km/h`);

  console.log("\nRunning:");

  console.log(
    `    Speed: ${runningSpeed} m/h, Pace: ${speedToPace(runningSpeed)} min/mi`
  );
  console.log(`    Cadence: ${Math.floor(runningCadence)} steps/min`);

  console.log(`\nRandomness: ${randomness}`);
  console.log(`Increment: ${incr}`);
  console.log("\n");
}

function listKeys() {
  console.log(`\nList of Available Keys`);
  console.log("c/C - Decrease/Increase cycling cadence");
  console.log("p/P - Decrease/Increase cycling power");

  console.log("s/S - Decrease/Increase running speed");
  console.log("d/D - Decrease/Increase running cadence");

  console.log("\nr/R - Decrease/Increase parameter variability");
  console.log("i/I - Decrease/Increase parameter increment");
  console.log("x/q - Exit");
  console.log();
}

function speedToPace(speed) {
  if (speed === 0) {
    return "00:00";
  }
  let t = 60 / speed;
  let minutes = Math.floor(t);
  let seconds = Math.floor((t - minutes) * 60);
  return (
    minutes.toString().padStart(2, "0") +
    ":" +
    seconds.toString().padStart(2, "0")
  );
}

function toMs(speed) {
  return (speed * 1.60934) / 3.6;
}

function kmhToMs(speed) {
  return speed / 3.6;
}

// Main
console.log(`[ZWack] Faking test data for sensor: ${sensorName}`);
console.log(`[ZWack]  Advertising these services: ${args.variable}`);

listKeys();
listParams();
qrcode.generate("MacBook Pro");

// Comment or Uncomment each line depending on what is needed
if (containsCSP && containsPWR && !containsCAD && !containsSPD) {
  notifyPowerCSP();
} // Simulate Cycling Power Service - Broadcasting Power ONLY
if (containsCSP && containsPWR && containsCAD && !containsSPD) {
  notifyCadenceCSP();
} // Simulate Cycling Power Service  - Broadcasting Power and Cadence
if (containsCSP && containsPWR && containsCAD && containsSPD) {
  notifyCPCS();
} // Simulate Cycling Power Service - Broadcasting Power and Cadence and Speed
if (containsFTMS) {
  notifyPowerFTMS();
  notifyRowerDataFTMS();
} // Simulate FTMS Smart Trainer - Broadcasting Power and Cadence
if (containsRSC) {
  notifyRSC();
} // Simulate Running Speed and Cadence - Broadcasting Speed and Cadence

global.simulator = simulator;
