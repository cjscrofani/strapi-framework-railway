export default (policyContext, config, { strapi }) => {
  const { state } = policyContext;

  if (!state.user) {
    return false;
  }

  // Check if user has admin role
  const adminRole = state.user.role?.type === 'admin' || 
                    state.user.role?.name === 'Admin' ||
                    state.user.role?.name === 'Super Admin';

  return adminRole;
};