module.exports = {
  env: {
    mocha: true
  },
  plugins: ["mocha"],
  rules: {
    // https://github.com/benmosher/eslint-plugin-import/blob/master/docs/rules/no-dynamic-require.md
    // Allow dynamic require(), we use it in the tests
    "import/no-dynamic-require": ["off"],

    // https://github.com/lo1tuma/eslint-plugin-mocha/blob/master/docs/rules/no-exclusive-tests.md
    // Disallow .only tests
    "mocha/no-exclusive-tests": ["error"]
  }
};
