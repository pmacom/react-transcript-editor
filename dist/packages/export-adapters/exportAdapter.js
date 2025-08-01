import draftToTxt from './txt/index';
import draftToDocx from './docx/index';
import draftToTxtSpeakersTimecodes from './txt-speakers-timecodes/index';
import draftToDigitalPaperEdit from './draftjs-to-digital-paper-edit/index.js';
import subtitlesGenerator from './subtitles-generator/index.js';
/**
 * Adapters for Draft.js conversion
 * @param blockData - Draft.js blocks
 * @param exportFormat - the type of file supported by the available adapters
 * @param transcriptTitle - optional title for the transcript
 * @returns Export result with data and file extension
 */
const exportAdapter = (blockData, exportFormat, transcriptTitle) => {
    try {
        switch (exportFormat) {
            case 'draftjs':
                return { data: blockData, ext: 'json' };
            case 'txt':
                return { data: draftToTxt(blockData), ext: 'txt' };
            case 'docx':
                return { data: draftToDocx(blockData, transcriptTitle), ext: 'docx' };
            case 'txtspeakertimecodes':
                return { data: draftToTxtSpeakersTimecodes(blockData), ext: 'txt' };
            case 'digitalpaperedit':
                return { data: draftToDigitalPaperEdit(blockData), ext: 'json' };
            case 'srt': {
                const { words } = draftToDigitalPaperEdit(blockData);
                const srtContent = subtitlesGenerator({
                    words,
                    type: 'srt',
                    numberOfCharPerLine: 35
                });
                return { data: srtContent, ext: 'srt' };
            }
            case 'premiereTTML': {
                const { words } = draftToDigitalPaperEdit(blockData);
                const content = subtitlesGenerator({
                    words,
                    type: 'premiere'
                });
                return { data: content, ext: 'ttml' };
            }
            case 'ttml': {
                const { words } = draftToDigitalPaperEdit(blockData);
                const content = subtitlesGenerator({
                    words,
                    type: 'ttml'
                });
                return { data: content, ext: 'ttml' };
            }
            case 'itt': {
                const { words } = draftToDigitalPaperEdit(blockData);
                const content = subtitlesGenerator({
                    words,
                    type: 'itt'
                });
                return { data: content, ext: 'itt' };
            }
            case 'csv': {
                const { words } = draftToDigitalPaperEdit(blockData);
                const content = subtitlesGenerator({
                    words,
                    type: 'csv'
                });
                return { data: content, ext: 'csv' };
            }
            case 'vtt': {
                const { words } = draftToDigitalPaperEdit(blockData);
                const content = subtitlesGenerator({
                    words,
                    type: 'vtt'
                });
                return { data: content, ext: 'vtt' };
            }
            case 'json-captions': {
                const { words } = draftToDigitalPaperEdit(blockData);
                const content = subtitlesGenerator({
                    words,
                    type: 'json'
                });
                return { data: content, ext: 'json' };
            }
            case 'pre-segment-txt': {
                const { words } = draftToDigitalPaperEdit(blockData);
                const content = subtitlesGenerator({
                    words,
                    type: 'pre-segment-txt'
                });
                return { data: content, ext: 'txt' };
            }
            default:
                console.error(`Unsupported export format: ${exportFormat}`);
                return null;
        }
    }
    catch (error) {
        console.error(`Error exporting ${exportFormat}:`, error);
        return null;
    }
};
export default exportAdapter;
//# sourceMappingURL=exportAdapter.js.map