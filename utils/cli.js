/**
 * Shared CLI argument parsing helpers
 * 
 * Provides getArg(), hasFlag(), and a pre-parsed args array.
 */

const args = process.argv.slice(2);

/**
 * Get the value of a CLI flag.
 * @param {string} flag - The flag to look for (e.g. '--topic')
 * @returns {string|null} - The value after the flag, or null if not found
 */
function getArg(flag) {
    const i = args.indexOf(flag);
    return i !== -1 ? args[i + 1] : null;
}

/**
 * Check if a boolean flag is present.
 * @param {string} flag - The flag to look for (e.g. '--dry-run')
 * @returns {boolean}
 */
function hasFlag(flag) {
    return args.includes(flag);
}

module.exports = { args, getArg, hasFlag };
