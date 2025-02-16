import winston from "winston";

class LoggerService {
  private static instance: LoggerService;
  private logger: winston.Logger;

  private constructor() {
    this.logger = winston.createLogger({
      level: "info",
      format: winston.format.json(),
      transports: [new winston.transports.Console()],
    });
  }

  public static getInstance(): LoggerService {
    if (!LoggerService.instance) {
      LoggerService.instance = new LoggerService();
      LoggerService.instance.log("LoggerService instance created");
    }
    return LoggerService.instance;
  }

  public log(message: string, ...args: any[]): void {
    this.logger.info(message, ...args);
  }

  public error(message: string, ...args: any[]): void {
    this.logger.error(message, ...args);
  }

  public warn(message: string, ...args: any[]): void {
    this.logger.warn(message, ...args);
  }

  public debug(message: string, ...args: any[]): void {
    this.logger.debug(message, ...args);
  }
}

export default LoggerService.getInstance();
