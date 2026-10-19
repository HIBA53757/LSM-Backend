/*
 * Configuration de Jest pour un projet ESM (ECMAScript Modules).
 * On utilise "transform: {}" pour dire à Jest de ne PAS transformer nos fichiers,
 * car Node.js gère déjà les imports ESM grâce au flag --experimental-vm-modules.
 */
export default {
  transform: {},
};
