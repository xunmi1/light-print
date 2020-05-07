/*!
 * light-print v1.1.0
 * (c) 2020 xunmi
 * Released under the MIT License.
 */

var isIE = function () { return /msie|trident/i.test(window.navigator.userAgent); };
var isString = function (val) { return typeof val === 'string'; };
var isNode = function (target) { return target instanceof Node; };
var appendNode = function (parent, child) { return parent.appendChild(child); };
var importNode = function (document, node) { return document.importNode(node, true); };
var removeNode = function (node) { var _a; return (_a = node.parentNode) === null || _a === void 0 ? void 0 : _a.removeChild(node); };
var SHOW_ELEMENT = window.NodeFilter.SHOW_ELEMENT;
var createNodeIterator = function (root, filter) {
    return window.document.createNodeIterator(root, SHOW_ELEMENT, filter);
};
var cloneStyle = function (target, origin) {
    var style = window.getComputedStyle(origin, null);
    target.setAttribute('style', style.cssText);
};
var setProperty = function (target, propertyName, value, priority) {
    target.style.setProperty(propertyName, String(value), priority);
};
var getDocument = function (target) { var _a, _b; return (_b = (_a = target.contentWindow) === null || _a === void 0 ? void 0 : _a.document) !== null && _b !== void 0 ? _b : target.contentDocument; };
var getNode = function (containerOrSelector) {
    if (isNode(containerOrSelector))
        return containerOrSelector;
    if (isString(containerOrSelector)) {
        var dom = window.document.querySelector(containerOrSelector);
        if (dom)
            return dom;
    }
};
var bindOnceEvent = function (el, eventName, listener, options) {
    var wrappedListener = function (event) {
        listener(event);
        el.removeEventListener(eventName, wrappedListener, options);
    };
    el.addEventListener(eventName, wrappedListener, options);
};

var __awaiter = (window && window.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (window && window.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var createContainer = function (documentTitle) {
    var container = window.document.createElement('iframe');
    var hidden = 'position: absolute; height: 0; width: 0; visibility: hidden;';
    container.setAttribute('style', hidden);
    var title = documentTitle !== null && documentTitle !== void 0 ? documentTitle : window.document.title;
    container.setAttribute('srcdoc', "<html><head><title>" + title + "</title></head></html>");
    return container;
};
var createStyleNode = function (style) {
    var node = window.document.createElement('style');
    node.innerHTML = "@media print {" + style + "}";
    return node;
};
var cloneDocumentStyle = function (printDocument, dom) {
    var originIterator = createNodeIterator(dom);
    var printIterator = createNodeIterator(printDocument.body);
    var node = printIterator.nextNode();
    while (node) {
        node = printIterator.nextNode();
        var originNode = originIterator.nextNode();
        if (originNode && node)
            cloneStyle(node, originNode);
    }
};
var setDocumentZoom = function (document, zoom) {
    if (zoom === void 0) { zoom = 1; }
    setProperty(document.documentElement, 'zoom', zoom);
};
var loadContainer = function (title) {
    return new Promise(function (resolve, reject) {
        var container = createContainer(title);
        appendNode(window.document.body, container);
        bindOnceEvent(container, 'load', function () { return resolve(container); });
        bindOnceEvent(container, 'error', function () { return reject(new Error('Failed to load document')); });
    });
};
var performPrint = function (container) {
    return new Promise(function (resolve, reject) {
        container.focus();
        var contentWindow = container.contentWindow;
        if (!contentWindow)
            return reject(new Error('Not found window'));
        if (isIE()) {
            try {
                contentWindow.document.execCommand('print', false);
            }
            catch (_a) {
                contentWindow.print();
            }
        }
        else {
            contentWindow.print();
        }
        bindOnceEvent(contentWindow, 'afterprint', function () {
            resolve();
            contentWindow.close();
            removeNode(container);
        });
    });
};
var lightPrint = function (containerOrSelector, options) {
    if (options === void 0) { options = {}; }
    return __awaiter(void 0, void 0, void 0, function () {
        var dom, container, printDocument, styleNode;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    dom = getNode(containerOrSelector);
                    if (!dom)
                        throw new Error('Invalid HTML element');
                    return [4, loadContainer(options.documentTitle)];
                case 1:
                    container = _a.sent();
                    printDocument = getDocument(container);
                    if (!printDocument)
                        throw new Error('Not found document');
                    setDocumentZoom(printDocument, options.zoom);
                    if (options.mediaPrintStyle) {
                        styleNode = createStyleNode(options.mediaPrintStyle);
                        appendNode(printDocument.head, styleNode);
                    }
                    appendNode(printDocument.body, importNode(printDocument, dom));
                    cloneDocumentStyle(printDocument, dom);
                    return [4, performPrint(container)];
                case 2:
                    _a.sent();
                    return [2];
            }
        });
    });
};

export default lightPrint;
