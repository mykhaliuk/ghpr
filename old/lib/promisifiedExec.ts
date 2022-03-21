import cp from 'child_process';
import util from 'util';

export const exec = util.promisify(cp.exec);
