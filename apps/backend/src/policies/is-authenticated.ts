export default (policyContext, config, { strapi }) => {
  const { state } = policyContext;

  if (!state.user) {
    return false;
  }

  // Check if user is active
  if (!state.user.isActive) {
    return false;
  }

  // Check if email is verified (if required)
  if (config.requireEmailVerification && !state.user.emailVerifiedAt) {
    return false;
  }

  return true;
};