const express = require('express');
const { body, validationResult } = require('express-validator');
const { User, StoreInvitation, Store } = require('../models');
const { Op } = require('sequelize');
const { authorize } = require('../middleware/authMiddleware');
const { checkStoreOwnership, checkTeamMembership } = require('../middleware/storeAuth');
const crypto = require('crypto');
const ConnectionManager = require('../services/database/ConnectionManager');
const router = express.Router();

// NOTE: HYBRID ARCHITECTURE
// - StoreTeam: TENANT database (per-store team members)
// - StoreInvitation: MASTER database (for cross-tenant invitation discovery)
// - Store: MASTER database (for store lookup and metadata)
// - User: MASTER database (for cross-tenant user authentication)

// @route   GET /api/store-teams/:store_id
// @desc    Get team members for a store
// @access  Private (store owner/admin)
router.get('/:store_id', authorize(['admin', 'store_owner']), checkStoreOwnership, async (req, res) => {
  try {
    const { store_id } = req.params;
    const { page = 1, limit = 10, status = 'active' } = req.query;
    const offset = (page - 1) * limit;

    // Check if user has permission to view team
    const canManageTeam = req.storeAccess.isDirectOwner ||
                         req.storeAccess.permissions?.canManageTeam ||
                         req.storeAccess.permissions?.all;

    if (!canManageTeam) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions to view team members'
      });
    }

    // Get tenant connection and models
    const connection = await ConnectionManager.getStoreConnection(store_id);
    const { StoreTeam } = connection.models;

    const where = { store_id };
    if (status !== 'all') {
      where.status = status;
    }

    const { count, rows } = await StoreTeam.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset: parseInt(offset),
      include: [
        {
          model: User,
          attributes: ['id', 'email', 'first_name', 'last_name', 'avatar_url']
        },
        {
          model: User,
          as: 'inviter',
          attributes: ['id', 'email', 'first_name', 'last_name']
        },
        {
          model: Store,
          attributes: ['id', 'name']
        }
      ],
      order: [['created_at', 'DESC']]
    });

    res.json({
      success: true,
      data: {
        team_members: rows,
        pagination: {
          current_page: parseInt(page),
          per_page: parseInt(limit),
          total: count,
          total_pages: Math.ceil(count / limit)
        }
      }
    });
  } catch (error) {
    console.error('❌ Get team members error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/store-teams/:store_id/invite
// @desc    Invite a user to join store team
// @access  Private (store owner/admin)
router.post('/:store_id/invite', authorize(['admin', 'store_owner']), checkStoreOwnership, [
  body('email').isEmail().withMessage('Valid email is required'),
  body('role').isIn(['admin', 'editor', 'viewer']).withMessage('Valid role is required'),
  body('message').optional().isString().isLength({ max: 500 }).withMessage('Message too long'),
  body('permissions').optional().isObject().withMessage('Permissions must be an object')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { store_id } = req.params;
    const { email, role, message, permissions = {} } = req.body;

    // Check if user has permission to manage team
    const canManageTeam = req.storeAccess.isDirectOwner ||
                         req.storeAccess.permissions?.canManageTeam ||
                         req.storeAccess.permissions?.all;

    if (!canManageTeam) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions to invite team members'
      });
    }

    // Get tenant connection for StoreTeam (tenant DB)
    const connection = await ConnectionManager.getStoreConnection(store_id);
    const { StoreTeam } = connection.models;

    // Check if email is already invited or is a team member (StoreTeam in tenant DB)
    const existingTeamMember = await StoreTeam.findOne({
      where: { store_id, user_id: { [Op.ne]: null } },
      include: [{
        model: User,
        where: { email },
        required: true
      }]
    });

    if (existingTeamMember) {
      return res.status(400).json({
        success: false,
        message: 'User is already a team member'
      });
    }

    // Check existing invitation in master DB
    const existingInvitation = await StoreInvitation.findOne({
      where: {
        store_id,
        invited_email: email,
        status: 'pending'
      }
    });

    if (existingInvitation) {
      return res.status(400).json({
        success: false,
        message: 'Invitation already sent to this email'
      });
    }

    // Create invitation
    const invitation = await StoreInvitation.create({
      store_id,
      invited_email: email,
      invited_by: req.user.id,
      role,
      permissions,
      message,
      invitation_token: crypto.randomBytes(32).toString('hex'),
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
    });

    // TODO: Send email invitation
    console.log('📧 Email invitation should be sent:', {
      to: email,
      invitationId: invitation.id,
      token: invitation.invitation_token
    });

    res.status(201).json({
      success: true,
      message: 'Invitation sent successfully',
      data: {
        invitation_id: invitation.id,
        invited_email: email,
        role,
        expires_at: invitation.expires_at
      }
    });
  } catch (error) {
    console.error('❌ Send invitation error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   PUT /api/store-teams/:store_id/members/:member_id
// @desc    Update team member role/permissions
// @access  Private (store owner/admin)
router.put('/:store_id/members/:member_id', authorize(['admin', 'store_owner']), checkStoreOwnership, [
  body('role').optional().isIn(['admin', 'editor', 'viewer']).withMessage('Valid role is required'),
  body('permissions').optional().isObject().withMessage('Permissions must be an object'),
  body('status').optional().isIn(['active', 'suspended']).withMessage('Valid status is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { store_id, member_id } = req.params;
    const { role, permissions, status } = req.body;

    // Check if user has permission to manage team
    const canManageTeam = req.storeAccess.isDirectOwner ||
                         req.storeAccess.permissions?.canManageTeam ||
                         req.storeAccess.permissions?.all;

    if (!canManageTeam) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions to manage team members'
      });
    }

    // Get tenant connection and models
    const connection = await ConnectionManager.getStoreConnection(store_id);
    const { StoreTeam } = connection.models;

    const teamMember = await StoreTeam.findOne({
      where: {
        id: member_id,
        store_id
      },
      include: [{
        model: User,
        attributes: ['id', 'email', 'first_name', 'last_name']
      }]
    });

    if (!teamMember) {
      return res.status(404).json({
        success: false,
        message: 'Team member not found'
      });
    }

    // Prevent changing owner role (if role is 'owner')
    if (teamMember.role === 'owner' && role && role !== 'owner') {
      return res.status(400).json({
        success: false,
        message: 'Cannot change owner role'
      });
    }

    // Update team member
    const updateData = {};
    if (role) updateData.role = role;
    if (permissions) updateData.permissions = permissions;
    if (status) updateData.status = status;

    await teamMember.update(updateData);
    await teamMember.reload({ include: [{ model: User, attributes: ['id', 'email', 'first_name', 'last_name'] }] });

    res.json({
      success: true,
      message: 'Team member updated successfully',
      data: teamMember
    });
  } catch (error) {
    console.error('❌ Update team member error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   DELETE /api/store-teams/:store_id/members/:member_id
// @desc    Remove team member
// @access  Private (store owner/admin)
router.delete('/:store_id/members/:member_id', authorize(['admin', 'store_owner']), checkStoreOwnership, async (req, res) => {
  try {
    const { store_id, member_id } = req.params;

    // Check if user has permission to manage team
    const canManageTeam = req.storeAccess.isDirectOwner ||
                         req.storeAccess.permissions?.canManageTeam ||
                         req.storeAccess.permissions?.all;

    if (!canManageTeam) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions to remove team members'
      });
    }

    // Get tenant connection and models
    const connection = await ConnectionManager.getStoreConnection(store_id);
    const { StoreTeam } = connection.models;

    const teamMember = await StoreTeam.findOne({
      where: {
        id: member_id,
        store_id
      }
    });

    if (!teamMember) {
      return res.status(404).json({
        success: false,
        message: 'Team member not found'
      });
    }

    // Prevent removing owner
    if (teamMember.role === 'owner') {
      return res.status(400).json({
        success: false,
        message: 'Cannot remove store owner'
      });
    }

    // Soft delete by setting status to 'removed'
    await teamMember.update({ status: 'removed', is_active: false });

    res.json({
      success: true,
      message: 'Team member removed successfully'
    });
  } catch (error) {
    console.error('❌ Remove team member error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/store-teams/accept-invitation/:token
// @desc    Accept store team invitation
// @access  Private
router.post('/accept-invitation/:token', authorize(['admin', 'store_owner']), async (req, res) => {
  try {
    const { token } = req.params;

    // Find invitation in master DB
    const invitation = await StoreInvitation.findOne({
      where: {
        invitation_token: token,
        status: 'pending',
        expires_at: { [Op.gt]: new Date() }
      },
      include: [
        { model: Store, attributes: ['id', 'name'] },
        { model: User, as: 'inviter', attributes: ['id', 'email', 'first_name', 'last_name'] }
      ]
    });

    if (!invitation) {
      return res.status(404).json({
        success: false,
        message: 'Invalid or expired invitation'
      });
    }

    // Check if invitee email matches current user
    if (invitation.invited_email !== req.user.email) {
      return res.status(403).json({
        success: false,
        message: 'This invitation is not for your email address'
      });
    }

    // Get tenant connection for StoreTeam
    const connection = await ConnectionManager.getStoreConnection(invitation.store_id);
    const { StoreTeam } = connection.models;

    // Check if user is already a team member (in tenant DB)
    const existingMember = await StoreTeam.findOne({
      where: {
        store_id: invitation.store_id,
        user_id: req.user.id
      }
    });

    if (existingMember) {
      return res.status(400).json({
        success: false,
        message: 'You are already a member of this store'
      });
    }

    // Create team membership in tenant DB
    const teamMember = await StoreTeam.create({
      store_id: invitation.store_id,
      user_id: req.user.id,
      role: invitation.role,
      permissions: invitation.permissions,
      invited_by: invitation.invited_by,
      invited_at: invitation.created_at,
      accepted_at: new Date(),
      status: 'active'
    });

    // Update invitation status in master DB
    await invitation.update({
      status: 'accepted',
      accepted_by: req.user.id,
      accepted_at: new Date()
    });

    // Reload with User and Store from master DB
    await teamMember.reload({
      include: [
        { model: Store, attributes: ['id', 'name'] },
        { model: User, attributes: ['id', 'email', 'first_name', 'last_name'] }
      ]
    });

    res.json({
      success: true,
      message: 'Invitation accepted successfully',
      data: {
        team_member: teamMember,
        store: invitation.Store
      }
    });
  } catch (error) {
    console.error('❌ Accept invitation error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/store-teams/my-invitations
// @desc    Get pending invitations for current user
// @access  Private
router.get('/my-invitations', authorize(['admin', 'store_owner']), async (req, res) => {
  try {
    const invitations = await StoreInvitation.findAll({
      where: {
        invited_email: req.user.email,
        status: 'pending',
        expires_at: { [Op.gt]: new Date() }
      },
      include: [
        { model: Store, attributes: ['id', 'name', 'logo_url'] },
        { model: User, as: 'inviter', attributes: ['id', 'email', 'first_name', 'last_name'] }
      ],
      order: [['created_at', 'DESC']]
    });

    res.json({
      success: true,
      data: invitations
    });
  } catch (error) {
    console.error('❌ Get my invitations error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;
