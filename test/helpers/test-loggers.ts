export class TestLoggers {
  static logUnit<T>(testResult: T, description: string) {
    console.log(
      `\x1b[4;36m***************${description}***************\x1b[0m\n\n`,
      '                \x1b[3;36m\u2193 \u2193 \u2193 Test result \u2193 \u2193 \u2193\x1b[0m',
      '\n\x1b[36m+-----------------------------------------------------------+\x1b[0m\n',
      testResult,
      '\n\x1b[36m+-----------------------------------------------------------+\x1b[0m\n\n',
    );
  }
}
