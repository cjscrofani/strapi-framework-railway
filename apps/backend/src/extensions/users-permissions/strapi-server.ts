export default (plugin) => {
  // Add custom fields to user model
  plugin.contentTypes.user.schema.attributes = {
    ...plugin.contentTypes.user.schema.attributes,
    firstName: {
      type: 'string',
      required: false,
    },
    lastName: {
      type: 'string', 
      required: false,
    },
    avatar: {
      type: 'media',
      multiple: false,
      allowedTypes: ['images'],
    },
    bio: {
      type: 'text',
    },
    website: {
      type: 'string',
    },
    socialLinks: {
      type: 'json',
    },
    isActive: {
      type: 'boolean',
      default: true,
    },
    lastLoginAt: {
      type: 'datetime',
    },
    emailVerifiedAt: {
      type: 'datetime',
    },
    preferences: {
      type: 'json',
      default: {},
    },
  };

  // Custom controllers for user operations
  plugin.controllers.user.updateProfile = async (ctx) => {
    const { id } = ctx.state.user;
    const { firstName, lastName, bio, website, socialLinks, preferences } = ctx.request.body;

    try {
      const updatedUser = await strapi.entityService.update('plugin::users-permissions.user', id, {
        data: {
          firstName,
          lastName, 
          bio,
          website,
          socialLinks,
          preferences,
        },
        populate: ['avatar'],
      });

      ctx.body = {
        user: updatedUser,
      };
    } catch (error) {
      ctx.throw(400, error.message);
    }
  };

  plugin.controllers.user.uploadAvatar = async (ctx) => {
    const { id } = ctx.state.user;
    
    try {
      const uploadedFiles = await strapi.plugins.upload.services.upload.upload({
        data: {
          fileInfo: {
            name: `avatar-${id}`,
            caption: 'User avatar',
          },
        },
        files: ctx.request.files.avatar,
      });

      const updatedUser = await strapi.entityService.update('plugin::users-permissions.user', id, {
        data: {
          avatar: uploadedFiles[0].id,
        },
        populate: ['avatar'],
      });

      ctx.body = {
        user: updatedUser,
      };
    } catch (error) {
      ctx.throw(400, error.message);
    }
  };

  // Add custom routes
  plugin.routes['content-api'].routes.push(
    {
      method: 'PUT',
      path: '/users/profile',
      handler: 'user.updateProfile',
      config: {
        policies: ['global::is-authenticated'],
      },
    },
    {
      method: 'POST',
      path: '/users/avatar',
      handler: 'user.uploadAvatar',
      config: {
        policies: ['global::is-authenticated'],
      },
    }
  );

  return plugin;
};