'use strict';
import textSegmentation from './index.js';

const sampleText = 'Hi there, my name is Mr. Ian police - are recording this video to talk about mercury for the folks at a tech daily conference in New York. Sorry, I can\'t be there in person, so we are building a prototype funded in part by Google DNI of a web-based computer, assisted transcription and translation tool with some video editing features. It does speech to text and then automated consistent translation and then text to speech generate synthetic voices at time codes that line up with the original original audio.';

const expectedOutput = `Hi there, my name is Mr. Ian police - are recording this video to talk about mercury for the folks at a tech daily conference in New York.
Sorry, I can't be there in person, so we are building a prototype funded in part by Google DNI of a web-based computer, assisted transcription and translation tool with some video editing features.
It does speech to text and then automated consistent translation and then text to speech generate synthetic voices at time codes that line up with the original original audio.`;

const optionalHonorificsSample = 'Mr';

test('add line break between sentences', () => {
  const result = textSegmentation(sampleText);
  	expect(result).toBe(expectedOutput);
});

test('add line break between sentences,with optional honorifics', () => {
  const result = textSegmentation(sampleText, optionalHonorificsSample);
  	expect(result).toBe(expectedOutput);
});
