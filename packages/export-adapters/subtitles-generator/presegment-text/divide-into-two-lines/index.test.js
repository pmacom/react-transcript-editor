'use strict';
import divideIntoTwoLines from './index.js';

const sampleText = `Hi there, my name is Ian police -
are recording this video to talk
about mercury for the folks at a
tech daily conference in New York.

Sorry, I can’t be there in person,
so we are building a prototype
funded in part by Google DNI of a
web-based computer, assisted
transcription and translation tool
with some video editing features.

It does speech to text and then
automated consistent translation
and then text to speech generate
synthetic voices at time codes that
line up with the original original
audio.`;

const expectedOutput = `Hi there, my name is Ian police -
are recording this video to talk

about mercury for the folks at a
tech daily conference in New York.

Sorry, I can’t be there in person,
so we are building a prototype

funded in part by Google DNI of a
web-based computer, assisted

transcription and translation tool
with some video editing features.

It does speech to text and then
automated consistent translation

and then text to speech generate
synthetic voices at time codes that

line up with the original original
audio.`;

test('divide into two lines', () => {
  const result = divideIntoTwoLines(sampleText);
  	expect(result).toBe(expectedOutput);
});
