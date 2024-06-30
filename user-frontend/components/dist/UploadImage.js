'use client';
"use strict";
exports.__esModule = true;
exports.UploadImage = void 0;
var react_1 = require("react");
exports.UploadImage = function () {
    var _a = react_1.useState(''), image = _a[0], setImage = _a[1];
    return (React.createElement("div", { className: 'w-40 h-40 rounded border text-2xl cursor' },
        React.createElement("div", { className: 'h-full flex justify-center' },
            React.createElement("div", { className: 'h-full flex justify-center flex-col' },
                "+",
                React.createElement("input", { type: 'file', style: {
                        opacity: 0,
                        position: 'absolute',
                        top: 0,
                        bottom: 0,
                        left: 0,
                        right: 0,
                        width: '100%',
                        height: '100%'
                    }, onSelect: function (file) {
                        console.log('file=', file);
                    } })))));
};
