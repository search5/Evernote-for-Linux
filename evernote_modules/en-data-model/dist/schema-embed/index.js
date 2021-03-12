"use strict";
/*
 * Copywrite 2020-present Evernote Coporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.SchemaArray = exports.SchemaMap = void 0;
exports.SchemaMap = {
    "AgentID.schema.json": {
        "$id": "AgentID.schema.json",
        "$schema": "http://json-schema.org/draft-07/schema#",
        "title": "AgentID",
        "type": "string",
        "nominal": "AgentID",
        "default": ""
    },
    "AgentRef.schema.json": {
        "$id": "AgentRef.schema.json",
        "$schema": "http://json-schema.org/draft-07/schema#",
        "title": "AgentRef",
        "type": "object",
        "properties": {
            "id": {
                "$ref": "AgentID.schema.json",
                "default": ""
            },
            "type": {
                "$ref": "AgentType.schema.json",
                "default": 0
            }
        },
        "required": [
            "id",
            "type"
        ],
        "default": {
            "id": "",
            "type": 0
        }
    },
    "AgentType.schema.json": {
        "$id": "AgentType.schema.json",
        "$schema": "http://json-schema.org/draft-07/schema#",
        "title": "AgentType",
        "type": "integer",
        "enum": [
            0,
            1,
            2,
            3,
            4
        ],
        "tsEnumNames": [
            "PUBLIC",
            "IDENTITY",
            "USER",
            "BUSINESS",
            "FAMILY"
        ],
        "default": 0
    },
    "AssociationConstraint.schema.json": {
        "$id": "AssociationConstraint.schema.json",
        "$schema": "http://json-schema.org/draft-07/schema#",
        "title": "AssociationConstraint",
        "type": "integer",
        "enum": [
            0,
            1,
            2
        ],
        "tsEnumNames": [
            "OPTIONAL",
            "REQUIRED",
            "MULTI"
        ],
        "default": 0
    },
    "AssociationRef.schema.json": {
        "$id": "AssociationRef.schema.json",
        "$schema": "http://json-schema.org/draft-07/schema#",
        "title": "AssociationRef",
        "type": "object",
        "properties": {
            "type": {
                "$ref": "AssociationType.schema.json",
                "default": 0
            },
            "src": {
                "$ref": "EntityRef.schema.json",
                "default": {
                    "type": "",
                    "id": ""
                }
            },
            "dst": {
                "$ref": "EntityRef.schema.json",
                "default": {
                    "type": "",
                    "id": ""
                }
            }
        },
        "required": [
            "type",
            "src",
            "dst"
        ],
        "default": {
            "type": 0,
            "src": {
                "type": "",
                "id": ""
            },
            "dst": {
                "type": "",
                "id": ""
            }
        }
    },
    "AssociationType.schema.json": {
        "$id": "AssociationType.schema.json",
        "$schema": "http://json-schema.org/draft-07/schema#",
        "title": "AssociationType",
        "description": "0 => FULL PERMISSION GRANTING\n1 => SOFT LINK. NOT PERMISSION GRANTING\n2 => Restricts to view permission for associated entities. Used for Note -> Tag association",
        "type": "integer",
        "enum": [
            0,
            1,
            2
        ],
        "tsEnumNames": [
            "ANCESTRY",
            "LINK",
            "VIEW"
        ],
        "default": 0
    },
    "BlobRef.schema.json": {
        "$id": "BlobRef.schema.json",
        "$schema": "http://json-schema.org/draft-07/schema#",
        "title": "BlobRef",
        "type": "object",
        "properties": {
            "hash": {
                "type": "string",
                "default": ""
            },
            "size": {
                "type": "integer",
                "default": 0
            },
            "path": {
                "type": "string",
                "description": "Path into various Evernote systems like FileService; use empty string and size 0 for an empty BlobRef.",
                "default": ""
            }
        },
        "required": [
            "hash",
            "size",
            "path"
        ],
        "default": {
            "hash": "",
            "size": 0,
            "path": ""
        }
    },
    "BoardMimeType.schema.json": {
        "$id": "BoardMimeType.schema.json",
        "$schema": "http://json-schema.org/draft-07/schema#",
        "title": "BoardMimeType",
        "type": "string",
        "enum": [
            "image/jpeg",
            "image/png",
            "image/webp"
        ],
        "tsEnumNames": [
            "Jpeg",
            "Png",
            "Webp"
        ],
        "default": ""
    },
    "BoardType.schema.json": {
        "$id": "BoardType.schema.json",
        "$schema": "http://json-schema.org/draft-07/schema#",
        "title": "BoardType",
        "type": "string",
        "enum": [
            "Home"
        ],
        "tsEnumNames": [
            "Home"
        ],
        "default": ""
    },
    "ConditionalDirective.schema.json": {
        "$id": "ConditionalDirective.schema.json",
        "$schema": "http://json-schema.org/draft-07/schema#",
        "title": "ConditionalDirective",
        "type": "string",
        "enum": [
            "GT",
            "GTE",
            "LT",
            "LTE",
            "EQ",
            "!EQ",
            "INCLUDES",
            "!INCLUDES",
            "EXISTS",
            "!EXISTS"
        ],
        "default": ""
    },
    "DeclarativeConditionalExpr.schema.json": {
        "$id": "DeclarativeConditionalExpr.schema.json",
        "$schema": "http://json-schema.org/draft-07/schema#",
        "title": "DeclarativeConditionalExpr",
        "type": "object",
        "properties": {
            "value1": {
                "$ref": "FieldValueRef.schema.json",
                "default": {
                    "field": ""
                }
            },
            "directive": {
                "$ref": "ConditionalDirective.schema.json",
                "default": ""
            },
            "value2": {
                "oneOf": [
                    {
                        "$ref": "DirectValueRef.schema.json"
                    },
                    {
                        "$ref": "FieldValueRef.schema.json"
                    }
                ]
            }
        },
        "required": [
            "value1",
            "directive",
            "value2"
        ],
        "default": {
            "value1": {
                "field": ""
            },
            "directive": ""
        }
    },
    "DeclarativeExpr.schema.json": {
        "$id": "DeclarativeExpr.schema.json",
        "$schema": "http://json-schema.org/draft-07/schema#",
        "title": "DeclarativeExpr",
        "oneOf": [
            {
                "$ref": "DeclarativeConditionalExpr.schema.json"
            }
        ]
    },
    "DirectValueRef.schema.json": {
        "$id": "DirectValueRef.schema.json",
        "$schema": "http://json-schema.org/draft-07/schema#",
        "title": "DirectValueRef",
        "type": "object",
        "properties": {
            "value": {
                "tsType": "any"
            }
        },
        "required": [
            "value"
        ],
        "default": {}
    },
    "EntityID.schema.json": {
        "$id": "EntityID.schema.json",
        "$schema": "http://json-schema.org/draft-07/schema#",
        "title": "EntityID",
        "type": "string",
        "nominal": "EntityID",
        "default": ""
    },
    "EntityRef.schema.json": {
        "$id": "EntityRef.schema.json",
        "$schema": "http://json-schema.org/draft-07/schema#",
        "title": "EntityRef",
        "type": "object",
        "properties": {
            "type": {
                "$ref": "EntityType.schema.json",
                "default": ""
            },
            "id": {
                "$ref": "EntityID.schema.json",
                "default": ""
            }
        },
        "required": [
            "type",
            "id"
        ],
        "default": {
            "type": "",
            "id": ""
        }
    },
    "EntityType.schema.json": {
        "$id": "EntityType.schema.json",
        "$schema": "http://json-schema.org/draft-07/schema#",
        "title": "EntityType",
        "type": "string",
        "enum": [
            "Attachment",
            "Board",
            "Note",
            "Notebook",
            "PinnedContent",
            "SavedSearch",
            "Shortcut",
            "Stack",
            "Tag",
            "Widget",
            "WidgetContentConflict",
            "Workspace"
        ],
        "tsEnumNames": [
            "Attachment",
            "Board",
            "Note",
            "Notebook",
            "PinnedContent",
            "SavedSearch",
            "Shortcut",
            "Stack",
            "Tag",
            "Widget",
            "WidgetContentConflict",
            "Workspace"
        ],
        "default": ""
    },
    "FieldValueRef.schema.json": {
        "$id": "FieldValueRef.schema.json",
        "$schema": "http://json-schema.org/draft-07/schema#",
        "title": "FieldValueRef",
        "type": "object",
        "properties": {
            "field": {
                "type": "string",
                "default": ""
            }
        },
        "required": [
            "field"
        ],
        "default": {
            "field": ""
        }
    },
    "MembershipRef.schema.json": {
        "$id": "MembershipRef.schema.json",
        "$schema": "http://json-schema.org/draft-07/schema#",
        "title": "MembershipRef",
        "type": "object",
        "properties": {
            "type": {
                "$ref": "MembershipType.schema.json",
                "default": 0
            },
            "recipient": {
                "$ref": "AgentRef.schema.json",
                "default": {
                    "id": "",
                    "type": 0
                }
            },
            "entity": {
                "$ref": "EntityRef.schema.json",
                "default": {
                    "type": "",
                    "id": ""
                }
            }
        },
        "required": [
            "type",
            "recipient",
            "entity",
            "role"
        ],
        "default": {
            "type": 0,
            "recipient": {
                "id": "",
                "type": 0
            },
            "entity": {
                "type": "",
                "id": ""
            }
        }
    },
    "MembershipRole.schema.json": {
        "$id": "MembershipRole.schema.json",
        "$schema": "http://json-schema.org/draft-07/schema#",
        "title": "MembershipRole",
        "type": "integer",
        "enum": [
            "NULL",
            "VIEWER",
            "COMMENTER",
            "EDITOR",
            "EDITOR_SHARER",
            "ADMIN",
            "OWNER",
            "ACTIVITY_VIEWER"
        ],
        "tsEnumNames": [
            "NULL",
            "VIEWER",
            "COMMENTER",
            "EDITOR",
            "EDITOR_SHARER",
            "ADMIN",
            "OWNER",
            "ACTIVITY_VIEWER"
        ],
        "default": 0
    },
    "MembershipType.schema.json": {
        "$id": "MembershipType.schema.json",
        "$schema": "http://json-schema.org/draft-07/schema#",
        "title": "MembershipType",
        "type": "integer",
        "enum": [
            0,
            1
        ],
        "tsEnumNames": [
            "INVITATION",
            "SHARE"
        ],
        "default": 0
    },
    "ShortcutTargetRef.schema.json": {
        "$id": "ShortcutTargetRef.schema.json",
        "$schema": "http://json-schema.org/draft-07/schema#",
        "title": "ShortcutTargetRef",
        "type": "object",
        "properties": {
            "type": {
                "$ref": "ShortcutTargetType.schema.json",
                "default": ""
            },
            "id": {
                "$ref": "EntityID.schema.json",
                "default": ""
            }
        },
        "required": [
            "type",
            "id"
        ],
        "default": {
            "type": "",
            "id": ""
        }
    },
    "ShortcutTargetType.schema.json": {
        "$id": "ShortcutTargetType.schema.json",
        "$schema": "http://json-schema.org/draft-07/schema#",
        "title": "ShortcutTargetType",
        "type": "string",
        "enum": [
            "Workspace",
            "Notebook",
            "Note",
            "Stack",
            "Tag",
            "SavedSearch"
        ],
        "tsEnumNames": [
            "Workspace",
            "Notebook",
            "Note",
            "Stack",
            "Tag",
            "SavedSearch"
        ],
        "default": ""
    },
    "TraversalDir.schema.json": {
        "$id": "TraversalDir.schema.json",
        "$schema": "http://json-schema.org/draft-07/schema#",
        "title": "TraversalDir",
        "type": "integer",
        "enum": [
            0,
            1
        ],
        "tsEnumNames": [
            "DOWN",
            "UP"
        ],
        "default": 0
    },
    "UserID.schema.json": {
        "$id": "UserID.schema.json",
        "$schema": "http://json-schema.org/draft-07/schema#",
        "type": "number",
        "nominal": "UserID",
        "default": 0
    },
    "WidgetFormFactor.schema.json": {
        "$id": "WidgetFormFactor.schema.json",
        "$schema": "http://json-schema.org/draft-07/schema#",
        "title": "WidgetFormFactor",
        "type": "object",
        "properties": {
            "sortWeight": {
                "type": "string",
                "default": ""
            },
            "width": {
                "type": "integer",
                "minimum": 0,
                "default": 0
            },
            "height": {
                "type": "integer",
                "minimum": 0,
                "default": 0
            },
            "panelKey": {
                "type": "string"
            }
        },
        "required": [
            "sortWeight",
            "width",
            "height"
        ],
        "additionalProperties": false,
        "default": {
            "sortWeight": "",
            "width": 0,
            "height": 0
        }
    },
    "WidgetSelectedTab.schema.json": {
        "$id": "WidgetSelectedTab.schema.json",
        "$schema": "http://json-schema.org/draft-07/schema#",
        "title": "WidgetSelectedTab",
        "type": "string",
        "enum": [
            "WebClips",
            "Audio",
            "Emails",
            "Images",
            "Documents",
            "Recent",
            "Suggested"
        ],
        "tsEnumNames": [
            "WebClips",
            "Audio",
            "Emails",
            "Images",
            "Documents",
            "Recent",
            "Suggested"
        ],
        "default": ""
    },
    "WidgetType.schema.json": {
        "$id": "WidgetType.schema.json",
        "$schema": "http://json-schema.org/draft-07/schema#",
        "title": "WidgetType",
        "type": "string",
        "enum": [
            "Tags",
            "Shortcuts",
            "Pinned",
            "OnboardingChecklist",
            "ScratchPad",
            "Notes",
            "Notebooks",
            "Clipped",
            "Calendar",
            "Tasks"
        ],
        "tsEnumNames": [
            "Tags",
            "Shortcuts",
            "Pinned",
            "OnboardingChecklist",
            "ScratchPad",
            "Notes",
            "Notebooks",
            "Clipped",
            "Calendar",
            "Tasks"
        ],
        "default": ""
    },
    "WorkspaceLayoutStyle.schema.json": {
        "$id": "WorkspaceLayoutStyle.schema.json",
        "$schema": "http://json-schema.org/draft-07/schema#",
        "title": "WorkspaceLayoutStyle",
        "type": "string",
        "enum": [
            "LIST",
            "BOARD"
        ],
        "tsEnumNames": [
            "LIST",
            "BOARD"
        ],
        "default": ""
    },
    "WorkspaceType.schema.json": {
        "$id": "WorkspaceType.schema.json",
        "$schema": "http://json-schema.org/draft-07/schema#",
        "title": "WorkspaceType",
        "type": "string",
        "enum": [
            "INVITE_ONLY",
            "DISCOVERABLE",
            "OPEN"
        ],
        "tsEnumNames": [
            "INVITE_ONLY",
            "DISCOVERABLE",
            "OPEN"
        ],
        "default": ""
    },
    "AttachmentEntity.schema.json": {
        "$id": "AttachmentEntity.schema.json",
        "$schema": "http://json-schema.org/draft-07/schema#",
        "title": "AttachmentEntity",
        "allOf": [
            {
                "$ref": "Entity.schema.json",
                "default": {
                    "acl": [],
                    "version": 0,
                    "shard": 0,
                    "owner": 0,
                    "created": 0,
                    "updated": 0,
                    "deleted": null,
                    "type": "",
                    "id": "",
                    "creator": 0,
                    "lastEditor": 0,
                    "label": ""
                }
            },
            {
                "type": "object",
                "properties": {
                    "isActive": {
                        "type": "boolean",
                        "default": false
                    },
                    "mime": {
                        "type": "string",
                        "default": ""
                    },
                    "width": {
                        "type": "integer",
                        "default": 0
                    },
                    "height": {
                        "type": "integer",
                        "default": 0
                    },
                    "filename": {
                        "type": "string",
                        "default": ""
                    },
                    "applicationDataKeys": {
                        "type": "array",
                        "items": {
                            "type": "string"
                        },
                        "default": []
                    },
                    "data": {
                        "$ref": "BlobRef.schema.json",
                        "default": {
                            "hash": "",
                            "size": 0,
                            "path": ""
                        }
                    },
                    "recognition": {
                        "$ref": "BlobRef.schema.json",
                        "default": {
                            "hash": "",
                            "size": 0,
                            "path": ""
                        }
                    },
                    "alternateData": {
                        "$ref": "BlobRef.schema.json",
                        "default": {
                            "hash": "",
                            "size": 0,
                            "path": ""
                        }
                    }
                },
                "required": [
                    "isActive",
                    "mime",
                    "width",
                    "height",
                    "filename",
                    "applicationDataKeys",
                    "data",
                    "recognition",
                    "alternateData"
                ],
                "default": {
                    "isActive": false,
                    "mime": "",
                    "width": 0,
                    "height": 0,
                    "filename": "",
                    "applicationDataKeys": [],
                    "data": {
                        "hash": "",
                        "size": 0,
                        "path": ""
                    },
                    "recognition": {
                        "hash": "",
                        "size": 0,
                        "path": ""
                    },
                    "alternateData": {
                        "hash": "",
                        "size": 0,
                        "path": ""
                    }
                }
            }
        ],
        "default": {
            "acl": [],
            "version": 0,
            "shard": 0,
            "owner": 0,
            "created": 0,
            "updated": 0,
            "deleted": null,
            "type": "",
            "id": "",
            "creator": 0,
            "lastEditor": 0,
            "label": "",
            "isActive": false,
            "mime": "",
            "width": 0,
            "height": 0,
            "filename": "",
            "applicationDataKeys": [],
            "data": {
                "hash": "",
                "size": 0,
                "path": ""
            },
            "recognition": {
                "hash": "",
                "size": 0,
                "path": ""
            },
            "alternateData": {
                "hash": "",
                "size": 0,
                "path": ""
            }
        }
    },
    "BoardEntity.schema.json": {
        "$id": "BoardEntity.schema.json",
        "$schema": "http://json-schema.org/draft-07/schema#",
        "title": "BoardEntity",
        "allOf": [
            {
                "$ref": "Entity.schema.json",
                "default": {
                    "acl": [],
                    "version": 0,
                    "shard": 0,
                    "owner": 0,
                    "created": 0,
                    "updated": 0,
                    "deleted": null,
                    "type": "",
                    "id": "",
                    "creator": 0,
                    "lastEditor": 0,
                    "label": ""
                }
            },
            {
                "type": "object",
                "properties": {
                    "boardType": {
                        "$ref": "BoardType.schema.json",
                        "default": ""
                    },
                    "freeTrialExpiration": {
                        "$ref": "timestamp.schema.json"
                    },
                    "headerBG": {
                        "$ref": "BlobRef.schema.json",
                        "default": {
                            "hash": "",
                            "size": 0,
                            "path": ""
                        }
                    },
                    "headerBGMime": {
                        "$ref": "BoardMimeType.schema.json"
                    },
                    "headerBGFileName": {
                        "type": "string"
                    },
                    "headerBGPreviousUpload": {
                        "$ref": "BlobRef.schema.json",
                        "default": {
                            "hash": "",
                            "size": 0,
                            "path": ""
                        }
                    },
                    "headerBGPreviousUploadMime": {
                        "$ref": "BoardMimeType.schema.json"
                    },
                    "headerBGPreviousUploadFileName": {
                        "type": "string"
                    },
                    "mobile": {
                        "type": "object",
                        "properties": {
                            "layout": {
                                "type": "string",
                                "enum": [
                                    "SingleColumnStack"
                                ],
                                "default": ""
                            }
                        },
                        "required": [
                            "layout"
                        ],
                        "default": {
                            "layout": ""
                        }
                    },
                    "desktop": {
                        "type": "object",
                        "properties": {
                            "layout": {
                                "type": "string",
                                "enum": [
                                    "ThreeColumnFlex"
                                ],
                                "default": ""
                            }
                        },
                        "required": [
                            "layout"
                        ],
                        "default": {
                            "layout": ""
                        }
                    },
                    "calendarVersion": {
                        "type": "integer"
                    },
                    "tasksVersion": {
                        "type": "integer"
                    }
                },
                "required": [
                    "boardType",
                    "headerBG",
                    "headerBGPreviousUpload",
                    "mobile",
                    "desktop"
                ],
                "default": {
                    "boardType": "",
                    "headerBG": {
                        "hash": "",
                        "size": 0,
                        "path": ""
                    },
                    "headerBGPreviousUpload": {
                        "hash": "",
                        "size": 0,
                        "path": ""
                    },
                    "mobile": {
                        "layout": ""
                    },
                    "desktop": {
                        "layout": ""
                    }
                }
            }
        ],
        "default": {
            "acl": [],
            "version": 0,
            "shard": 0,
            "owner": 0,
            "created": 0,
            "updated": 0,
            "deleted": null,
            "type": "",
            "id": "",
            "creator": 0,
            "lastEditor": 0,
            "label": "",
            "boardType": "",
            "headerBG": {
                "hash": "",
                "size": 0,
                "path": ""
            },
            "headerBGPreviousUpload": {
                "hash": "",
                "size": 0,
                "path": ""
            },
            "mobile": {
                "layout": ""
            },
            "desktop": {
                "layout": ""
            }
        }
    },
    "NoteEntity.schema.json": {
        "$id": "NoteEntity.schema.json",
        "$schema": "http://json-schema.org/draft-07/schema#",
        "title": "NoteEntity",
        "allOf": [
            {
                "$ref": "Entity.schema.json",
                "default": {
                    "acl": [],
                    "version": 0,
                    "shard": 0,
                    "owner": 0,
                    "created": 0,
                    "updated": 0,
                    "deleted": null,
                    "type": "",
                    "id": "",
                    "creator": 0,
                    "lastEditor": 0,
                    "label": ""
                }
            },
            {
                "type": "object",
                "properties": {
                    "isUntitled": {
                        "type": "boolean",
                        "default": false
                    },
                    "displayOrder": {
                        "$ref": "LexoRank.schema.json",
                        "default": "M"
                    },
                    "content": {
                        "$ref": "BlobRef.schema.json",
                        "default": {
                            "hash": "",
                            "size": 0,
                            "path": ""
                        }
                    },
                    "snippet": {
                        "type": "string",
                        "default": ""
                    },
                    "Attributes": {
                        "type": "object",
                        "properties": {
                            "contentClass": {
                                "oneOf": [
                                    {
                                        "type": "string"
                                    },
                                    {
                                        "type": "null"
                                    }
                                ],
                                "default": null
                            },
                            "subjectDate": {
                                "oneOf": [
                                    {
                                        "$ref": "timestamp.schema.json"
                                    },
                                    {
                                        "type": "null"
                                    }
                                ],
                                "default": null
                            },
                            "Location": {
                                "type": "object",
                                "properties": {
                                    "latitude": {
                                        "oneOf": [
                                            {
                                                "type": "integer"
                                            },
                                            {
                                                "type": "null"
                                            }
                                        ],
                                        "default": null
                                    },
                                    "longitude": {
                                        "oneOf": [
                                            {
                                                "type": "integer"
                                            },
                                            {
                                                "type": "null"
                                            }
                                        ],
                                        "default": null
                                    },
                                    "altitude": {
                                        "oneOf": [
                                            {
                                                "type": "integer"
                                            },
                                            {
                                                "type": "null"
                                            }
                                        ],
                                        "default": null
                                    }
                                },
                                "required": [
                                    "latitude",
                                    "longitude",
                                    "altitude"
                                ],
                                "default": {
                                    "latitude": null,
                                    "longitude": null,
                                    "altitude": null
                                }
                            },
                            "Reminder": {
                                "type": "object",
                                "properties": {
                                    "reminderOrder": {
                                        "oneOf": [
                                            {
                                                "$ref": "timestamp.schema.json"
                                            },
                                            {
                                                "type": "null"
                                            }
                                        ],
                                        "default": null
                                    },
                                    "reminderDoneTime": {
                                        "oneOf": [
                                            {
                                                "$ref": "timestamp.schema.json"
                                            },
                                            {
                                                "type": "null"
                                            }
                                        ],
                                        "default": null
                                    },
                                    "reminderTime": {
                                        "oneOf": [
                                            {
                                                "$ref": "timestamp.schema.json"
                                            },
                                            {
                                                "type": "null"
                                            }
                                        ],
                                        "default": null
                                    }
                                },
                                "required": [
                                    "reminderOrder",
                                    "reminderDoneTime",
                                    "reminderTime"
                                ],
                                "default": {
                                    "reminderOrder": null,
                                    "reminderDoneTime": null,
                                    "reminderTime": null
                                }
                            },
                            "Share": {
                                "type": "object",
                                "properties": {
                                    "shareDate": {
                                        "oneOf": [
                                            {
                                                "$ref": "timestamp.schema.json"
                                            },
                                            {
                                                "type": "null"
                                            }
                                        ],
                                        "default": null
                                    },
                                    "sharedWithBusiness": {
                                        "oneOf": [
                                            {
                                                "type": "boolean"
                                            },
                                            {
                                                "type": "null"
                                            }
                                        ],
                                        "default": null
                                    }
                                },
                                "required": [
                                    "shareDate",
                                    "sharedWithBusiness"
                                ],
                                "default": {
                                    "shareDate": null,
                                    "sharedWithBusiness": null
                                }
                            },
                            "Editor": {
                                "type": "object",
                                "description": "these are user-friendly strings, the names of the author/lastEditor (though some clients may allow manually editing these!)",
                                "properties": {
                                    "author": {
                                        "oneOf": [
                                            {
                                                "type": "string"
                                            },
                                            {
                                                "type": "null"
                                            }
                                        ],
                                        "default": null
                                    },
                                    "lastEditedBy": {
                                        "oneOf": [
                                            {
                                                "type": "string"
                                            },
                                            {
                                                "type": "null"
                                            }
                                        ],
                                        "default": null
                                    }
                                },
                                "required": [
                                    "author",
                                    "lastEditedBy"
                                ],
                                "default": {
                                    "author": null,
                                    "lastEditedBy": null
                                }
                            },
                            "Source": {
                                "type": "object",
                                "properties": {
                                    "source": {
                                        "oneOf": [
                                            {
                                                "type": "string"
                                            },
                                            {
                                                "type": "null"
                                            }
                                        ],
                                        "default": null
                                    },
                                    "sourceURL": {
                                        "oneOf": [
                                            {
                                                "type": "string"
                                            },
                                            {
                                                "type": "null"
                                            }
                                        ],
                                        "default": null
                                    },
                                    "sourceApplication": {
                                        "oneOf": [
                                            {
                                                "type": "string"
                                            },
                                            {
                                                "type": "null"
                                            }
                                        ],
                                        "default": null
                                    }
                                },
                                "required": [
                                    "source",
                                    "sourceURL",
                                    "sourceApplication"
                                ],
                                "default": {
                                    "source": null,
                                    "sourceURL": null,
                                    "sourceApplication": null
                                }
                            }
                        },
                        "required": [
                            "contentClass",
                            "subjectDate",
                            "Location",
                            "Reminder",
                            "Share",
                            "Editor",
                            "Source"
                        ],
                        "default": {
                            "contentClass": null,
                            "subjectDate": null,
                            "Location": {
                                "latitude": null,
                                "longitude": null,
                                "altitude": null
                            },
                            "Reminder": {
                                "reminderOrder": null,
                                "reminderDoneTime": null,
                                "reminderTime": null
                            },
                            "Share": {
                                "shareDate": null,
                                "sharedWithBusiness": null
                            },
                            "Editor": {
                                "author": null,
                                "lastEditedBy": null
                            },
                            "Source": {
                                "source": null,
                                "sourceURL": null,
                                "sourceApplication": null
                            }
                        }
                    }
                },
                "required": [
                    "isUntitled",
                    "displayOrder",
                    "content",
                    "snippet",
                    "Attributes"
                ],
                "default": {
                    "isUntitled": false,
                    "displayOrder": "M",
                    "content": {
                        "hash": "",
                        "size": 0,
                        "path": ""
                    },
                    "snippet": "",
                    "Attributes": {
                        "contentClass": null,
                        "subjectDate": null,
                        "Location": {
                            "latitude": null,
                            "longitude": null,
                            "altitude": null
                        },
                        "Reminder": {
                            "reminderOrder": null,
                            "reminderDoneTime": null,
                            "reminderTime": null
                        },
                        "Share": {
                            "shareDate": null,
                            "sharedWithBusiness": null
                        },
                        "Editor": {
                            "author": null,
                            "lastEditedBy": null
                        },
                        "Source": {
                            "source": null,
                            "sourceURL": null,
                            "sourceApplication": null
                        }
                    }
                }
            }
        ],
        "default": {
            "acl": [],
            "version": 0,
            "shard": 0,
            "owner": 0,
            "created": 0,
            "updated": 0,
            "deleted": null,
            "type": "",
            "id": "",
            "creator": 0,
            "lastEditor": 0,
            "label": "",
            "isUntitled": false,
            "displayOrder": "M",
            "content": {
                "hash": "",
                "size": 0,
                "path": ""
            },
            "snippet": "",
            "Attributes": {
                "contentClass": null,
                "subjectDate": null,
                "Location": {
                    "latitude": null,
                    "longitude": null,
                    "altitude": null
                },
                "Reminder": {
                    "reminderOrder": null,
                    "reminderDoneTime": null,
                    "reminderTime": null
                },
                "Share": {
                    "shareDate": null,
                    "sharedWithBusiness": null
                },
                "Editor": {
                    "author": null,
                    "lastEditedBy": null
                },
                "Source": {
                    "source": null,
                    "sourceURL": null,
                    "sourceApplication": null
                }
            }
        }
    },
    "NotebookEntity.schema.json": {
        "$id": "NotebookEntity.schema.json",
        "$schema": "http://json-schema.org/draft-07/schema#",
        "title": "NotebookEntity",
        "allOf": [
            {
                "$ref": "Entity.schema.json",
                "default": {
                    "acl": [],
                    "version": 0,
                    "shard": 0,
                    "owner": 0,
                    "created": 0,
                    "updated": 0,
                    "deleted": null,
                    "type": "",
                    "id": "",
                    "creator": 0,
                    "lastEditor": 0,
                    "label": ""
                }
            },
            {
                "type": "object",
                "properties": {
                    "inWorkspace": {
                        "type": "boolean",
                        "default": false
                    },
                    "isPublished": {
                        "type": "boolean",
                        "default": false
                    },
                    "displayColor": {
                        "type": "integer",
                        "default": 0
                    },
                    "displayOrder": {
                        "$ref": "LexoRank.schema.json",
                        "default": "M"
                    }
                },
                "required": [
                    "inWorkspace",
                    "isPublished",
                    "displayColor",
                    "displayOrder"
                ],
                "default": {
                    "inWorkspace": false,
                    "isPublished": false,
                    "displayColor": 0,
                    "displayOrder": "M"
                }
            }
        ],
        "default": {
            "acl": [],
            "version": 0,
            "shard": 0,
            "owner": 0,
            "created": 0,
            "updated": 0,
            "deleted": null,
            "type": "",
            "id": "",
            "creator": 0,
            "lastEditor": 0,
            "label": "",
            "inWorkspace": false,
            "isPublished": false,
            "displayColor": 0,
            "displayOrder": "M"
        }
    },
    "PinnedContentEntity.schema.json": {
        "$id": "PinnedContentEntity.schema.json",
        "$schema": "http://json-schema.org/draft-07/schema#",
        "title": "PinnedContentEntity",
        "allOf": [
            {
                "$ref": "Entity.schema.json",
                "default": {
                    "acl": [],
                    "version": 0,
                    "shard": 0,
                    "owner": 0,
                    "created": 0,
                    "updated": 0,
                    "deleted": null,
                    "type": "",
                    "id": "",
                    "creator": 0,
                    "lastEditor": 0,
                    "label": ""
                }
            },
            {
                "type": "object",
                "properties": {
                    "displayOrder": {
                        "$ref": "LexoRank.schema.json",
                        "default": "M"
                    },
                    "uri": {
                        "oneOf": [
                            {
                                "type": "string"
                            },
                            {
                                "type": "null"
                            }
                        ]
                    },
                    "target": {
                        "$ref": "EntityRef.schema.json"
                    }
                },
                "required": [
                    "displayOrder"
                ],
                "default": {
                    "displayOrder": "M"
                }
            }
        ],
        "default": {
            "acl": [],
            "version": 0,
            "shard": 0,
            "owner": 0,
            "created": 0,
            "updated": 0,
            "deleted": null,
            "type": "",
            "id": "",
            "creator": 0,
            "lastEditor": 0,
            "label": "",
            "displayOrder": "M"
        }
    },
    "SavedSearchEntity.schema.json": {
        "$id": "SavedSearchEntity.schema.json",
        "$schema": "http://json-schema.org/draft-07/schema#",
        "title": "SavedSearchEntity",
        "allOf": [
            {
                "$ref": "Entity.schema.json",
                "default": {
                    "acl": [],
                    "version": 0,
                    "shard": 0,
                    "owner": 0,
                    "created": 0,
                    "updated": 0,
                    "deleted": null,
                    "type": "",
                    "id": "",
                    "creator": 0,
                    "lastEditor": 0,
                    "label": ""
                }
            },
            {
                "type": "object",
                "properties": {
                    "query": {
                        "type": "string",
                        "default": ""
                    }
                },
                "required": [
                    "query"
                ],
                "default": {
                    "query": ""
                }
            }
        ],
        "default": {
            "acl": [],
            "version": 0,
            "shard": 0,
            "owner": 0,
            "created": 0,
            "updated": 0,
            "deleted": null,
            "type": "",
            "id": "",
            "creator": 0,
            "lastEditor": 0,
            "label": "",
            "query": ""
        }
    },
    "ShortcutEntity.schema.json": {
        "$id": "ShortcutEntity.schema.json",
        "$schema": "http://json-schema.org/draft-07/schema#",
        "title": "ShortcutEntity",
        "allOf": [
            {
                "$ref": "Entity.schema.json",
                "default": {
                    "acl": [],
                    "version": 0,
                    "shard": 0,
                    "owner": 0,
                    "created": 0,
                    "updated": 0,
                    "deleted": null,
                    "type": "",
                    "id": "",
                    "creator": 0,
                    "lastEditor": 0,
                    "label": ""
                }
            },
            {
                "type": "object",
                "properties": {
                    "target": {
                        "$ref": "ShortcutTargetRef.schema.json",
                        "default": {
                            "type": "",
                            "id": ""
                        }
                    },
                    "displayOrder": {
                        "$ref": "LexoRank.schema.json",
                        "default": "M"
                    }
                },
                "required": [
                    "target",
                    "displayOrder"
                ],
                "default": {
                    "target": {
                        "type": "",
                        "id": ""
                    },
                    "displayOrder": "M"
                }
            }
        ],
        "default": {
            "acl": [],
            "version": 0,
            "shard": 0,
            "owner": 0,
            "created": 0,
            "updated": 0,
            "deleted": null,
            "type": "",
            "id": "",
            "creator": 0,
            "lastEditor": 0,
            "label": "",
            "target": {
                "type": "",
                "id": ""
            },
            "displayOrder": "M"
        }
    },
    "StackEntity.schema.json": {
        "$id": "StackEntity.schema.json",
        "$schema": "http://json-schema.org/draft-07/schema#",
        "title": "StackEntity",
        "$ref": "Entity.schema.json",
        "default": {
            "acl": [],
            "version": 0,
            "shard": 0,
            "owner": 0,
            "created": 0,
            "updated": 0,
            "deleted": null,
            "type": "",
            "id": "",
            "creator": 0,
            "lastEditor": 0,
            "label": ""
        }
    },
    "TagEntity.schema.json": {
        "$id": "TagEntity.schema.json",
        "$schema": "http://json-schema.org/draft-07/schema#",
        "title": "TagEntity",
        "$ref": "Entity.schema.json",
        "default": {
            "acl": [],
            "version": 0,
            "shard": 0,
            "owner": 0,
            "created": 0,
            "updated": 0,
            "deleted": null,
            "type": "",
            "id": "",
            "creator": 0,
            "lastEditor": 0,
            "label": ""
        }
    },
    "WidgetContentConflictEntity.schema.json": {
        "$id": "WidgetContentConflictEntity.schema.json",
        "$schema": "http://json-schema.org/draft-07/schema#",
        "title": "WidgetContentConflictEntity",
        "allOf": [
            {
                "$ref": "Entity.schema.json",
                "default": {
                    "acl": [],
                    "version": 0,
                    "shard": 0,
                    "owner": 0,
                    "created": 0,
                    "updated": 0,
                    "deleted": null,
                    "type": "",
                    "id": "",
                    "creator": 0,
                    "lastEditor": 0,
                    "label": ""
                }
            },
            {
                "type": "object",
                "properties": {
                    "parentID": {
                        "$ref": "EntityID.schema.json",
                        "default": ""
                    },
                    "content": {
                        "type": "object",
                        "allOf": [
                            {
                                "$ref": "BlobRef.schema.json",
                                "default": {
                                    "hash": "",
                                    "size": 0,
                                    "path": ""
                                }
                            },
                            {
                                "properties": {
                                    "content": {
                                        "type": "string",
                                        "description": "The blob content",
                                        "default": ""
                                    }
                                },
                                "required": [
                                    "content"
                                ],
                                "default": {
                                    "content": ""
                                }
                            }
                        ],
                        "default": {
                            "hash": "",
                            "size": 0,
                            "path": "",
                            "content": ""
                        }
                    }
                },
                "required": [
                    "content",
                    "parentID"
                ],
                "default": {
                    "parentID": "",
                    "content": {
                        "hash": "",
                        "size": 0,
                        "path": "",
                        "content": ""
                    }
                }
            }
        ],
        "default": {
            "acl": [],
            "version": 0,
            "shard": 0,
            "owner": 0,
            "created": 0,
            "updated": 0,
            "deleted": null,
            "type": "",
            "id": "",
            "creator": 0,
            "lastEditor": 0,
            "label": "",
            "parentID": "",
            "content": {
                "hash": "",
                "size": 0,
                "path": "",
                "content": ""
            }
        }
    },
    "WidgetEntity.schema.json": {
        "$id": "WidgetEntity.schema.json",
        "$schema": "http://json-schema.org/draft-07/schema#",
        "title": "WidgetEntity",
        "definitions": {
            "formFactor": {
                "type": "object",
                "properties": {
                    "sortWeight": {
                        "type": "string"
                    },
                    "width": {
                        "type": "integer",
                        "minimum": 0
                    },
                    "height": {
                        "type": "integer",
                        "minimum": 0
                    },
                    "panelKey": {
                        "type": "string"
                    }
                },
                "required": [
                    "sortWeight",
                    "width",
                    "height"
                ]
            }
        },
        "allOf": [
            {
                "$ref": "Entity.schema.json",
                "default": {
                    "acl": [],
                    "version": 0,
                    "shard": 0,
                    "owner": 0,
                    "created": 0,
                    "updated": 0,
                    "deleted": null,
                    "type": "",
                    "id": "",
                    "creator": 0,
                    "lastEditor": 0,
                    "label": ""
                }
            },
            {
                "type": "object",
                "properties": {
                    "parentID": {
                        "$ref": "EntityID.schema.json",
                        "default": ""
                    },
                    "boardType": {
                        "$ref": "BoardType.schema.json",
                        "default": ""
                    },
                    "widgetType": {
                        "$ref": "WidgetType.schema.json",
                        "default": ""
                    },
                    "selectedTab": {
                        "$ref": "WidgetSelectedTab.schema.json"
                    },
                    "desktop": {
                        "$ref": "WidgetFormFactor.schema.json",
                        "default": {
                            "sortWeight": "",
                            "width": 0,
                            "height": 0
                        }
                    },
                    "mobile": {
                        "$ref": "WidgetFormFactor.schema.json",
                        "default": {
                            "sortWeight": "",
                            "width": 0,
                            "height": 0
                        }
                    },
                    "isEnabled": {
                        "type": "boolean",
                        "default": false
                    },
                    "softDelete": {
                        "type": "boolean"
                    },
                    "content": {
                        "type": "object",
                        "allOf": [
                            {
                                "$ref": "BlobRef.schema.json",
                                "default": {
                                    "hash": "",
                                    "size": 0,
                                    "path": ""
                                }
                            },
                            {
                                "properties": {
                                    "content": {
                                        "type": "string",
                                        "description": "The blob content",
                                        "default": ""
                                    }
                                },
                                "required": [
                                    "content"
                                ],
                                "default": {
                                    "content": ""
                                }
                            }
                        ],
                        "default": {
                            "hash": "",
                            "size": 0,
                            "path": "",
                            "content": ""
                        }
                    }
                },
                "required": [
                    "boardType",
                    "widgetType",
                    "isEnabled",
                    "desktop",
                    "mobile",
                    "content",
                    "parentID"
                ],
                "default": {
                    "parentID": "",
                    "boardType": "",
                    "widgetType": "",
                    "desktop": {
                        "sortWeight": "",
                        "width": 0,
                        "height": 0
                    },
                    "mobile": {
                        "sortWeight": "",
                        "width": 0,
                        "height": 0
                    },
                    "isEnabled": false,
                    "content": {
                        "hash": "",
                        "size": 0,
                        "path": "",
                        "content": ""
                    }
                }
            }
        ],
        "default": {
            "acl": [],
            "version": 0,
            "shard": 0,
            "owner": 0,
            "created": 0,
            "updated": 0,
            "deleted": null,
            "type": "",
            "id": "",
            "creator": 0,
            "lastEditor": 0,
            "label": "",
            "parentID": "",
            "boardType": "",
            "widgetType": "",
            "desktop": {
                "sortWeight": "",
                "width": 0,
                "height": 0
            },
            "mobile": {
                "sortWeight": "",
                "width": 0,
                "height": 0
            },
            "isEnabled": false,
            "content": {
                "hash": "",
                "size": 0,
                "path": "",
                "content": ""
            }
        }
    },
    "WorkspaceEntity.schema.json": {
        "$id": "WorkspaceEntity.schema.json",
        "$schema": "http://json-schema.org/draft-07/schema#",
        "title": "WorkspaceEntity",
        "allOf": [
            {
                "$ref": "Entity.schema.json",
                "default": {
                    "acl": [],
                    "version": 0,
                    "shard": 0,
                    "owner": 0,
                    "created": 0,
                    "updated": 0,
                    "deleted": null,
                    "type": "",
                    "id": "",
                    "creator": 0,
                    "lastEditor": 0,
                    "label": ""
                }
            },
            {
                "type": "object",
                "properties": {
                    "description": {
                        "type": "string",
                        "default": ""
                    },
                    "workspaceType": {
                        "$ref": "WorkspaceType.schema.json",
                        "default": ""
                    },
                    "defaultRole": {
                        "$ref": "MembershipRole.schema.json",
                        "default": 0
                    },
                    "isSample": {
                        "type": "boolean",
                        "default": false
                    },
                    "managerID": {
                        "$ref": "AgentID.schema.json",
                        "default": ""
                    },
                    "layoutStyle": {
                        "$ref": "WorkspaceLayoutStyle.schema.json",
                        "default": ""
                    }
                },
                "required": [
                    "description",
                    "workspaceType",
                    "defaultRole",
                    "isSample",
                    "managerID",
                    "layoutStyle"
                ],
                "default": {
                    "description": "",
                    "workspaceType": "",
                    "defaultRole": 0,
                    "isSample": false,
                    "managerID": "",
                    "layoutStyle": ""
                }
            }
        ],
        "default": {
            "acl": [],
            "version": 0,
            "shard": 0,
            "owner": 0,
            "created": 0,
            "updated": 0,
            "deleted": null,
            "type": "",
            "id": "",
            "creator": 0,
            "lastEditor": 0,
            "label": "",
            "description": "",
            "workspaceType": "",
            "defaultRole": 0,
            "isSample": false,
            "managerID": "",
            "layoutStyle": ""
        }
    },
    "QueryConfig.schema.json": {
        "$id": "QueryConfig.schema.json",
        "$schema": "http://json-schema.org/draft-07/schema#",
        "title": "QueryConfig",
        "type": "object",
        "properties": {
            "recpient": {
                "type": "string",
                "enum": [
                    "user",
                    "business",
                    "global"
                ]
            },
            "filter": {
                "$ref": "DeclarativeExpr.schema.json"
            },
            "sort": {
                "type": "array",
                "items": {
                    "type": "string"
                }
            },
            "params": {
                "type": "object",
                "patternProperties": {
                    "^.*$": {
                        "$ref": "QueryParamConfig.schema.json"
                    }
                }
            }
        },
        "default": {}
    },
    "QueryMatchParamConfig.schema.json": {
        "$id": "QueryMatchParamConfig.schema.json",
        "$schema": "http://json-schema.org/draft-07/schema#",
        "title": "QueryMatchParamConfig",
        "type": "object",
        "properties": {
            "match": {
                "$ref": "FieldValueRef.schema.json",
                "default": {
                    "field": ""
                }
            }
        },
        "required": [
            "match"
        ],
        "default": {
            "match": {
                "field": ""
            }
        }
    },
    "QueryParamConfig.schema.json": {
        "$id": "QueryParamConfig.schema.json",
        "$schema": "http://json-schema.org/draft-07/schema#",
        "title": "QueryParamConfig",
        "oneOf": [
            {
                "$ref": "QueryMatchParamConfig.schema.json"
            },
            {
                "$ref": "QueryPartitionParamConfig.schema.json"
            },
            {
                "$ref": "QuerySortParamConfig.schema.json"
            }
        ]
    },
    "QueryPartitionParamConfig.schema.json": {
        "$id": "QueryPartitionParamConfig.schema.json",
        "$schema": "http://json-schema.org/draft-07/schema#",
        "title": "QueryPartitionParamConfig",
        "type": "object",
        "properties": {
            "defaultValue": {
                "type": "boolean",
                "default": false
            },
            "partition": {
                "$ref": "DeclarativeExpr.schema.json"
            }
        },
        "required": [
            "defaultValue",
            "partition"
        ],
        "default": {
            "defaultValue": false
        }
    },
    "QuerySortParamConfig.schema.json": {
        "$id": "QuerySortParamConfig.schema.json",
        "$schema": "http://json-schema.org/draft-07/schema#",
        "title": "QuerySortParamConfig",
        "type": "object",
        "properties": {
            "defaultValue": {
                "type": "string",
                "default": ""
            },
            "sort": {
                "type": "object",
                "patternProperties": {
                    "^.*$": {
                        "type": "array",
                        "items": {
                            "type": "string"
                        }
                    }
                },
                "default": {}
            }
        },
        "required": [
            "defaultValue",
            "sort"
        ],
        "default": {
            "defaultValue": "",
            "sort": {}
        }
    },
    "TraversalQuery.schema.json": {
        "$id": "TraversalQuery.schema.json",
        "$schema": "http://json-schema.org/draft-07/schema#",
        "title": "TraversalQuery",
        "allOf": [
            {
                "$ref": "TraversalDir.schema.json",
                "default": 0
            },
            {
                "$ref": "Entity.schema.json",
                "default": {
                    "acl": [],
                    "version": 0,
                    "shard": 0,
                    "owner": 0,
                    "created": 0,
                    "updated": 0,
                    "deleted": null,
                    "type": "",
                    "id": "",
                    "creator": 0,
                    "lastEditor": 0,
                    "label": ""
                }
            },
            {
                "$ref": "AssociationType.schema.json",
                "default": 0
            },
            {
                "$ref": "AssociationConstraint.schema.json",
                "default": 0
            },
            {
                "$ref": "QueryConfig.schema.json",
                "default": {}
            }
        ],
        "default": {
            "acl": [],
            "version": 0,
            "shard": 0,
            "owner": 0,
            "created": 0,
            "updated": 0,
            "deleted": null,
            "type": "",
            "id": "",
            "creator": 0,
            "lastEditor": 0,
            "label": ""
        }
    },
    "NotebookRecipientFields.schema.json": {
        "$id": "NotebookRecipientFields.schema.json",
        "$schema": "http://json-schema.org/draft-07/schema#",
        "title": "NotebookRecipientFields",
        "allOf": [
            {
                "$ref": "Syncable.schema.json",
                "default": {
                    "acl": [],
                    "version": 0,
                    "shard": 0,
                    "owner": 0,
                    "created": 0,
                    "updated": 0,
                    "deleted": null
                }
            },
            {
                "type": "object",
                "properties": {
                    "reminderNotifyEmail": {
                        "type": "boolean",
                        "default": false
                    },
                    "reminderNotifyInApp": {
                        "type": "boolean",
                        "default": false
                    }
                },
                "required": [
                    "reminderNotifyEmail",
                    "reminderNotifyInApp"
                ],
                "default": {
                    "reminderNotifyEmail": false,
                    "reminderNotifyInApp": false
                }
            }
        ],
        "default": {
            "acl": [],
            "version": 0,
            "shard": 0,
            "owner": 0,
            "created": 0,
            "updated": 0,
            "deleted": null,
            "reminderNotifyEmail": false,
            "reminderNotifyInApp": false
        }
    },
    "WorkspaceRecipientFields.schema.json": {
        "$id": "WorkspaceRecipientFields.schema.json",
        "$schema": "http://json-schema.org/draft-07/schema#",
        "title": "WorkspaceRecipientFields",
        "allOf": [
            {
                "$ref": "Syncable.schema.json",
                "default": {
                    "acl": [],
                    "version": 0,
                    "shard": 0,
                    "owner": 0,
                    "created": 0,
                    "updated": 0,
                    "deleted": null
                }
            },
            {
                "type": "object",
                "properties": {
                    "viewed": {
                        "type": "boolean",
                        "default": false
                    }
                },
                "required": [
                    "viewed"
                ],
                "default": {
                    "viewed": false
                }
            }
        ],
        "default": {
            "acl": [],
            "version": 0,
            "shard": 0,
            "owner": 0,
            "created": 0,
            "updated": 0,
            "deleted": null,
            "viewed": false
        }
    },
    "Agent.schema.json": {
        "$id": "Agent.schema.json",
        "$schema": "http://json-schema.org/draft-07/schema#",
        "title": "Agent",
        "allOf": [
            {
                "$ref": "AgentRef.schema.json",
                "default": {
                    "id": "",
                    "type": 0
                }
            },
            {
                "$ref": "Syncable.schema.json",
                "default": {
                    "acl": [],
                    "version": 0,
                    "shard": 0,
                    "owner": 0,
                    "created": 0,
                    "updated": 0,
                    "deleted": null
                }
            }
        ],
        "default": {
            "id": "",
            "type": 0,
            "acl": [],
            "version": 0,
            "shard": 0,
            "owner": 0,
            "created": 0,
            "updated": 0,
            "deleted": null
        }
    },
    "Association.schema.json": {
        "$id": "Association.schema.json",
        "$schema": "http://json-schema.org/draft-07/schema#",
        "title": "Association",
        "allOf": [
            {
                "$ref": "Syncable.schema.json",
                "default": {
                    "acl": [],
                    "version": 0,
                    "shard": 0,
                    "owner": 0,
                    "created": 0,
                    "updated": 0,
                    "deleted": null
                }
            },
            {
                "$ref": "AssociationRef.schema.json",
                "default": {
                    "type": 0,
                    "src": {
                        "type": "",
                        "id": ""
                    },
                    "dst": {
                        "type": "",
                        "id": ""
                    }
                }
            }
        ],
        "default": {
            "acl": [],
            "version": 0,
            "shard": 0,
            "owner": 0,
            "created": 0,
            "updated": 0,
            "deleted": null,
            "type": 0,
            "src": {
                "type": "",
                "id": ""
            },
            "dst": {
                "type": "",
                "id": ""
            }
        }
    },
    "Entity.schema.json": {
        "$id": "Entity.schema.json",
        "$schema": "http://json-schema.org/draft-07/schema#",
        "title": "Entity",
        "allOf": [
            {
                "$ref": "Syncable.schema.json",
                "default": {
                    "acl": [],
                    "version": 0,
                    "shard": 0,
                    "owner": 0,
                    "created": 0,
                    "updated": 0,
                    "deleted": null
                }
            },
            {
                "$ref": "EntityRef.schema.json",
                "default": {
                    "type": "",
                    "id": ""
                }
            },
            {
                "type": "object",
                "properties": {
                    "creator": {
                        "$ref": "UserID.schema.json",
                        "default": 0
                    },
                    "lastEditor": {
                        "$ref": "UserID.schema.json",
                        "default": 0
                    },
                    "label": {
                        "type": "string",
                        "minLength": 0,
                        "maxLength": 255,
                        "default": ""
                    }
                },
                "required": [
                    "creator",
                    "lastEditor",
                    "label"
                ],
                "default": {
                    "creator": 0,
                    "lastEditor": 0,
                    "label": ""
                }
            }
        ],
        "default": {
            "acl": [],
            "version": 0,
            "shard": 0,
            "owner": 0,
            "created": 0,
            "updated": 0,
            "deleted": null,
            "type": "",
            "id": "",
            "creator": 0,
            "lastEditor": 0,
            "label": ""
        }
    },
    "Membership.schema.json": {
        "$id": "Membership.schema.json",
        "$schema": "http://json-schema.org/draft-07/schema#",
        "title": "Membership",
        "allOf": [
            {
                "$ref": "Syncable.schema.json",
                "default": {
                    "acl": [],
                    "version": 0,
                    "shard": 0,
                    "owner": 0,
                    "created": 0,
                    "updated": 0,
                    "deleted": null
                }
            },
            {
                "$ref": "MembershipRef.schema.json",
                "default": {
                    "type": 0,
                    "recipient": {
                        "id": "",
                        "type": 0
                    },
                    "entity": {
                        "type": "",
                        "id": ""
                    }
                }
            },
            {
                "type": "object",
                "properties": {
                    "role": {
                        "$ref": "MembershipRole.schema.json"
                    },
                    "sharer": {
                        "$ref": "UserID.schema.json",
                        "default": 0
                    },
                    "label": {
                        "type": "string",
                        "minLength": 0,
                        "maxLength": 255,
                        "default": ""
                    },
                    "invited": {
                        "$ref": "timestamp.schema.json"
                    }
                },
                "required": [
                    "sharer",
                    "label"
                ],
                "default": {
                    "sharer": 0,
                    "label": ""
                }
            }
        ],
        "default": {
            "acl": [],
            "version": 0,
            "shard": 0,
            "owner": 0,
            "created": 0,
            "updated": 0,
            "deleted": null,
            "type": 0,
            "recipient": {
                "id": "",
                "type": 0
            },
            "entity": {
                "type": "",
                "id": ""
            },
            "sharer": 0,
            "label": ""
        }
    },
    "Syncable.schema.json": {
        "$id": "Syncable.schema.json",
        "$schema": "http://json-schema.org/draft-07/schema#",
        "title": "Syncable",
        "description": "The shared fields for all syncable objects (Agent, Entity, Association, Membership, Connection)",
        "type": "object",
        "properties": {
            "acl": {
                "type": "array",
                "items": {
                    "$ref": "AgentRef.schema.json"
                },
                "default": []
            },
            "version": {
                "type": "integer",
                "default": 0
            },
            "shard": {
                "type": "integer",
                "default": 0
            },
            "owner": {
                "$ref": "UserID.schema.json",
                "default": 0
            },
            "created": {
                "$ref": "timestamp.schema.json",
                "default": 0
            },
            "updated": {
                "$ref": "timestamp.schema.json",
                "default": 0
            },
            "deleted": {
                "oneOf": [
                    {
                        "$ref": "timestamp.schema.json"
                    },
                    {
                        "type": "null"
                    }
                ],
                "default": null
            }
        },
        "required": [
            "acl",
            "version",
            "shard",
            "owner",
            "created",
            "updated",
            "deleted"
        ],
        "default": {
            "acl": [],
            "version": 0,
            "shard": 0,
            "owner": 0,
            "created": 0,
            "updated": 0,
            "deleted": null
        }
    },
    "LexoRank.schema.json": {
        "$id": "LexoRank.schema.json",
        "$schema": "http://json-schema.org/draft-07/schema#",
        "type": "string",
        "nominal": "LexoRank",
        "default": "M"
    },
    "timestamp.schema.json": {
        "$id": "timestamp.schema.json",
        "$schema": "http://json-schema.org/draft-07/schema#",
        "type": "number",
        "nominal": "timestamp",
        "default": 0
    }
};
exports.SchemaArray = Object.values(exports.SchemaMap);
//# sourceMappingURL=index.js.map