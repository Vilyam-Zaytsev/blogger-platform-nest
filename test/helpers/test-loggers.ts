export class TestLoggers {
  static logUnit<T>(resultTest: T, description: string) {
    console.log(
      `\x1b[4;36m***************${description}***************\x1b[0m\n`,
      resultTest,
    );
  }
}
