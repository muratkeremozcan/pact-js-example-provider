require('dotenv').config({ path: '.env' })

module.exports = function () {
  return {
    autoDetect: true,
    files: {
      override: (filePatterns) => [
        ...filePatterns,
        '!src/**/*.pacttest.ts' // Ignore pacttest.ts files
      ]
    },
    tests: {
      override: (testPatterns) => [
        ...testPatterns,
        '!src/**/*.pacttest.ts' // Ignore pacttest.ts files in tests
      ]
    }
  }
}
