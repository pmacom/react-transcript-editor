import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';
import isEqual from 'react-fast-compare';
import style from './index.module.scss';
class TimeBox extends React.Component {
    shouldComponentUpdate = (nextProps) => {
        return !isEqual(this.props, nextProps);
    };
    handleClick = (e) => {
        this.props.promptSetCurrentTime(e);
    };
    render() {
        return (_jsxs("div", { className: style.timeBox, children: [_jsx("span", { title: "Current time: alt t", className: style.currentTime, onClick: this.handleClick, children: this.props.currentTime }), _jsx("span", { className: style.separator, children: "|" }), _jsx("span", { title: "Clip duration", className: style.duration, children: this.props.duration })] }));
    }
}
export default TimeBox;
//# sourceMappingURL=TimeBox.js.map