export class TestLoggers {
  static logUnit<T>(testResult: T, description: string): void {
    console.log(
      `\x1b[4;36m***************${description}***************\x1b[0m\n\n`,
      '                \x1b[3;36m\u2193 \u2193 \u2193 Test result \u2193 \u2193 \u2193\x1b[0m',
      '\n\x1b[36m+-----------------------------------------------------------+\x1b[0m\n',
      testResult,
      '\n\x1b[36m+-----------------------------------------------------------+\x1b[0m\n\n',
    );
  }

  static logE2E<T = null>(
    responseBody: T,
    statusCode: number,
    description: string,
  ): void {
    console.log(
      `\x1b[4;36m***************${description}***************\x1b[0m\n`,
      '                \x1b[3;36m\u2193 \u2193 \u2193 Test result \u2193 \u2193 \u2193\x1b[0m',
      '\n\x1b[36m+-----------------------------------------------------------+\x1b[0m\n',
      '\x1b[33mResponseBody: \x1b[0m',
      JSON.stringify(
        responseBody,
        (key, value) =>
          typeof value === 'object' && value !== null ? value : value,
        2,
      ),
      // responseBody,
      '\n\n\x1b[33mStatusCode: \x1b[0m',
      statusCode,
      '\n\x1b[36m+-----------------------------------------------------------+\x1b[0m\n\n',
    );
  }
}
