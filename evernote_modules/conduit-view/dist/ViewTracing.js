"use strict";
/*!
 * Copyright 2020 Evernote Corporation. All rights reserved.
 *
 * Credit A lot of the monkey-patching code here is cribbed from the https://github.com/welldone-software/why-did-you-render package.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.traceUserEvent = exports.markUserEvent = exports.enableReactTracing = exports.getHookOwnerUnstable = exports.viewTracingContext = void 0;
const conduit_utils_1 = require("conduit-utils");
const React = require('react'); // tslint:disable-line:no-var-requires
exports.viewTracingContext = conduit_utils_1.createTraceContext('UserEvent');
const gTracePool = new conduit_utils_1.AsyncTracePool('UserEvent');
const UNKNOWN_DISPLAY_NAME = '<unknown>';
// copied from packages/shared/ReactSymbols.js in https://github.com/facebook/react
const hasSymbol = typeof Symbol === 'function' && Symbol.for;
const REACT_MEMO_TYPE = hasSymbol ? Symbol.for('react.memo') : 0xead3;
const REACT_FORWARD_REF_TYPE = hasSymbol ? Symbol.for('react.forward_ref') : 0xead0;
function assignDefaults(target, def) {
    for (const key in def) {
        if (def.hasOwnProperty(key) && !target.hasOwnProperty(key)) {
            target[key] = def[key];
        }
    }
}
function isReactClassComponent(Component) {
    return Component.prototype && !!Component.prototype.isReactComponent;
}
function isMemoComponent(Component) {
    return Component.$$typeof === REACT_MEMO_TYPE;
}
function isForwardRefComponent(Component) {
    return Component.$$typeof === REACT_FORWARD_REF_TYPE;
}
function patchClassComponent(ClassComponent, displayName) {
    const eventName = `${displayName}.render`;
    class PatchedClassComponent extends ClassComponent {
        constructor(props, context) {
            super(props, context);
            const origRender = super.render || this.render;
            // this probably means render is an arrow function or this.render.bind(this) was called on the original class
            const renderIsABindedFunction = origRender !== ClassComponent.prototype.render;
            if (renderIsABindedFunction) {
                this.render = () => {
                    PatchedClassComponent.prototype.render.apply(this);
                    return origRender();
                };
            }
        }
        render() {
            conduit_utils_1.traceEventStart(exports.viewTracingContext, eventName);
            const ret = super.render ? super.render() : null;
            conduit_utils_1.traceEventEnd(exports.viewTracingContext, eventName);
            return ret;
        }
    }
    try {
        PatchedClassComponent.displayName = displayName;
    }
    catch (e) {
        // not crucial if displayName couldn't be set
    }
    assignDefaults(PatchedClassComponent, ClassComponent);
    return PatchedClassComponent;
}
function getFunctionalComponentFromStringComponent(componentTypeStr) {
    return props => (React.createElement(componentTypeStr, props));
}
function patchFunctionalOrStrComponent(FunctionalOrStringComponent, isPure, displayName) {
    const eventName = `${displayName}.render`;
    const FunctionalComponent = typeof FunctionalOrStringComponent === 'string' ?
        getFunctionalComponentFromStringComponent(FunctionalOrStringComponent) :
        FunctionalOrStringComponent;
    function PatchedFunctionalComponent() {
        conduit_utils_1.traceEventStart(exports.viewTracingContext, eventName);
        const ret = FunctionalComponent(...arguments);
        conduit_utils_1.traceEventEnd(exports.viewTracingContext, eventName);
        return ret;
    }
    try {
        PatchedFunctionalComponent.displayName = displayName;
    }
    catch (e) {
        // not crucial if displayName couldn't be set
    }
    PatchedFunctionalComponent.ComponentForHooksTracking = FunctionalComponent;
    assignDefaults(PatchedFunctionalComponent, FunctionalComponent);
    return PatchedFunctionalComponent;
}
function patchMemoComponent(MemoComponent, displayName) {
    const { type: InnerMemoComponent } = MemoComponent;
    const isInnerMemoComponentAClassComponent = isReactClassComponent(InnerMemoComponent);
    const isInnerMemoComponentForwardRefs = isForwardRefComponent(InnerMemoComponent);
    const isInnerMemoComponentAnotherMemoComponent = isMemoComponent(InnerMemoComponent);
    const WrappedFunctionalComponent = isInnerMemoComponentForwardRefs ?
        InnerMemoComponent.render :
        InnerMemoComponent;
    const PatchedInnerComponent = isInnerMemoComponentAClassComponent ?
        patchClassComponent(WrappedFunctionalComponent, displayName) :
        (isInnerMemoComponentAnotherMemoComponent ?
            patchMemoComponent(WrappedFunctionalComponent, displayName) :
            patchFunctionalOrStrComponent(WrappedFunctionalComponent, true, displayName));
    try {
        PatchedInnerComponent.displayName = getDisplayName(WrappedFunctionalComponent);
    }
    catch (e) {
        // not crucial if displayName couldn't be set
    }
    PatchedInnerComponent.ComponentForHooksTracking = MemoComponent;
    assignDefaults(PatchedInnerComponent, WrappedFunctionalComponent);
    const patchedMemoizedFunctionalComponent = React.memo(isInnerMemoComponentForwardRefs ? React.forwardRef(PatchedInnerComponent) : PatchedInnerComponent, MemoComponent.compare);
    try {
        patchedMemoizedFunctionalComponent.displayName = displayName;
    }
    catch (e) {
        // not crucial if displayName couldn't be set
    }
    assignDefaults(patchedMemoizedFunctionalComponent, MemoComponent);
    return patchedMemoizedFunctionalComponent;
}
function getDisplayName(type) {
    if (!type) {
        return UNKNOWN_DISPLAY_NAME;
    }
    return (type.displayName ||
        type.name ||
        (type.type && getDisplayName(type.type)) ||
        (type.render && getDisplayName(type.render)) ||
        (typeof type === 'string' ? type : undefined) ||
        UNKNOWN_DISPLAY_NAME);
}
// call this from within a hook to get the name of the calling React component; unstable because it uses react internals
function getHookOwnerUnstable() {
    const ComponentHookDispatchedFromInstance = React.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.ReactCurrentOwner.current;
    if (!ComponentHookDispatchedFromInstance) {
        return UNKNOWN_DISPLAY_NAME;
    }
    const Component = ComponentHookDispatchedFromInstance.type.ComponentForHooksTracking || ComponentHookDispatchedFromInstance.type;
    return getDisplayName(Component);
}
exports.getHookOwnerUnstable = getHookOwnerUnstable;
function createPatchedComponent(Component, displayName) {
    if (isMemoComponent(Component)) {
        return patchMemoComponent(Component, displayName);
    }
    if (isForwardRefComponent(Component)) {
        return Component;
    }
    if (isReactClassComponent(Component)) {
        return patchClassComponent(Component, displayName);
    }
    return patchFunctionalOrStrComponent(Component, false, displayName);
}
function getPatchedComponent(componentsMap, Component, displayName) {
    if (componentsMap.has(Component)) {
        return componentsMap.get(Component);
    }
    const patchedComponent = createPatchedComponent(Component, displayName);
    componentsMap.set(Component, patchedComponent);
    return patchedComponent;
}
// monkey patches React to wrap render calls in trace events; not free so only run in profile mode, and make sure to do so before rendering anything
function enableReactTracing() {
    if (React.__CONDUIT_PATCHED__) {
        // already patched
        return;
    }
    const origCreateElement = React.createElement;
    const origCreateFactory = React.createFactory;
    const componentsMap = new WeakMap();
    React.createElement = (componentNameOrComponent, ...rest) => {
        try {
            if (typeof componentNameOrComponent === 'function' ||
                isMemoComponent(componentNameOrComponent) ||
                isForwardRefComponent(componentNameOrComponent)) {
                const displayName = getDisplayName(componentNameOrComponent);
                componentNameOrComponent = getPatchedComponent(componentsMap, componentNameOrComponent, displayName);
            }
        }
        catch (e) {
            conduit_utils_1.logger.warn('ReactTracing error.', e, componentNameOrComponent);
        }
        return origCreateElement.apply(React, [componentNameOrComponent, ...rest]);
    };
    Object.assign(React.createElement, origCreateElement);
    React.createFactory = type => {
        const factory = React.createElement.bind(null, type);
        factory.type = type;
        return factory;
    };
    Object.assign(React.createFactory, origCreateFactory);
    React.__CONDUIT_PATCHED__ = true;
}
exports.enableReactTracing = enableReactTracing;
// convenience function for client code to trace user events (button press, gesture, etc)
function markUserEvent(eventName) {
    conduit_utils_1.traceMarker(exports.viewTracingContext, 'User.' + eventName);
}
exports.markUserEvent = markUserEvent;
async function traceUserEvent(eventName, loggedFields, tracedFunc) {
    return await gTracePool.runTraced(null, async (trc) => {
        conduit_utils_1.traceEventStart(trc, eventName, loggedFields);
        return conduit_utils_1.traceEventEndWhenSettled(trc, eventName, tracedFunc(trc));
    });
}
exports.traceUserEvent = traceUserEvent;
//# sourceMappingURL=ViewTracing.js.map