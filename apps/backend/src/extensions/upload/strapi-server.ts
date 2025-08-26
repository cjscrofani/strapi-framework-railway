export default (plugin) => {
  // Extend upload controller with custom methods
  plugin.controllers.upload.optimizeImage = async (ctx) => {
    try {
      const { files } = ctx.request;
      const optimizedFiles = [];

      for (const file of files.files || [files.file]) {
        // Basic file validation
        if (!file.type.startsWith('image/')) {
          continue;
        }

        // File size validation (already handled in config but double-check)
        const maxSize = 250 * 1024 * 1024; // 250MB
        if (file.size > maxSize) {
          ctx.throw(413, 'File too large');
        }

        // Generate optimized versions
        const optimizedFile = await strapi.plugins.upload.services.upload.upload({
          data: {
            fileInfo: {
              name: file.name,
              alternativeText: ctx.request.body.alternativeText || file.name,
              caption: ctx.request.body.caption,
            },
          },
          files: file,
        });

        optimizedFiles.push(optimizedFile[0]);
      }

      ctx.body = optimizedFiles;
    } catch (error) {
      ctx.throw(400, error.message);
    }
  };

  // Add security middleware for file uploads
  plugin.routes['content-api'].routes.push({
    method: 'POST',
    path: '/upload/optimize',
    handler: 'upload.optimizeImage',
    config: {
      policies: ['global::is-authenticated'],
    },
  });

  // Override default upload to add security checks
  const originalUpload = plugin.controllers.upload.upload;
  plugin.controllers.upload.upload = async (ctx) => {
    const { files } = ctx.request;
    
    // Security checks
    const allowedTypes = [
      'image/jpeg',
      'image/jpg', 
      'image/png',
      'image/webp',
      'image/gif',
      'video/mp4',
      'video/webm',
      'application/pdf',
      'text/plain',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];

    const filesToCheck = files.files || [files.file];
    
    for (const file of filesToCheck) {
      if (file && !allowedTypes.includes(file.type)) {
        ctx.throw(400, `File type ${file.type} not allowed`);
      }

      // Check for malicious file extensions
      const maliciousExtensions = ['.exe', '.bat', '.cmd', '.scr', '.pif', '.jar'];
      const hasmaliciousExtension = maliciousExtensions.some(ext => 
        file.name.toLowerCase().endsWith(ext)
      );
      
      if (hasmaliciousExtension) {
        ctx.throw(400, 'File type not allowed for security reasons');
      }
    }

    // Call original upload
    return await originalUpload(ctx);
  };

  return plugin;
};