//
// Autogenerated by Thrift Compiler (0.7.0-en-11139b3b5cb61e817408c6e84b0e1c258bf6c6ae)
//
// DO NOT EDIT UNLESS YOU ARE SURE THAT YOU KNOW WHAT YOU ARE DOING
//


  // Define types and services

  var Thrift = require('evernote-thrift').Thrift;
  var Errors = require('./Errors');
  var Types = require('./Types');
  var MembershipService = require('./MembershipService');


  module.exports.WorkspaceType = {
    'INVITE_ONLY' : 1,
    'DISCOVERABLE' : 2,
    'OPEN' : 3
  };

  module.exports.WorkspacePrivilegeLevel = {
    'READ' : 1,
    'EDIT' : 2,
    'EDIT_AND_MANAGE' : 3
  };

  module.exports.WorkspaceSortField = {
    'NAME' : 1,
    'CREATED' : 2,
    'MAX_UPDATED' : 3,
    'MEMBER_COUNT' : 4
  };

  module.exports.WORKSPACE_FILTER_MAX_INCLUDED_WORKSPACE_GUIDS = 256;

  module.exports.WorkspaceRestrictions = Thrift.Struct.define('WorkspaceRestrictions',  {
    1: { alias: 'noUpdateName', type: Thrift.Type.BOOL },
    3: { alias: 'noCreateNotebooks', type: Thrift.Type.BOOL },
    6: { alias: 'noManageShares', type: Thrift.Type.BOOL },
    7: { alias: 'noCanMoveNotebook', type: Thrift.Type.BOOL },
    8: { alias: 'noUpdateType', type: Thrift.Type.BOOL },
    9: { alias: 'noUpdateDescription', type: Thrift.Type.BOOL }
  });

  module.exports.Workspace = Thrift.Struct.define('Workspace',  {
    1: { alias: 'guid', type: Thrift.Type.STRING },
    2: { alias: 'contactId', type: Thrift.Type.I32 },
    3: { alias: 'name', type: Thrift.Type.STRING },
    5: { alias: 'backingNotebookGuid', type: Thrift.Type.STRING },
    6: { alias: 'serviceCreated', type: Thrift.Type.I64 },
    7: { alias: 'serviceUpdated', type: Thrift.Type.I64 },
    8: { alias: 'userId', type: Thrift.Type.I32 },
    9: { alias: 'updateSequenceNum', type: Thrift.Type.I32 },
    10: { alias: 'sharingUpdateCounter', type: Thrift.Type.I32 },
    11: { alias: 'descriptionText', type: Thrift.Type.STRING },
    12: { alias: 'workspaceType', type: Thrift.Type.I32 },
    13: { alias: 'defaultPrivilegeLevel', type: Thrift.Type.I32 },
    14: { alias: 'sample', type: Thrift.Type.BOOL },
    15: { alias: 'seed', type: Thrift.Type.STRING },
    16: { alias: 'backingNotebookSeed', type: Thrift.Type.STRING }
  });

  module.exports.WorkspaceInvitation = Thrift.Struct.define('WorkspaceInvitation',  {
    1: { alias: 'common', type: Thrift.Type.STRUCT, def: MembershipService.InvitationCommon },
    2: { alias: 'workspaceGuid', type: Thrift.Type.STRING },
    3: { alias: 'privilege', type: Thrift.Type.I32 },
    4: { alias: 'contact', type: Thrift.Type.STRUCT, def: Types.Contact }
  });

  module.exports.WorkspaceMembership = Thrift.Struct.define('WorkspaceMembership',  {
    1: { alias: 'common', type: Thrift.Type.STRUCT, def: MembershipService.MembershipCommon },
    2: { alias: 'workspaceGuid', type: Thrift.Type.STRING },
    3: { alias: 'privilege', type: Thrift.Type.I32 }
  });

  module.exports.ManageWorkspaceSharingRequest = Thrift.Struct.define('ManageWorkspaceSharingRequest',  {
    1: { alias: 'workspaceGuid', type: Thrift.Type.STRING },
    2: { alias: 'membershipsToUpdate', type: Thrift.Type.LIST, def: Thrift.List.define(Thrift.Type.STRUCT, module.exports.WorkspaceMembership)  },
    3: { alias: 'invitationsToCreateOrUpdate', type: Thrift.Type.LIST, def: Thrift.List.define(Thrift.Type.STRUCT, module.exports.WorkspaceInvitation)  },
    4: { alias: 'membershipsToRemove', type: Thrift.Type.LIST, def: Thrift.List.define(Thrift.Type.STRING)  }
  });

  module.exports.ErrorResponse = Thrift.Struct.define('ErrorResponse',  {
    1: { alias: 'noErrors', type: Thrift.Type.BOOL },
    2: { alias: 'systemException', type: Thrift.Type.EXCEPTION, def: Errors.EDAMSystemException },
    3: { alias: 'userException', type: Thrift.Type.EXCEPTION, def: Errors.EDAMUserException },
    4: { alias: 'notFoundException', type: Thrift.Type.EXCEPTION, def: Errors.EDAMNotFoundException }
  });

  module.exports.ManageWorkspaceMembershipResponse = Thrift.Struct.define('ManageWorkspaceMembershipResponse',  {
    1: { alias: 'membership', type: Thrift.Type.STRUCT, def: module.exports.WorkspaceMembership },
    2: { alias: 'errorResponse', type: Thrift.Type.STRUCT, def: module.exports.ErrorResponse }
  });

  module.exports.ManageWorkspaceInvitationResponse = Thrift.Struct.define('ManageWorkspaceInvitationResponse',  {
    1: { alias: 'invitation', type: Thrift.Type.STRUCT, def: module.exports.WorkspaceInvitation },
    2: { alias: 'membership', type: Thrift.Type.STRUCT, def: module.exports.WorkspaceMembership },
    3: { alias: 'identity', type: Thrift.Type.STRUCT, def: Types.Identity },
    4: { alias: 'errorResponse', type: Thrift.Type.STRUCT, def: module.exports.ErrorResponse }
  });

  module.exports.ManageWorkspaceRemoveResponse = Thrift.Struct.define('ManageWorkspaceRemoveResponse',  {
    1: { alias: 'guid', type: Thrift.Type.STRING },
    3: { alias: 'membership', type: Thrift.Type.STRUCT, def: module.exports.WorkspaceMembership },
    2: { alias: 'errorResponse', type: Thrift.Type.STRUCT, def: module.exports.ErrorResponse }
  });

  module.exports.ManageWorkspaceSharingResponse = Thrift.Struct.define('ManageWorkspaceSharingResponse',  {
    1: { alias: 'containsNoErrors', type: Thrift.Type.BOOL },
    2: { alias: 'membershipsToUpdateResponse', type: Thrift.Type.LIST, def: Thrift.List.define(Thrift.Type.STRUCT, module.exports.ManageWorkspaceMembershipResponse)  },
    3: { alias: 'invitationsToCreateOrUpdateResponse', type: Thrift.Type.LIST, def: Thrift.List.define(Thrift.Type.STRUCT, module.exports.ManageWorkspaceInvitationResponse)  },
    4: { alias: 'membershipsToRemoveResponse', type: Thrift.Type.LIST, def: Thrift.List.define(Thrift.Type.STRUCT, module.exports.ManageWorkspaceRemoveResponse)  }
  });

  module.exports.WorkspaceResponseSpec = Thrift.Struct.define('WorkspaceResponseSpec',  {
    1: { alias: 'includeInvitations', type: Thrift.Type.BOOL },
    2: { alias: 'includeIdentityByInvitationsGuid', type: Thrift.Type.BOOL },
    3: { alias: 'includeMemberships', type: Thrift.Type.BOOL },
    4: { alias: 'includeWorkspaceRestrictions', type: Thrift.Type.BOOL },
    6: { alias: 'includeNotebookGuids', type: Thrift.Type.BOOL },
    7: { alias: 'includeAccessInfo', type: Thrift.Type.BOOL },
    8: { alias: 'includeNotebookRestrictions', type: Thrift.Type.BOOL },
    9: { alias: 'includeDiscoverableWorkspaces', type: Thrift.Type.BOOL },
    10: { alias: 'includeAggregations', type: Thrift.Type.BOOL },
    11: { alias: 'includeOpenWorkspaces', type: Thrift.Type.BOOL }
  });

  module.exports.WorkspaceSorting = Thrift.Struct.define('WorkspaceSorting',  {
    1: { alias: 'sortField', type: Thrift.Type.I32 },
    2: { alias: 'descending', type: Thrift.Type.BOOL }
  });

  module.exports.WorkspaceFilter = Thrift.Struct.define('WorkspaceFilter',  {
    1: { alias: 'includeTypes', type: Thrift.Type.SET, def: Thrift.Set.define(Thrift.Type.I32) },
    2: { alias: 'includeWorkspacesWithoutMembership', type: Thrift.Type.BOOL },
    3: { alias: 'sorting', type: Thrift.Type.STRUCT, def: module.exports.WorkspaceSorting },
    4: { alias: 'limit', type: Thrift.Type.I32 },
    5: { alias: 'includedWorkspaceGuids', type: Thrift.Type.LIST, def: Thrift.List.define(Thrift.Type.STRING)  }
  });

  module.exports.WorkspaceAggregations = Thrift.Struct.define('WorkspaceAggregations',  {
    1: { alias: 'notebooksCount', type: Thrift.Type.I32 },
    2: { alias: 'notesCount', type: Thrift.Type.I32 },
    3: { alias: 'maxServiceUpdated', type: Thrift.Type.I64 }
  });

  module.exports.AccessInfo = Thrift.Struct.define('AccessInfo',  {
    1: { alias: 'viewed', type: Thrift.Type.BOOL },
    2: { alias: 'viewedTimestamp', type: Thrift.Type.I64 },
    3: { alias: 'accessRequestedTimestamp', type: Thrift.Type.I64 }
  });

  module.exports.WorkspaceResponse = Thrift.Struct.define('WorkspaceResponse',  {
    1: { alias: 'workspace', type: Thrift.Type.STRUCT, def: module.exports.Workspace },
    2: { alias: 'invitations', type: Thrift.Type.LIST, def: Thrift.List.define(Thrift.Type.STRUCT, module.exports.WorkspaceInvitation)  },
    3: { alias: 'identityByInvitationsGuid', type: Thrift.Type.MAP, def: Thrift.Map.define(Thrift.Type.STRING, Thrift.Type.STRUCT, Types.Identity)  },
    4: { alias: 'memberships', type: Thrift.Type.LIST, def: Thrift.List.define(Thrift.Type.STRUCT, module.exports.WorkspaceMembership)  },
    6: { alias: 'workspaceRestrictions', type: Thrift.Type.STRUCT, def: module.exports.WorkspaceRestrictions },
    7: { alias: 'notebookGuids', type: Thrift.Type.LIST, def: Thrift.List.define(Thrift.Type.STRING)  },
    8: { alias: 'accessInfo', type: Thrift.Type.STRUCT, def: module.exports.AccessInfo },
    9: { alias: 'notebookRestrictions', type: Thrift.Type.STRUCT, def: Types.NotebookRestrictions },
    10: { alias: 'aggregations', type: Thrift.Type.STRUCT, def: module.exports.WorkspaceAggregations },
    11: { alias: 'member', type: Thrift.Type.BOOL }
  });

  module.exports.CopyWorkspaceSpec = Thrift.Struct.define('CopyWorkspaceSpec',  {
    1: { alias: 'workspaceGuid', type: Thrift.Type.STRING },
    2: { alias: 'includeNotes', type: Thrift.Type.BOOL }
  });
