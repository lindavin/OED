/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/*
 * Imports. We use the testing TDD testing framework Mocha and the assertion
 * library Chai.
 */

const chai = require('chai');
const mocha = require('mocha');

const expect = chai.expect;

const { sample, sectionInterval, sineOverEmbeddedPercentages } = require('../data/generateTestData');

mocha.describe('Trying out mocha', () => {
	mocha.it('should be able to compare two arrays', () => {
		const test_array = [0, 1];
		expect(test_array).deep.to.equal([0, 1]);
	});
});

// Generate a simple set of numbers
mocha.describe('The sample data generator', () => {
	mocha.it('should be able to generate a simple array from 1 to 100 with step 1', () => {
		// https://stackoverflow.com/questions/3746725/how-to-create-an-array-containing-1-n
		const one_to_hundred = Array.from({ length: 100 }, (_, i) => i + 1);
		const sample_array = sample(1, 100, 99);
		expect(one_to_hundred).to.deep.equal(sample_array);
	});
	mocha.it('should be able to generate an array with .2 stepSize', () => {
		const test = [];
		for (i = 0; i <= 100; i++) {
			test[i] = i * .2 + 0;
		}
		const sample_array = sample(0, 20, 100);
		expect(test).to.deep.equal(sample_array);
	});
});

mocha.describe('The sectioning function', () => {
	mocha.it('should cover the empty case', () => {
		expect([]).to.deep.equal(sectionInterval([], 1));
		// make a two-d-array, section off every periods worth until the end
	});
	mocha.it('should be able to cover a simple single period', () => {
		const array_to_section = [1, 2, 3];
		expect([[1], [2], [3]]).to.deep.equal(sectionInterval(array_to_section, 1));
	});
	mocha.it('should be able to cover a simple double period', () => {
		const array_to_section = [1, 2, 3, 4, 5, 6, 7, 8, 9];
		console.log(sectionInterval(array_to_section, 2))
		expect([[1, 2], [3, 4], [5, 6], [7, 8], [9]]).to.deep.equal(sectionInterval(array_to_section, 2));
	});
})

mocha.describe('The sine percentage function', () => {
	mocha.it('should cover the empty case', () => {
		expect([]).to.deep.equal(sineOverEmbeddedPercentages([]));
	});
	mocha.it('should do the singleton case', () => {
		const array_of_percentages = [[.1], [.2], [.3, .4]]
		expect([Math.sin(.1 * 2 * Math.PI), Math.sin(.2 * 2 * Math.PI), Math.sin(.3 * 2 * Math.PI), Math.sin(.4 * 2 * Math.PI)])
			.to.deep.equal(sineOverEmbeddedPercentages(array_of_percentages));
	});
})