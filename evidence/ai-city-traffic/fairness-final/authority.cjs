'use strict';
const path = require('node:path');
const buildDirectory = path.resolve(process.env.TRAFFIC_REVIEW_BUILD || path.join(__dirname, '../../../dist/games/ai-city-traffic/src'));
module.exports = { buildDirectory, simulation: require(path.join(buildDirectory, 'simulation.js')), network: require(path.join(buildDirectory, 'traffic-network.js')) };
