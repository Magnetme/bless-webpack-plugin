var bless = require('bless');
var RawSource = require('webpack/lib/RawSource');

module.exports = function(options, pattern, outputFilename) {
	pattern = pattern || /\.css$/;
	options = options || {};
	outputFilename = outputFilename || '[file]';

	return {
		apply: function(compiler) {
			compiler.plugin("this-compilation", function(compilation) {
				compilation.plugin("optimize-assets", function(assets, callback) {
					var pending = 0, basename, output;

					function done(err) {
						pending--;
						if (err && pending >= 0) {
							pending = 0;
							callback(err);
						} else if (pending === 0) {
							callback();
						}
					}

					Object.keys(assets)
						.filter(pattern.test.bind(pattern))
						.forEach(function(name) {
							pending++;
							basename = name.substring(name.lastIndexOf('/') + 1);
							if (basename.lastIndexOf('.') !== -1) {
								basename = basename.substring(0, basename.lastIndexOf('.'));
							}
							output = compilation.getPath(outputFilename, {
								filename: name,
								basename: basename
							});
							new bless.Parser({ output: output, options : options })
								.parse(assets[name].source(), function(err, files) {
									if (err) {
										done(err);
										return;
									}
									if (outputFilename === name) {
										delete assets[name];
									}
									files.forEach(function(file) {
										assets[file.filename] = new RawSource(file.content);
									});
									done();
								});
						});

				});
			});
		}
	};
};
