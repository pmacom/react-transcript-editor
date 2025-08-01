import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';
import { 
// eslint-disable-next-line no-unused-vars
EditorBlock, Modifier, EditorState, SelectionState, convertFromRaw, convertToRaw } from 'draft-js';
// eslint-disable-next-line no-unused-vars
import SpeakerLabel from './SpeakerLabel';
// import { shortTimecode, secondsToTimecode } from '../../Util/timecode-converter/';
import { shortTimecode, secondsToTimecode } from '../../util/timecode-converter';
import style from './WrapperBlock.module.css';
const updateSpeakerName = (oldName, newName, state) => {
    const contentToUpdate = convertToRaw(state);
    contentToUpdate.blocks.forEach(block => {
        if (block.data.speaker === oldName) {
            block.data.speaker = newName;
        }
    });
    return convertFromRaw(contentToUpdate);
};
class WrapperBlock extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            speaker: '',
            start: 0,
            timecodeOffset: this.props.blockProps.timecodeOffset
        };
    }
    componentDidMount() {
        const { block } = this.props;
        const speaker = block.getData().get('speaker');
        const start = block.getData().get('start');
        this.setState({
            speaker,
            start
        });
    }
    // reducing unnecessary re-renders
    shouldComponentUpdate = (nextProps, nextState) => {
        if (nextProps.block.getText() !== this.props.block.getText()) {
            return true;
        }
        if (nextProps.blockProps.showSpeakers !== this.props.blockProps.showSpeakers) {
            return true;
        }
        if (nextProps.blockProps.showTimecodes !== this.props.blockProps.showTimecodes) {
            return true;
        }
        if (nextProps.blockProps.timecodeOffset !== this.props.blockProps.timecodeOffset) {
            return true;
        }
        if (nextState.speaker !== this.state.speaker) {
            return true;
        }
        if (nextProps.blockProps.isEditable !== this.props.blockProps.isEditable) {
            return true;
        }
        if (nextProps.block.getData().get('speaker') !== this.state.speaker) {
            console.log('shouldComponentUpdate wrapper speaker', nextProps.block.getData().get('speaker'), this.state.speaker);
            return true;
        }
        return false;
    };
    componentDidUpdate = (prevProps, prevState) => {
        if (prevProps.block.getData().get('speaker') !== prevState.speaker) {
            console.log('componentDidUpdate wrapper speaker', prevProps.block.getData().get('speaker'), prevState.speaker);
            this.setState({
                speaker: prevProps.block.getData().get('speaker')
            });
            return true;
        }
    };
    handleOnClickEdit = () => {
        const oldSpeakerName = this.state.speaker;
        const newSpeakerName = prompt('New Speaker Name?', this.state.speaker);
        if (newSpeakerName !== '' && newSpeakerName !== null) {
            this.setState({ speaker: newSpeakerName });
            const isUpdateAllSpeakerInstances = confirm(`Would you like to replace all occurrences of ${oldSpeakerName} with ${newSpeakerName}?`);
            if (this.props.blockProps.handleAnalyticsEvents) {
                this.props.blockProps.handleAnalyticsEvents({
                    category: 'WrapperBlock',
                    action: 'handleOnClickEdit',
                    name: 'newSpeakerName',
                    value: newSpeakerName
                });
            }
            if (isUpdateAllSpeakerInstances) {
                const ContentState = this.props.blockProps.editorState.getCurrentContent();
                const contentToUpdateWithSpekaers = updateSpeakerName(oldSpeakerName, newSpeakerName, ContentState);
                this.props.blockProps.setEditorNewContentStateSpeakersUpdate(contentToUpdateWithSpekaers);
            }
            else {
                // From docs: https://draftjs.org/docs/api-reference-selection-state#keys-and-offsets
                // selection points are tracked as key/offset pairs,
                // where the key value is the key of the ContentBlock where the point is positioned
                // and the offset value is the character offset within the block.
                // Get key of the currentBlock
                const keyForCurrentCurrentBlock = this.props.block.getKey();
                // create empty selection for current block
                // https://draftjs.org/docs/api-reference-selection-state#createempty
                const currentBlockSelection = SelectionState.createEmpty(keyForCurrentCurrentBlock);
                const editorStateWithSelectedCurrentBlock = EditorState.acceptSelection(this.props.blockProps.editorState, currentBlockSelection);
                const currentBlockSelectionState = editorStateWithSelectedCurrentBlock.getSelection();
                const newBlockDataWithSpeakerName = { speaker: newSpeakerName };
                // https://draftjs.org/docs/api-reference-modifier#mergeblockdata
                const newContentState = Modifier.mergeBlockData(this.props.contentState, currentBlockSelectionState, newBlockDataWithSpeakerName);
                this.props.blockProps.setEditorNewContentStateSpeakersUpdate(newContentState);
            }
        }
    };
    handleTimecodeClick = () => {
        this.props.blockProps.onWordClick(this.state.start);
        if (this.props.blockProps.handleAnalyticsEvents) {
            this.props.blockProps.handleAnalyticsEvents({
                category: 'WrapperBlock',
                action: 'handleTimecodeClick',
                name: 'onWordClick',
                value: secondsToTimecode(this.state.start)
            });
        }
    };
    render() {
        let startTimecode = this.state.start;
        if (this.props.blockProps.timecodeOffset) {
            startTimecode += this.props.blockProps.timecodeOffset;
        }
        const speakerElement = (_jsx(SpeakerLabel, { name: this.state.speaker, handleOnClickEdit: this.handleOnClickEdit, isEditable: this.props.blockProps.isEditable }));
        const timecodeElement = (_jsx("span", { className: style.time, onClick: this.handleTimecodeClick, children: shortTimecode(startTimecode) }));
        return (_jsxs("div", { className: style.WrapperBlock, children: [_jsxs("div", { className: [style.markers, style.unselectable].join(' '), contentEditable: false, children: [this.props.blockProps.showSpeakers ? speakerElement : '', this.props.blockProps.showTimecodes ? timecodeElement : ''] }), _jsx("div", { className: style.text, children: _jsx(EditorBlock, { ...this.props }) })] }));
    }
}
export default WrapperBlock;
//# sourceMappingURL=WrapperBlock.js.map