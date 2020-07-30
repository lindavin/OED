/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

export interface CartesianPoint {
	x: number;
	y: number;
}

/**
 * if copied from places such as google map, the format is latitude, longitude;
 * stored as (longitude, latitude) in postgres as POINTS
 * @param longitude: the 'x' axis of GIS coordinate system, min: -180, max: 180;
 * @param latitude: the 'y' axis of GIS coordinate system, min: -90, max: 90;
 */
export interface GPSPoint {
	longitude: number;
	latitude: number;
}

/**
 * @param degreePerUnitX
 * @param degreePerUnitY
 */
interface MapScale {
	degreePerUnitX: number;
	degreePerUnitY: number;
}

export interface CalibratedPoint {
	cartesian: CartesianPoint;
	gps: GPSPoint;
}

export interface CalibrationResult {
	maxError: {
		x: number,
		y: number,
	},
	origin: GPSPoint,
	opposite: GPSPoint,
}

export interface Dimensions {
	width: number;
	height: number;
}

export function isValidGPSInput(input: string) {
	if (input.indexOf(',') == -1) return false;
	const array = input.split(',').map((value:string) => parseFloat(value));
	const latitudeIndex = 0;
	const longitudeIndex = 1;
	return array[latitudeIndex] >= -90 && array[latitudeIndex] <= 90
		&& array[longitudeIndex] >= -180 && array[longitudeIndex] <= 180;
}

export function calculateScaleFromEndpoints(origin: GPSPoint, opposite: GPSPoint, imageDimensions: Dimensions) {
	const normalizedDimensions = normalizeImageDimensions(imageDimensions);
	const originComplete: CalibratedPoint = {gps: origin, cartesian: {x: 0, y: 0}};
	const oppositeComplete: CalibratedPoint = {gps: opposite, cartesian: {x: normalizedDimensions.width, y: normalizedDimensions.height}};
	let mapScale: MapScale = calculateScale(originComplete, oppositeComplete);
	return mapScale;
}

export function calibrate(calibrationSet: CalibratedPoint[], imageDimensions: Dimensions) {
	const normalizedDimensions = normalizeImageDimensions(imageDimensions);
	// calculate (n choose 2) scales for each pair of data points;
	let scales: MapScale[] = [];
	for (let i = 0; i < calibrationSet.length - 1; i++) {
		for (let j = i+1; j < calibrationSet.length; j++) {
			let mapScale: MapScale = calculateScale(calibrationSet[i], calibrationSet[j]);
			scales.push(mapScale);
		}
	}
	// take average to get the calibrated scale;
	let XScaleSum = 0;
	let YScaleSum = 0;
	let numDataPoints = scales.length;
	for (let i = 0; i < numDataPoints; i++) {
		XScaleSum += scales[i].degreePerUnitX;
		YScaleSum += scales[i].degreePerUnitY;
	}
	const degreePerUnitX = XScaleSum/numDataPoints;
	const degreePerUnitY = YScaleSum/numDataPoints;

	// calculate gps coordinates for the origin;
	const originCoordinate: GPSPoint = {
		latitude: calibrationSet[0].gps.latitude - degreePerUnitY * calibrationSet[0].cartesian.y,
		longitude: calibrationSet[0].gps.longitude - degreePerUnitX * calibrationSet[0].cartesian.x,
	}

	// uncomment this block to get gps coordinates of the opposite corner from origin

	const oppositeCoordinate: GPSPoint = {
		latitude: originCoordinate.latitude + normalizedDimensions.height * degreePerUnitY,
		longitude: originCoordinate.longitude + normalizedDimensions.width * degreePerUnitX,
	};

	// calculate gps coordinates for top-left and down-right corner
	let topLeftLatitude = originCoordinate.latitude + normalizedDimensions.height * degreePerUnitY;
	let topLeftLongitude = originCoordinate.longitude;
	let topLeftCoordinate: GPSPoint = {
		latitude: Number(topLeftLatitude.toFixed(6)),
		longitude: Number(topLeftLongitude.toFixed(6)),
	};

	let downRightLatitude = originCoordinate.latitude;
	let downRightLongitude = originCoordinate.longitude + normalizedDimensions.width * degreePerUnitX;
	let downRightCoordinate: GPSPoint = {
		latitude: Number(downRightLatitude.toFixed(6)),
		longitude: Number(downRightLongitude.toFixed(6)),
	};

	// calculate max error
	const diagonal = Math.sqrt(Math.pow(normalizedDimensions.width*degreePerUnitX, 2) + Math.pow(normalizedDimensions.height*degreePerUnitY, 2));
	let scalesWithMaxDifference: MapScale = {
		degreePerUnitX: 0,
		degreePerUnitY: 0,
	};
	let pointIndexWithMaxDifference = {
		x: -1,
		y: -1,
	};
	for (let i = 0; i < calibrationSet.length; i++) {
		const XScaleDifference = Math.abs(scales[i].degreePerUnitX - degreePerUnitX);
		const YScaleDifference = Math.abs(scales[i].degreePerUnitY - degreePerUnitY);
		if (XScaleDifference > scalesWithMaxDifference.degreePerUnitX) {
			pointIndexWithMaxDifference.x = i;
			scalesWithMaxDifference.degreePerUnitX = XScaleDifference;
		}
		if (YScaleDifference > scalesWithMaxDifference.degreePerUnitY) {
			pointIndexWithMaxDifference.y = i;
			scalesWithMaxDifference.degreePerUnitY = YScaleDifference;
		}
	}
	const maxErrorPercentage = {
		x: Number.parseFloat((scalesWithMaxDifference.degreePerUnitX/diagonal * 100).toFixed(3)),
		y: Number.parseFloat((scalesWithMaxDifference.degreePerUnitY/diagonal * 100).toFixed(3))
	}
	const result: CalibrationResult = {
		maxError: maxErrorPercentage,
		origin: originCoordinate,
		opposite: oppositeCoordinate,
	}
	return result;
}

function calculateScale(p1: CalibratedPoint, p2: CalibratedPoint) {
	let deltaLatitude = p1.gps.latitude - p2.gps.latitude;
	let deltaYInUnits = p1.cartesian.y - p2.cartesian.y;
	let degreePerUnitY = deltaLatitude / deltaYInUnits;

	let deltaLongitude = p1.gps.longitude - p2.gps.longitude;
	let deltaXInUnits = p1.cartesian.x - p2.cartesian.x;
	let degreePerUnitX = deltaLongitude / deltaXInUnits;

	return {degreePerUnitX, degreePerUnitY};
}

/**
 * normalize image dimensions to fit in the default 500*500 pixel-sized graph
 * @param dimensions Dimensions: { width: number, height: number};
 * @return normalized Dimensions object
 */
export function normalizeImageDimensions(dimensions: Dimensions) {
	let res: Dimensions;
	if (dimensions.width > dimensions.height) {
		const width = 500;
		const height = 500 * dimensions.height / dimensions.width;
		res = {
			width: width,
			height: height
		};
	} else {
		const height = 500;
		const width = 500 * dimensions.width / dimensions.height;
		res = {
			width: width,
			height: height,
		};
	}
	return res;
}

// Typescript functions to determine whether an object is one of these points
function isCartesian(object: any): object is CartesianPoint {
	return 'x' in object && 'y' in object;
}

function isGPS(object: any): object is GPSPoint {
	return 'latitude' in object && 'longitude' in object;
}
