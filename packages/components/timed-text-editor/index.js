import React from 'react';
import PropTypes from 'prop-types';

import {
  EditorState,
  CompositeDecorator,
  convertFromRaw,
  convertToRaw,
  getDefaultKeyBinding,
  Modifier
} from 'draft-js';


// eslint-disable-next-line no-unused-vars
import CustomEditor from './CustomEditor.js';
import Word from './Word';

import sttJsonAdapter from '../../stt-adapters';
import exportAdapter from '../../export-adapters';
import updateTimestamps from './UpdateTimestamps/index.js';
import style from './index.module.css';

class TimedTextEditor extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      editorState: EditorState.createEmpty()
    };
  }

  componentDidMount() {
    this.loadData();
  }

  shouldComponentUpdate = (nextProps, nextState) => {
    if (nextProps !== this.props) return true;

    if (nextState !== this.state) return true;

    return false;
  };

  componentDidUpdate(prevProps, _prevState) {
    if (
      prevProps.timecodeOffset !== this.props.timecodeOffset ||
      prevProps.showSpeakers !== this.props.showSpeakers ||
      prevProps.showTimecodes !== this.props.showTimecodes ||
      prevProps.isEditable !== this.props.isEditable
    ) {
      // forcing a re-render is an expensive operation and
      // there might be a way of optimising this at a later refactor (?)
      // the issue is that WrapperBlock is not update on TimedTextEditor
      // state change otherwise.
      // for now compromising on this, as setting timecode offset, and
      // display preferences for speakers and timecodes are not expected to
      // be very frequent operations but rather one time setup in most cases.
      this.forceRenderDecorator();
    }
  }

  onChange = editorState => {
    // https://draftjs.org/docs/api-reference-editor-state#lastchangetype
    // https://draftjs.org/docs/api-reference-editor-change-type
    // doing editorStateChangeType === 'insert-characters'  is triggered even
    // outside of draftJS eg when clicking play button so using this instead
    // see issue https://github.com/facebook/draft-js/issues/1060
    // also "insert-characters" does not get triggered if you delete text
    if (this.state.editorState.getCurrentContent() !== editorState.getCurrentContent()) {
      if (this.props.isPauseWhileTypingOn) {
        if (this.props.isPlaying()) {
          this.props.playMedia(false);
          // Pause video for X seconds
          const pauseWhileTypingIntervalInMilliseconds = 3000;
          // resets timeout
          clearTimeout(this.plauseWhileTypingTimeOut);
          this.plauseWhileTypingTimeOut = setTimeout(
            function() {
              // after timeout starts playing again
              this.props.playMedia(true);
            }.bind(this),
            pauseWhileTypingIntervalInMilliseconds
          );
        }
      }

      if (this.saveTimer !== undefined) {
        clearTimeout(this.saveTimer);
      }
      this.saveTimer = setTimeout(() => {
        this.setState(
          () => ({
            editorState
          }),
          () => {
            // const data = this.updateTimestampsForEditorState();
            const data = this.getEditorContent( this.props.autoSaveContentType, this.props.title);
            this.props.handleAutoSaveChanges(data);
          }
        );
      }, 1000);
    }

    if (this.props.isEditable) {
      this.setState({ editorState });
    }
  };

  updateTimestampsForEditorState() {
    // Update timestamps according to the original state.
    const currentContent = convertToRaw(
      this.state.editorState.getCurrentContent()
    );
    const updatedContentRaw = updateTimestamps(
      currentContent,
      this.state.originalState
    );
    const updatedContent = convertFromRaw(updatedContentRaw);

    // Update editor state
    const newEditorState = EditorState.push(
      this.state.editorState,
      updatedContent
    );

    // Re-convert updated content to raw to gain access to block keys
    const updatedContentBlocks = convertToRaw(updatedContent);

    // Get current selection state and update block keys
    const selectionState = this.state.editorState.getSelection();

    // Check if editor has currently the focus. If yes, keep current selection.
    if (selectionState.getHasFocus()) {
      // Build block map, which maps the block keys of the previous content to the block keys of the
      // updated content.
      const blockMap = {};
      for (
        let blockIdx = 0;
        blockIdx < currentContent.blocks.length;
        blockIdx++
      ) {
        blockMap[currentContent.blocks[blockIdx].key] =
          updatedContentBlocks.blocks[blockIdx].key;
      }

      const selection = selectionState.merge({
        anchorOffset: selectionState.getAnchorOffset(),
        anchorKey: blockMap[selectionState.getAnchorKey()],
        focusOffset: selectionState.getFocusOffset(),
        focusKey: blockMap[selectionState.getFocusKey()]
      });

      // Set the updated selection state on the new editor state
      const newEditorStateSelected = EditorState.forceSelection(
        newEditorState,
        selection
      );
      this.setState({ editorState: newEditorStateSelected });
      return newEditorStateSelected;
    } else {
      this.setState({ editorState: newEditorState });
      return newEditorState;
    }
  }

  loadData() {
    if (this.props.transcriptData !== null) {
      const blocks = sttJsonAdapter(
        this.props.transcriptData,
        this.props.sttJsonType
      );
      this.setState({ originalState: convertToRaw(convertFromRaw(blocks)) });
      this.setEditorContentState(blocks);
    }
  }

  getEditorContent(exportFormat, title) {
    const format = exportFormat || 'draftjs';
    const tmpEditorState = this.updateTimestampsForEditorState();

    return exportAdapter(
      convertToRaw(tmpEditorState.getCurrentContent()),
      format,
      title
    );
  }

  // click on words - for navigation

  handleDoubleClick = event => {
    // nativeEvent --> React giving you the DOM event
    let element = event.nativeEvent.target;
    // find the parent in Word that contains span with time-code start attribute
    while (!element.hasAttribute('data-start') && element.parentElement) {
      element = element.parentElement;
    }

    if (element.hasAttribute('data-start')) {
      const t = parseFloat(element.getAttribute('data-start'));
      this.props.onWordClick(t);
    }
  };

  // originally from
  // https://github.com/draft-js-plugins/draft-js-plugins/blob/master/draft-js-counter-plugin/src/WordCounter/index.js#L12
  getWordCount = editorState => {
    const plainText = editorState.getCurrentContent().getPlainText('');
    const regex = /(?:\r\n|\r|\n)/g; // new line, carriage return, line feed
    const cleanString = plainText.replace(regex, ' ').trim(); // replace above characters w/ space
    const wordArray = cleanString.match(/\S+/g); // matches words according to whitespace

    return wordArray ? wordArray.length : 0;
  };

  /**
   * @param {object} data.entityMap - draftJs entity maps - used by convertFromRaw
   * @param {object} data.blocks - draftJs blocks - used by convertFromRaw
   * set DraftJS Editor content state from blocks
   * contains blocks and entityMap
   */
  setEditorContentState = data => {
    const contentState = convertFromRaw(data);

    const editorState = EditorState.createWithContent(contentState, decorator);

    if (this.props.handleAnalyticsEvents !== undefined) {
      this.props.handleAnalyticsEvents({
        category: 'TimedTextEditor',
        action: 'setEditorContentState',
        name: 'getWordCount',
        value: this.getWordCount(editorState)
      });
    }

    this.setState({ editorState }, () => {
      this.forceRenderDecorator();
    });
  };

  // Helper function to re-render this component
  // used to re-render WrapperBlock on timecode offset change
  // or when show / hide preferences for speaker labels and timecodes change
  forceRenderDecorator = () => {
    const contentState = this.state.editorState.getCurrentContent();
    const decorator = this.state.editorState.getDecorator();
    const newState = EditorState.createWithContent(contentState, decorator);
    const newEditorState = EditorState.push(newState, contentState);
    this.setState({ editorState: newEditorState });
  };

  /**
   * Update Editor content state
   */
  setEditorNewContentState = newContentState => {
    const decorator = this.state.editorState.getDecorator();
    const newState = EditorState.createWithContent(newContentState, decorator);
    const newEditorState = EditorState.push(
      newState,
      newContentState
    );
    this.setState({ editorState: newEditorState });
  };

  setEditorNewContentStateSpeakersUpdate = newContentState => {
    const decorator = this.state.editorState.getDecorator();
    const newState = EditorState.createWithContent(newContentState, decorator);
    const editorState = EditorState.push(
      newState,
      newContentState
    );

    this.setState(
      () => ({
        editorState
      }),
      () => {
        const format =  this.props.autoSaveContentType;
        const title = this.props.title;

        const data = exportAdapter(
          convertToRaw(editorState.getCurrentContent()),
          format,
          title
        );

        this.props.handleAutoSaveChanges(data);
      }
    );
  };

  /**
   * Listen for draftJs custom key bindings
   */
  customKeyBindingFn = e => {
    const enterKey = 13;
    const spaceKey = 32;
    const kKey = 75;
    const lKey = 76;
    const jKey = 74;
    const equalKey = 187; //used for +
    const minusKey = 189; // -
    const rKey = 82;
    const tKey = 84;

    if (e.keyCode === enterKey) {
      console.log('customKeyBindingFn');

      return 'split-paragraph';
    }
    // if alt key is pressed in combination with these other keys
    if (
      e.altKey &&
      (e.keyCode === spaceKey ||
        e.keyCode === spaceKey ||
        e.keyCode === kKey ||
        e.keyCode === lKey ||
        e.keyCode === jKey ||
        e.keyCode === equalKey ||
        e.keyCode === minusKey ||
        e.keyCode === rKey ||
        e.keyCode === tKey)
    ) {
      e.preventDefault();

      return 'keyboard-shortcuts';
    }

    return getDefaultKeyBinding(e);
  };

  /**
   * Handle draftJs custom key commands
   */
  handleKeyCommand = command => {
    if (command === 'split-paragraph') {
      this.splitParagraph();
    }

    if (command === 'keyboard-shortcuts') {
      return 'handled';
    }
    return 'not-handled';
  };

  /**
   * Helper function to handle splitting paragraphs with return key
   * on enter key, perform split paragraph at selection point.
   * Add timecode of next word after split to paragraph
   * as well as speaker name to new paragraph
   * TODO: move into its own file as helper function
   */
  splitParagraph = () => {
    // https://github.com/facebook/draft-js/issues/723#issuecomment-367918580
    // https://draftjs.org/docs/api-reference-selection-state#start-end-vs-anchor-focus
    const currentSelection = this.state.editorState.getSelection();
    // only perform if selection is not selecting a range of words
    // in that case, we'd expect delete + enter to achieve same result.
    if (currentSelection.isCollapsed()) {
      const currentContent = this.state.editorState.getCurrentContent();
      // https://draftjs.org/docs/api-reference-modifier#splitblock
      const newContentState = Modifier.splitBlock(
        currentContent,
        currentSelection
      );
      // https://draftjs.org/docs/api-reference-editor-state#push
      const splitState = EditorState.push(
        this.state.editorState,
        newContentState,
        'split-block'
      );
      const targetSelection = splitState.getSelection();

      const originalBlock = currentContent.blockMap.get(
        newContentState.selectionBefore.getStartKey()
      );
      const originalBlockData = originalBlock.getData();
      const blockSpeaker = originalBlockData.get('speaker');

      let wordStartTime = 'NA';

      let isEndOfParagraph = false;
      // identify the entity (word) at the selection/cursor point on split.

      let entityKey = originalBlock.getEntityAt(
        currentSelection.getStartOffset()
      );
      // if there is no word entity associated with a char then there is no entity key
      // at that selection point
      if (entityKey === null) {
        const closestEntityToSelection = this.findClosestEntityKeyToSelectionPoint(
          currentSelection,
          originalBlock
        );
        entityKey = closestEntityToSelection.entityKey;
        isEndOfParagraph = closestEntityToSelection.isEndOfParagraph;
        // handle edge case when it doesn't find a closest entity (word)
        // eg pres enter on an empty line
        if (entityKey === null) {
          return 'not-handled';
        }
      }
      // if there is an entityKey at or close to the selection point
      // can get the word startTime. for the new paragraph.
      const entityInstance = currentContent.getEntity(entityKey);
      const entityData = entityInstance.getData();
      if (isEndOfParagraph) {
        // if it's end of paragraph use end time of word for new paragraph
        wordStartTime = entityData.end;
      } else {
        wordStartTime = entityData.start;
      }
      // split paragraph
      // https://draftjs.org/docs/api-reference-modifier#mergeblockdata
      const afterMergeContentState = Modifier.mergeBlockData(
        splitState.getCurrentContent(),
        targetSelection,
        {
          start: wordStartTime,
          speaker: blockSpeaker
        }
      );
      this.setEditorNewContentState(afterMergeContentState);

      return 'handled';
    }

    return 'not-handled';
  };

  /**
   * Helper function for splitParagraph
   * to find the closest entity (word) to a selection point
   * that does not fall on an entity to begin with
   * Looks before if it's last char in a paragraph block.
   * After for everything else.
   */
  findClosestEntityKeyToSelectionPoint = (currentSelection, originalBlock) => {
    // set defaults
    let entityKey = null;
    let isEndOfParagraph = false;

    // selection offset from beginning of the paragraph block
    const startSelectionOffsetKey = currentSelection.getStartOffset();
    // length of the plain text for the ContentBlock
    const lengthPlainTextForTheBlock = originalBlock.getLength();
    // number of char from selection point to end of paragraph
    const remainingCharNumber =
      lengthPlainTextForTheBlock - startSelectionOffsetKey;
    // if it's the last char in the paragraph - get previous entity
    if (remainingCharNumber === 0) {
      isEndOfParagraph = true;
      for (let j = lengthPlainTextForTheBlock; j > 0; j--) {
        entityKey = originalBlock.getEntityAt(j);
        if (entityKey !== null) {
          // if it finds it then return
          return { entityKey, isEndOfParagraph };
        }
      }
    }
    // if it's first char or another within the block - get next entity
    else {
      let initialSelectionOffset = currentSelection.getStartOffset();
      for (let i = 0; i < remainingCharNumber; i++) {
        initialSelectionOffset += i;
        entityKey = originalBlock.getEntityAt(initialSelectionOffset);
        // if it finds it then return
        if (entityKey !== null) {
          return { entityKey, isEndOfParagraph };
        }
      }
    }

    // cover edge cases where it doesn't find it
    return { entityKey, isEndOfParagraph };
  };

  getCurrentWord = () => {
    const currentWord = {
      start: 'NA',
      end: 'NA'
    };

    if (this.props.transcriptData) {
      const contentState = this.state.editorState.getCurrentContent();
      // TODO: using convertToRaw here might be slowing down performance(?)
      const contentStateConvertEdToRaw = convertToRaw(contentState);
      const entityMap = contentStateConvertEdToRaw.entityMap;

      for (const entityKey in entityMap) {
        const entity = entityMap[entityKey];
        const word = entity.data;

        if (
          word.start <= this.props.currentTime &&
          word.end >= this.props.currentTime
        ) {
          currentWord.start = word.start;
          currentWord.end = word.end;
        }
      }
    }

    if (currentWord.start !== 'NA') {
      if (this.props.isScrollIntoViewOn) {
        const currentWordElement = document.querySelector(
          `span.Word[data-start="${currentWord.start}"]`
        );
        currentWordElement.scrollIntoView({
          block: 'nearest',
          inline: 'center'
        });
      }
    }

    return currentWord;
  };

  onWordClick = e => {
    this.props.onWordClick(e);
  };

  render() {
    // console.log('render TimedTextEditor');
    const currentWord = this.getCurrentWord();
    const highlightColour = '#69e3c2';
    const unplayedColor = '#767676';
    const correctionBorder = '1px dotted blue';

    // Time to the nearest half second
    const time = Math.round(this.props.currentTime * 4.0) / 4.0;

    const editor = (
      <section
        className={style.editor}
        onDoubleClick={this.handleDoubleClick}
        // TODO: decide if on mobile want to have a way to "click" on words
        // to play corresponding media
        // a double tap would be the ideal solution
        // onTouchStart={ event => this.handleDoubleClick(event) }
      >
        <style scoped>
          {`span.Word[data-start="${currentWord.start}"] { background-color: ${highlightColour}; text-shadow: 0 0 0.01px black }`}
          {`span.Word[data-start="${currentWord.start}"]+span { background-color: ${highlightColour} }`}
          {`span.Word[data-prev-times~="${Math.floor(
            time
          )}"] { color: ${unplayedColor} }`}
          {`span.Word[data-prev-times~="${time}"] { color: ${unplayedColor} }`}
          {`span.Word[data-confidence="low"] { border-bottom: ${correctionBorder} }`}
        </style>
        <CustomEditor
          editorState={this.state.editorState}
          onChange={this.onChange}
          stripPastedStyles
          handleKeyCommand={this.handleKeyCommand}
          customKeyBindingFn={this.customKeyBindingFn}
          spellCheck={this.props.spellCheck}
          showSpeakers={this.props.showSpeakers}
          showTimecodes={this.props.showTimecodes}
          timecodeOffset={this.props.timecodeOffset}
          setEditorNewContentStateSpeakersUpdate={this.setEditorNewContentStateSpeakersUpdate}
          onWordClick={this.onWordClick}
          handleAnalyticsEvents={this.props.handleAnalyticsEvents}
          isEditable={this.props.isEditable}
        />
      </section>
    );

    return (
      <section>{this.props.transcriptData !== null ? editor : null}</section>
    );
  }
}

