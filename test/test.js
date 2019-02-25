const crypto = require("crypto");
const webpack = require("webpack");
const path = require("path");
const { expect } = require("chai");
const rimraf = require("rimraf");
const fs = require("fs");
const sinon = require("sinon");

const webpackCompile = (fixture, mode) =>
  new Promise((resolve, reject) => {
    const dir = path.resolve(__dirname, fixture);
    const config = path.resolve(dir, "webpack.config.js");
    // eslint-disable-next-line global-require
    const opts = Object.assign(require(config), {
      mode,
      context: dir
    });
    webpack(opts, (err, stats) => {
      if (err) reject(err);
      else resolve(stats);
    });
  });

describe("OutputHash", () => {
  const modes = ["production"];

  before(() => {
    if (fs.existsSync("./test/tmp")) {
      rimraf.sync("./test/tmp");
    }
  });

  afterEach(() => {
    sinon.restore();
  });

  modes.forEach(mode => {
    context(`In ${mode} mode`, () => {
      it("Works with mini-css-extract-plugin", () =>
        webpackCompile("import-retry", mode).then(stats => {
          console.log(stats.assets);
        }));
    });
  });
});
