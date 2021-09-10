"use strict";
/*
 * Copyright 2020 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.convertGuidToService = exports.convertGuidFromService = exports.getNodeConverter = exports.initNodeConverters = exports.testOverrideConverters = void 0;
const en_core_entity_types_1 = require("en-core-entity-types");
const BetaFeatureConverter_1 = require("./BetaFeatureConverter");
const InvitationConverter_1 = require("./InvitationConverter");
const LocalEntityConverter_1 = require("./LocalEntityConverter");
const MembershipConverter_1 = require("./MembershipConverter");
const MessageConverter_1 = require("./MessageConverter");
const NotebookConverter_1 = require("./NotebookConverter");
const NoteConverter_1 = require("./NoteConverter");
const ProfileConverter_1 = require("./ProfileConverter");
const PromotionConverter_1 = require("./PromotionConverter");
const ResourceConverter_1 = require("./ResourceConverter");
const SavedSearchConverter_1 = require("./SavedSearchConverter");
const ShortcutConverter_1 = require("./ShortcutConverter");
const StackConverter_1 = require("./StackConverter");
const TagConverter_1 = require("./TagConverter");
const ThreadConverter_1 = require("./ThreadConverter");
const UserConverter_1 = require("./UserConverter");
const WorkspaceConverter_1 = require("./WorkspaceConverter");
let gNodeConverters;
function testOverrideConverters(nodeConverters) {
    const oldConverters = gNodeConverters;
    gNodeConverters = nodeConverters;
    return () => {
        gNodeConverters = oldConverters;
    };
}
exports.testOverrideConverters = testOverrideConverters;
function initNodeConverters(localEntities, activateLESMode) {
    gNodeConverters = {
        Attachment: ResourceConverter_1.ResourceConverter,
        BetaFeature: BetaFeatureConverter_1.BetaFeatureConverter,
        Invitation: InvitationConverter_1.InvitationConverter,
        Membership: MembershipConverter_1.MembershipConverter,
        Message: MessageConverter_1.MessageConverter,
        Note: NoteConverter_1.NoteConverter,
        Notebook: NotebookConverter_1.NotebookConverter,
        Profile: ProfileConverter_1.ProfileConverter,
        Promotion: PromotionConverter_1.PromotionConverter,
        SavedSearch: activateLESMode ? null : SavedSearchConverter_1.SavedSearchConverter,
        Shortcut: ShortcutConverter_1.ShortcutConverter,
        Stack: StackConverter_1.StackConverter,
        Tag: TagConverter_1.TagConverter,
        Thread: ThreadConverter_1.ThreadConverter,
        Workspace: WorkspaceConverter_1.WorkspaceConverter,
        User: UserConverter_1.UserConverter,
    };
    localEntities === null || localEntities === void 0 ? void 0 : localEntities.forEach(type => {
        gNodeConverters[type] = new LocalEntityConverter_1.LocalEntitiyConverterClass(type);
    });
}
exports.initNodeConverters = initNodeConverters;
function getNodeConverter(nodeType) {
    var _a;
    if (!gNodeConverters) {
        initNodeConverters();
    }
    return (_a = gNodeConverters[nodeType]) !== null && _a !== void 0 ? _a : null;
}
exports.getNodeConverter = getNodeConverter;
function convertGuidFromService(guid, type, source) {
    if (type === en_core_entity_types_1.CoreEntityTypes.Profile) {
        if (!source) {
            throw new Error('Must provide a source type for converting Profile guids');
        }
        return ProfileConverter_1.convertProfileGuidFromService(source, String(guid));
    }
    if (type === en_core_entity_types_1.CoreEntityTypes.User) {
        throw new Error('TUserID cannot be converted from service');
    }
    const converter = getNodeConverter(type);
    if (!converter) {
        return String(guid);
    }
    return converter.convertGuidFromService(String(guid));
}
exports.convertGuidFromService = convertGuidFromService;
function convertGuidToService(nodeID, type) {
    const converter = getNodeConverter(type);
    if (!converter) {
        return nodeID;
    }
    const guid = converter.convertGuidToService(nodeID);
    if (type === en_core_entity_types_1.CoreEntityTypes.User) {
        throw new Error('User nodeID cannot be converted to service');
    }
    return guid;
}
exports.convertGuidToService = convertGuidToService;
//# sourceMappingURL=Converters.js.map