// DraftJs decorator to recognize which entity is which
// and know what to apply to what component
const getEntityStrategy = mutability => (
  contentBlock,
  callback,
  contentState
) => {
  contentBlock.findEntityRanges(character => {
    const entityKey = character.getEntity();
    if (entityKey === null) {
      return false;
    }

    return contentState.getEntity(entityKey).getMutability() === mutability;
  }, callback);
};

// decorator definition - Draftjs
// defines what to use to render the entity
const decorator = new CompositeDecorator([
  {
    strategy: getEntityStrategy('MUTABLE'),
    component: Word
  }
]);

TimedTextEditor.propTypes = {
  transcriptData: PropTypes.object,
  mediaUrl: PropTypes.string,
  isEditable: PropTypes.bool,
  spellCheck: PropTypes.bool,
  onWordClick: PropTypes.func,
  sttJsonType: PropTypes.string,
  isPlaying: PropTypes.func,
  playMedia: PropTypes.func,
  currentTime: PropTypes.number,
  isScrollIntoViewOn: PropTypes.bool,
  isPauseWhileTypingOn: PropTypes.bool,
  timecodeOffset: PropTypes.number,
  handleAnalyticsEvents: PropTypes.func,
  showSpeakers: PropTypes.bool,
  showTimecodes: PropTypes.bool,
  fileName: PropTypes.string
};

export default TimedTextEditor;
