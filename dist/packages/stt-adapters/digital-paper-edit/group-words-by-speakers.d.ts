export default groupWordsInParagraphsBySpeakers;
/**
 edge cases
- more segments then words - not an issue if you start by matching words with segment
and handle edge case where it doesn't find a match
- more words then segments - orphan words?
*
* Takes in list of words and list of paragraphs (paragraphs have speakers info associated with it)
```js
{
  "words": [
    {
      "id": 0,
      "start": 13.02,
      "end": 13.17,
      "text": "There"
    },
    {
      "id": 1,
      "start": 13.17,
      "end": 13.38,
      "text": "is"
    },
    ...
    ],
  "paragraphs": [
    {
      "id": 0,
      "start": 13.02,
      "end": 13.86,
      "speaker": "TBC 00"
    },
    {
      "id": 1,
      "start": 13.86,
      "end": 19.58,
      "speaker": "TBC 1"
    },
    ...
  ]
}
```
*  and returns a list of words grouped into paragraphs, with words, text and speaker attribute
```js
[
  {
    "words": [
      {
        "id": 0,
        "start": 13.02,
        "end": 13.17,
        "text": "There"
      },
      {
        "id": 1,
        "start": 13.17,
        "end": 13.38,
        "text": "is"
      },
      {
        "id": 2,
        "start": 13.38,
        "end": 13.44,
        "text": "a"
      },
      {
        "id": 3,
        "start": 13.44,
        "end": 13.86,
        "text": "day."
      }
    ],
    "text": "There is a day.",
    "speaker": "TBC 00"
  },
  ...
]
```
 */
declare function groupWordsInParagraphsBySpeakers(words: any, segments: any): {
    words: never[];
    text: string;
    speaker: string;
}[];
//# sourceMappingURL=group-words-by-speakers.d.ts.map