/**
 * @param {string} message
 * @returns {() => void} clean function that removes las line in stdout
 */
export declare const tempLine: (message: string) => (() => void);
