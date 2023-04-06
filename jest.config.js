module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/test/**/*.test.ts'],
  coverageReporters: ['html'],
  collectCoverageFrom: ['src/**/*.ts','!src/test/*.ts']
};
