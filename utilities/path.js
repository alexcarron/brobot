const path = require('path');

const root_dir = path.resolve(__dirname, '..');
const getSubDirectory = (foldler_name) => {
	return path.join(root_dir, foldler_name)
}

const utilities_dir = getSubDirectory('utilities');
const modules_dir = getSubDirectory('modules');
const databases_dir = getSubDirectory('databases');
const commands_dir = getSubDirectory('commands');


module.exports = {
  root_dir,
	utilities_dir,
	databases_dir,
	modules_dir,
	commands_dir,
  getAbsolutePath: function(relative_path) {
    return path.join(root_dir, relative_path);
  },
  getRelativePath: function(root_dir, relative_path) {
    return path.join(root_dir, relative_path);
  }
};